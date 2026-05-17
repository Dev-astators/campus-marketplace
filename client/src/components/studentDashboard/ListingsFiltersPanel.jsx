import { CONDITIONS, SORT_OPTIONS } from "./listingFiltersConfig";

export default function ListingsFiltersPanel({
  selectedCondition,
  onConditionChange,
  minPrice,
  onMinPriceChange,
  maxPrice,
  onMaxPriceChange,
  sortBy,
  onSortByChange,
  onClearFilters,
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <form
        className="grid grid-cols-1 items-end gap-3 md:grid-cols-2 lg:grid-cols-5"
        aria-label="Listings filters"
        onSubmit={(event) => event.preventDefault()}
      >
        <label className="flex flex-col gap-1 text-sm text-gray-700">
          <p>Condition</p>
          <select
            value={selectedCondition}
            onChange={(event) => onConditionChange(event.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2"
          >
            {CONDITIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-gray-700">
          <p>Min Price (R)</p>
          <input
            type="number"
            min="0"
            value={minPrice}
            onChange={(event) => onMinPriceChange(event.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2"
            placeholder="0"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-gray-700">
          <p>Max Price (R)</p>
          <input
            type="number"
            min="0"
            value={maxPrice}
            onChange={(event) => onMaxPriceChange(event.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2"
            placeholder="10000"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-gray-700">
          <p>Sort By</p>
          <select
            value={sortBy}
            onChange={(event) => onSortByChange(event.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={onClearFilters}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:border-gray-400"
        >
          Clear Filters
        </button>
      </form>
    </section>
  );
}
