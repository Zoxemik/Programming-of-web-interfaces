export const ApiUrl = "https://szandala.github.io/piwo-api/board-games.json";
export const ApiBaseUrl = "https://szandala.github.io/piwo-api/";

export function ToNumber(Value, Fallback)
{
  const ParsedNumber = Number(Value);

  if (Number.isNaN(ParsedNumber))
  {
    return Fallback;
  }

  return ParsedNumber;
}

export function ToText(Value)
{
  if (Value === null)
  {
    return "";
  }

  if (Value === undefined)
  {
    return "";
  }

  return String(Value);
}

export function FormatMoney(Value)
{
  const SafeValue = ToNumber(Value, 0);

  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN"
  }).format(SafeValue);
}

export function BuildImageUrl(ImagePath)
{
  const CleanImagePath = ToText(ImagePath).trim();

  if (CleanImagePath.length === 0)
  {
    return "";
  }

  if (CleanImagePath.startsWith("http://") || CleanImagePath.startsWith("https://"))
  {
    return CleanImagePath;
  }

  const NormalizedPath = CleanImagePath.replace(/^\/+/, "");

  return `${ApiBaseUrl}${NormalizedPath}`;
}

export function NormalizeGame(Game)
{
  let Images = [];

  if (Array.isArray(Game.images))
  {
    Images = Game.images;
  }

  let Description = [];

  if (Array.isArray(Game.description))
  {
    Description = Game.description;
  }

  if (typeof Game.description === "string")
  {
    Description = Game.description.split("\n");
  }

let Auction = null;

if (Game.auction !== null && Game.auction !== undefined && typeof Game.auction === "object")
{
  Auction = {
    starting_price: ToNumber(Game.auction.starting_price, 0),
    current_bid: ToNumber(Game.auction.current_bid, 0),
    highest_bidder_uid: ToText(Game.auction.highest_bidder_uid),
    highest_bidder_email: ToText(Game.auction.highest_bidder_email)
  };
}

  let IsAvailable = true;

  if (Game.isAvailable === false)
  {
    IsAvailable = false;
  }

  return {
    id: ToText(Game.id),
    legacyId: ToText(Game.legacyId),
    title: ToText(Game.title),
    images: Images,
    description: Description,
    min_players: ToNumber(Game.min_players, 1),
    max_players: ToNumber(Game.max_players, 1),
    avg_play_time_minutes: ToNumber(Game.avg_play_time_minutes, 30),
    publisher: ToText(Game.publisher),
    is_expansion: Boolean(Game.is_expansion),
    price_pln: ToNumber(Game.price_pln, 0),
    auction: Auction,
    type: ToText(Game.type),
    ownerUid: ToText(Game.ownerUid),
    ownerEmail: ToText(Game.ownerEmail),
    isAvailable: IsAvailable,
    buyerUid: ToText(Game.buyerUid),
    buyerEmail: ToText(Game.buyerEmail),
    createdAt: Game.createdAt,
    updatedAt: Game.updatedAt,
    soldAt: Game.soldAt
  };
}

export async function FetchBoardGames()
{
  const Response = await fetch(ApiUrl, {
    cache: "no-store"
  });

  if (!Response.ok)
  {
    throw new Error("Nie udało się pobrać listy gier.");
  }

  const Data = await Response.json();

  let Games = [];

  if (Array.isArray(Data.board_games))
  {
    Games = Data.board_games;
  }

  return Games.map(function NormalizeFetchedGame(Game)
  {
    return NormalizeGame(Game);
  });
}