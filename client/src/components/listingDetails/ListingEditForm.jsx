import {
  LISTING_CATEGORIES,
  LISTING_CONDITIONS,
  LISTING_TYPES,
} from "./listingDetailsOptions";

// Controlled form: parent hook owns state/validation/network calls,
// this component only renders fields and invokes callbacks.
export default function ListingEditForm({
  editForm,
  onEditChange,
  onSaveEdit,
  onCancelEdit,
  saving,
  saveError,
}) {
  return (
    <form className="mt-4 flex flex-col gap-3" onSubmit={onSaveEdit}>
      <label className="text-sm text-gray-700 flex flex-col gap-1">
        <strong>Title</strong>
        <input
          name="title"
          value={editForm.title}
          onChange={onEditChange}
          required
          className="border border-gray-300 rounded-lg px-3 py-2"
        />
      </label>

      <label className="text-sm text-gray-700 flex flex-col gap-1">
        <strong>Description</strong>
        <textarea
          name="description"
          value={editForm.description}
          onChange={onEditChange}
          className="border border-gray-300 rounded-lg px-3 py-2"
          rows={4}
        />
      </label>

      <label className="text-sm text-gray-700 flex flex-col gap-1">
        <strong>Price (ZAR)</strong>
        <input
          name="askingPrice"
          type="number"
          min="1"
          value={editForm.askingPrice}
          onChange={onEditChange}
          required
          className="border border-gray-300 rounded-lg px-3 py-2"
        />
      </label>

      <label className="text-sm text-gray-700 flex flex-col gap-1">
        <strong>Category</strong>
        <select
          name="category"
          value={editForm.category}
          onChange={onEditChange}
          className="border border-gray-300 rounded-lg px-3 py-2"
        >
          {LISTING_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm text-gray-700 flex flex-col gap-1">
        <strong>Condition</strong>
        <select
          name="condition"
          value={editForm.condition}
          onChange={onEditChange}
          className="border border-gray-300 rounded-lg px-3 py-2"
        >
          {LISTING_CONDITIONS.map((condition) => (
            <option key={condition} value={condition}>
              {condition}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm text-gray-700 flex flex-col gap-1">
        <strong>Listing Type</strong>
        <select
          name="listingType"
          value={editForm.listingType}
          onChange={onEditChange}
          className="border border-gray-300 rounded-lg px-3 py-2"
        >
          {LISTING_TYPES.map((listingType) => (
            <option key={listingType} value={listingType}>
              {listingType}
            </option>
          ))}
        </select>
      </label>

      {saveError && <p className="text-sm text-red-500">{saveError}</p>}

      <section className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium px-5 py-2 rounded-lg transition-colors"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={onCancelEdit}
          disabled={saving}
          className="bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-gray-800 font-medium px-5 py-2 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </section>
    </form>
  );
}
