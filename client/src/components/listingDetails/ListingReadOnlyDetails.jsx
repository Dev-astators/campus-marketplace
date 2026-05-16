import { FiTag, FiGrid, FiRepeat } from "react-icons/fi";

export default function ListingReadOnlyDetails({ listing }) {
  const formattedCondition = listing.condition
    ? listing.condition
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase())
    : "—";

  const formattedType = listing.listing_type
    ? listing.listing_type
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase())
    : "—";

  return (
    <section className="space-y-5" aria-label="Listing metadata">
      {listing.description && (
        <p className="sr-only">
          {listing.description}
        </p>
      )}

      {listing.price && (
        <p className="sr-only">
          R{listing.price}
        </p>
      )}

      <article className="flex items-start gap-4">
        <FiTag className="text-green-500 text-lg mt-1" />

        <section>
          <h2 className="text-base font-semibold text-black">
            Condition
          </h2>

          <p className="text-gray-700">
            {formattedCondition}
          </p>
        </section>
      </article>

      <article className="flex items-start gap-4">
        <FiGrid className="text-green-500 text-lg mt-1" />

        <section>
          <h2 className="text-base font-semibold text-black">
            Category
          </h2>

          <p className="text-gray-700">
            {listing.category || "—"}
          </p>
        </section>
      </article>

      <article className="flex items-start gap-4">
        <FiRepeat className="text-green-500 text-lg mt-1" />

        <section>
          <h2 className="text-base font-semibold text-black">
            Type
          </h2>

          <p className="text-gray-700">
            {formattedType}
          </p>
        </section>
      </article>
    </section>
  );
}