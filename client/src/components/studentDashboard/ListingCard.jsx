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
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all hover:border-blue-300 hover:shadow-md">
      <Link
        to={`/listing/${listing.id}`}
        className="block cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
        aria-label={`View details for ${title}`}
      >
        <figure className="flex h-44 items-center justify-center overflow-hidden bg-gray-100">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="h-full w-full object-cover"
            />
          ) : (
            <figcaption className="text-sm text-gray-400">
              image of item
            </figcaption>
          )}
        </figure>

        <section className="flex flex-col gap-1 p-3">
          <h3 className="truncate text-sm font-semibold text-gray-900">
            {title}
          </h3>
          <p className="text-sm font-bold text-gray-900">R{price}</p>
          <footer>
            <mark className="inline-block bg-blue-600 rounded-full border border-gray-300 px-3 py-0.5 text-xs text-white">
              {formatLabel(condition)}
            </mark>
          </footer>
        </section>
      </Link>
    </article>
  );
}
