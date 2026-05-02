export default function FacilitySettingsPanel({
  settings,
  operatingHours,
  onSettingChange,
  onHoursChange,
  onSave,
  lastSavedAt,
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
            Configure operating hours and slot capacity for the campus hub.
          </p>
        </div>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          type="button"
          onClick={onSave}
        >
          Save Settings
        </button>
      </header>

      <div className="mt-6 flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-600">
            <span>Facility Name</span>
            <input
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
              value={settings.name}
              onChange={(e) => onSettingChange("name", e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-600">
            <span>Location</span>
            <input
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
              value={settings.location}
              onChange={(e) => onSettingChange("location", e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-600">
            <span>Slot Capacity</span>
            <input
              type="number"
              min="1"
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
              value={settings.slotCapacity}
              onChange={(e) =>
                onSettingChange("slotCapacity", Number(e.target.value))
              }
            />
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              className="h-4 w-4 text-blue-600"
              checked={settings.isActive}
              onChange={(e) => onSettingChange("isActive", e.target.checked)}
            />
            <span>Facility Active</span>
          </label>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-base font-semibold text-gray-900">
              Operating Hours
            </h3>
            {lastSavedAt && (
              <span className="text-xs text-gray-500">
                Last saved {lastSavedAt.toLocaleTimeString()}
              </span>
            )}
          </div>
          <ul className="mt-3 flex flex-col gap-3" role="list">
            {operatingHours.map((entry) => (
              <li
                className="grid grid-cols-1 items-center gap-3 md:grid-cols-[160px_1fr_1fr]"
                key={entry.day}
              >
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
                <input
                  type="time"
                  value={entry.open}
                  disabled={!entry.active}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-gray-100"
                  onChange={(e) =>
                    onHoursChange(entry.day, "open", e.target.value)
                  }
                />
                <input
                  type="time"
                  value={entry.close}
                  disabled={!entry.active}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-gray-100"
                  onChange={(e) =>
                    onHoursChange(entry.day, "close", e.target.value)
                  }
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}
