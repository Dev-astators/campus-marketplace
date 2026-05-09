// src/components/dashboard/ListingCard.jsx

/**
 * ListingCard component
 * Displays a single marketplace listing.
 * Props:
 *  - listing: {
 *      id: string,
 *      title: string,
 *      price: number,
 *      condition: string,
 *      imageUrl: string | null,
 *      category: string,
 *    }
 */
import { Link } from "react-router-dom";

const formatLabel = (value) => {
  if (!value || typeof value !== "string") return "—";

  return value
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
};

export default function ListingCard({ listing }) {
  const imageUrl = listing.listing_images?.[0]?.storage_path
    ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/listing-images/${listing.listing_images[0].storage_path}`
    : null;

  const { title, price, condition } = listing;

  return (
    <article className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all">
      <Link
        to={`/listing/${listing.id}`}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 cursor-pointer"
        aria-label={`View details for ${title}`}
      >
        {/* Image */}
        <figure className="bg-gray-100 h-44 flex items-center justify-center overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <figcaption className="text-sm text-gray-400">
              image of item
            </figcaption>
          )}
        </figure>

        {/* Details */}
        <section className="p-3 flex flex-col gap-1">
          <h3 className="text-sm font-semibold text-gray-900 truncate">
            {title}
          </h3>
          <p className="text-sm font-bold text-gray-900">R{price}</p>
          <footer>
            <span className="inline-block text-xs text-gray-600 border border-gray-300 rounded-full px-3 py-0.5">
              {formatLabel(condition)}
            </span>
          </footer>
        </section>
      </Link>
    </article>
  );
}
