const statusClasses = {
  Full: "bg-rose-50 text-rose-700",
  Busy: "bg-amber-50 text-amber-700",
  Open: "bg-emerald-50 text-emerald-700",
};

const formatSelectedDate = (selectedDate) => {
  if (!selectedDate) {
    return "";
  }

  const parsedDate = new Date(`${selectedDate}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return selectedDate;
  }

  return new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsedDate);
};

export default function BookingScheduleBoard({ slots, selectedDate = "" }) {
  const displayDate = formatSelectedDate(selectedDate);

  return (
    <article className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-100 px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">
          Booking schedule
        </p>
        <h2 className="mt-2 text-xl font-bold text-slate-900">
          Drop-off and collection windows
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Full windows stop accepting more bookings automatically, helping the
          facility enforce slot capacity throughout the day.
        </p>
        {displayDate ? (
          <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
            Showing bookings for {displayDate}
          </p>
        ) : null}
      </header>

      <section className="overflow-x-auto px-6 py-5">
        {slots.length > 0 ? (
          <table className="min-w-full border-separate border-spacing-y-3 text-left">
            <caption className="sr-only">
              Today&apos;s staff booking schedule with slot capacity status
            </caption>
            <thead>
              <tr className="text-xs uppercase tracking-[0.18em] text-slate-500">
                <th scope="col" className="pb-2 font-semibold">
                  Time
                </th>
                <th scope="col" className="pb-2 font-semibold">
                  Booking mix
                </th>
                <th scope="col" className="pb-2 font-semibold">
                  Capacity
                </th>
                <th scope="col" className="pb-2 font-semibold">
                  Slot queue
                </th>
                <th scope="col" className="pb-2 font-semibold">
                  Facility
                </th>
                <th scope="col" className="pb-2 font-semibold">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {slots.map((slot) => (
                <tr key={slot.id} className="overflow-hidden rounded-2xl bg-slate-50">
                  <th
                    scope="row"
                    className="rounded-l-2xl px-4 py-4 text-sm font-semibold text-slate-900"
                  >
                    {slot.time}
                  </th>
                  <td className="px-4 py-4 text-sm text-slate-700">
                    <p className="font-medium text-slate-900">
                      {slot.bookingSummary}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {slot.dropOffCount} drop-off bookings and{" "}
                      {slot.collectionCount} collection bookings
                    </p>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-700">
                    <label
                      className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500"
                      htmlFor={`meter-${slot.id}`}
                    >
                      {slot.booked} of {slot.capacity} booked
                    </label>
                    <meter
                      id={`meter-${slot.id}`}
                      className="mt-2 block h-3 w-full"
                      min="0"
                      max={slot.capacity}
                      value={slot.booked}
                    />
                    <p className="mt-2 text-xs text-slate-500">
                      {slot.availabilityLabel}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-700">
                    {slot.linkedTransactions?.length ? (
                      <ul className="space-y-3">
                        {slot.linkedTransactions.map((transaction) => (
                          <li
                            key={`${slot.id}-${transaction.bookingId || transaction.transactionId}`}
                            className="rounded-2xl border border-slate-200 bg-white px-3 py-3"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <strong className="text-sm font-semibold text-slate-900">
                                {transaction.transactionId || "No transaction yet"}
                              </strong>
                              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                                {transaction.bookingTypeLabel}
                              </span>
                            </div>
                            <p className="mt-2 font-medium text-slate-900">
                              {transaction.itemTitle}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              Seller: {transaction.seller}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              Buyer: {transaction.buyer}
                            </p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <>
                        <strong className="block font-semibold text-slate-900">
                          {slot.leadTransactionId || "No transaction yet"}
                        </strong>
                        <p className="mt-1">{slot.leadItemTitle}</p>
                      </>
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-700">
                    <p className="font-medium text-slate-900">
                      {slot.facilityName}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {slot.facilityLocation}
                    </p>
                  </td>
                  <td className="rounded-r-2xl px-4 py-4 text-sm text-slate-700">
                    <p
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[slot.status]}`}
                    >
                      {slot.status}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500">
            No facility slots are scheduled for the selected day yet.
          </p>
        )}
      </section>
    </article>
  );
}
