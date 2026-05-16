import { FiTag, FiGrid, FiRepeat } from "react-icons/fi";

export default function ListingReadOnlyDetails({ listing }) {
  return (
    <section className="space-y-5" aria-label="Listing metadata">
      <article className="flex items-start gap-4">
        <FiTag className="text-green-500 text-lg mt-1" />

        <section>
          <h2 className="text-base font-semibold text-black">Condition</h2>
          <p className="text-gray-700 capitalize">{listing.condition}</p>
        </section>
      </article>

      <article className="flex items-start gap-4">
        <FiGrid className="text-green-500 text-lg mt-1" />

        <section>
          <h2 className="text-base font-semibold text-black">Category</h2>
          <p className="text-gray-700">{listing.category}</p>
        </section>
      </article>

      <article className="flex items-start gap-4">
        <FiRepeat className="text-green-500 text-lg mt-1" />

        <section>
          <h2 className="text-base font-semibold text-black">Type</h2>
          <p className="text-gray-700 capitalize">{listing.listing_type}</p>
        </section>
      </article>
    </section>
  );
}