export default function AnalyticsPanel({
  analytics,
  onExportCsv,
  onExportPdf,
}) {
  const {
    popularCategories,
    transactionsOverTime,
    facilityUtilization,
    flaggedSummary,
  } = analytics;

  return (
    <section className="grid grid-cols-1 gap-6" id="analytics">
      <article className="rounded-lg border border-gray-200 bg-white p-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Popular Categories
            </h2>
            <p className="text-sm text-gray-500">
              Top categories by listings created this month.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
              onClick={() => onExportPdf("categories")}
            >
              Export PDF
            </button>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
              onClick={() => onExportCsv("categories")}
            >
              Export CSV
            </button>
          </div>
        </header>
        <ul className="mt-5 flex flex-col gap-3" role="list">
          {popularCategories.map((item) => (
            <li key={item.label} className="flex items-center gap-4">
              <div className="min-w-30">
                <p className="text-sm font-semibold text-gray-700">
                  {item.label}
                </p>
                <p className="text-xs text-gray-500">{item.count} listings</p>
              </div>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                <span
                  className="block h-full bg-blue-600"
                  style={{ width: `${item.count * 2}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </article>

      <article className="rounded-lg border border-gray-200 bg-white p-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Transactions Over Time
            </h2>
            <p className="text-sm text-gray-500">
              Completed transactions per month (last 4 months).
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
              onClick={() => onExportPdf("transactions")}
            >
              Export PDF
            </button>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
              onClick={() => onExportCsv("transactions")}
            >
              Export CSV
            </button>
          </div>
        </header>
        <ul className="mt-5 flex flex-col gap-3" role="list">
          {transactionsOverTime.map((item) => (
            <li key={item.label} className="flex items-center gap-4">
              <div className="min-w-30">
                <p className="text-sm font-semibold text-gray-700">
                  {item.label}
                </p>
                <p className="text-xs text-gray-500">
                  {item.count} transactions
                </p>
              </div>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                <span
                  className="block h-full bg-blue-600"
                  style={{ width: `${item.count * 2}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </article>

      <article className="rounded-lg border border-gray-200 bg-white p-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Facility Utilisation
            </h2>
            <p className="text-sm text-gray-500">
              Bookings vs capacity for the current operating week.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
              onClick={() => onExportPdf("utilization")}
            >
              Export PDF
            </button>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
              onClick={() => onExportCsv("utilization")}
            >
              Export CSV
            </button>
          </div>
        </header>
        <div className="mt-5 flex flex-col gap-3">
          <div>
            <p className="text-3xl font-bold text-gray-900">
              {facilityUtilization.booked}/{facilityUtilization.capacity}
            </p>
            <p className="text-sm text-gray-500">Slots booked</p>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-gray-200">
            <span
              className="block h-full bg-blue-600"
              style={{
                width: `${
                  (facilityUtilization.booked / facilityUtilization.capacity) *
                  100
                }%`,
              }}
            />
          </div>
        </div>
      </article>

      <article className="rounded-lg border border-gray-200 bg-white p-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Flagged Content Summary
            </h2>
            <p className="text-sm text-gray-500">
              Items awaiting review across the platform.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
              onClick={() => onExportPdf("moderation")}
            >
              Export PDF
            </button>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
              onClick={() => onExportCsv("moderation")}
            >
              Export CSV
            </button>
          </div>
        </header>
        <ul className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3" role="list">
          <li className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">
              {flaggedSummary.listings}
            </p>
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Listings
            </p>
          </li>
          <li className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">
              {flaggedSummary.reviews}
            </p>
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Reviews
            </p>
          </li>
          <li className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">
              {flaggedSummary.messages}
            </p>
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Messages
            </p>
          </li>
        </ul>
      </article>
    </section>
  );
}
