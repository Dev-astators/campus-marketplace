// src/components/dashboard/ListingsGrid.jsx

/**
 * ListingsGrid component
 * Renders a responsive grid of ListingCard components.
 * Props:
 *  - listings: Listing[]
 *  - loading: boolean
 */

import ListingCard from "./ListingCard";

export default function ListingsGrid({
  listings = [],
  loading = false,
  emptyMessage = "No listings found.",
}) {
  if (loading) {
    return (
      <section
        aria-label="Loading listings"
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <article
            key={i}
            className="bg-gray-100 rounded-2xl h-64 animate-pulse"
            aria-hidden="true"
          />
        ))}
      </section>
    );
  }

  if (listings.length === 0) {
    return (
      <section
        aria-label="No listings found"
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <p className="text-gray-500 text-sm">{emptyMessage}</p>
      </section>
    );
  }

  return (
    <section aria-label="Available listings">
      <ul
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        role="list"
      >
        {listings.map((listing) => (
          <li key={listing.id}>
            <ListingCard listing={listing} />
          </li>
        ))}
      </ul>
    </section>
  );
}
