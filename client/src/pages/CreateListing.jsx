import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../config/supabaseClient";
import { API_BASE_URL } from "../config/apiBaseUrl";

const CATEGORY_OPTIONS = ["Textbooks", "Electronics", "Furniture", "Clothing"];
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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const nextImage = e.target.files?.[0] || null;

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { data } = await supabase.auth.getSession();
    const sellerId = data.session?.user?.id;

    if (!sellerId) {
      alert("You must be logged in");
      return;
    }

    try {
      // Persist the listing first, then attach image metadata if upload succeeds.
      const res = await fetch(`${API_BASE_URL}/api/listings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          askingPrice: Number(form.askingPrice),
          sellerId,
        }),
      });

      const dataRes = await res.json();

      if (!res.ok) {
        console.error(dataRes);
        alert("Failed to create listing");
        return;
      }

      const listingId = dataRes.listing.id;

      //Upload image 
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

        // 3️⃣ Save image path in DB
        await fetch(`${API_BASE_URL}/api/listings/${listingId}/images`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storage_path: fileName,
          }),
        });
      }

      navigate("/student-dashboard");
    } catch (err) {
      console.error(err);
      alert("Error creating listing");
    }
  };

  return (
    <main className="mx-auto max-w-3xl p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Create Listing</h1>
        <p className="mt-2 text-sm text-gray-600">
          Add your item details and review the CPI-based price guidance before
          publishing.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <fieldset className="space-y-4 rounded-lg border p-5">
          <legend className="px-2 text-sm font-semibold text-gray-700">
            Listing details
          </legend>

          <section className="space-y-2">
            <label htmlFor="listing-image" className="block text-sm font-medium">
              Listing image
            </label>
            <article className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
              <header className="space-y-2">
                <p className="text-sm font-medium text-slate-900">
                  Add a clear photo of your item
                </p>
                <p className="text-sm text-slate-600">
                  Use a well-lit image so buyers can quickly understand the
                  item and its condition.
                </p>
                <p className="text-xs text-slate-500">
                  Accepted formats: JPG, PNG, WEBP and other image files.
                </p>
              </header>

              <p className="mt-4">
                <label
                  htmlFor="listing-image"
                  className="inline-flex cursor-pointer rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white"
                >
                  Choose image
                </label>
              </p>

              {image ? (
                <article className="mt-4 grid gap-4 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-[160px_1fr]">
                  {imagePreviewUrl ? (
                    <figure className="overflow-hidden rounded-lg border bg-slate-100">
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
                      <p className="mt-1 text-sm text-slate-700">
                        {image.name}
                      </p>
                    </header>

                    <dl className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                      <dt className="font-medium text-slate-800">File size</dt>
                      <dd>{formatFileSize(image.size)}</dd>
                      <dt className="font-medium text-slate-800">File type</dt>
                      <dd>{image.type || "Unknown image type"}</dd>
                    </dl>

                    <p>
                      <button
                        type="button"
                        onClick={clearSelectedImage}
                        className="inline-flex rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
                      >
                        Remove image
                      </button>
                    </p>
                  </section>
                </article>
              ) : (
                <p className="mt-4 text-sm text-slate-500">
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

          <section className="space-y-2">
            <label htmlFor="title" className="block text-sm font-medium">
              Title
            </label>
            <input
              id="title"
              name="title"
              value={form.title}
              onChange={handleChange}
              className="w-full rounded border p-2"
              required
            />
          </section>

          <section className="space-y-2">
            <label htmlFor="description" className="block text-sm font-medium">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              className="min-h-28 w-full rounded border p-2"
            />
          </section>
        </fieldset>

        <fieldset className="space-y-4 rounded-lg border p-5">
          <legend className="px-2 text-sm font-semibold text-gray-700">
            Pricing and category
          </legend>

          <section className="grid gap-4 md:grid-cols-2">
            <section className="space-y-2">
              <label htmlFor="category" className="block text-sm font-medium">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full rounded border p-2"
              >
                {CATEGORY_OPTIONS.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </section>

            <section className="space-y-2">
              <label
                htmlFor="askingPrice"
                className="block text-sm font-medium"
              >
                Asking price (ZAR)
              </label>
              <input
                id="askingPrice"
                name="askingPrice"
                type="number"
                min="0.01"
                step="0.01"
                value={form.askingPrice}
                onChange={handleChange}
                className="w-full rounded border p-2"
                required
                aria-describedby="price-suggestion-status"
              />
            </section>
          </section>

          <aside
            className="rounded-lg border border-blue-200 bg-blue-50 p-4"
            aria-labelledby="price-suggestion-heading"
          >
            <h2
              id="price-suggestion-heading"
              className="text-sm font-semibold text-blue-900"
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
              <table className="mt-4 w-full text-sm text-slate-800">
                <caption className="sr-only">
                  Suggested pricing details from the selected category
                </caption>
                <tbody className="divide-y divide-blue-100">
                  <tr>
                    <th scope="row" className="py-2 pr-4 text-left font-medium">
                      Recommended range
                    </th>
                    <td className="py-2">
                      {formatCurrency(displayedPriceSuggestion.low)} to{" "}
                      {formatCurrency(displayedPriceSuggestion.high)}
                    </td>
                  </tr>
                  <tr>
                    <th scope="row" className="py-2 pr-4 text-left font-medium">
                      Annual category change
                    </th>
                    <td className="py-2">
                      {displayedPriceSuggestion.annualChangePercent}%
                    </td>
                  </tr>
                  <tr>
                    <th scope="row" className="py-2 pr-4 text-left font-medium">
                      CPI index
                    </th>
                    <td className="py-2">{displayedPriceSuggestion.cpiIndex}</td>
                  </tr>
                  <tr>
                    <th scope="row" className="py-2 pr-4 text-left font-medium">
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

        <fieldset className="space-y-4 rounded-lg border p-5">
          <legend className="px-2 text-sm font-semibold text-gray-700">
            Item condition
          </legend>

          <section className="grid gap-4 md:grid-cols-2">
            <section className="space-y-2">
              <label htmlFor="condition" className="block text-sm font-medium">
                Condition
              </label>
              <select
                id="condition"
                name="condition"
                value={form.condition}
                onChange={handleChange}
                className="w-full rounded border p-2"
              >
                {CONDITION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </section>

            <section className="space-y-2">
              <label
                htmlFor="listingType"
                className="block text-sm font-medium"
              >
                Listing type
              </label>
              <select
                id="listingType"
                name="listingType"
                value={form.listingType}
                onChange={handleChange}
                className="w-full rounded border p-2"
              >
                {LISTING_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </section>
          </section>
        </fieldset>

        <footer>
          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-2 text-white"
          >
            Create Listing
          </button>
        </footer>
      </form>
    </main>
  );
}
