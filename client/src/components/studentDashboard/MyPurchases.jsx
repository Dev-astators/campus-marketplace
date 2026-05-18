// client/src/components/studentDashboard/MyPurchases.jsx
// Shows a buyer's transaction history with status and collection slot details.

import { useEffect, useState, useCallback } from "react";
import { API_BASE_URL } from "../../config/apiBaseUrl";
import { supabase } from "../../config/supabaseClient";

const STATUS_STYLES = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  complete: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const BOOKING_STATUS = {
  pending: "⏳ Awaiting staff",
  confirmed: "✅ Confirmed",
  complete: "🎉 Collected",
};

export default function MyPurchases({ profileId }) {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const [score, setScore] = useState(5);
  const [reviewText, setReviewText] = useState("");

  const [submittingRating, setSubmittingRating] = useState(false);

  const [bookingTx, setBookingTx] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  const fetchPurchases = useCallback(async () => {
    if (!profileId) return;

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/payments/my-purchases/${profileId}`,
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setPurchases(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    if (!profileId) return;

    const loadPurchases = async () => {
      setLoading(true);
      await fetchPurchases();
    };

    loadPurchases();

    // auto refresh every 5 seconds
    const interval = setInterval(fetchPurchases, 5000);

    return () => clearInterval(interval);
  }, [profileId, fetchPurchases]);

  // ─────────────────────────────
  // OPEN RATING MODAL
  const openRatingModal = (tx) => {
    setSelectedTransaction(tx);
    setScore(5);
    setReviewText("");
    setRatingModalOpen(true);
  };

  // ─────────────────────────────
  // SUBMIT RATING
  const submitRating = async () => {
    if (!selectedTransaction) return;

    try {
      setSubmittingRating(true);

      const revieweeId =
        selectedTransaction?.seller_id || selectedTransaction?.seller?.id;

      if (!revieweeId) {
        alert("Seller ID not found");
        return;
      }

      // STEP 1: check existing rating
      const { data: existing, error: fetchError } = await supabase
        .from("ratings")
        .select("*")
        .eq("transaction_id", selectedTransaction.id)
        .eq("reviewer_id", profileId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      // STEP 2: update OR insert
      if (existing) {
        const { error: updateError } = await supabase
          .from("ratings")
          .update({
            score,
            review_text: reviewText,
          })
          .eq("id", existing.id);

        if (updateError) throw updateError;

        alert("Rating updated successfully!");
      } else {
        const { error: insertError } = await supabase.from("ratings").insert({
          transaction_id: selectedTransaction.id,
          reviewer_id: profileId,
          reviewee_id: revieweeId,
          score,
          review_text: reviewText,
        });

        if (insertError) throw insertError;

        alert("Rating submitted successfully!");
      }

      // ─────────────────────────────────────────────
      // STEP 3: RECALCULATE PROFILE RATING (NEW LOGIC)
      const { data: allRatings, error: ratingsError } = await supabase
        .from("ratings")
        .select("score")
        .eq("reviewee_id", revieweeId);

      if (ratingsError) throw ratingsError;

      const totalRatings = allRatings?.length || 0;

      const averageRating =
        totalRatings > 0
          ? allRatings.reduce((sum, r) => sum + r.score, 0) / totalRatings
          : 0;

      const { error: profileUpdateError } = await supabase
        .from("profiles")
        .update({
          average_rating: averageRating,
          total_ratings: totalRatings,
        })
        .eq("id", revieweeId);

      if (profileUpdateError) throw profileUpdateError;

      setRatingModalOpen(false);
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to submit rating");
    } finally {
      setSubmittingRating(false);
    }
  };

  const openCollectionBooking = async (tx) => {
    setBookingTx(tx);
    setSelectedSlot(null);
    setSlots([]);
    setBookingError(null);
    setLoadingSlots(true);

    const dropoff = tx.facility_bookings?.find(
      (b) => b.booking_type === "drop_off",
    );
    const dropoffSlot = dropoff?.facility_slots;
    const facilityId = dropoffSlot?.facility_id;

    if (!dropoffSlot || !facilityId) {
      setBookingError("Seller has not booked a drop-off slot yet.");
      setLoadingSlots(false);
      return;
    }

    const dropoffDateTime = new Date(
      `${dropoffSlot.slot_date}T${dropoffSlot.slot_time}`,
    );

    if (Number.isNaN(dropoffDateTime.getTime())) {
      setBookingError("Drop-off slot time is invalid.");
      setLoadingSlots(false);
      return;
    }

    try {
      const afterParam = encodeURIComponent(dropoffDateTime.toISOString());
      const res = await fetch(
        `${API_BASE_URL}/api/payments/slots/${facilityId}?type=collection&after=${afterParam}`,
      );
      const data = await res.json();
      setSlots(Array.isArray(data) ? data : []);
    } catch {
      setBookingError("Could not load available collection slots.");
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBookCollection = async () => {
    if (!selectedSlot || !bookingTx) return;
    setBookingLoading(true);
    setBookingError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/payments/book-slot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: bookingTx.id,
          slotId: selectedSlot,
          studentId: profileId,
          bookingType: "collection",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setBookingError(data.error || "Booking failed.");
      } else {
        setBookingTx(null);
        await fetchPurchases();
      }
    } catch {
      setBookingError("Something went wrong. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  };

  const bookingDropoff = bookingTx?.facility_bookings?.find(
    (booking) => booking.booking_type === "drop_off",
  );
  const bookingDropoffSlot = bookingDropoff?.facility_slots;
  if (loading)
    return <p className="text-sm text-slate-400 py-4">Loading purchases…</p>;

  if (error) return <p className="text-sm text-red-500 py-4">Error: {error}</p>;

  if (purchases.length === 0)
    return (
      <p className="text-sm text-slate-400 py-4">
        You haven't bought anything yet.
      </p>
    );

  return (
    <>
      <section aria-label="My Purchases">
        <h2 className="text-lg font-bold text-[#0D1B4B] mb-4">My Purchases</h2>

        <ul className="flex flex-col gap-4 list-none p-0 m-0">
          {purchases.map((tx) => {
            const collection = tx.facility_bookings?.find(
              (b) => b.booking_type === "collection",
            );
            const dropoff = tx.facility_bookings?.find(
              (b) => b.booking_type === "drop_off",
            );

            const collectionSlot = collection?.facility_slots;
            const dropoffSlot = dropoff?.facility_slots;

            const isCollected = collection?.status === "complete";
            const canBookCollection = !collection && dropoffSlot;

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
                    className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${
                      STATUS_STYLES[tx.status] || "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {tx.status}
                  </mark>
                </header>

                <dl className="text-sm text-slate-600 grid grid-cols-2 gap-x-4 gap-y-1">
                  <dt className="font-medium text-slate-400">
                    Amount paid online
                  </dt>

                  <dd>R{Number(tx.online_amount).toFixed(2)}</dd>

                  {Number(tx.cash_shortfall) > 0 && (
                    <>
                      <dt className="font-medium text-slate-400">
                        Cash to pay at facility
                      </dt>

                      <dd className="text-amber-600 font-semibold">
                        R{Number(tx.cash_shortfall).toFixed(2)}
                      </dd>

                      <dt className="font-medium text-slate-400">
                        Cash settled
                      </dt>

                      <dd>
                        {tx.cash_settled ? "✅ Yes" : "⏳ Pending at facility"}
                      </dd>
                    </>
                  )}

                  <dt className="font-medium text-slate-400">Seller</dt>

                  <dd>{tx.seller?.full_name || "—"}</dd>

                  <dt className="font-medium text-slate-400">
                    Seller drop-off
                  </dt>

                  <dd>
                    {dropoffSlot
                      ? `${new Date(
                          dropoffSlot.slot_date,
                        ).toDateString()} · ${dropoffSlot.slot_time?.slice(0, 5)}`
                      : "Not booked yet"}
                  </dd>

                  <dt className="font-medium text-slate-400">
                    Collection slot
                  </dt>

                  <dd>
                    {collectionSlot
                      ? `${new Date(
                          collectionSlot.slot_date,
                        ).toDateString()} · ${collectionSlot.slot_time?.slice(0, 5)}`
                      : "Not booked yet"}
                  </dd>

                  <dt className="font-medium text-slate-400">
                    Collection status
                  </dt>

                  <dd>
                    {collection ? BOOKING_STATUS[collection.status] : "—"}
                  </dd>
                </dl>

                {!collection ? (
                  <section className="mt-4">
                    {canBookCollection ? (
                      <>
                        <p className="text-xs text-slate-500 mb-2">
                          Drop-off booked for{" "}
                          {new Date(dropoffSlot.slot_date).toDateString()} ·{" "}
                          {dropoffSlot.slot_time?.slice(0, 5)}
                        </p>
                        <button
                          type="button"
                          onClick={() => openCollectionBooking(tx)}
                          className="w-full bg-[#1C3FAA] hover:bg-[#1535a0] text-white text-sm font-semibold rounded-xl py-2.5 transition-all cursor-pointer"
                        >
                          Book Collection Slot
                        </button>
                      </>
                    ) : (
                      <p className="text-xs font-semibold text-amber-600">
                        Waiting for seller to book a drop-off slot.
                      </p>
                    )}
                  </section>
                ) : null}

                {/* RATE PRODUCT BUTTON */}
                {isCollected && (
                  <section className="mt-5">
                    <button
                      type="button"
                      onClick={() => openRatingModal(tx)}
                      className="bg-[#0D1B4B] hover:bg-[#11205a] text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
                    >
                      Rate product
                    </button>
                  </section>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* RATING MODAL */}
      {ratingModalOpen && (
        <section className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <section className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h2 className="text-xl font-bold text-[#0D1B4B] mb-4">
              Rate Product
            </h2>

            <section className="mb-4">
              <label className="block text-sm font-semibold mb-2">Rating</label>

              <select
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-xl px-3 py-2"
              >
                <option value={5}>⭐⭐⭐⭐⭐ (5)</option>
                <option value={4}>⭐⭐⭐⭐ (4)</option>
                <option value={3}>⭐⭐⭐ (3)</option>
                <option value={2}>⭐⭐ (2)</option>
                <option value={1}>⭐ (1)</option>
              </select>
            </section>

            <section className="mb-5">
              <label className="block text-sm font-semibold mb-2">Review</label>

              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={4}
                placeholder="Write your review..."
                className="w-full border border-slate-300 rounded-xl px-3 py-2 resize-none"
              />
            </section>

            <section className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRatingModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={submitRating}
                disabled={submittingRating}
                className="bg-[#0D1B4B] hover:bg-[#11205a] text-white px-4 py-2 rounded-xl font-semibold"
              >
                {submittingRating ? "Submitting..." : "Submit Rating"}
              </button>
            </section>
          </section>
        </section>
      )}

      {bookingTx && (
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Book collection slot"
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
        >
          <section className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <header className="mb-4">
              <h2 className="text-lg font-bold text-[#0D1B4B]">
                Book Collection Slot
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Choose a collection slot after the seller's drop-off.
              </p>
              {bookingDropoffSlot ? (
                <p className="text-xs text-slate-400 mt-2">
                  Drop-off:{" "}
                  {new Date(bookingDropoffSlot.slot_date).toDateString()} ·{" "}
                  {bookingDropoffSlot.slot_time?.slice(0, 5)}
                </p>
              ) : null}
            </header>

            {bookingError && (
              <output role="alert" className="block text-sm text-red-600 mb-3">
                {bookingError}
              </output>
            )}

            {loadingSlots ? (
              <p className="text-sm text-slate-400 text-center py-4">
                Loading slots…
              </p>
            ) : (
              <fieldset className="border-0 p-0 m-0">
                <legend className="text-sm font-semibold text-[#0D1B4B] mb-2">
                  Available Slots
                </legend>
                <ul className="flex flex-col gap-2 list-none p-0 m-0 max-h-52 overflow-y-auto">
                  {slots.length === 0 && (
                    <li className="text-sm text-slate-400 text-center py-4">
                      No slots available after the drop-off time.
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
                          name="collection-slot"
                          value={slot.id}
                          checked={selectedSlot === slot.id}
                          onChange={() => setSelectedSlot(slot.id)}
                          className="sr-only"
                        />
                        <span className="text-sm font-medium text-[#0D1B4B]">
                          {new Date(slot.slot_date).toDateString()} ·{" "}
                          {slot.slot_time?.slice(0, 5)}
                        </span>
                        <span className="text-xs text-slate-400">
                          {slot.capacity - slot.booked_count} left
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </fieldset>
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
                onClick={handleBookCollection}
                disabled={!selectedSlot || bookingLoading}
                className="flex-1 bg-[#1C3FAA] text-white text-sm font-semibold rounded-xl py-2.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {bookingLoading ? "Booking…" : "Confirm Collection"}
              </button>
            </footer>
          </section>
        </aside>
      )}
    </>
  );
}
