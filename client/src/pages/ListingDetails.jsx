import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';

export default function ListingDetails() {
  const { id } = useParams();

  const [listing, setListing] = useState(null);
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState(null);

  // ─────────────────────────────────────────────
  // Get logged-in user
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getSession();
      setUserId(data.session?.user?.id);
    };
    getUser();
  }, []);

  // ─────────────────────────────────────────────
  // Fetch listing (THIS FIXES YOUR ERROR)
  useEffect(() => {
    const fetchListing = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/listings/${id}`);

        // 🔴 HANDLE NON-JSON RESPONSE
        if (!res.ok) {
          const text = await res.text();
          console.error("Server error response:", text);
          throw new Error("Failed to fetch listing");
        }

        const data = await res.json();
        console.log("Listing data:", data);

        setListing(data.listing);

      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message);
      }
    };

    fetchListing(); // ✅ THIS CALL FIXES YOUR "never read" warning
  }, [id]);

  // ─────────────────────────────────────────────
  if (error) {
    return <p className="p-6 text-red-500">Error: {error}</p>;
  }

  if (!listing) {
    return <p className="p-6">Loading...</p>;
  }

  // ─────────────────────────────────────────────
  // Image
  const imageUrl = listing.listing_images?.[0]?.storage_path
    ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/listing-images/${listing.listing_images[0].storage_path}`
    : null;

  return (
    <div className="p-8">

      {/* Title */}
      <h1 className="text-2xl font-bold">{listing.title}</h1>

      {/* Seller info */}
      <div className="mt-2">
        <p className="text-sm text-gray-700">
          Sold by: <span className="font-medium">
            {listing.seller?.full_name || 'Unknown'}
          </span>
        </p>

        <p className="text-sm text-yellow-600">
          ⭐ {listing.seller?.average_rating?.toFixed(1) || '0.0'} 
          ({listing.seller?.total_ratings || 0} reviews)
        </p>
      </div>

      {/* Image */}
      {imageUrl && (
        <img
          src={imageUrl}
          className="w-96 mt-4 rounded-xl"
          alt="listing"
        />
      )}

      {/* Description */}
      <p className="mt-4 text-gray-700">{listing.description}</p>

      {/* Price */}
      <p className="mt-2 font-semibold text-lg">R{listing.price}</p>

      {/* Meta */}
      <p className="text-sm text-gray-500">{listing.condition}</p>
      <p className="text-sm text-gray-500">{listing.category}</p>

      {/* Delete button (only owner) */}
      {userId === listing.seller?.id && (
        <button
          onClick={async () => {
            await fetch(`${import.meta.env.VITE_API_URL}/api/listings/${listing.id}`, {
              method: 'DELETE'
            });
            window.location.href = '/student-dashboard';
          }}
          className="mt-6 bg-red-500 text-white px-4 py-2 rounded"
        >
          Delete Listing
        </button>
      )}

    </div>
  );
}