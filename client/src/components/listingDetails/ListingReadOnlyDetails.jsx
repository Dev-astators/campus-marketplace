// Read-only content block shown when the owner is not editing.
const formatLabel = (value) => {
  if (!value || typeof value !== "string") return "—";

  return value
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
};

export default function ListingReadOnlyDetails({ listing }) {
  return (
    <section className="mt-4" aria-label="Listing details">
      <p className="text-gray-700">{listing.description}</p>
      <p className="mt-2 font-semibold text-lg">R{listing.price}</p>
      <dl className="mt-3 grid grid-cols-1 gap-2 text-sm text-gray-500">
        <div>
          <dt className="sr-only">Condition</dt>
          <dd>{formatLabel(listing.condition)}</dd>
        </div>
        <div>
          <dt className="sr-only">Category</dt>
          <dd>{listing.category}</dd>
        </div>
        <div>
          <dt className="sr-only">Listing type</dt>
          <dd>{formatLabel(listing.listing_type)}</dd>
        </div>
      </dl>
    </section>
  );
}
