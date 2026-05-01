const renderRows = (items, onResolve, labelKey) =>
  items.map((item) => (
    <tr key={item.id} className="border-t border-gray-100">
      <td className="px-4 py-3 text-xs font-semibold text-gray-500">
        {item.id}
      </td>
      <td className="px-4 py-3 text-sm text-gray-700">{item[labelKey]}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{item.reason}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{item.reportedBy}</td>
      <td className="px-4 py-3 text-right">
        <button
          type="button"
          className="text-sm font-semibold text-blue-600 transition hover:text-blue-700"
          onClick={() => onResolve(item.id)}
        >
          Resolve
        </button>
      </td>
    </tr>
  ));

export default function ModerationPanel({
  flaggedListings,
  flaggedReviews,
  onResolveListing,
  onResolveReview,
}) {
  return (
    <article
      className="rounded-lg border border-gray-200 bg-white p-6"
      id="moderation"
    >
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Moderation Queue
          </h2>
          <p className="text-sm text-gray-500">
            Review flagged listings and reviews before they go live.
          </p>
        </div>
        <button
          className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
          type="button"
        >
          View policy
        </button>
      </header>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="overflow-hidden rounded-lg border border-gray-200">
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-700">
              Flagged Listings
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-gray-400">
                  <th className="px-4 py-2">ID</th>
                  <th className="px-4 py-2">Title</th>
                  <th className="px-4 py-2">Reason</th>
                  <th className="px-4 py-2">Reported By</th>
                  <th className="px-4 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {flaggedListings.length ? (
                  renderRows(flaggedListings, onResolveListing, "title")
                ) : (
                  <tr>
                    <td colSpan="5" className="px-4 py-4 text-sm text-gray-500">
                      No flagged listings.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-gray-200">
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-700">
              Flagged Reviews
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-gray-400">
                  <th className="px-4 py-2">ID</th>
                  <th className="px-4 py-2">Listing</th>
                  <th className="px-4 py-2">Reason</th>
                  <th className="px-4 py-2">Reported By</th>
                  <th className="px-4 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {flaggedReviews.length ? (
                  renderRows(flaggedReviews, onResolveReview, "listing")
                ) : (
                  <tr>
                    <td colSpan="5" className="px-4 py-4 text-sm text-gray-500">
                      No flagged reviews.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </article>
  );
}
