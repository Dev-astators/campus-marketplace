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
  const canBuy =
    isLoggedInBuyer &&
    (listing.listing_type === "sale" ||
      listing.listing_type === "both");

  return (
    <footer className="mt-4" aria-label="Listing actions">
      {/* Owner Buttons */}
      <section className="flex flex-wrap gap-3">
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
      </section>

      {/* Buyer Buttons */}
      {isLoggedInBuyer && (
        <section className="mt-3">
          {/* Contact Seller */}
          <button
            onClick={onContactSeller}
            className="
              mb-3
              w-full
              bg-green-400
              hover:bg-green-500
              text-white
              font-semibold
              text-sm
              py-3
              px-6
              rounded-xl
              transition-colors
            "
          >
            Contact Seller
          </button>

          {/* Buy Button */}
          {canBuy && <BuyButton listing={listing} />}
        </section>
      )}
    </footer>
  );
}