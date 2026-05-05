"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AuthPanel from "@/components/AuthPanel";
import GameCard from "@/components/GameCard";
import GameFilters from "@/components/GameFilters";
import Pagination from "@/components/Pagination";
import {
  BuyGameNow,
  GetGamesPage,
  SeedGamesFromApi
} from "@/lib/FirestoreGames";

const ItemsPerPage = 10;

export default function BoardGameMarket()
{
  const [CurrentUser, SetCurrentUser] = useState(null);
  const [Games, SetGames] = useState([]);
  const [PageCursors, SetPageCursors] = useState([null]);
  const [CurrentPageIndex, SetCurrentPageIndex] = useState(0);
  const [HasNextPage, SetHasNextPage] = useState(false);
  const [SearchText, SetSearchText] = useState("");
  const [TypeFilter, SetTypeFilter] = useState("all");
  const [PublisherFilter, SetPublisherFilter] = useState("all");
  const [ExpansionFilter, SetExpansionFilter] = useState("all");
  const [AuctionFilter, SetAuctionFilter] = useState("all");
  const [PlayerFilter, SetPlayerFilter] = useState("all");
  const [SortOrder, SetSortOrder] = useState("default");
  const [IsLoading, SetIsLoading] = useState(true);
  const [ErrorMessage, SetErrorMessage] = useState("");

  async function LoadPage(PageIndex, PageCursor)
  {
    SetIsLoading(true);
    SetErrorMessage("");

    try
    {
      const Result = await GetGamesPage(ItemsPerPage, PageCursor);

      SetGames(Result.Games);
      SetHasNextPage(Result.HasMore);
      SetCurrentPageIndex(PageIndex);

      SetPageCursors(function UpdateCursors(CurrentCursors)
      {
        const NextCursors = CurrentCursors.slice();

        if (Result.LastDocument !== null)
        {
          NextCursors[PageIndex + 1] = Result.LastDocument;
        }

        return NextCursors;
      });
    }
    catch (Error)
    {
      SetErrorMessage(Error.message);
    }

    SetIsLoading(false);
  }

  useEffect(function LoadInitialGames()
  {
    LoadPage(0, null);
  }, []);

  const Types = useMemo(function BuildTypes()
  {
    const UniqueTypes = new Set();

    Games.forEach(function AddType(Game)
    {
      if (Game.type.length > 0)
      {
        UniqueTypes.add(Game.type);
      }
    });

    return Array.from(UniqueTypes).sort();
  }, [Games]);

  const Publishers = useMemo(function BuildPublishers()
  {
    const UniquePublishers = new Set();

    Games.forEach(function AddPublisher(Game)
    {
      if (Game.publisher.length > 0)
      {
        UniquePublishers.add(Game.publisher);
      }
    });

    return Array.from(UniquePublishers).sort();
  }, [Games]);

  const FilteredGames = useMemo(function BuildFilteredGames()
  {
    const SearchQuery = SearchText.trim().toLowerCase();

    let Result = Games.filter(function CheckGameVisibility(Game)
    {
      const DescriptionText = Game.description.join(" ");
      const FlatText = `${Game.title} ${Game.publisher} ${Game.type} ${DescriptionText}`.toLowerCase();

      if (SearchQuery.length > 0 && !FlatText.includes(SearchQuery))
      {
        return false;
      }

      if (TypeFilter !== "all" && Game.type !== TypeFilter)
      {
        return false;
      }

      if (PublisherFilter !== "all" && Game.publisher !== PublisherFilter)
      {
        return false;
      }

      if (ExpansionFilter === "base" && Game.is_expansion)
      {
        return false;
      }

      if (ExpansionFilter === "expansion" && !Game.is_expansion)
      {
        return false;
      }

      if (AuctionFilter === "auction" && Game.auction === null)
      {
        return false;
      }

      if (AuctionFilter === "fixed" && Game.auction !== null)
      {
        return false;
      }

      if (PlayerFilter !== "all")
      {
        const WantedPlayers = Number(PlayerFilter);

        if (WantedPlayers === 6)
        {
          if (Game.max_players < 6)
          {
            return false;
          }
        }
        else
        {
          if (Game.min_players > WantedPlayers || Game.max_players < WantedPlayers)
          {
            return false;
          }
        }
      }

      return true;
    });

    Result = Result.slice();

    if (SortOrder === "title")
    {
      Result.sort(function CompareByTitle(FirstGame, SecondGame)
      {
        return FirstGame.title.localeCompare(SecondGame.title, "pl");
      });
    }

    if (SortOrder === "priceAsc")
    {
      Result.sort(function CompareByLowestPrice(FirstGame, SecondGame)
      {
        return FirstGame.price_pln - SecondGame.price_pln;
      });
    }

    if (SortOrder === "priceDesc")
    {
      Result.sort(function CompareByHighestPrice(FirstGame, SecondGame)
      {
        return SecondGame.price_pln - FirstGame.price_pln;
      });
    }

    if (SortOrder === "timeAsc")
    {
      Result.sort(function CompareByShortestTime(FirstGame, SecondGame)
      {
        return FirstGame.avg_play_time_minutes - SecondGame.avg_play_time_minutes;
      });
    }

    return Result;
  }, [
    Games,
    SearchText,
    TypeFilter,
    PublisherFilter,
    ExpansionFilter,
    AuctionFilter,
    PlayerFilter,
    SortOrder
  ]);

  function HandleSearchTextChange(Event)
  {
    SetSearchText(Event.target.value);
  }

  function HandleTypeFilterChange(Event)
  {
    SetTypeFilter(Event.target.value);
  }

  function HandlePublisherFilterChange(Event)
  {
    SetPublisherFilter(Event.target.value);
  }

  function HandleExpansionFilterChange(Event)
  {
    SetExpansionFilter(Event.target.value);
  }

  function HandleAuctionFilterChange(Event)
  {
    SetAuctionFilter(Event.target.value);
  }

  function HandlePlayerFilterChange(Event)
  {
    SetPlayerFilter(Event.target.value);
  }

  function HandleSortOrderChange(Event)
  {
    SetSortOrder(Event.target.value);
  }

  function HandleClearFilters()
  {
    SetSearchText("");
    SetTypeFilter("all");
    SetPublisherFilter("all");
    SetExpansionFilter("all");
    SetAuctionFilter("all");
    SetPlayerFilter("all");
    SetSortOrder("default");
  }

  async function HandleSeedData()
  {
    SetErrorMessage("");

    try
    {
      await SeedGamesFromApi(CurrentUser);
      SetPageCursors([null]);
      await LoadPage(0, null);
    }
    catch (Error)
    {
      SetErrorMessage(Error.message);
    }
  }

  async function HandleBuyNow(GameId)
  {
    SetErrorMessage("");

    try
    {
      await BuyGameNow(GameId, CurrentUser);
      await LoadPage(CurrentPageIndex, PageCursors[CurrentPageIndex]);
    }
    catch (Error)
    {
      SetErrorMessage(Error.message);
    }
  }

  function HandleNextPage()
  {
    const NextPageIndex = CurrentPageIndex + 1;
    const NextCursor = PageCursors[NextPageIndex];

    LoadPage(NextPageIndex, NextCursor);
  }

  function HandlePreviousPage()
  {
    const PreviousPageIndex = CurrentPageIndex - 1;
    let PreviousCursor = PageCursors[PreviousPageIndex];

    if (PreviousCursor === undefined)
    {
      PreviousCursor = null;
    }

    LoadPage(PreviousPageIndex, PreviousCursor);
  }

  return (
    <main className="market-shell">
      <div className="market-container">
        <header className="mb-8 grid gap-6 lg:grid-cols-[1.4fr_0.6fr] lg:items-start">
          <div>
            <p className="mb-3 inline-flex rounded-full bg-amber-100 px-4 py-2 text-sm font-black text-amber-900">
              Firebase bazarek planszówek
            </p>

            <h1 className="text-4xl font-black tracking-tight text-stone-950 sm:text-6xl">
              Planszowy Pchli Targ
            </h1>

            <p className="mt-4 max-w-2xl text-lg leading-8 text-stone-600">
              Przeglądaj oferty z Firestore, kupuj gry, dodawaj własne ogłoszenia i licytuj bez konfliktów.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {CurrentUser && (
                <Link href="/games/new" className="primary-button">
                  Dodaj grę
                </Link>
              )}

              {CurrentUser && (
                <button type="button" className="secondary-button" onClick={HandleSeedData}>
                  Importuj przykładowe dane
                </button>
              )}
            </div>
          </div>

          <AuthPanel OnUserChange={SetCurrentUser} />
        </header>

        {ErrorMessage.length > 0 && (
          <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
            {ErrorMessage}
          </div>
        )}

        <GameFilters
          SearchText={SearchText}
          OnSearchTextChange={HandleSearchTextChange}
          TypeFilter={TypeFilter}
          OnTypeFilterChange={HandleTypeFilterChange}
          PublisherFilter={PublisherFilter}
          OnPublisherFilterChange={HandlePublisherFilterChange}
          ExpansionFilter={ExpansionFilter}
          OnExpansionFilterChange={HandleExpansionFilterChange}
          AuctionFilter={AuctionFilter}
          OnAuctionFilterChange={HandleAuctionFilterChange}
          PlayerFilter={PlayerFilter}
          OnPlayerFilterChange={HandlePlayerFilterChange}
          SortOrder={SortOrder}
          OnSortOrderChange={HandleSortOrderChange}
          Types={Types}
          Publishers={Publishers}
          OnClearFilters={HandleClearFilters}
        />

        <section className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-bold text-stone-600">
            Na tej stronie: {FilteredGames.length} ofert
          </p>

          <p className="text-sm font-bold text-stone-600">
            Strona {CurrentPageIndex + 1}
          </p>
        </section>

        {IsLoading && (
          <section className="soft-card mt-6 p-8 text-center">
            <p className="text-lg font-black">Ładowanie danych z Firestore...</p>
          </section>
        )}

        {!IsLoading && FilteredGames.length === 0 && (
          <section className="soft-card mt-6 p-8 text-center">
            <p className="text-2xl font-black">Brak ofert na tej stronie</p>
            <p className="mt-2 text-stone-500">
              Zaimportuj dane albo zmień filtry.
            </p>
          </section>
        )}

        {!IsLoading && (
          <section className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {FilteredGames.map(function RenderGameCard(Game)
            {
              return (
                <GameCard
                  key={Game.id}
                  Game={Game}
                  CurrentUser={CurrentUser}
                  OnBuyNow={HandleBuyNow}
                />
              );
            })}
          </section>
        )}

        <Pagination
          CurrentPage={CurrentPageIndex + 1}
          CanGoPrevious={CurrentPageIndex > 0}
          CanGoNext={HasNextPage}
          OnPreviousPage={HandlePreviousPage}
          OnNextPage={HandleNextPage}
        />
      </div>
    </main>
  );
}