"use client";

import { useState } from "react";
import { BuildImageUrl } from "@/lib/BoardGamesStorage";

function LocalPlaceholderImage(Props)
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

export default function GameImage(Props)
{
  const [ImageFailed, SetImageFailed] = useState(false);
  const ImageUrl = BuildImageUrl(Props.ImagePath);

  let ClassName = "";

  if (Props.ClassName)
  {
    ClassName = Props.ClassName;
  }

  function HandleImageError()
  {
    SetImageFailed(true);
  }

  if (ImageUrl.length === 0)
  {
    return <LocalPlaceholderImage />;
  }

  if (ImageFailed)
  {
    return <LocalPlaceholderImage Label="Zdjęcie niedostępne" />;
  }

  return (
    <img
      src={ImageUrl}
      alt={Props.AltText}
      className={ClassName}
      onError={HandleImageError}
    />
  );
}