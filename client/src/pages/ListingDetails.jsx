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

  // Keep navigation side-effects outside the hook so the hook stays reusable.
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

  // Contact seller handler
  const handleContactSeller = () => {
    navigate(`/chat/${listing.id}?seller=${listing.seller.id}`);
  };

  if (error) return <p className="p-6 text-red-500">Error: {error}</p>;
  if (!listing) return <p className="p-6">Loading...</p>;

  return (
    <main className="p-8 max-w-2xl" aria-label="Listing details">
      <article>
      {/* Title */}
      {!editing && <h1 className="text-2xl font-bold">{listing.title}</h1>}

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
        <figure className="mt-4">
          <img
            src={imageUrl}
            className="w-96 rounded-xl"
            alt="listing"
          />
          <figcaption className="sr-only">Listing image</figcaption>
        </figure>
      )}

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

      <ListingActions
        isOwner={isOwner}
        editing={editing}
        deleting={deleting}
        onStartEdit={handleStartEdit}
        onDelete={handleDelete}
        isLoggedInBuyer={isLoggedInBuyer}
        onContactSeller={handleContactSeller}
      />
      </article>
    </main>
  );
}
