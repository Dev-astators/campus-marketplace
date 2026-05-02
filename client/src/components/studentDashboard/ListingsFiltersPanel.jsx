import { useState } from "react";
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
  const [open, setOpen] = useState(false);

  return (
    <section aria-label="Listing filters">
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((s) => !s)}
          className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 hover:shadow"
        >
          Filters
        </button>
        <button
          type="button"
          onClick={onClearFilters}
          className="text-sm text-gray-500 hover:underline"
        >
          Clear
        </button>
      </header>

      {open && (
        <section className="mt-3 bg-white border border-gray-200 rounded-xl p-4">
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

            <div className="flex items-center">
              <button
                type="button"
                onClick={() => {
                  onClearFilters();
                  setOpen(false);
                }}
                className="border border-gray-300 hover:border-gray-400 rounded-lg px-4 py-2 text-sm text-gray-700"
              >
                Apply / Clear
              </button>
            </div>
          </form>
        </section>
      )}
    </section>
  );
}
