// src/components/studentDashboard/MySales.jsx
// Seller sees all their completed sales and can book a drop-off slot.
import { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config/apiBaseUrl";

const STATUS_STYLES = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  complete: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function MySales({ profileId }) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Drop-off booking modal state
  const [bookingTx, setBookingTx] = useState(null); // transaction being booked
  const [facilities, setFacilities] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState("");
  const [loadingFacilities, setLoadingFacilities] = useState(false);
  const [facilityLock, setFacilityLock] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  const fetchSales = async () => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/payments/my-sales/${profileId}`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSales(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!profileId) return;

    let cancelled = false;

    const loadSales = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/payments/my-sales/${profileId}`,
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        if (!cancelled) setSales(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadSales();

    return () => {
      cancelled = true;
    };
  }, [profileId]);

  const loadSlots = async (facilityId) => {
    if (!facilityId) return;
    setLoadingSlots(true);
    setSlots([]);
    setSelectedSlot(null);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/payments/slots/${facilityId}?type=drop_off`,
      );
      const data = await res.json();
      setSlots(Array.isArray(data) ? data : []);
    } catch {
      setBookingError("Could not load available slots.");
    } finally {
      setLoadingSlots(false);
    }
  };

  // Opens the drop-off booking modal for a given transaction.
  const openDropoffBooking = async (tx) => {
    setBookingTx(tx);
    setSelectedSlot(null);
    setBookingError(null);
    setSlots([]);
    setFacilities([]);
    setSelectedFacility("");
    setFacilityLock(null);
    setLoadingFacilities(true);

    const collectionBooking = tx.facility_bookings?.find(
      (b) => b.booking_type === "collection",
    );
    const lockedFacilityId = collectionBooking?.facility_slots?.facility_id;

    if (lockedFacilityId) {
      setFacilityLock({
        id: lockedFacilityId,
        name: collectionBooking?.facility_slots?.trade_facilities?.name,
        location: collectionBooking?.facility_slots?.trade_facilities?.location,
      });
      setSelectedFacility(lockedFacilityId);
      await loadSlots(lockedFacilityId);
      setLoadingFacilities(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/payments/facilities`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setFacilities(list);

      if (list.length === 1) {
        setSelectedFacility(list[0].id);
        await loadSlots(list[0].id);
      }
    } catch {
      setBookingError("Could not load trade facilities.");
    } finally {
      setLoadingFacilities(false);
    }
  };

  const handleFacilityChange = async (event) => {
    const facilityId = event.target.value;
    setSelectedFacility(facilityId);
    setBookingError(null);
    if (facilityId) {
      await loadSlots(facilityId);
    } else {
      setSlots([]);
      setSelectedSlot(null);
    }
  };

  const handleBookDropoff = async () => {
    if (!selectedSlot || !bookingTx) return;
    setBookingLoading(true);
    setBookingError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/payments/book-dropoff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: bookingTx.id,
          slotId: selectedSlot,
          sellerId: profileId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setBookingError(data.error || "Booking failed.");
      } else {
        setBookingTx(null); // close modal
        fetchSales(); // refresh list to show drop-off booked
      }
    } catch {
      setBookingError("Something went wrong. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading)
    return <p className="text-sm text-slate-400 py-4">Loading sales…</p>;
  if (error) return <p className="text-sm text-red-500 py-4">Error: {error}</p>;
  if (sales.length === 0)
    return (
      <p className="text-sm text-slate-400 py-4">
        You haven't sold anything yet.
      </p>
    );

  return (
    <section aria-label="My Sales">
      <h2 className="text-lg font-bold text-[#0D1B4B] mb-4">My Sales</h2>

      <ul className="flex flex-col gap-4 list-none p-0 m-0">
        {sales.map((tx) => {
          const collection = tx.facility_bookings?.find(
            (b) => b.booking_type === "collection",
          );
          const dropoff = tx.facility_bookings?.find(
            (b) => b.booking_type === "drop_off",
          );
          const collSlot = collection?.facility_slots;
          const dropSlot = dropoff?.facility_slots;
          const facility =
            dropSlot?.trade_facilities || collSlot?.trade_facilities;

          return (
            <li
              key={tx.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
            >
              <header className="flex items-start justify-between gap-3 mb-3">
                <h3 className="font-semibold text-[#0D1B4B] text-sm">
                  {tx.listings?.title || "Unknown item"}
                </h3>
                <mark
                  className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${STATUS_STYLES[tx.status] || "bg-slate-100 text-slate-600"}`}
                >
                  {tx.status}
                </mark>
              </header>

              <dl className="text-sm text-slate-600 grid grid-cols-2 gap-x-4 gap-y-1 mb-4">
                <dt className="font-medium text-slate-400">Amount received</dt>
                <dd>R{Number(tx.online_amount).toFixed(2)}</dd>

                <dt className="font-medium text-slate-400">Buyer</dt>
                <dd>{tx.buyer?.full_name || "—"}</dd>

                <dt className="font-medium text-slate-400">Facility</dt>
                <dd>{facility?.name || "—"}</dd>

                <dt className="font-medium text-slate-400">Buyer collects</dt>
                <dd>
                  {collSlot
                    ? `${new Date(collSlot.slot_date).toDateString()} · ${collSlot.slot_time?.slice(0, 5)}`
                    : "Not yet booked"}
                </dd>

                <dt className="font-medium text-slate-400">Your drop-off</dt>
                <dd>
                  {dropSlot ? (
                    `${new Date(dropSlot.slot_date).toDateString()} · ${dropSlot.slot_time?.slice(0, 5)}`
                  ) : (
                    <strong className="text-orange-500 font-medium">
                      Not booked yet
                    </strong>
                  )}
                </dd>
              </dl>

              {/* Show Book Drop-off button only if not yet booked and tx is confirmed */}
              {!dropoff && tx.status === "confirmed" && (
                <button
                  type="button"
                  onClick={() => openDropoffBooking(tx)}
                  className="w-full bg-[#1C3FAA] hover:bg-[#1535a0] text-white text-sm font-semibold rounded-xl py-2.5 transition-all cursor-pointer"
                >
                  Book Drop-off Slot
                </button>
              )}

              {dropoff && (
                <p className="text-xs text-green-600 font-semibold text-center">
                  ✅ Drop-off booked — bring the item to the facility at your
                  slot time
                </p>
              )}
            </li>
          );
        })}
      </ul>

      {/* ── Drop-off booking modal ── */}
      {bookingTx && (
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Book drop-off slot"
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
        >
          <article className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <header className="mb-4">
              <h2 className="text-lg font-bold text-[#0D1B4B]">
                Book Drop-off Slot
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Choose a slot to drop off{" "}
                <strong>{bookingTx.listings?.title}</strong>. It must be at
                least 1 hour from now and before the buyer's collection time.
              </p>
            </header>

            {loadingFacilities ? (
              <p className="text-sm text-slate-400 text-center py-2">
                Loading facilities…
              </p>
            ) : facilityLock ? (
              <section className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold text-slate-500">
                  Facility locked to buyer collection
                </p>
                <p className="text-sm font-semibold text-slate-700">
                  {facilityLock.name || "Selected facility"}
                </p>
                {facilityLock.location ? (
                  <p className="text-xs text-slate-400">
                    {facilityLock.location}
                  </p>
                ) : null}
              </section>
            ) : (
              <section className="mb-4">
                <label
                  htmlFor="dropoff-facility"
                  className="block text-sm font-semibold text-[#0D1B4B] mb-2"
                >
                  Choose a facility
                </label>
                <select
                  id="dropoff-facility"
                  value={selectedFacility}
                  onChange={handleFacilityChange}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="">Select a facility</option>
                  {facilities.map((facility) => (
                    <option key={facility.id} value={facility.id}>
                      {facility.name} · {facility.location}
                    </option>
                  ))}
                </select>
              </section>
            )}

            {bookingError && (
              <output role="alert" className="block text-sm text-red-600 mb-3">
                {bookingError}
              </output>
            )}

            {loadingSlots ? (
              <p className="text-sm text-slate-400 text-center py-4">
                Loading slots…
              </p>
            ) : selectedFacility || facilityLock ? (
              <fieldset className="border-0 p-0 m-0">
                <legend className="text-sm font-semibold text-[#0D1B4B] mb-2">
                  Available Slots
                </legend>
                <ul className="flex flex-col gap-2 list-none p-0 m-0 max-h-52 overflow-y-auto">
                  {slots.length === 0 && (
                    <li className="text-sm text-slate-400 text-center py-4">
                      No slots available.
                    </li>
                  )}
                  {slots.map((slot) => (
                    <li key={slot.id}>
                      <label
                        className={`flex items-center justify-between px-4 py-3 rounded-xl border-[1.5px] cursor-pointer transition-colors
                        ${selectedSlot === slot.id ? "border-[#1C3FAA] bg-blue-50" : "border-slate-200 hover:border-slate-300"}`}
                      >
                        <input
                          type="radio"
                          name="dropoff-slot"
                          value={slot.id}
                          checked={selectedSlot === slot.id}
                          onChange={() => setSelectedSlot(slot.id)}
                          className="sr-only"
                        />
                        <strong className="text-sm font-medium text-[#0D1B4B]">
                          {new Date(slot.slot_date).toDateString()} ·{" "}
                          {slot.slot_time?.slice(0, 5)}
                        </strong>
                        <small className="text-xs text-slate-400">
                          {slot.capacity - slot.booked_count} left
                        </small>
                      </label>
                    </li>
                  ))}
                </ul>
              </fieldset>
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">
                Select a facility to see available slots.
              </p>
            )}

            <footer className="flex gap-3 mt-5">
              <button
                type="button"
                onClick={() => setBookingTx(null)}
                className="flex-1 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl py-2.5 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBookDropoff}
                disabled={!selectedSlot || bookingLoading}
                className="flex-1 bg-[#1C3FAA] text-white text-sm font-semibold rounded-xl py-2.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {bookingLoading ? "Booking…" : "Confirm Drop-off"}
              </button>
            </footer>
          </article>
        </aside>
      )}
    </section>
  );
}
