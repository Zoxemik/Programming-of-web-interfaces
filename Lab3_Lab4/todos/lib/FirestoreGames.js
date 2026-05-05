import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  startAfter
} from "firebase/firestore";
import { Db } from "@/lib/FirebaseClient";
import { NormalizeGame, ToNumber } from "@/lib/BoardGamesStorage";

const GamesCollectionName = "games";

function GetGamesCollection()
{
  return collection(Db, GamesCollectionName);
}

function GetGameDocument(GameId)
{
  return doc(Db, GamesCollectionName, String(GameId));
}

function DocumentToGame(DocumentSnapshot)
{
  const Data = DocumentSnapshot.data();

  return NormalizeGame({
    ...Data,
    id: DocumentSnapshot.id
  });
}

function BuildGameWriteData(Game)
{
  return {
    title: Game.title,
    images: Game.images,
    description: Game.description,
    min_players: Game.min_players,
    max_players: Game.max_players,
    avg_play_time_minutes: Game.avg_play_time_minutes,
    publisher: Game.publisher,
    is_expansion: Game.is_expansion,
    price_pln: Game.price_pln,
    auction: Game.auction,
    type: Game.type
  };
}

function EnsureSignedIn(CurrentUser)
{
  if (!CurrentUser)
  {
    throw new Error("Musisz się zalogować.");
  }
}

export async function GetGamesPage(PageSize, PageCursor)
{
  const QueryParts = [
    orderBy("createdAt", "desc"),
    limit(PageSize + 1)
  ];

  if (PageCursor !== null && PageCursor !== undefined)
  {
    QueryParts.splice(1, 0, startAfter(PageCursor));
  }

  const GamesQuery = query(GetGamesCollection(), ...QueryParts);
  const Snapshot = await getDocs(GamesQuery);
  const AllDocuments = Snapshot.docs;
  const VisibleDocuments = AllDocuments.slice(0, PageSize);

  let LastDocument = null;

  if (VisibleDocuments.length > 0)
  {
    LastDocument = VisibleDocuments[VisibleDocuments.length - 1];
  }

  const Games = VisibleDocuments.map(function ConvertDocument(DocumentSnapshot)
  {
    return DocumentToGame(DocumentSnapshot);
  });

  return {
    Games: Games,
    LastDocument: LastDocument,
    HasMore: AllDocuments.length > PageSize
  };
}

export async function GetGameById(GameId)
{
  const GameSnapshot = await getDoc(GetGameDocument(GameId));

  if (!GameSnapshot.exists())
  {
    return null;
  }

  return DocumentToGame(GameSnapshot);
}

export async function CreateGame(Game, CurrentUser)
{
  EnsureSignedIn(CurrentUser);

  const GameData = BuildGameWriteData(Game);

  const CreatedDocument = await addDoc(GetGamesCollection(), {
    ...GameData,
    ownerUid: CurrentUser.uid,
    ownerEmail: CurrentUser.email,
    isAvailable: true,
    buyerUid: "",
    buyerEmail: "",
    soldAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return CreatedDocument.id;
}

export async function UpdateGame(GameId, Game, CurrentUser)
{
  EnsureSignedIn(CurrentUser);

  const ExistingGame = await GetGameById(GameId);

  if (!ExistingGame)
  {
    throw new Error("Nie znaleziono gry do edycji.");
  }

  if (ExistingGame.ownerUid !== CurrentUser.uid)
  {
    throw new Error("Możesz edytować tylko własne gry.");
  }

  const GameData = BuildGameWriteData(Game);

  await runTransaction(Db, async function UpdateGameTransaction(Transaction)
  {
    const GameReference = GetGameDocument(GameId);
    const GameSnapshot = await Transaction.get(GameReference);

    if (!GameSnapshot.exists())
    {
      throw new Error("Ta gra już nie istnieje.");
    }

    const CurrentData = GameSnapshot.data();

    if (CurrentData.ownerUid !== CurrentUser.uid)
    {
      throw new Error("Możesz edytować tylko własne gry.");
    }

    Transaction.update(GameReference, {
      ...GameData,
      updatedAt: serverTimestamp()
    });
  });
}

export async function DeleteGame(GameId, CurrentUser)
{
  EnsureSignedIn(CurrentUser);

  const ExistingGame = await GetGameById(GameId);

  if (!ExistingGame)
  {
    throw new Error("Nie znaleziono gry do usunięcia.");
  }

  if (ExistingGame.ownerUid !== CurrentUser.uid)
  {
    throw new Error("Możesz usunąć tylko własne gry.");
  }

  await deleteDoc(GetGameDocument(GameId));
}

export async function BuyGameNow(GameId, CurrentUser)
{
  EnsureSignedIn(CurrentUser);

  await runTransaction(Db, async function BuyGameTransaction(Transaction)
  {
    const GameReference = GetGameDocument(GameId);
    const GameSnapshot = await Transaction.get(GameReference);

    if (!GameSnapshot.exists())
    {
      throw new Error("Ta oferta już nie istnieje.");
    }

    const GameData = GameSnapshot.data();

    if (GameData.ownerUid === CurrentUser.uid)
    {
      throw new Error("Nie możesz kupić własnej gry.");
    }

    if (GameData.isAvailable === false)
    {
      throw new Error("Ktoś już kupił tę grę.");
    }

    Transaction.update(GameReference, {
      isAvailable: false,
      buyerUid: CurrentUser.uid,
      buyerEmail: CurrentUser.email,
      soldAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  });
}

export async function PlaceBid(GameId, BidAmount, CurrentUser)
{
  EnsureSignedIn(CurrentUser);

  const CleanBidAmount = ToNumber(BidAmount, 0);

  await runTransaction(Db, async function PlaceBidTransaction(Transaction)
  {
    const GameReference = GetGameDocument(GameId);
    const GameSnapshot = await Transaction.get(GameReference);

    if (!GameSnapshot.exists())
    {
      throw new Error("Ta oferta już nie istnieje.");
    }

    const GameData = GameSnapshot.data();

    if (GameData.ownerUid === CurrentUser.uid)
    {
      throw new Error("Nie możesz licytować własnej gry.");
    }

    if (GameData.isAvailable === false)
    {
      throw new Error("Ta oferta jest już zakończona.");
    }

    if (GameData.auction === null || GameData.auction === undefined)
    {
      throw new Error("Ta gra nie ma licytacji.");
    }

    const CurrentBid = ToNumber(GameData.auction.current_bid, 0);

    if (CleanBidAmount <= CurrentBid)
    {
      throw new Error("Oferta musi być większa niż aktualna kwota.");
    }

    Transaction.update(GameReference, {
      "auction.current_bid": CleanBidAmount,
      "auction.highest_bidder_uid": CurrentUser.uid,
      "auction.highest_bidder_email": CurrentUser.email,
      updatedAt: serverTimestamp()
    });
  });
}