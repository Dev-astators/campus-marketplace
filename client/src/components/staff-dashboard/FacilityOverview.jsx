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
      <article className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 shadow-sm">
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
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
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
        <dl className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <section className="rounded-2xl bg-slate-50 p-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Location
            </dt>
            <dd className="mt-2 text-sm font-medium text-slate-800">
              {facility.location}
            </dd>
          </section>
          <section className="rounded-2xl bg-slate-50 p-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Drop-off capacity
            </dt>
            <dd className="mt-2 text-sm font-medium text-slate-800">
              {facility.slotCapacity} bookings per window
            </dd>
          </section>
          <section className="rounded-2xl bg-slate-50 p-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Collection capacity
            </dt>
            <dd className="mt-2 text-sm font-medium text-slate-800">
              {facility.collectionCapacity} bookings per window
            </dd>
          </section>
          <section className="rounded-2xl bg-slate-50 p-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Booked today
            </dt>
            <dd className="mt-2 text-sm font-medium text-slate-800">
              {totalBookedSlots}/{totalCapacity} reserved
            </dd>
          </section>
          <section className="rounded-2xl bg-slate-50 p-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Full windows
            </dt>
            <dd className="mt-2 text-sm font-medium text-slate-800">
              {fullSlots} capacity-locked slots
            </dd>
          </section>
          <section className="rounded-2xl bg-slate-50 p-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Pending handoffs
            </dt>
            <dd className="mt-2 text-sm font-medium text-slate-800">
              {pendingTransactions} active transactions
            </dd>
          </section>
        </dl>
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

        <article className="rounded-2xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-900">
            Staff coordination
          </h3>
          <dl className="mt-3 space-y-3 text-sm text-slate-700">
            <section className="rounded-xl bg-slate-50 px-3 py-3">
              <dt className="font-semibold text-slate-900">Supervisor</dt>
              <dd className="mt-1">{facility.supervisor}</dd>
            </section>
            <section className="rounded-xl bg-slate-50 px-3 py-3">
              <dt className="font-semibold text-slate-900">Support line</dt>
              <dd className="mt-1">{facility.supportLine}</dd>
            </section>
            <section className="rounded-xl bg-slate-50 px-3 py-3">
              <dt className="font-semibold text-slate-900">Desk status</dt>
              <dd className="mt-1">
                {facility.status} across {facility.deskCount} staffed counters
              </dd>
            </section>
          </dl>
        </article>
      </section>
    </article>
  );
}
