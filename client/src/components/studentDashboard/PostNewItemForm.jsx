import { useEffect, useState } from "react";
import { supabase } from "../../config/supabaseClient";

const CONDITION_OPTIONS = [
  { label: "New", value: "new" },
  { label: "Like New", value: "like_new" },
  { label: "Good", value: "good" },
  { label: "Fair", value: "fair" },
  { label: "Poor", value: "poor" },
];

const LISTING_TYPE_OPTIONS = [
  { label: "For Sale", value: "sale" },
  { label: "Trade", value: "trade" },
  { label: "Sale or Trade", value: "both" },
];

function formatConditionLabel(condition) {
  if (!condition || typeof condition !== "string") {
    return "Unknown";
  }

  return condition
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function createStoragePath(userId, fileName) {
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
  return `${userId}/${Date.now()}-${sanitizedName}`;
}

const LISTING_IMAGE_BUCKET =
  import.meta.env.VITE_LISTING_IMAGES_BUCKET || "listing-images";

function getFriendlySubmitErrorMessage(
  error,
  fallback = "Could not publish listing. Please try again.",
) {
  const rawMessage = error?.message || "";
  const normalized = rawMessage.toLowerCase();

  if (
    normalized.includes("failed to fetch") ||
    normalized.includes("network") ||
    normalized.includes("timeout")
  ) {
    return "Network issue while publishing. Check your internet connection and try again.";
  }

  if (
    normalized.includes("jwt") ||
    normalized.includes("not authenticated") ||
    normalized.includes("token")
  ) {
    return "Your session has expired. Please sign in again and retry.";
  }

  if (
    normalized.includes("row-level security") ||
    normalized.includes("permission denied") ||
    normalized.includes("insufficient privilege")
  ) {
    return "You do not have permission to post this listing. Please contact support if this continues.";
  }

  if (
    normalized.includes("violates not-null constraint") ||
    normalized.includes("violates check constraint") ||
    normalized.includes("invalid input syntax")
  ) {
    return "Some listing details are invalid. Please review the form values and submit again.";
  }

  return rawMessage || fallback;
}

export default function PostNewItemForm({ user, categories = [], onPosted }) {
  const [formData, setFormData] = useState({
    title: "",
    category: categories[0] ?? "",
    price: "",
    condition: "good",
    listingType: "sale",
    description: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const effectiveCategory =
    categories.length > 0
      ? categories.includes(formData.category)
        ? formData.category
        : categories[0]
      : formData.category;

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0] ?? null;
    setImageFile(file);
    setPreviewUrl((previous) => {
      if (previous) {
        URL.revokeObjectURL(previous);
      }

      return file ? URL.createObjectURL(file) : "";
    });
  };

  const resetForm = () => {
    setFormData({
      title: "",
      category: categories[0] ?? "",
      price: "",
      condition: "good",
      listingType: "sale",
      description: "",
    });
    setImageFile(null);
    setPreviewUrl((previous) => {
      if (previous) {
        URL.revokeObjectURL(previous);
      }

      return "";
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!user?.id) {
      setErrorMessage("You need to be signed in before posting a listing.");
      return;
    }

    if (!formData.title.trim()) {
      setErrorMessage("Item title is required.");
      return;
    }

    if (!effectiveCategory.trim()) {
      setErrorMessage("Category is required.");
      return;
    }

    if (!formData.price || Number(formData.price) <= 0) {
      setErrorMessage("Price must be greater than 0.");
      return;
    }

    setIsSubmitting(true);

    let imageUrl = null;
    let uploadedStoragePath = null;
    let imageUploadWarning = "";

    if (imageFile) {
      const filePath = createStoragePath(user.id, imageFile.name);

      const { error: uploadError } = await supabase.storage
        .from(LISTING_IMAGE_BUCKET)
        .upload(filePath, imageFile, { upsert: false });

      if (uploadError) {
        imageUploadWarning = `${getFriendlySubmitErrorMessage(uploadError, "Image upload failed.")} Listing was posted without an image.`;
      } else {
        uploadedStoragePath = filePath;
        const { data: publicUrlData } = supabase.storage
          .from(LISTING_IMAGE_BUCKET)
          .getPublicUrl(filePath);

        imageUrl = publicUrlData?.publicUrl ?? null;
      }
    }

    const basePayload = {
      seller_id: user.id,
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: effectiveCategory,
      condition: formData.condition,
      asking_price: Number(formData.price),
      listing_type: formData.listingType,
      status: "active",
    };

    let { data, error } = await supabase
      .from("listings")
      .insert(basePayload)
      .select()
      .single();

    if (error) {
      if (uploadedStoragePath) {
        await supabase.storage
          .from(LISTING_IMAGE_BUCKET)
          .remove([uploadedStoragePath]);
      }

      setErrorMessage(
        getFriendlySubmitErrorMessage(
          error,
          "Failed to publish listing. Please try again.",
        ),
      );
      setIsSubmitting(false);
      return;
    }

    if (!data?.id) {
      const { data: recoveredListing, error: recoverError } = await supabase
        .from("listings")
        .select(
          "id, title, asking_price, condition, category, listing_type, seller_id, status, created_at",
        )
        .eq("seller_id", user.id)
        .eq("title", basePayload.title)
        .eq("asking_price", basePayload.asking_price)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recoverError || !recoveredListing?.id) {
        if (uploadedStoragePath) {
          await supabase.storage
            .from(LISTING_IMAGE_BUCKET)
            .remove([uploadedStoragePath]);
        }

        setErrorMessage(
          getFriendlySubmitErrorMessage(
            recoverError,
            "Listing was created but could not be synced locally. Please refresh and try again.",
          ),
        );
        setIsSubmitting(false);
        return;
      }

      data = recoveredListing;
    }

    if (uploadedStoragePath) {
      const { error: listingImageError } = await supabase
        .from("listing_images")
        .insert({
          listing_id: data.id,
          storage_path: uploadedStoragePath,
          display_order: 0,
        });

      if (listingImageError) {
        imageUrl = null;
        imageUploadWarning =
          "Listing was posted, but the image link could not be saved.";
      }
    }

    const postedListing = {
      id: String(data.id),
      title: data?.title ?? formData.title.trim(),
      asking_price: data?.asking_price ?? Number(formData.price),
      condition: formatConditionLabel(data?.condition ?? formData.condition),
      category: data?.category ?? effectiveCategory,
      imageUrl,
      sellerId: data?.seller_id ?? user.id,
      status: data?.status ?? "active",
      createdAt: data?.created_at ?? new Date().toISOString(),
    };

    onPosted?.(postedListing);
    setSuccessMessage(
      imageUploadWarning
        ? `Listing posted. ${imageUploadWarning}`
        : "Listing posted successfully.",
    );
    resetForm();
    setIsSubmitting(false);
  };

  return (
    <form
      className="bg-white rounded-xl border border-gray-200 p-6 space-y-4"
      onSubmit={handleSubmit}
      aria-label="Post new item form"
    >
      <div>
        <label
          htmlFor="item-title"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Item title
        </label>
        <input
          id="item-title"
          name="title"
          value={formData.title}
          onChange={handleFieldChange}
          type="text"
          placeholder="e.g. Statistics Textbook"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="item-category"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Category
          </label>
          <select
            id="item-category"
            name="category"
            value={effectiveCategory}
            onChange={handleFieldChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
            required
            disabled={categories.length === 0}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          {categories.length === 0 ? (
            <p className="mt-1 text-xs text-amber-700">
              Category options are not available right now.
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="item-price"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Price (ZAR)
          </label>
          <input
            id="item-price"
            name="price"
            value={formData.price}
            onChange={handleFieldChange}
            type="number"
            min="1"
            step="1"
            placeholder="0"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="item-condition"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Condition
          </label>
          <select
            id="item-condition"
            name="condition"
            value={formData.condition}
            onChange={handleFieldChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            {CONDITION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="item-listing-type"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Listing type
          </label>
          <select
            id="item-listing-type"
            name="listingType"
            value={formData.listingType}
            onChange={handleFieldChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            {LISTING_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label
          htmlFor="item-description"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Description
        </label>
        <textarea
          id="item-description"
          name="description"
          value={formData.description}
          onChange={handleFieldChange}
          rows={4}
          placeholder="Describe the item, usage, and pickup details."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>

      <section aria-label="Image upload section" className="space-y-3">
        <label
          htmlFor="item-image"
          className="block text-sm font-medium text-gray-700"
        >
          Upload item image
        </label>
        <input
          id="item-image"
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-medium file:text-blue-700 hover:file:bg-blue-100"
        />
        {previewUrl && (
          <figure className="w-40 h-40 rounded-lg border border-gray-200 overflow-hidden">
            <img
              src={previewUrl}
              alt="Selected item preview"
              className="w-full h-full object-cover"
            />
          </figure>
        )}
      </section>

      {errorMessage ? (
        <p className="text-sm text-red-600" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {successMessage ? (
        <p className="text-sm text-green-700" role="status">
          {successMessage}
        </p>
      ) : null}

      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-60"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Publishing..." : "Publish Listing"}
      </button>
    </form>
  );
}
