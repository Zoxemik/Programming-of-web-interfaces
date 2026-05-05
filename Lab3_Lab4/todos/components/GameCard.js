import Link from "next/link";
import GameImage from "@/components/GameImage";
import { FormatMoney } from "@/lib/BoardGamesStorage";

function GetExpansionLabel(Game)
{
  if (Game.is_expansion)
  {
    return "Dodatek";
  }

  return "Podstawka";
}

function GetAuctionLabel(Game)
{
  if (Game.auction !== null)
  {
    return "Licytacja";
  }

  return "Cena stała";
}

export default function GameCard(Props)
{
  const Game = Props.Game;
  let MainImage = "";

  if (Game.images.length > 0)
  {
    MainImage = Game.images[0];
  }

  let ArticleClassName = "soft-card group overflow-hidden transition hover:-translate-y-1 hover:shadow-xl";

  if (!Game.isAvailable)
  {
    ArticleClassName = `${ArticleClassName} opacity-60 grayscale`;
  }

  let CanBuy = false;

  if (Props.CurrentUser && Game.isAvailable && Game.ownerUid !== Props.CurrentUser.uid)
  {
    CanBuy = true;
  }

  function HandleBuyClick()
  {
    if (Props.OnBuyNow)
    {
      Props.OnBuyNow(Game.id);
    }
  }

  return (
    <article className={ArticleClassName}>
      <div className="relative">
        <GameImage
          ImagePath={MainImage}
          AltText={Game.title}
          ClassName="h-52 w-full object-cover"
        />

        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className="tiny-pill bg-white/90">{Game.type}</span>
          <span className="tiny-pill bg-white/90">{GetAuctionLabel(Game)}</span>

          {!Game.isAvailable && (
            <span className="tiny-pill border-red-200 bg-red-50 text-red-700">
              Sprzedane
            </span>
          )}
        </div>
      </div>

      <div className="p-5">
        <div className="mb-3 flex items-start justify-between gap-4">
          <h2 className="text-xl font-black leading-tight text-stone-900">
            {Game.title}
          </h2>

          <span className="rounded-2xl bg-amber-100 px-3 py-1 text-sm font-black text-amber-900">
            {FormatMoney(Game.price_pln)}
          </span>
        </div>

        <p className="line-clamp-2 text-sm leading-6 text-stone-600">
          {Game.description.join(" ")}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-stone-50 p-3">
            <p className="text-xs font-bold uppercase text-stone-400">Gracze</p>
            <p className="font-black text-stone-800">
              {Game.min_players}-{Game.max_players}
            </p>
          </div>

          <div className="rounded-2xl bg-stone-50 p-3">
            <p className="text-xs font-bold uppercase text-stone-400">Czas</p>
            <p className="font-black text-stone-800">
              {Game.avg_play_time_minutes} min
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="tiny-pill">{Game.publisher}</span>
          <span className="tiny-pill">{GetExpansionLabel(Game)}</span>
        </div>

        <div className="mt-5 grid gap-2">
          <Link href={`/games/${Game.id}`} className="secondary-button w-full">
            Szczegóły
          </Link>

          {CanBuy && (
            <button type="button" className="primary-button w-full" onClick={HandleBuyClick}>
              Kup teraz
            </button>
          )}

          {!Game.isAvailable && (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-center text-sm font-black text-red-700">
              Oferta niedostępna
            </p>
          )}

          {Props.CurrentUser && Game.ownerUid === Props.CurrentUser.uid && (
            <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-center text-sm font-black text-emerald-700">
              Twoja oferta
            </p>
          )}
        </div>
      </div>
    </article>
  );
}