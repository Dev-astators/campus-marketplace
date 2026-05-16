import { useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ListingEditForm from "../components/listingDetails/ListingEditForm";
import ListingReadOnlyDetails from "../components/listingDetails/ListingReadOnlyDetails";
import ListingActions from "../components/listingDetails/ListingActions";
import useListingDetails from "../hooks/useListingDetails";

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
      className="max-w-7xl mx-auto px-6 py-6"
      aria-label="Listing details"
    >
      <main className="grid grid-cols-[110px_1fr] gap-6 items-start">
        {/* Back Button */}
        <section className="-ml-12 pt-1">
          <button
            onClick={() => navigate(-1)}
            className="
              px-4
              py-2
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
        </section>

        {/* Main Layout */}
        <section className="grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-8 items-start mt-16">
          {/* Left Side */}
          <section aria-label="Listing image and description">
            {/* Image */}
            <figure aria-label="Listing image">
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="listing"
                  className="
                    w-full
                    max-h-[520px]
                    object-contain
                    rounded-xl
                  "
                />
              )}
            </figure>

            {/* Description */}
            {!editing && listing.description && (
              <section className="mt-4" aria-label="Description">
                <h2 className="text-lg font-bold mb-2">
                  Description
                </h2>

                <p className="text-gray-700 text-base leading-7">
                  {listing.description}
                </p>
              </section>
            )}
          </section>

          {/* Right Side */}
          <section
            aria-label="Listing information"
            className="pt-1"
          >
            {/* Title */}
            {!editing && (
              <header>
                <h1 className="text-2xl font-bold leading-tight text-black">
                  {listing.title}
                </h1>
              </header>
            )}

            {/* Seller */}
            <section
              className="mt-3"
              aria-label="Seller information"
            >
              <p className="text-gray-700 text-base">
                Sold by:{" "}
                {listing.seller?.full_name || "Unknown"}{" "}
                <strong className="font-normal text-yellow-500">
                  ⭐{" "}
                  {listing.seller?.average_rating?.toFixed(1) ||
                    "0.0"}{" "}
                  (
                  {listing.seller?.total_ratings || 0} reviews)
                </strong>
              </p>
            </section>

            {/* Price */}
            {!editing && (
              <section className="mt-4" aria-label="Price">
                <p className="text-3xl font-bold">
                  R{Number(listing.price).toFixed(2)}
                </p>
              </section>
            )}

            <hr className="my-4 border-gray-200" />

            {/* Metadata */}
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

            <hr className="my-4 border-gray-200" />

            {/* Actions */}
            <footer aria-label="Listing actions">
              <ListingActions
                listing={listing}
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
        </section>
      </main>
    </article>
  );
}