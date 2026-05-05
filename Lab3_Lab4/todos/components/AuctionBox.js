"use client";

import { useEffect, useState } from "react";
import { FormatMoney, ToNumber } from "@/lib/BoardGamesStorage";
import { PlaceBid } from "@/lib/FirestoreGames";

export default function AuctionBox(Props)
{
  let Game = null;

  if (Props.Game)
  {
    Game = Props.Game;
  }

  let Auction = null;

  if (Game && Game.auction)
  {
    Auction = Game.auction;
  }

  if (!Game && Props.Auction)
  {
    Auction = Props.Auction;
  }

  const [BidValue, SetBidValue] = useState("");
  const [Message, SetMessage] = useState("");
  const [IsSaving, SetIsSaving] = useState(false);

  useEffect(function PrepareBidValue()
  {
    if (Auction !== null && Auction !== undefined)
    {
      const NextBid = ToNumber(Auction.current_bid, 0) + 1;
      SetBidValue(String(NextBid));
    }
  }, [Auction]);

  if (Auction === null || Auction === undefined)
  {
    return (
      <div className="soft-card p-5">
        <p className="text-sm font-bold text-stone-500">Sprzedaż bez licytacji</p>

        <p className="mt-2 text-sm text-stone-600">
          Ta oferta ma zwykłą cenę katalogową.
        </p>
      </div>
    );
  }

  let CanBid = false;

  if (Props.CurrentUser && Game && Game.isAvailable && Game.ownerUid !== Props.CurrentUser.uid)
  {
    CanBid = true;
  }

  async function HandleBidSubmit(Event)
  {
    Event.preventDefault();
    SetMessage("");
    SetIsSaving(true);

    try
    {
      await PlaceBid(Game.id, BidValue, Props.CurrentUser);
      SetMessage("Oferta została przebita.");

      if (Props.OnBidPlaced)
      {
        Props.OnBidPlaced();
      }
    }
    catch (Error)
    {
      SetMessage(Error.message);
    }

    SetIsSaving(false);
  }

  let HighestBidderText = Auction.highest_bidder_email;

  if (!HighestBidderText)
  {
    HighestBidderText = Auction.highest_bidder_uid;
  }

  if (!HighestBidderText)
  {
    HighestBidderText = "Brak ofert";
  }

  return (
    <div className="soft-card border-amber-200 bg-amber-50/80 p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm font-black uppercase tracking-wide text-amber-800">
          Licytacja
        </p>

        <span className="tiny-pill border-amber-200 bg-white text-amber-800">
          aktywna
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <p className="text-xs font-bold uppercase text-stone-500">Cena startowa</p>

          <p className="text-lg font-black text-stone-900">
            {FormatMoney(Auction.starting_price)}
          </p>
        </div>

        <div>
          <p className="text-xs font-bold uppercase text-stone-500">Aktualna oferta</p>

          <p className="text-lg font-black text-stone-900">
            {FormatMoney(Auction.current_bid)}
          </p>
        </div>

        <div>
          <p className="text-xs font-bold uppercase text-stone-500">Najwyższy oferent</p>

          <p className="break-all text-lg font-black text-stone-900">
            {HighestBidderText}
          </p>
        </div>
      </div>

      {CanBid && (
        <form className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={HandleBidSubmit}>
          <input
            className="field-input"
            type="number"
            min="0"
            step="0.01"
            value={BidValue}
            onChange={function HandleBidChange(Event)
            {
              SetBidValue(Event.target.value);
            }}
          />

          <button type="submit" className="primary-button" disabled={IsSaving}>
            Przebij
          </button>
        </form>
      )}

      {!Props.CurrentUser && (
        <p className="mt-4 text-sm font-bold text-amber-900">
          Zaloguj się, żeby licytować.
        </p>
      )}

      {Props.CurrentUser && Game && Game.ownerUid === Props.CurrentUser.uid && (
        <p className="mt-4 text-sm font-bold text-amber-900">
          To Twoja oferta, więc nie możesz jej licytować.
        </p>
      )}

      {Game && !Game.isAvailable && (
        <p className="mt-4 text-sm font-bold text-red-700">
          Oferta jest zakończona.
        </p>
      )}

      {Message.length > 0 && (
        <p className="mt-4 text-sm font-bold text-stone-700">
          {Message}
        </p>
      )}
    </div>
  );
}