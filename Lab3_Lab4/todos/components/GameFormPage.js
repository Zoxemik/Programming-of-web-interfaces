"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import AuthPanel from "@/components/AuthPanel";
import { Auth } from "@/lib/FirebaseClient";
import {
  CreateGame,
  GetGameById,
  UpdateGame
} from "@/lib/FirestoreGames";
import {
  NormalizeGame,
  ToNumber
} from "@/lib/BoardGamesStorage";

function BuildEmptyForm()
{
  return {
    Title: "",
    Description: "",
    MinPlayers: "2",
    MaxPlayers: "4",
    AvgPlayTimeMinutes: "45",
    Publisher: "",
    IsExpansion: false,
    PricePln: "99.99",
    Type: "",
    ImagesText: "",
    HasAuction: false,
    StartingPrice: "",
    CurrentBid: "",
    HighestBidderUid: "",
    HighestBidderEmail: ""
  };
}

function BuildFormFromGame(Game)
{
  const Form = BuildEmptyForm();

  Form.Title = Game.title;
  Form.Description = Game.description.join("\n");
  Form.MinPlayers = String(Game.min_players);
  Form.MaxPlayers = String(Game.max_players);
  Form.AvgPlayTimeMinutes = String(Game.avg_play_time_minutes);
  Form.Publisher = Game.publisher;
  Form.IsExpansion = Game.is_expansion;
  Form.PricePln = String(Game.price_pln);
  Form.Type = Game.type;
  Form.ImagesText = Game.images.join(", ");

  if (Game.auction !== null)
  {
    Form.HasAuction = true;
    Form.StartingPrice = String(Game.auction.starting_price);
    Form.CurrentBid = String(Game.auction.current_bid);
    Form.HighestBidderUid = Game.auction.highest_bidder_uid;
    Form.HighestBidderEmail = Game.auction.highest_bidder_email;
  }

  return Form;
}

function GetPageTitle(Mode)
{
  if (Mode === "edit")
  {
    return "Edytuj ofertę";
  }

  return "Dodaj nową grę";
}

function GetSubmitText(Mode)
{
  if (Mode === "edit")
  {
    return "Zapisz zmiany";
  }

  return "Dodaj ofertę";
}

function BuildGameFromForm(FormData, GameId)
{
  const Description = FormData.Description
    .split("\n")
    .map(function CleanParagraph(Paragraph)
    {
      return Paragraph.trim();
    })
    .filter(function KeepParagraph(Paragraph)
    {
      return Paragraph.length > 0;
    });

  const Images = FormData.ImagesText
    .split(",")
    .map(function CleanImagePath(ImagePath)
    {
      return ImagePath.trim();
    })
    .filter(function KeepImagePath(ImagePath)
    {
      return ImagePath.length > 0;
    });

  let Auction = null;

  if (FormData.HasAuction)
  {
    Auction = {
      starting_price: ToNumber(FormData.StartingPrice, 0),
      current_bid: ToNumber(FormData.CurrentBid, 0),
      highest_bidder_uid: FormData.HighestBidderUid.trim(),
      highest_bidder_email: FormData.HighestBidderEmail.trim()
    };
  }

  const RawGame = {
    id: String(GameId),
    title: FormData.Title.trim(),
    images: Images,
    description: Description,
    min_players: ToNumber(FormData.MinPlayers, 1),
    max_players: ToNumber(FormData.MaxPlayers, 1),
    avg_play_time_minutes: ToNumber(FormData.AvgPlayTimeMinutes, 30),
    publisher: FormData.Publisher.trim(),
    is_expansion: FormData.IsExpansion,
    price_pln: ToNumber(FormData.PricePln, 0),
    auction: Auction,
    type: FormData.Type.trim()
  };

  return NormalizeGame(RawGame);
}

