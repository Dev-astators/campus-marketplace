const PROGRESS_BAR_CLASSES =
  "h-2 flex-1 appearance-none overflow-hidden rounded-full bg-gray-200 accent-blue-600 [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-blue-600 [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-gray-200 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-blue-600";

const TALL_PROGRESS_BAR_CLASSES =
  "h-3 appearance-none overflow-hidden rounded-full bg-gray-200 accent-blue-600 [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-blue-600 [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-gray-200 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-blue-600";

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
      <header className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
        <section>
          <h2 className="text-lg font-semibold text-gray-900">
            Analytics Reports
          </h2>
          <p className="text-sm text-gray-500">
            Export each analytics card individually or combine everything into
            one complete PDF report.
          </p>
        </section>
        <button
          type="button"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          onClick={() => onExportPdf("all")}
        >
          Create Full Report
        </button>
      </header>

      <article className="rounded-lg border border-gray-200 bg-white p-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              Popular Categories
            </h2>
            <p className="text-sm text-gray-500">
              Top categories by listings created this month.
            </p>
          </section>
          <menu className="m-0 flex list-none flex-wrap gap-2 p-0">
            <li>
              <button
                className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => onExportPdf("categories")}
              >
                Export PDF
              </button>
            </li>
            <li>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                onClick={() => onExportCsv("categories")}
              >
                Export CSV
              </button>
            </li>
          </menu>
        </header>
        <ul className="mt-5 flex flex-col gap-3">
          {popularCategories.map((item) => (
            <li key={item.label} className="flex items-center gap-4">
              <section className="min-w-30">
                <p className="text-sm font-semibold text-gray-700">
                  {item.label}
                </p>
                <p className="text-xs text-gray-500">{item.count} listings</p>
              </section>
              <progress
                className={PROGRESS_BAR_CLASSES}
                max="100"
                value={item.count * 2}
                aria-label={`${item.label} listing share`}
              />
            </li>
          ))}
        </ul>
      </article>

      <article className="rounded-lg border border-gray-200 bg-white p-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              Transactions Over Time
            </h2>
            <p className="text-sm text-gray-500">
              Completed transactions per month (last 4 months).
            </p>
          </section>
          <menu className="m-0 flex list-none flex-wrap gap-2 p-0">
            <li>
              <button
                className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => onExportPdf("transactions")}
              >
                Export PDF
              </button>
            </li>
            <li>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                onClick={() => onExportCsv("transactions")}
              >
                Export CSV
              </button>
            </li>
          </menu>
        </header>
        <ul className="mt-5 flex flex-col gap-3">
          {transactionsOverTime.map((item) => (
            <li key={item.label} className="flex items-center gap-4">
              <section className="min-w-30">
                <p className="text-sm font-semibold text-gray-700">
                  {item.label}
                </p>
                <p className="text-xs text-gray-500">
                  {item.count} transactions
                </p>
              </section>
              <progress
                className={PROGRESS_BAR_CLASSES}
                max="100"
                value={item.count * 2}
                aria-label={`${item.label} transaction share`}
              />
            </li>
          ))}
        </ul>
      </article>

      <article className="rounded-lg border border-gray-200 bg-white p-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              Facility Utilisation
            </h2>
            <p className="text-sm text-gray-500">
              Bookings vs capacity for the current operating week.
            </p>
          </section>
          <menu className="m-0 flex list-none flex-wrap gap-2 p-0">
            <li>
              <button
                className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => onExportPdf("utilization")}
              >
                Export PDF
              </button>
            </li>
            <li>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                onClick={() => onExportCsv("utilization")}
              >
                Export CSV
              </button>
            </li>
          </menu>
        </header>
        <section className="mt-5 flex flex-col gap-3">
          <section>
            <p className="text-3xl font-bold text-gray-900">
              {facilityUtilization.booked}/{facilityUtilization.capacity}
            </p>
            <p className="text-sm text-gray-500">Slots booked</p>
          </section>
          <progress
            className={TALL_PROGRESS_BAR_CLASSES}
            max={facilityUtilization.capacity}
            value={facilityUtilization.booked}
            aria-label="Facility slot utilisation"
          />
        </section>
      </article>

      <article className="rounded-lg border border-gray-200 bg-white p-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              Flagged Content Summary
            </h2>
            <p className="text-sm text-gray-500">
              Items awaiting review across the platform.
            </p>
          </section>
          <menu className="m-0 flex list-none flex-wrap gap-2 p-0">
            <li>
              <button
                className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => onExportPdf("moderation")}
              >
                Export PDF
              </button>
            </li>
            <li>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                onClick={() => onExportCsv("moderation")}
              >
                Export CSV
              </button>
            </li>
          </menu>
        </header>
        <section className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <article className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">
              {flaggedSummary.listings}
            </p>
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Listings
            </p>
          </article>
          <article className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">
              {flaggedSummary.reviews}
            </p>
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Reviews
            </p>
          </article>
          <article className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">
              {flaggedSummary.messages}
            </p>
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Messages
            </p>
          </article>
        </section>
      </article>
    </section>
  );
}
