import { useEffect, useState } from "react";
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

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 2,
  }).format(value);

export default function CreateListing() {
  const navigate = useNavigate();
  const [image, setImage] = useState(null);
  const [priceSuggestion, setPriceSuggestion] = useState(null);
  const [suggestionState, setSuggestionState] = useState("idle");
  const [suggestionMessage, setSuggestionMessage] = useState(
    "Enter a price to see a CPI-based suggestion for this category.",
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

  useEffect(() => {
    const price = Number(form.askingPrice);

    if (!form.askingPrice) {
      setPriceSuggestion(null);
      setSuggestionState("idle");
      setSuggestionMessage(
        "Enter a price to see a CPI-based suggestion for this category.",
      );
      return undefined;
    }

    if (Number.isNaN(price) || price <= 0) {
      setPriceSuggestion(null);
      setSuggestionState("error");
      setSuggestionMessage("Enter a valid positive price to get a suggestion.");
      return undefined;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      setSuggestionState("loading");
      setSuggestionMessage("Checking the latest Stats SA category guidance...");

      try {
        const params = new URLSearchParams({
          category: form.category,
          askingPrice: String(price),
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
        setSuggestionState("success");
        setSuggestionMessage("Price suggestion loaded.");
      } catch (error) {
        if (error.name === "AbortError") {
          return;
        }

        setPriceSuggestion(null);
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
  }, [form.askingPrice, form.category]);

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

      // 2️⃣ Upload image (if exists)
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

          <div className="space-y-2">
            <label htmlFor="listing-image" className="block text-sm font-medium">
              Listing image
            </label>
            <input
              id="listing-image"
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files[0] || null)}
              className="w-full rounded border p-2"
            />
          </div>

          <div className="space-y-2">
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
          </div>

          <div className="space-y-2">
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
          </div>
        </fieldset>

        <fieldset className="space-y-4 rounded-lg border p-5">
          <legend className="px-2 text-sm font-semibold text-gray-700">
            Pricing and category
          </legend>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
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
            </div>

            <div className="space-y-2">
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
            </div>
          </div>

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
              {suggestionState === "loading"
                ? "Loading suggestion..."
                : suggestionMessage}
            </p>

            {priceSuggestion ? (
              <dl className="mt-4 grid gap-3 text-sm text-slate-800 md:grid-cols-2">
                <div>
                  <dt className="font-medium">Recommended range</dt>
                  <dd>
                    {formatCurrency(priceSuggestion.low)} to{" "}
                    {formatCurrency(priceSuggestion.high)}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium">Annual category change</dt>
                  <dd>{priceSuggestion.annualChangePercent}%</dd>
                </div>
                <div>
                  <dt className="font-medium">CPI index</dt>
                  <dd>{priceSuggestion.cpiIndex}</dd>
                </div>
                <div>
                  <dt className="font-medium">Reference date</dt>
                  <dd>{priceSuggestion.referenceDate}</dd>
                </div>
              </dl>
            ) : null}
          </aside>
        </fieldset>

        <fieldset className="space-y-4 rounded-lg border p-5">
          <legend className="px-2 text-sm font-semibold text-gray-700">
            Item condition
          </legend>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
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
            </div>

            <div className="space-y-2">
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
            </div>
          </div>
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
