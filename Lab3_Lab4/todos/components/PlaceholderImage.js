export default function PlaceholderImage(Props)
{
  let Label = "Brak zdjęcia";

  if (Props !== undefined && Props.Label !== undefined)
  {
    Label = Props.Label;
  }

  return (
    <div className="flex min-h-48 w-full items-center justify-center rounded-3xl border border-dashed border-stone-300 bg-stone-100 px-6 text-center">
      <div>
        <div className="text-4xl">🎲</div>

        <p className="mt-3 text-sm font-bold text-stone-500">
          {Label}
        </p>
      </div>
    </div>
  );
}