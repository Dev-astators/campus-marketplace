export default function ActivityFeed({ activityLog }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="border-b border-slate-100 pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">
          Activity feed
        </p>
        <h2 className="mt-2 text-xl font-bold text-slate-900">
          Transaction updates and notifications
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Every status change shown here represents an update to the transaction
          record and the notifications that would be sent to the relevant
          parties.
        </p>
      </header>

      {activityLog.length > 0 ? (
        <ol className="mt-5 space-y-4">
          {activityLog.map((entry) => (
            <li key={entry.id}>
              <article className="rounded-2xl bg-slate-50 p-4">
                <header>
                  <time
                    className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
                    dateTime={entry.time}
                  >
                    {entry.time}
                  </time>
                  <h3 className="mt-2 text-sm font-semibold text-slate-900">
                    {entry.title}
                  </h3>
                </header>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {entry.detail}
                </p>
                <p className="mt-3 text-xs font-medium text-blue-700">
                  {entry.audience}
                </p>
              </article>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-5 rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500">
          No staff activity has been recorded yet for the selected facility day.
        </p>
      )}
    </article>
  );
}
