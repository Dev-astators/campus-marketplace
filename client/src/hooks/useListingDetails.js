import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../config/supabaseClient";
import { API_BASE_URL } from "../config/apiBaseUrl";

// Helper keeps UI defaults and payload shaping in one place.
const createEditFormFromListing = (listing) => ({
  title: listing?.title || "",
  description: listing?.description || "",
  askingPrice: String(listing?.price ?? ""),
  category: listing?.category || "Textbooks",
  condition: listing?.condition || "good",
  listingType: listing?.listing_type || "sale",
});

export default function useListingDetails({ listingId, onDeleteSuccess }) {
  const [listing, setListing] = useState(null);
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [editForm, setEditForm] = useState(createEditFormFromListing(null));

  // Session lookup is independent from listing fetch and only needed for
  // owner-vs-buyer action gating.
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getSession();
      setUserId(data.session?.user?.id);
    };

    getUser();
  }, []);

  const fetchListing = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/listings/${listingId}`);

      if (!res.ok) {
        const text = await res.text();
        console.error("Server error response:", text);
        throw new Error("Failed to fetch listing");
      }

      const data = await res.json();
      setListing(data.listing);
      setError(null);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message);
    }
  }, [listingId]);

  useEffect(() => {
    fetchListing();
  }, [fetchListing]);

  // Rehydrate edit form whenever fresh listing data is loaded.
  useEffect(() => {
    if (!listing) return;
    setEditForm(createEditFormFromListing(listing));
  }, [listing]);

  const imageUrl = useMemo(() => {
    if (!listing?.listing_images?.[0]?.storage_path) return null;

    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/listing-images/${listing.listing_images[0].storage_path}`;
  }, [listing]);

  const isOwner = userId === listing?.seller?.id;
  const isLoggedInBuyer = Boolean(userId && !isOwner);

  // Delete action is encapsulated here so page/components remain presentational.
  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this listing?",
    );
    if (!confirmed || !listing) return;

    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/listings/${listing.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete listing");

      onDeleteSuccess?.();
    } catch (err) {
      console.error("Delete error:", err);
      alert("Something went wrong while deleting. Please try again.");
      setDeleting(false);
    }
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleStartEdit = () => {
    setSaveError("");
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setSaveError("");
    setEditing(false);
    setEditForm(createEditFormFromListing(listing));
  };

  const handleSaveEdit = async (event) => {
    event.preventDefault();

    if (!listing) return;

    const askingPrice = Number(editForm.askingPrice);
    if (!Number.isFinite(askingPrice) || askingPrice <= 0) {
      setSaveError("Price must be a positive number.");
      return;
    }

    setSaving(true);
    setSaveError("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/listings/${listing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description,
          askingPrice,
          category: editForm.category,
          condition: editForm.condition,
          listingType: editForm.listingType,
        }),
      });

      if (!res.ok) {
        const response = await res.json().catch(() => null);
        throw new Error(response?.message || "Failed to update listing");
      }

      // Refresh from source of truth so read-only view reflects DB state.
      await fetchListing();
      setEditing(false);
    } catch (err) {
      console.error("Update error:", err);
      setSaveError(err.message || "Failed to update listing");
    } finally {
      setSaving(false);
    }
  };

  return {
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
  };
}
