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
import { useNavigate } from 'react-router-dom';


export default function ListingCard({ listing }) {
  const navigate = useNavigate();
  const imageUrl = listing.listing_images?.[0]?.storage_path
    ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/listing-images/${listing.listing_images[0].storage_path}`
    : null;

  const { title, price, condition } = listing;

  return (
    <article 
      onClick={() => navigate(`/listing/${listing.id}`)}
      className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
      {/* Image */}
      <figure className="bg-gray-100 h-44 flex items-center justify-center overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <figcaption className="text-sm text-gray-400">image of item</figcaption>
        )}
      </figure>

      {/* Details */}
      <section className="p-3 flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-gray-900 truncate">{title}</h3>
        <p className="text-sm font-bold text-gray-900">R{price}</p>
        <footer>
          <span className="inline-block text-xs text-gray-600 border border-gray-300 rounded-full px-3 py-0.5">
            {condition}
          </span>
        </footer>
      </section>
    </article>
  );
}
