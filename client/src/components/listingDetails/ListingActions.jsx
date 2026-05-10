// components/listingDetails/ListingActions.jsx
// Centralizes action button visibility by role/state.
// - Owner: edit + delete (when not in edit mode)
// - Logged-in buyer: contact seller + buy now (for sale/both listings)
import BuyButton from "../listingDetails/BuyButton";

export default function ListingActions({
  listing,
  isOwner,
  editing,
  deleting,
  onStartEdit,
  onDelete,
  isLoggedInBuyer,
  onContactSeller,
}) {
  // Show the buy button only for listings that are for sale
  const canBuy =
    isLoggedInBuyer &&
    (listing.listing_type === "sale" || listing.listing_type === "both");

  return (
    <footer className="mt-6 flex flex-wrap gap-3" aria-label="Listing actions">
      {isOwner && !editing && (
        <button
          onClick={onStartEdit}
          className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-5 py-2 rounded-lg transition-colors"
        >
          Edit Listing
        </button>
      )}

      {isOwner && !editing && (
        <button
          onClick={onDelete}
          disabled={deleting}
          className="bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-5 py-2 rounded-lg transition-colors"
        >
          {deleting ? "Deleting..." : "Delete Listing"}
        </button>
      )}

      {isLoggedInBuyer && (
        <button
          onClick={onContactSeller}
          className="bg-green-500 hover:bg-green-600 text-white font-medium px-5 py-2 rounded-lg transition-colors"
        >
          Contact Seller
        </button>
      )}

      {/* Buy Now — only shown for sale listings to non-owners */}
      {canBuy && <BuyButton listing={listing} />}
    </footer>
  );
}