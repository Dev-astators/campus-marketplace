const formatOperatingHours = (entry) =>
  entry.active ? `${entry.open} - ${entry.close}` : "Closed";

export default function FacilityOverview({
  facility,
  operatingHours,
  totalCapacity,
  totalBookedSlots,
  fullSlots,
  pendingTransactions,
}) {
  if (!facility) {
    return (
      <article className="rounded-3xl border border-dashed border-slate-300 bg-white p-5 shadow-sm sm:p-6">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">
            Facility management
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">
            No active trade facility found
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            The staff dashboard is now connected to the real database, but
            there is no active record in <code>trade_facilities</code> yet.
            Once a facility is created, operating hours, slots, and handoff
            records will appear here automatically.
          </p>
        </header>
      </article>
    );
  }

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <header className="border-b border-slate-100 pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">
          Facility management
        </p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900">
          {facility.name}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Admin-managed operating hours and slot limits are shown here so staff
          can monitor capacity before accepting physical handoffs.
        </p>
      </header>

      <section className="mt-5">
        <h3 className="text-sm font-semibold text-slate-900">
          Facility summary
        </h3>
        <ul className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <li className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Location
            </p>
            <p className="mt-2 text-sm font-medium text-slate-800">
              {facility.location}
            </p>
          </li>
          <li className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Drop-off capacity
            </p>
            <p className="mt-2 text-sm font-medium text-slate-800">
              {facility.slotCapacity} bookings per window
            </p>
          </li>
          <li className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Collection capacity
            </p>
            <p className="mt-2 text-sm font-medium text-slate-800">
              {facility.collectionCapacity} bookings per window
            </p>
          </li>
          <li className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Booked today
            </p>
            <p className="mt-2 text-sm font-medium text-slate-800">
              {totalBookedSlots}/{totalCapacity} reserved
            </p>
          </li>
          <li className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Full windows
            </p>
            <p className="mt-2 text-sm font-medium text-slate-800">
              {fullSlots} capacity-locked slots
            </p>
          </li>
          <li className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Pending handoffs
            </p>
            <p className="mt-2 text-sm font-medium text-slate-800">
              {pendingTransactions} active transactions
            </p>
          </li>
        </ul>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-2xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-900">
            Operating hours
          </h3>
          {operatingHours.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {operatingHours.map((entry) => (
                <li
                  key={entry.day}
                  className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700"
                >
                  <strong className="font-semibold text-slate-900">
                    {entry.day}
                  </strong>
                  <p className="mt-1">{formatOperatingHours(entry)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-500">
              No operating hours have been configured yet.
            </p>
          )}
        </article>

      </section>
    </article>
  );
}
