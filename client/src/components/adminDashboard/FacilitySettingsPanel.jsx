export default function FacilitySettingsPanel({
  settings,
  operatingHours,
  onSettingChange,
  onHoursChange,
  onSave,
  lastSavedAt,
  isSaving = false,
  isNew = false,
}) {
  return (
    <article
      className="rounded-lg border border-gray-200 bg-white p-6"
      id="facility"
    >
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Trade Facility Settings
          </h2>
          <p className="text-sm text-gray-500">
            {isNew
              ? "Configure a new trade facility for this campus."
              : "Update operating hours and slot capacity for the selected facility."}
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          type="button"
          onClick={onSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              Saving…
            </>
          ) : isNew ? (
            "Create Facility"
          ) : (
            "Save Settings"
          )}
        </button>
      </header>

      <div className="mt-6 flex flex-col gap-6">
        {/* ── Basic fields ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-600">
            <span>Facility Name</span>
            <input
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
              value={settings.name}
              onChange={(e) => onSettingChange("name", e.target.value)}
              placeholder="e.g. Wits Trade Hub"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-gray-600">
            <span>Location</span>
            <input
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
              value={settings.location}
              onChange={(e) => onSettingChange("location", e.target.value)}
              placeholder="e.g. Wits Central Campus, Room 101"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-gray-600">
            <span>Slot Capacity</span>
            <input
              type="number"
              min="1"
              max="100"
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
              value={settings.slotCapacity}
              onChange={(e) =>
                onSettingChange("slotCapacity", Number(e.target.value))
              }
            />
          </label>

          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 text-blue-600"
              checked={settings.isActive}
              onChange={(e) => onSettingChange("isActive", e.target.checked)}
            />
            <span>Facility Active</span>
            <span
              className={`ml-1 inline-block h-2 w-2 rounded-full ${
                settings.isActive ? "bg-green-500" : "bg-gray-400"
              }`}
            />
          </label>
        </div>

        {/* ── Operating hours ───────────────────────────────────────────── */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-base font-semibold text-gray-900">
              Operating Hours
            </h3>
            {lastSavedAt && (
              <span className="text-xs text-gray-400">
                Last saved {lastSavedAt.toLocaleTimeString("en-ZA")}
              </span>
            )}
          </div>

          <div className="mt-3 flex flex-col gap-3">
            {operatingHours.map((entry) => (
              <div
                className="grid grid-cols-1 items-center gap-3 md:grid-cols-[160px_1fr_1fr]"
                key={entry.day}
              >
                {/* Day toggle */}
                <div className="flex items-center justify-between gap-3 text-sm font-semibold text-gray-700">
                  <span>{entry.day}</span>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={entry.active}
                      onChange={(e) =>
                        onHoursChange(entry.day, "active", e.target.checked)
                      }
                    />
                    <span className="h-6 w-10 rounded-full bg-gray-200 transition-colors peer-checked:bg-blue-600" />
                    <span className="pointer-events-none absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
                  </label>
                </div>

                {/* Open time */}
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-gray-400 md:sr-only">Open</span>
                  <input
                    type="time"
                    value={entry.open}
                    disabled={!entry.active}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-gray-100 disabled:text-gray-400"
                    onChange={(e) =>
                      onHoursChange(entry.day, "open", e.target.value)
                    }
                  />
                </div>

                {/* Close time */}
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-gray-400 md:sr-only">Close</span>
                  <input
                    type="time"
                    value={entry.close}
                    disabled={!entry.active}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-gray-100 disabled:text-gray-400"
                    onChange={(e) =>
                      onHoursChange(entry.day, "close", e.target.value)
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
