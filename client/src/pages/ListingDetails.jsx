import { useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ListingEditForm from "../components/listingDetails/ListingEditForm";
import ListingReadOnlyDetails from "../components/listingDetails/ListingReadOnlyDetails";
import ListingActions from "../components/listingDetails/ListingActions";
import useListingDetails from "../hooks/useListingDetails";

// Page-level composition only: domain state/actions live in useListingDetails,
// while rendering is delegated to focused child components.
export default function ListingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const handleDeleteSuccess = useCallback(() => {
    navigate("/student-dashboard");
  }, [navigate]);

  const {
    listing,
    error,
    imageUrl,
    isOwner,
    isLoggedInBuyer,
    deleting,
    editing,
    saving,
    saveError,
    editForm,
    handleDelete,
    handleEditChange,
    handleStartEdit,
    handleCancelEdit,
    handleSaveEdit,
  } = useListingDetails({
    listingId: id,
    onDeleteSuccess: handleDeleteSuccess,
  });

  const handleContactSeller = () => {
    navigate(`/chat/${listing.id}?seller=${listing.seller.id}`);
  };

  if (error) {
    return <p className="p-6 text-red-500">Error: {error}</p>;
  }

  if (!listing) {
    return <p className="p-6">Loading...</p>;
  }

  return (
    <article
      className="max-w-7xl mx-auto p-6 lg:p-10"
      aria-label="Listing details"
    >
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="
          mb-8
          px-5
          py-2.5
          border
          border-gray-200
          rounded-xl
          shadow-sm
          hover:bg-gray-50
          transition
        "
      >
        ← Back
      </button>

      {/* Main Layout */}
      <main className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* LEFT SIDE - IMAGE */}
        <figure
          className="
            bg-gray-100
            rounded-3xl
            min-h-[500px]
            flex
            items-center
            justify-center
            p-8
          "
          aria-label="Listing image"
        >
          {imageUrl && (
            <img
              src={imageUrl}
              alt={listing.title}
              className="w-full max-w-md object-contain"
            />
          )}
        </figure>

        {/* RIGHT SIDE - DETAILS */}
        <section aria-label="Listing information">
          {/* Title */}
          {!editing && (
            <header>
              <h1 className="text-4xl font-bold leading-tight text-black">
                {listing.title}
              </h1>
            </header>
          )}

          {/* Seller Info */}
          <section
            className="mt-4 space-y-1"
            aria-label="Seller information"
          >
            <p className="text-gray-700">
              Sold by: {listing.seller?.full_name || "Unknown"}
            </p>

            <p className="text-yellow-500">
              ⭐ {listing.seller?.average_rating?.toFixed(1) || "0.0"} (
              {listing.seller?.total_ratings || 0} reviews)
            </p>
          </section>

          {/* Price */}
          {!editing && (
            <section className="mt-8" aria-label="Price">
              <p className="text-4xl font-bold">
                R{Number(listing.price).toFixed(2)}
              </p>
            </section>
          )}

          <hr className="my-8 border-gray-200" />

          {/* Listing Details */}
          <section aria-label="Listing details">
            {editing ? (
              <ListingEditForm
                editForm={editForm}
                onEditChange={handleEditChange}
                onSaveEdit={handleSaveEdit}
                onCancelEdit={handleCancelEdit}
                saving={saving}
                saveError={saveError}
              />
            ) : (
              <ListingReadOnlyDetails listing={listing} />
            )}
          </section>

          <hr className="my-8 border-gray-200" />

          {/* Actions */}
          <footer aria-label="Listing actions">
            <ListingActions
              isOwner={isOwner}
              editing={editing}
              deleting={deleting}
              onStartEdit={handleStartEdit}
              onDelete={handleDelete}
              isLoggedInBuyer={isLoggedInBuyer}
              onContactSeller={handleContactSeller}
            />
          </footer>
        </section>
      </main>
    </article>
  );
}
