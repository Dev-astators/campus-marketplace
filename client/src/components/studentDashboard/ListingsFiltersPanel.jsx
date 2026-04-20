import { CONDITIONS, SORT_OPTIONS } from "./listingFiltersConfig";

// Stateless/controlled filter panel.
// All values and handlers are provided by the parent hook/page, which keeps
// business logic in one place and UI rendering in this component.
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
    <section className="bg-white border border-gray-200 rounded-xl p-4">
      <form
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 items-end"
        aria-label="Listings filters"
        onSubmit={(e) => e.preventDefault()}
      >
        <label className="flex flex-col gap-1 text-sm text-gray-700">
          <span>Condition</span>
          <select
            value={selectedCondition}
            onChange={(e) => onConditionChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            {CONDITIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-gray-700">
          <span>Min Price (R)</span>
          <input
            type="number"
            min="0"
            value={minPrice}
            onChange={(e) => onMinPriceChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2"
            placeholder="0"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-gray-700">
          <span>Max Price (R)</span>
          <input
            type="number"
            min="0"
            value={maxPrice}
            onChange={(e) => onMaxPriceChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2"
            placeholder="10000"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-gray-700">
          <span>Sort By</span>
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2"
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
          className="border border-gray-300 hover:border-gray-400 rounded-lg px-4 py-2 text-sm text-gray-700"
        >
          Clear Filters
        </button>
      </form>
    </section>
  );
}
