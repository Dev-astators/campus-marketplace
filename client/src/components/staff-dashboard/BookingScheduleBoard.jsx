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

export default function BookingScheduleBoard({
  slots,
  selectedDate = "",
  onDateChange,
}) {
  const displayDate = formatSelectedDate(selectedDate);

  return (
    <article className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-100 px-4 py-5 sm:px-6">
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
        <form className="mt-4 flex flex-col gap-2 sm:max-w-xs">
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
        </form>
        {displayDate ? (
          <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
            Showing bookings for {displayDate}
          </p>
        ) : null}
      </header>

      <section className="overflow-x-auto px-4 py-5 sm:px-6">
        {slots.length > 0 ? (
          <table className="min-w-[760px] border-separate border-spacing-y-3 text-left">
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
                <tr
                  key={slot.id}
                  className="overflow-hidden rounded-2xl bg-slate-50 align-top"
                >
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
                    <ul className="mt-3 space-y-3">
                      <li>
                        <header className="flex items-center justify-between text-xs font-medium text-slate-600">
                          <p>Drop-off</p>
                          <output>
                            {slot.dropOffCount}/{slot.capacity}
                          </output>
                        </header>
                        <meter
                          className="mt-1 h-2.5 w-full"
                          min="0"
                          max={slot.capacity}
                          value={slot.dropOffCount}
                          aria-label={`Drop-off capacity for ${slot.time}`}
                        >
                          {slot.dropOffCount} of {slot.capacity}
                        </meter>
                      </li>
                      <li>
                        <header className="flex items-center justify-between text-xs font-medium text-slate-600">
                          <p>Collection</p>
                          <output>
                            {slot.collectionCount}/{slot.capacity}
                          </output>
                        </header>
                        <meter
                          className="mt-1 h-2.5 w-full"
                          min="0"
                          max={slot.capacity}
                          value={slot.collectionCount}
                          aria-label={`Collection capacity for ${slot.time}`}
                        >
                          {slot.collectionCount} of {slot.capacity}
                        </meter>
                      </li>
                    </ul>
                    <p className="mt-3 text-xs text-slate-500">
                      {slot.availabilityLabel}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-700">
                    {slot.linkedTransactions?.length ? (
                      <ul className="space-y-2">
                        {slot.linkedTransactions.map((transaction) => (
                          <li
                            key={`${slot.id}-${transaction.id}`}
                            className="rounded-xl bg-blue-50 px-2 py-1.5"
                          >
                            <p className="text-center text-sm font-semibold break-words text-slate-900">
                              {transaction.itemTitle}
                            </p>
                            <p className="mt-1 text-center text-xs break-words text-slate-600">
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
