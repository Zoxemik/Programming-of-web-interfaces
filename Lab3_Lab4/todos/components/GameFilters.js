export default function GameFilters(Props)
{
  return (
    <section className="soft-card p-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="md:col-span-2">
          <label className="field-label" htmlFor="SearchText">
            Szukaj gry
          </label>

          <input
            id="SearchText"
            className="field-input"
            value={Props.SearchText}
            onChange={Props.OnSearchTextChange}
            placeholder="np. Catan, Rebel, karciana..."
          />
        </div>

        <div>
          <label className="field-label" htmlFor="TypeFilter">
            Typ
          </label>

          <select
            id="TypeFilter"
            className="field-input"
            value={Props.TypeFilter}
            onChange={Props.OnTypeFilterChange}
          >
            <option value="all">Wszystkie typy</option>
            {Props.Types.map(function RenderTypeOption(Type)
            {
              return (
                <option key={Type} value={Type}>
                  {Type}
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label className="field-label" htmlFor="PublisherFilter">
            Wydawca
          </label>

          <select
            id="PublisherFilter"
            className="field-input"
            value={Props.PublisherFilter}
            onChange={Props.OnPublisherFilterChange}
          >
            <option value="all">Wszyscy wydawcy</option>
            {Props.Publishers.map(function RenderPublisherOption(Publisher)
            {
              return (
                <option key={Publisher} value={Publisher}>
                  {Publisher}
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label className="field-label" htmlFor="ExpansionFilter">
            Wersja
          </label>

          <select
            id="ExpansionFilter"
            className="field-input"
            value={Props.ExpansionFilter}
            onChange={Props.OnExpansionFilterChange}
          >
            <option value="all">Wszystko</option>
            <option value="base">Tylko podstawki</option>
            <option value="expansion">Tylko dodatki</option>
          </select>
        </div>

        <div>
          <label className="field-label" htmlFor="AuctionFilter">
            Aukcja
          </label>

          <select
            id="AuctionFilter"
            className="field-input"
            value={Props.AuctionFilter}
            onChange={Props.OnAuctionFilterChange}
          >
            <option value="all">Wszystkie oferty</option>
            <option value="auction">Tylko licytacje</option>
            <option value="fixed">Bez licytacji</option>
          </select>
        </div>

        <div>
          <label className="field-label" htmlFor="PlayerFilter">
            Liczba graczy
          </label>

          <select
            id="PlayerFilter"
            className="field-input"
            value={Props.PlayerFilter}
            onChange={Props.OnPlayerFilterChange}
          >
            <option value="all">Dowolna</option>
            <option value="1">1 gracz</option>
            <option value="2">2 graczy</option>
            <option value="3">3 graczy</option>
            <option value="4">4 graczy</option>
            <option value="5">5 graczy</option>
            <option value="6">6+ graczy</option>
          </select>
        </div>

        <div>
          <label className="field-label" htmlFor="SortOrder">
            Sortowanie
          </label>

          <select
            id="SortOrder"
            className="field-input"
            value={Props.SortOrder}
            onChange={Props.OnSortOrderChange}
          >
            <option value="default">Domyślnie</option>
            <option value="title">Tytuł A-Z</option>
            <option value="priceAsc">Cena rosnąco</option>
            <option value="priceDesc">Cena malejąco</option>
            <option value="timeAsc">Najkrótszy czas gry</option>
          </select>
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <button type="button" className="secondary-button" onClick={Props.OnClearFilters}>
          Wyczyść filtry
        </button>
      </div>
    </section>
  );
}