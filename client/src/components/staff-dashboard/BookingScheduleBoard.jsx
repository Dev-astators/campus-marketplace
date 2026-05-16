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

const formatBookingType = (bookingType) =>
  bookingType === "dropoff" ? "Drop-off" : "Collection";

const getBarWidth = (count, capacity) => {
  if (!capacity || capacity <= 0) {
    return "0%";
  }

  return `${Math.min((count / capacity) * 100, 100)}%`;
};

export default function BookingScheduleBoard({
  slots,
  selectedDate = "",
  onDateChange,
}) {
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
        <div className="mt-4 flex flex-col gap-2 sm:max-w-xs">
          <label
            htmlFor="booking-date-filter"
            className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
          >
            Filter by date
          </label>
          <input
            id="booking-date-filter"
            type="date"
            value={selectedDate}
            onChange={(event) => onDateChange?.(event.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
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
                  Transactions
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
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {slot.booked} active of {slot.capacity} capacity
                    </p>
                    <div className="mt-3 space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                          <span>Drop-off</span>
                          <span>
                            {slot.dropOffCount}/{slot.capacity}
                          </span>
                        </div>
                        <div className="mt-1 h-2.5 overflow-hidden rounded-2 bg-slate-200">
                          <div
                            className="h-full rounded-1 bg-green-500"
                            style={{
                              width: getBarWidth(slot.dropOffCount, slot.capacity),
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                          <span>Collection</span>
                          <span>
                            {slot.collectionCount}/{slot.capacity}
                          </span>
                        </div>
                        <div className="mt-1 h-2.5 overflow-hidden rounded- bg-slate-200">
                          <div
                            className="h-full rounded-1 bg-blue-500"
                            style={{
                              width: getBarWidth(
                                slot.collectionCount,
                                slot.capacity,
                              ),
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-slate-500">
                      {slot.availabilityLabel}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-700">
                    {slot.linkedTransactions?.length ? (
                      <ul className="space-y-2">
                        {slot.linkedTransactions.map((transaction) => (
                          <li key={`${slot.id}-${transaction.id}`} className="bg-blue-50 flex-wrap">

                            <p className="mt-1 p-1  text-center text-wrap"><strong>{transaction.itemTitle}</strong></p>
                            <p className="mt-1 p-1 text-xs text-center text-wrap">
                              {formatBookingType(transaction.bookingType)}
                            </p>
                            
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="font-medium text-slate-500">
                        No transactions yet
                      </p>
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
