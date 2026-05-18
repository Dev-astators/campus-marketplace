import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../config/supabaseClient";
import { API_BASE_URL } from "../config/apiBaseUrl";

const CATEGORY_OPTIONS = [
  {
    value: "Textbooks",
    label: "Textbooks",
    description: "Study materials, textbooks and tertiary education supplies.",
  },
  {
    value: "Electronics",
    label: "Electronics",
    description: "Consumer electronics, devices and ICT equipment.",
  },
  {
    value: "Furniture",
    label: "Furniture",
    description: "Furniture, home furnishings and household items.",
  },
  {
    value: "Clothing",
    label: "Clothing",
    description: "Apparel, footwear and wearable accessories.",
  },
  {
    value: "Home & Kitchenware",
    label: "Home & Kitchenware",
    description: "Home goods, kitchenware and household essentials.",
  },
  {
    value: "Sports Equipment",
    label: "Sports Equipment",
    description: "Fitness, recreational and sporting gear.",
  },
  {
    value: "Stationery",
    label: "Stationery",
    description: "Notebooks, stationery, printers and study supplies.",
  },
  {
    value: "Other",
    label: "Other",
    description: "Items that don't fit a specific category.",
  },
];

const CONDITION_OPTIONS = [
  { value: "new", label: "New" },
  { value: "like_new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
];

const LISTING_TYPE_OPTIONS = [
  { value: "sale", label: "Sale" },
  { value: "trade", label: "Trade" },
  { value: "both", label: "Both" },
];

const DEFAULT_SUGGESTION_MESSAGE =
  "Enter a price to see a CPI-based suggestion for this category.";

const INVALID_SUGGESTION_MESSAGE =
  "Enter a valid positive price to get a suggestion.";

const LOADING_SUGGESTION_MESSAGE =
  "Checking the latest Stats SA category guidance...";

const SUCCESS_SUGGESTION_MESSAGE = "Price suggestion loaded.";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 2,
  }).format(value);

const formatFileSize = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

