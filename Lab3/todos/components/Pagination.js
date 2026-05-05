export default function Pagination(Props)
{
  function GoToPreviousPage()
  {
    if (Props.CanGoPrevious)
    {
      Props.OnPreviousPage();
    }
  }

  function GoToNextPage()
  {
    if (Props.CanGoNext)
    {
      Props.OnNextPage();
    }
  }

  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        className="secondary-button"
        onClick={GoToPreviousPage}
        disabled={!Props.CanGoPrevious}
      >
        Poprzednia
      </button>

      <span className="tiny-pill bg-white">
        Strona {Props.CurrentPage}
      </span>

      <button
        type="button"
        className="secondary-button"
        onClick={GoToNextPage}
        disabled={!Props.CanGoNext}
      >
        Następna
      </button>
    </nav>
  );
}