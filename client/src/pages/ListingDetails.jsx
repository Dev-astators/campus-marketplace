import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../config/supabaseClient";
import { API_BASE_URL } from "../config/apiBaseUrl";

export default function ListingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [listing, setListing] = useState(null);
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Get logged-in user
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getSession();
      setUserId(data.session?.user?.id);
    };
    getUser();
  }, []);

  // Fetch listing
  useEffect(() => {
    const fetchListing = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/listings/${id}`);

        if (!res.ok) {
          const text = await res.text();
          console.error("Server error response:", text);
          throw new Error("Failed to fetch listing");
        }

        const data = await res.json();
        setListing(data.listing);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message);
      }
    };

    fetchListing();
  }, [id]);

  // Delete handler
  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this listing?",
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/listings/${listing.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete listing");

      navigate("/student-dashboard");
    } catch (err) {
      console.error("Delete error:", err);
      alert("Something went wrong while deleting. Please try again.");
      setDeleting(false);
    }
  };

  // Contact seller handler
  const handleContactSeller = () => {
    navigate(`/chat/${listing.id}?seller=${listing.seller.id}`);
  };

  if (error) return <p className="p-6 text-red-500">Error: {error}</p>;
  if (!listing) return <p className="p-6">Loading...</p>;

  const imageUrl = listing.listing_images?.[0]?.storage_path
    ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/listing-images/${listing.listing_images[0].storage_path}`
    : null;

  const isOwner = userId === listing.seller?.id;
  const isLoggedInBuyer = userId && !isOwner;

  return (
    <article className="p-8 max-w-2xl" aria-label="Listing details">
      {/* Title */}
      <h1 className="text-2xl font-bold">{listing.title}</h1>

      {/* Seller info */}
      <section className="mt-2" aria-label="Seller information">
        <p className="text-sm text-gray-700">
          Sold by:{" "}
          <span className="font-medium">
            {listing.seller?.full_name || "Unknown"}
          </span>
        </p>
        <p className="text-sm text-yellow-600">
          ⭐ {listing.seller?.average_rating?.toFixed(1) || "0.0"}(
          {listing.seller?.total_ratings || 0} reviews)
        </p>
      </section>

      {/* Image */}
      {imageUrl && (
        <img src={imageUrl} className="w-96 mt-4 rounded-xl" alt="listing" />
      )}

      {/* Description */}
      <p className="mt-4 text-gray-700">{listing.description}</p>

      {/* Price */}
      <p className="mt-2 font-semibold text-lg">R{listing.price}</p>

      {/* Meta */}
      <p className="text-sm text-gray-500">{listing.condition}</p>
      <p className="text-sm text-gray-500">{listing.category}</p>

      {/* ── Action Buttons ── */}
      <footer
        className="mt-6 flex flex-wrap gap-3"
        aria-label="Listing actions"
      >
        {/* Delete — only visible to the owner */}
        {isOwner && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-5 py-2 rounded-lg transition-colors"
          >
            {deleting ? "Deleting..." : "Delete Listing"}
          </button>
        )}

        {/* Contact Seller — only visible to logged-in non-owners */}
        {isLoggedInBuyer && (
          <button
            onClick={handleContactSeller}
            className="bg-green-500 hover:bg-green-600 text-white font-medium px-5 py-2 rounded-lg transition-colors"
          >
            Contact Seller
          </button>
        )}
      </footer>
    </article>
  );
}