export default function CreateListing() {
  const navigate = useNavigate();
  const imageInputRef = useRef(null);

  const [image, setImage] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [priceSuggestion, setPriceSuggestion] = useState(null);
  const [suggestionRequestKey, setSuggestionRequestKey] = useState("");
  const [suggestionState, setSuggestionState] = useState("idle");
  const [suggestionMessage, setSuggestionMessage] = useState(
    DEFAULT_SUGGESTION_MESSAGE,
  );

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Textbooks",
    condition: "good",
    askingPrice: "",
    listingType: "sale",
  });

  //const selectedCategory =
  //  CATEGORY_OPTIONS.find((option) => option.value === form.category) || null;

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleImageChange = (event) => {
    const nextImage = event.target.files?.[0] || null;

    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    setImage(nextImage);
    setImagePreviewUrl(nextImage ? URL.createObjectURL(nextImage) : "");
  };

  const clearSelectedImage = () => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    setImage(null);
    setImagePreviewUrl("");

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const parsedPrice = Number(form.askingPrice);
  const hasPriceInput = form.askingPrice !== "";
  const hasValidPrice = Number.isFinite(parsedPrice) && parsedPrice > 0;

  const currentSuggestionKey = hasValidPrice
    ? `${form.category}:${parsedPrice}`
    : "";

  const suggestionMatchesCurrentInput =
    suggestionRequestKey === currentSuggestionKey;

  const displayedSuggestionState = !hasPriceInput
    ? "idle"
    : !hasValidPrice
      ? "error"
      : suggestionMatchesCurrentInput
        ? suggestionState
        : "loading";

  const displayedSuggestionMessage = !hasPriceInput
    ? DEFAULT_SUGGESTION_MESSAGE
    : !hasValidPrice
      ? INVALID_SUGGESTION_MESSAGE
      : suggestionMatchesCurrentInput
        ? suggestionMessage
        : LOADING_SUGGESTION_MESSAGE;

  const displayedPriceSuggestion =
    displayedSuggestionState === "success" ? priceSuggestion : null;

  useEffect(() => {
    if (!hasValidPrice) {
      return undefined;
    }

    const controller = new AbortController();

    const timeoutId = setTimeout(async () => {
      setSuggestionRequestKey(currentSuggestionKey);
      setSuggestionState("loading");
      setSuggestionMessage(LOADING_SUGGESTION_MESSAGE);
      setPriceSuggestion(null);

      try {
        const params = new URLSearchParams({
          category: form.category,
          askingPrice: String(parsedPrice),
        });

        const response = await fetch(
          `${API_BASE_URL}/api/listings/suggested-price?${params.toString()}`,
          { signal: controller.signal },
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message || "Unable to load a price suggestion right now.",
          );
        }

        setPriceSuggestion(result.suggestion);
        setSuggestionRequestKey(currentSuggestionKey);
        setSuggestionState("success");
        setSuggestionMessage(SUCCESS_SUGGESTION_MESSAGE);
      } catch (error) {
        if (error.name === "AbortError") {
          return;
        }

        setPriceSuggestion(null);
        setSuggestionRequestKey(currentSuggestionKey);
        setSuggestionState("error");
        setSuggestionMessage(
          error.message || "Unable to load a price suggestion right now.",
        );
      }
    }, 350);

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [currentSuggestionKey, form.category, hasValidPrice, parsedPrice]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const { data } = await supabase.auth.getSession();
    const sellerId = data.session?.user?.id;

    if (!sellerId) {
      alert("You must be logged in");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/listings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          askingPrice: Number(form.askingPrice),
          sellerId,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        console.error(payload);
        alert("Failed to create listing");
        return;
      }

      const listingId = payload.listing.id;

      if (image) {
        const fileExt = image.name.split(".").pop();
        const fileName = `${listingId}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("listing-images")
          .upload(fileName, image);

        if (uploadError) {
          console.error(uploadError);
          alert("Image upload failed");
          return;
        }

        await fetch(`${API_BASE_URL}/api/listings/${listingId}/images`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storage_path: fileName,
          }),
        });
      }

      navigate("/student-dashboard");
    } catch (error) {
      console.error(error);
      alert("Error creating listing");
    }
  };

  return (
    <main
      className="min-h-screen bg-white px-4 py-6 sm:px-6 sm:py-8"
      style={{ fontFamily: "Inter, sans-serif" }}
      aria-label="Create listing page"
    >
      <article className="mx-auto max-w-4xl">
        <header className="mb-8">
          <p>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              Back
            </button>
          </p>

          <h1 className="mt-4 text-2xl font-bold text-gray-900 sm:text-3xl">
            Create Listing
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Add your item details and review the CPI-based price guidance before
            publishing.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <fieldset className="m-0 space-y-5 border-0 p-0">
            <legend className="sr-only">Listing details</legend>

            <header className="mb-2">
              <h2 className="text-lg font-bold text-gray-900">
                Listing details
              </h2>
            </header>

            <section className="space-y-2">
              <label
                htmlFor="listing-image"
                className="block text-sm font-semibold text-gray-800"
              >
                Listing image
              </label>

              <article className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5">
                <header className="space-y-1">
                  <h2 className="text-sm font-semibold text-gray-900">
                    Add a clear photo of your item
                  </h2>

                  <p className="text-sm text-gray-500">
                    Use a well-lit image so buyers can quickly understand the
                    item and its condition.
                  </p>

                  <p className="text-xs text-gray-400">
                    Accepted formats: JPG, PNG, WEBP and other image files.
                  </p>
                </header>

                <p className="mt-4">
                  <label
                    htmlFor="listing-image"
                    className="inline-flex cursor-pointer rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
                  >
                    Choose image
                  </label>
                </p>

                {image ? (
                  <article className="mt-5 grid gap-4 rounded-2xl border border-gray-200 bg-white p-4 md:grid-cols-[160px_1fr]">
                    {imagePreviewUrl ? (
                      <figure className="overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                        <img
                          src={imagePreviewUrl}
                          alt={`Preview of ${image.name}`}
                          className="h-40 w-full object-cover"
                        />
                      </figure>
                    ) : null}

                    <section className="space-y-3">
                      <header>
                        <h2 className="text-sm font-semibold text-blue-700">
                          Selected image
                        </h2>

                        <p className="mt-1 text-sm text-gray-700">
                          {image.name}
                        </p>
                      </header>

                      <dl className="grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
                        <dt className="font-medium text-gray-800">File size</dt>
                        <dd>{formatFileSize(image.size)}</dd>

                        <dt className="font-medium text-gray-800">File type</dt>
                        <dd>{image.type || "Unknown image type"}</dd>
                      </dl>

                      <p>
                        <button
                          type="button"
                          onClick={clearSelectedImage}
                          className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                        >
                          Remove image
                        </button>
                      </p>
                    </section>
                  </article>
                ) : (
                  <p className="mt-4 text-sm text-gray-500">
                    No image selected yet.
                  </p>
                )}

                <input
                  ref={imageInputRef}
                  id="listing-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="sr-only"
                />
              </article>
            </section>

            <section className="grid gap-5">
              <label htmlFor="title" className="space-y-2">
                <strong className="block text-sm font-semibold text-gray-800">
                  Title
                </strong>

                <input
                  id="title"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. First-year Computer Science textbook"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
              </label>

              <label htmlFor="description" className="space-y-2">
                <strong className="block text-sm font-semibold text-gray-800">
                  Description
                </strong>

                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe the item, its condition, and any important details."
                  className="min-h-32 w-full resize-y rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
            </section>
          </fieldset>

          <fieldset className="m-0 space-y-5 border-0 border-t border-gray-100 p-0 pt-8">
            <legend className="sr-only">Pricing and category</legend>

            <header className="mb-2">
              <h2 className="text-lg font-bold text-gray-900">
                Pricing and category
              </h2>
            </header>

            <section className="grid gap-5 md:grid-cols-2">
              <label htmlFor="category" className="space-y-2">
                <strong className="block text-sm font-semibold text-gray-800">
                  Category
                </strong>

                  <select
                    id="category"
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    {CATEGORY_OPTIONS.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>

              <label htmlFor="askingPrice" className="space-y-2">
                <strong className="block text-sm font-semibold text-gray-800">
                  Asking price (ZAR)
                </strong>

                <input
                  id="askingPrice"
                  name="askingPrice"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.askingPrice}
                  onChange={handleChange}
                  placeholder="Price in ZAR"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                  aria-describedby="price-suggestion-status"
                />
              </label>
            </section>

            <aside
              className="rounded-2xl border border-blue-100 bg-blue-50 p-5"
              aria-labelledby="price-suggestion-heading"
            >
              <h2
                id="price-suggestion-heading"
                className="text-sm font-bold text-blue-900"
              >
                Suggested price range
              </h2>

              <p
                id="price-suggestion-status"
                className="mt-2 text-sm text-blue-900"
                aria-live="polite"
              >
                {displayedSuggestionState === "loading"
                  ? "Loading suggestion..."
                  : displayedSuggestionMessage}
              </p>

              {displayedPriceSuggestion ? (
                <table className="mt-4 w-full text-sm text-gray-800">
                  <caption className="sr-only">
                    Suggested pricing details from the selected category
                  </caption>

                  <tbody className="divide-y divide-blue-100">
                    <tr>
                      <th
                        scope="row"
                        className="py-2 pr-4 text-left font-medium"
                      >
                        Recommended range
                      </th>
                      <td className="py-2">
                        {formatCurrency(displayedPriceSuggestion.low)} to{" "}
                        {formatCurrency(displayedPriceSuggestion.high)}
                      </td>
                    </tr>

                    <tr>
                      <th
                        scope="row"
                        className="py-2 pr-4 text-left font-medium"
                      >
                        Annual category change
                      </th>
                      <td className="py-2">
                        {displayedPriceSuggestion.annualChangePercent}%
                      </td>
                    </tr>

                    <tr>
                      <th
                        scope="row"
                        className="py-2 pr-4 text-left font-medium"
                      >
                        CPI index
                      </th>
                      <td className="py-2">
                        {displayedPriceSuggestion.cpiIndex}
                      </td>
                    </tr>

                    <tr>
                      <th
                        scope="row"
                        className="py-2 pr-4 text-left font-medium"
                      >
                        Reference date
                      </th>
                      <td className="py-2">
                        {displayedPriceSuggestion.referenceDate}
                      </td>
                    </tr>
                  </tbody>
                </table>
              ) : null}
            </aside>
          </fieldset>

          <fieldset className="m-0 space-y-5 border-0 border-t border-gray-100 p-0 pt-8">
            <legend className="sr-only">Item condition</legend>

            <header className="mb-2">
              <h2 className="text-lg font-bold text-gray-900">
                Item condition
              </h2>
            </header>

            <section className="grid gap-5 md:grid-cols-2">
              <label htmlFor="condition" className="space-y-2">
                <strong className="block text-sm font-semibold text-gray-800">
                  Condition
                </strong>

                <select
                  id="condition"
                  name="condition"
                  value={form.condition}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {CONDITION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label htmlFor="listingType" className="space-y-2">
                <strong className="block text-sm font-semibold text-gray-800">
                  Listing type
                </strong>

                <select
                  id="listingType"
                  name="listingType"
                  value={form.listingType}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {LISTING_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </section>
          </fieldset>

          <footer className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate("/student-dashboard")}
              className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-xl bg-blue-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
            >
              Create Listing
            </button>
          </footer>
        </form>
      </article>
    </main>
  );
}
