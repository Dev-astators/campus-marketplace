import { useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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
    try {
      sessionStorage.setItem("chatBackTarget", `/listing/${listing.id}`);
    } catch {
      // sessionStorage may not be available in some test/runtime environments
    }

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
      className="mx-auto max-w-7xl px-6 py-6"
      aria-label="Listing details"
    >
      <main className="grid items-start gap-6 lg:grid-cols-[110px_1fr]">
        <section className="pt-1">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-xl border border-gray-200 px-4 py-2 shadow-sm transition hover:bg-gray-50"
          >
            Back
          </button>
        </section>

        <section className="mt-4 grid grid-cols-1 items-start gap-8 lg:mt-16 lg:grid-cols-[1.25fr_1fr]">
          <section aria-label="Listing image and description">
            <figure aria-label="Listing image">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="listing"
                  className="max-h-[520px] w-full rounded-xl object-contain"
                />
              ) : null}
            </figure>

            {!editing && listing.description ? (
              <section className="mt-4" aria-label="Description">
                <h2 className="mb-2 text-lg font-bold">Description</h2>
                <p className="text-base leading-7 text-gray-700">
                  {listing.description}
                </p>
              </section>
            ) : null}
          </section>

          <section aria-label="Listing information" className="pt-1">
            {!editing ? (
              <header>
                <h1 className="text-2xl font-bold leading-tight text-black">
                  {listing.title}
                </h1>
              </header>
            ) : null}

            <section className="mt-3" aria-label="Seller information">
              <p className="text-base text-gray-700">
                Sold by{" "}
                {listing.seller?.id ? (
                  <Link
                    to={`/seller-profile/${listing.seller.id}`}
                    className="font-semibold text-blue-700 underline-offset-4 hover:underline focus:outline-none focus-visible:underline"
                  >
                    {listing.seller?.full_name || "Unknown"}
                  </Link>
                ) : (
                  <strong className="font-semibold text-gray-900">
                    {listing.seller?.full_name || "Unknown"}
                  </strong>
                )}{" "}
                <strong className="font-normal text-yellow-500">
                  {listing.seller?.average_rating?.toFixed(1) || "0.0"} (
                  {listing.seller?.total_ratings || 0} reviews)
                </strong>
              </p>
            </section>

            {!editing ? (
              <section className="mt-4" aria-label="Price">
                <p className="text-3xl font-bold">
                  R{Number(listing.price).toFixed(2)}
                </p>
              </section>
            ) : null}

            <hr className="my-4 border-gray-200" />

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