export default function GameFormPage(Props)
{
  const Router = useRouter();
  const [CurrentUser, SetCurrentUser] = useState(null);
  const [AuthReady, SetAuthReady] = useState(false);
  const [EditedGame, SetEditedGame] = useState(null);
  const [FormData, SetFormData] = useState(BuildEmptyForm());
  const [IsLoading, SetIsLoading] = useState(true);
  const [ErrorMessage, SetErrorMessage] = useState("");

  useEffect(function SubscribeToAuth()
  {
    const Unsubscribe = onAuthStateChanged(Auth, function HandleAuthChange(User)
    {
      SetCurrentUser(User);
      SetAuthReady(true);
    });

    return function CleanupAuth()
    {
      Unsubscribe();
    };
  }, []);

  useEffect(function LoadFormData()
  {
    let IsMounted = true;

    async function LoadEditedGame()
    {
      if (Props.Mode !== "edit")
      {
        SetIsLoading(false);
        return;
      }

      try
      {
        const FoundGame = await GetGameById(Props.GameId);

        if (!IsMounted)
        {
          return;
        }

        if (FoundGame)
        {
          SetEditedGame(FoundGame);
          SetFormData(BuildFormFromGame(FoundGame));
        }
        else
        {
          SetErrorMessage("Nie znaleziono gry do edycji.");
        }
      }
      catch (Error)
      {
        SetErrorMessage(Error.message);
      }

      SetIsLoading(false);
    }

    LoadEditedGame();

    return function StopLoadingFormData()
    {
      IsMounted = false;
    };
  }, [Props.Mode, Props.GameId]);

  function HandleInputChange(Event)
  {
    const Input = Event.target;
    const Name = Input.name;
    let NewValue = Input.value;

    if (Input.type === "checkbox")
    {
      NewValue = Input.checked;
    }

    SetFormData(function UpdateFormData(CurrentFormData)
    {
      return {
        ...CurrentFormData,
        [Name]: NewValue
      };
    });
  }

  function ValidateForm()
  {
    if (FormData.Title.trim().length === 0)
    {
      return "Podaj tytuł gry.";
    }

    if (FormData.Publisher.trim().length === 0)
    {
      return "Podaj wydawcę.";
    }

    if (FormData.Type.trim().length === 0)
    {
      return "Podaj typ gry.";
    }

    if (FormData.Description.trim().length === 0)
    {
      return "Dodaj przynajmniej jedno zdanie opisu.";
    }

    if (ToNumber(FormData.MinPlayers, 0) > ToNumber(FormData.MaxPlayers, 0))
    {
      return "Minimalna liczba graczy nie może być większa niż maksymalna.";
    }

    if (FormData.HasAuction && ToNumber(FormData.CurrentBid, 0) < ToNumber(FormData.StartingPrice, 0))
    {
      return "Aktualna oferta nie może być mniejsza niż cena startowa.";
    }

    return "";
  }

  async function HandleSubmit(Event)
  {
    Event.preventDefault();
    SetErrorMessage("");

    if (!CurrentUser)
    {
      SetErrorMessage("Musisz się zalogować.");
      return;
    }

    const ValidationMessage = ValidateForm();

    if (ValidationMessage.length > 0)
    {
      SetErrorMessage(ValidationMessage);
      return;
    }

    try
    {
      if (Props.Mode === "create")
      {
        const Game = BuildGameFromForm(FormData, "");
        const CreatedId = await CreateGame(Game, CurrentUser);
        Router.push(`/games/${CreatedId}`);
        return;
      }

      const Game = BuildGameFromForm(FormData, Props.GameId);

      await UpdateGame(Props.GameId, Game, CurrentUser);
      Router.push(`/games/${Props.GameId}`);
    }
    catch (Error)
    {
      SetErrorMessage(Error.message);
    }
  }

  if (!AuthReady || IsLoading)
  {
    return (
      <main className="market-shell">
        <div className="market-container">
          <div className="soft-card p-8 text-center">
            <p className="text-lg font-black">Przygotowujemy formularz...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!CurrentUser)
  {
    return (
      <main className="market-shell">
        <div className="market-container max-w-3xl">
          <Link href="/" className="secondary-button mb-6">
            Wróć do listy
          </Link>

          <div className="soft-card p-6">
            <p className="mb-4 text-2xl font-black">
              Zaloguj się, żeby dodać albo edytować ofertę.
            </p>

            <AuthPanel OnUserChange={SetCurrentUser} />
          </div>
        </div>
      </main>
    );
  }

  if (Props.Mode === "edit" && EditedGame && EditedGame.ownerUid !== CurrentUser.uid)
  {
    return (
      <main className="market-shell">
        <div className="market-container">
          <div className="soft-card p-8">
            <p className="text-2xl font-black text-red-700">
              Nie możesz edytować cudzej oferty.
            </p>

            <Link href={`/games/${Props.GameId}`} className="secondary-button mt-5">
              Wróć do szczegółów
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="market-shell">
      <div className="market-container max-w-4xl">
        <div className="mb-6 flex flex-wrap gap-3">
          <Link href="/" className="secondary-button">
            Wróć do listy
          </Link>
        </div>

        <section className="soft-card p-6 sm:p-8">
          <div className="mb-8">
            <p className="mb-3 inline-flex rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-900">
              Firestore formularz
            </p>

            <h1 className="text-4xl font-black tracking-tight text-stone-950">
              {GetPageTitle(Props.Mode)}
            </h1>

            <p className="mt-3 text-stone-600">
              Dane zapisują się w Firestore, a właścicielem oferty jest aktualnie zalogowany użytkownik.
            </p>
          </div>

          {ErrorMessage.length > 0 && (
            <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
              {ErrorMessage}
            </div>
          )}

          <form onSubmit={HandleSubmit} className="grid gap-5">
            <div>
              <label className="field-label" htmlFor="Title">
                Tytuł
              </label>

              <input
                id="Title"
                name="Title"
                className="field-input"
                value={FormData.Title}
                onChange={HandleInputChange}
              />
            </div>

            <div>
              <label className="field-label" htmlFor="Description">
                Opis
              </label>

              <textarea
                id="Description"
                name="Description"
                className="field-input min-h-36 resize-y"
                value={FormData.Description}
                onChange={HandleInputChange}
                placeholder="Każda linia stanie się osobnym akapitem."
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="field-label" htmlFor="MinPlayers">
                  Min. graczy
                </label>

                <input
                  id="MinPlayers"
                  name="MinPlayers"
                  type="number"
                  min="1"
                  className="field-input"
                  value={FormData.MinPlayers}
                  onChange={HandleInputChange}
                />
              </div>

              <div>
                <label className="field-label" htmlFor="MaxPlayers">
                  Max. graczy
                </label>

                <input
                  id="MaxPlayers"
                  name="MaxPlayers"
                  type="number"
                  min="1"
                  className="field-input"
                  value={FormData.MaxPlayers}
                  onChange={HandleInputChange}
                />
              </div>

              <div>
                <label className="field-label" htmlFor="AvgPlayTimeMinutes">
                  Czas gry
                </label>

                <input
                  id="AvgPlayTimeMinutes"
                  name="AvgPlayTimeMinutes"
                  type="number"
                  min="1"
                  className="field-input"
                  value={FormData.AvgPlayTimeMinutes}
                  onChange={HandleInputChange}
                />
              </div>

              <div>
                <label className="field-label" htmlFor="PricePln">
                  Cena PLN
                </label>

                <input
                  id="PricePln"
                  name="PricePln"
                  type="number"
                  step="0.01"
                  min="0"
                  className="field-input"
                  value={FormData.PricePln}
                  onChange={HandleInputChange}
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="field-label" htmlFor="Publisher">
                  Wydawca
                </label>

                <input
                  id="Publisher"
                  name="Publisher"
                  className="field-input"
                  value={FormData.Publisher}
                  onChange={HandleInputChange}
                />
              </div>

              <div>
                <label className="field-label" htmlFor="Type">
                  Typ
                </label>

                <input
                  id="Type"
                  name="Type"
                  className="field-input"
                  value={FormData.Type}
                  onChange={HandleInputChange}
                  placeholder="np. ekonomiczna, rodzinna, karciana"
                />
              </div>
            </div>

            <div>
              <label className="field-label" htmlFor="ImagesText">
                Zdjęcia
              </label>

              <input
                id="ImagesText"
                name="ImagesText"
                className="field-input"
                value={FormData.ImagesText}
                onChange={HandleInputChange}
                placeholder="Ścieżki albo linki oddzielone przecinkami"
              />
            </div>

            <label className="flex items-center gap-3 rounded-3xl border border-stone-200 bg-stone-50 p-4">
              <input
                name="IsExpansion"
                type="checkbox"
                checked={FormData.IsExpansion}
                onChange={HandleInputChange}
                className="h-5 w-5"
              />

              <span className="font-bold text-stone-700">
                To jest dodatek do innej gry
              </span>
            </label>

            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
              <label className="flex items-center gap-3">
                <input
                  name="HasAuction"
                  type="checkbox"
                  checked={FormData.HasAuction}
                  onChange={HandleInputChange}
                  className="h-5 w-5"
                />

                <span className="font-black text-amber-900">
                  Ta oferta ma licytację
                </span>
              </label>

              {FormData.HasAuction && (
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="field-label" htmlFor="StartingPrice">
                      Cena startowa
                    </label>

                    <input
                      id="StartingPrice"
                      name="StartingPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      className="field-input"
                      value={FormData.StartingPrice}
                      onChange={HandleInputChange}
                    />
                  </div>

                  <div>
                    <label className="field-label" htmlFor="CurrentBid">
                      Aktualna oferta
                    </label>

                    <input
                      id="CurrentBid"
                      name="CurrentBid"
                      type="number"
                      step="0.01"
                      min="0"
                      className="field-input"
                      value={FormData.CurrentBid}
                      onChange={HandleInputChange}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap justify-end gap-3 pt-4">
              <Link href="/" className="secondary-button">
                Anuluj
              </Link>

              <button type="submit" className="primary-button">
                {GetSubmitText(Props.Mode)}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}