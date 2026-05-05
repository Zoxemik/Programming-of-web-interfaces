"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import AuctionBox from "@/components/AuctionBox";
import GameImage from "@/components/GameImage";
import PlaceholderImage from "@/components/PlaceholderImage";
import { Auth } from "@/lib/FirebaseClient";
import { BuyGameNow, DeleteGame, GetGameById } from "@/lib/FirestoreGames";
import { FormatMoney } from "@/lib/BoardGamesStorage";

function GetExpansionText(Game)
{
  if (Game.is_expansion)
  {
    return "Dodatek";
  }

  return "Gra podstawowa";
}

export default function GameDetailsPage(Props)
{
  const Router = useRouter();
  const [CurrentUser, SetCurrentUser] = useState(null);
  const [Game, SetGame] = useState(null);
  const [IsLoading, SetIsLoading] = useState(true);
  const [ErrorMessage, SetErrorMessage] = useState("");

  useEffect(function SubscribeToAuth()
  {
    const Unsubscribe = onAuthStateChanged(Auth, function HandleAuthChange(User)
    {
      SetCurrentUser(User);
    });

    return function CleanupAuth()
    {
      Unsubscribe();
    };
  }, []);

  async function LoadGame()
  {
    SetIsLoading(true);
    SetErrorMessage("");

    try
    {
      const FoundGame = await GetGameById(Props.GameId);
      SetGame(FoundGame);
    }
    catch (Error)
    {
      SetErrorMessage(Error.message);
    }

    SetIsLoading(false);
  }

  useEffect(function LoadGameDetails()
  {
    LoadGame();
  }, [Props.GameId]);

  async function HandleBuyNow()
  {
    SetErrorMessage("");

    try
    {
      await BuyGameNow(Game.id, CurrentUser);
      await LoadGame();
    }
    catch (Error)
    {
      SetErrorMessage(Error.message);
    }
  }

  async function HandleDelete()
  {
    const Confirmed = window.confirm("Na pewno usunąć tę ofertę?");

    if (!Confirmed)
    {
      return;
    }

    SetErrorMessage("");

    try
    {
      await DeleteGame(Game.id, CurrentUser);
      Router.push("/");
    }
    catch (Error)
    {
      SetErrorMessage(Error.message);
    }
  }

  if (IsLoading)
  {
    return (
      <main className="market-shell">
        <div className="market-container">
          <div className="soft-card p-8 text-center">
            <p className="text-lg font-black">Szukamy pudełka w Firestore...</p>
          </div>
        </div>
      </main>
    );
  }

  if (ErrorMessage.length > 0)
  {
    return (
      <main className="market-shell">
        <div className="market-container">
          <div className="soft-card p-8">
            <p className="font-black text-red-700">{ErrorMessage}</p>

            <Link href="/" className="secondary-button mt-5">
              Wróć do listy
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!Game)
  {
    return (
      <main className="market-shell">
        <div className="market-container">
          <div className="soft-card p-8">
            <p className="text-2xl font-black">Nie znaleziono takiej gry.</p>

            <Link href="/" className="secondary-button mt-5">
              Wróć do listy
            </Link>
          </div>
        </div>
      </main>
    );
  }

  let IsOwner = false;

  if (CurrentUser && Game.ownerUid === CurrentUser.uid)
  {
    IsOwner = true;
  }

  let CanBuy = false;

  if (CurrentUser && Game.isAvailable && !IsOwner)
  {
    CanBuy = true;
  }

  return (
    <main className="market-shell">
      <div className="market-container">
        <div className="mb-6 flex flex-wrap gap-3">
          <Link href="/" className="secondary-button">
            Wróć do listy
          </Link>

          {IsOwner && (
            <Link href={`/games/${Game.id}/edit`} className="primary-button">
              Edytuj ofertę
            </Link>
          )}

          {IsOwner && (
            <button type="button" className="danger-button" onClick={HandleDelete}>
              Usuń ofertę
            </button>
          )}
        </div>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="soft-card overflow-hidden p-4">
            {Game.images.length === 0 && (
              <PlaceholderImage />
            )}

            {Game.images.length > 0 && (
              <div className="grid gap-4">
                {Game.images.map(function RenderGameImage(ImagePath, ImageIndex)
                {
                  return (
                    <GameImage
                      key={`${ImagePath}-${ImageIndex}`}
                      ImagePath={ImagePath}
                      AltText={Game.title}
                      ClassName="h-72 w-full rounded-3xl object-cover sm:h-96"
                    />
                  );
                })}
              </div>
            )}
          </div>

          <article className="soft-card p-6 sm:p-8">
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="tiny-pill">{Game.type}</span>
              <span className="tiny-pill">{GetExpansionText(Game)}</span>
              <span className="tiny-pill">{Game.publisher}</span>

              {!Game.isAvailable && (
                <span className="tiny-pill border-red-200 bg-red-50 text-red-700">
                  Sprzedane
                </span>
              )}
            </div>

            <h1 className="text-4xl font-black tracking-tight text-stone-950 sm:text-5xl">
              {Game.title}
            </h1>

            <p className="mt-5 text-3xl font-black text-amber-800">
              {FormatMoney(Game.price_pln)}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl bg-stone-50 p-4">
                <p className="text-xs font-bold uppercase text-stone-400">Gracze</p>

                <p className="text-xl font-black">
                  {Game.min_players}-{Game.max_players}
                </p>
              </div>

              <div className="rounded-3xl bg-stone-50 p-4">
                <p className="text-xs font-bold uppercase text-stone-400">Czas gry</p>

                <p className="text-xl font-black">
                  {Game.avg_play_time_minutes} min
                </p>
              </div>

              <div className="rounded-3xl bg-stone-50 p-4">
                <p className="text-xs font-bold uppercase text-stone-400">Sprzedawca</p>

                <p className="break-all text-sm font-black">
                  {Game.ownerEmail}
                </p>
              </div>
            </div>

            <div className="mt-6">
              {CanBuy && (
                <button type="button" className="primary-button w-full" onClick={HandleBuyNow}>
                  Kup teraz
                </button>
              )}

              {!CurrentUser && (
                <p className="rounded-3xl bg-stone-50 p-4 text-sm font-bold text-stone-600">
                  Zaloguj się, żeby kupić tę grę.
                </p>
              )}

              {IsOwner && (
                <p className="rounded-3xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
                  To Twoja oferta.
                </p>
              )}

              {!Game.isAvailable && (
                <p className="rounded-3xl bg-red-50 p-4 text-sm font-bold text-red-700">
                  Ta oferta nie jest już dostępna.
                </p>
              )}
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-black">Opis</h2>

              <div className="mt-4 space-y-4 text-base leading-8 text-stone-600">
                {Game.description.map(function RenderParagraph(Paragraph, ParagraphIndex)
                {
                  return (
                    <p key={`${Paragraph}-${ParagraphIndex}`}>
                      {Paragraph}
                    </p>
                  );
                })}
              </div>
            </div>
          </article>
        </section>

        <section className="mt-6">
          <AuctionBox
            Game={Game}
            CurrentUser={CurrentUser}
            OnBidPlaced={LoadGame}
          />
        </section>
      </div>
    </main>
  );
}