// client/src/pages/PaymentPage.jsx
import { useCallback, useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "../config/supabaseClient";


const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
// Drives whether to call confirm-dev (sandbox) or poll for ITN (production)
const IS_SANDBOX = import.meta.env.VITE_PAYFAST_SANDBOX === "true";

export default function PaymentPage({ result }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const transactionId = searchParams.get("transaction_id");
  const confirmedRef = useRef(false);

  const [status, setStatus] = useState(
    result === "cancel" || !transactionId ? "cancelled" : "checking",
  );
  const [facilities, setFacilities] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState(null);
  const [loadingFacilities, setLoadingFacilities] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingBooking, setLoadingBooking] = useState(false);

  // ── Fetch slots for a given facility ────────────────────────────────────
  const fetchSlots = useCallback(async (facilityId) => {
    setLoadingSlots(true);
    setSlots([]);
    setSelectedSlot(null);
    try {
      const res = await fetch(
        `${API_URL}/api/payments/slots/${facilityId}?type=collection`,
      );
      const data = await res.json();
      setSlots(Array.isArray(data) ? data : []);
    } catch {
      setError("Could not load available slots.");
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  // ── Fetch active trade facilities from DB ────────────────────────────────
  const fetchFacilities = useCallback(async () => {
    setLoadingFacilities(true);
    try {
      const res = await fetch(`${API_URL}/api/payments/facilities`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setFacilities(list);
      // Auto-select if there's only one facility
      if (list.length === 1) {
        setSelectedFacility(list[0].id);
        fetchSlots(list[0].id);
      }
    } catch {
      setError("Could not load trade facilities.");
    } finally {
      setLoadingFacilities(false);
    }
  }, [fetchSlots]);

  const handleFacilityChange = useCallback(
    (facilityId) => {
      setSelectedFacility(facilityId);
      fetchSlots(facilityId);
    },
    [fetchSlots],
  );

  // ── Main effect: confirm then show slots ─────────────────────────────────
  useEffect(() => {
    if (result === "cancel" || !transactionId) return;
    if (confirmedRef.current) return;
    confirmedRef.current = true;

    const run = async () => {
      try {
        if (IS_SANDBOX) {
          // Sandbox: auto-call confirm-dev so DB is updated immediately.
          // In production this is handled by the PayFast ITN webhook instead.
          const confirmRes = await fetch(
            `${API_URL}/api/payments/confirm-dev`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ transactionId }),
            },
          );

          if (!confirmRes.ok) {
            const err = await confirmRes.json().catch(() => ({}));
            throw new Error(err.error || "Failed to confirm payment.");
          }

          setStatus("confirmed");
          fetchFacilities();
        } else {
          // Production: poll until PayFast ITN webhook has updated the DB
          let attempts = 0;
          const MAX_ATTEMPTS = 15;

          const poll = async () => {
            const res = await fetch(
              `${API_URL}/api/payments/status/${transactionId}`,
            );
            const data = await res.json();

            if (data.status === "confirmed" || data.status === "complete") {
              setStatus("confirmed");
              fetchFacilities();
            } else if (attempts < MAX_ATTEMPTS) {
              attempts++;
              setTimeout(poll, 2000);
            } else {
              setStatus("pending");
            }
          };

          poll();
        }
      } catch (err) {
        console.error("Payment confirmation error:", err);
        setError(err.message);
        setStatus("failed");
      }
    };

    run();
  }, [transactionId, result, fetchFacilities]);

  // ── Book selected slot ───────────────────────────────────────────────────
  const handleBookSlot = async () => {
    if (!selectedSlot) return;
    setLoadingBooking(true);
    setError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("Your session expired. Please sign in again.");
        setLoadingBooking(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("auth_user_id", session.user.id)
        .single();

      console.log("Session user id:", session.user.id);
      console.log("Profile result:", profile);
      console.log("Profile error:", profileError);

      if (profileError || !profile) {
        setError(
          `Profile error: ${profileError?.message || "No profile found for user " + session.user.id}`,
        );
        setLoadingBooking(false);
        return;
      }

      const res = await fetch(`${API_URL}/api/payments/book-slot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId,
          slotId: selectedSlot,
          studentId: profile.id,
          bookingType: "collection",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Show the actual server error so it's easier to debug
        setError(data.error || `Server error ${res.status}`);
      } else {
        setBooking(data.bookingId);
      }
    } catch (err) {
      // Show the actual JS error instead of a generic message
      console.error("Book slot error:", err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoadingBooking(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F4F6FB] flex items-center justify-center px-4 py-12 font-['inter',sans-serif]">
      <article className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-[0_4px_24px_rgba(28,63,170,0.07)] p-8">
        {/* ── Cancelled ── */}
        {status === "cancelled" && (
          <section className="text-center">
            <p className="text-4xl mb-4" role="img" aria-label="Cancelled">
              ❌
            </p>
            <h1 className="text-xl font-bold text-[#0D1B4B] mb-2">
              Payment Cancelled
            </h1>
            <p className="text-sm text-slate-500 mb-6">
              No charge was made. You can try again from the listing.
            </p>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-full bg-[#1C3FAA] text-white rounded-xl py-3 text-sm font-semibold cursor-pointer"
            >
              Back to Listing
            </button>
          </section>
        )}

        {/* ── Checking ── */}
        {status === "checking" && (
          <section className="text-center">
            <p className="text-4xl mb-4" role="img" aria-label="Loading">
              ⏳
            </p>
            <h1 className="text-xl font-bold text-[#0D1B4B] mb-2">
              Confirming your payment…
            </h1>
            <p className="text-sm text-slate-500">
              Please wait while we verify your payment.
            </p>
          </section>
        )}

        {/* ── Pending (production ITN delay) ── */}
        {status === "pending" && (
          <section className="text-center">
            <p className="text-4xl mb-4" role="img" aria-label="Pending">
              ⏳
            </p>
            <h1 className="text-xl font-bold text-[#0D1B4B] mb-2">
              Almost there…
            </h1>
            <p className="text-sm text-slate-500 mb-6">
              Your payment was received but is still being confirmed. Please
              check your dashboard shortly.
            </p>
            <button
              type="button"
              onClick={() => navigate("/student-dashboard")}
              className="w-full bg-[#1C3FAA] text-white rounded-xl py-3 text-sm font-semibold cursor-pointer"
            >
              Go to Dashboard
            </button>
          </section>
        )}

        {/* ── Failed ── */}
        {status === "failed" && (
          <section className="text-center">
            <p className="text-4xl mb-4" role="img" aria-label="Failed">
              ⚠️
            </p>
            <h1 className="text-xl font-bold text-red-600 mb-2">
              Payment Failed
            </h1>
            <p className="text-sm text-slate-500 mb-2">
              Something went wrong. Please try again or contact support.
            </p>
            {error && <p className="text-xs text-red-400 mb-6">{error}</p>}
            <button
              type="button"
              onClick={() => navigate("/student-dashboard")}
              className="w-full bg-[#1C3FAA] text-white rounded-xl py-3 text-sm font-semibold cursor-pointer"
            >
              Go to Dashboard
            </button>
          </section>
        )}

        {/* ── Confirmed — facility + slot booking ── */}
        {status === "confirmed" && !booking && (
          <section>
            <header className="text-center mb-6">
              <p className="text-4xl mb-3" role="img" aria-label="Success">
                ✅
              </p>
              <h1 className="text-xl font-bold text-[#0D1B4B]">
                Payment Confirmed!
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Book a collection slot at a campus trade facility.
              </p>
            </header>

            {error && (
              <output
                role="alert"
                className="block text-sm text-red-600 mb-4 text-center"
              >
                {error}
              </output>
            )}

            {/* ── Facility selector ── */}
            {loadingFacilities ? (
              <p className="text-sm text-slate-400 text-center mb-4">
                Loading facilities…
              </p>
            ) : (
              facilities.length > 1 && (
                <fieldset className="border-0 p-0 m-0 mb-5">
                  <legend className="text-sm font-semibold text-[#0D1B4B] mb-2">
                    Select a Trade Facility
                  </legend>
                  <ul className="flex flex-col gap-2 list-none p-0 m-0">
                    {facilities.map((facility) => (
                      <li key={facility.id}>
                        <label
                          className={`flex flex-col px-4 py-3 rounded-xl border-[1.5px] cursor-pointer transition-colors
                        ${
                          selectedFacility === facility.id
                            ? "border-[#1C3FAA] bg-blue-50"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                        >
                          <input
                            type="radio"
                            name="facility"
                            value={facility.id}
                            checked={selectedFacility === facility.id}
                            onChange={() => handleFacilityChange(facility.id)}
                            className="sr-only"
                          />
                          <span className="text-sm font-semibold text-[#0D1B4B]">
                            {facility.name}
                          </span>
                          <span className="text-xs text-slate-400">
                            {facility.location}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </fieldset>
              )
            )}

            {/* ── Slot selector — only shown once a facility is selected ── */}
            {selectedFacility &&
              (loadingSlots ? (
                <p className="text-sm text-slate-400 text-center">
                  Loading available slots…
                </p>
              ) : (
                <fieldset className="border-0 p-0 m-0">
                  <legend className="text-sm font-semibold text-[#0D1B4B] mb-3">
                    Available Collection Slots
                  </legend>
                  <ul className="flex flex-col gap-2 list-none p-0 m-0 max-h-56 overflow-y-auto">
                    {slots.length === 0 && (
                      <li className="text-sm text-slate-400 text-center py-4">
                        No slots available at this facility. Try another.
                      </li>
                    )}
                    {slots.map((slot) => (
                      <li key={slot.id}>
                        <label
                          className={`flex items-center justify-between px-4 py-3 rounded-xl border-[1.5px] cursor-pointer transition-colors
                          ${
                            selectedSlot === slot.id
                              ? "border-[#1C3FAA] bg-blue-50"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name="slot"
                            value={slot.id}
                            checked={selectedSlot === slot.id}
                            onChange={() => setSelectedSlot(slot.id)}
                            className="sr-only"
                          />
                          <span className="text-sm font-medium text-[#0D1B4B]">
                            {new Date(slot.slot_date).toDateString()} ·{" "}
                            {slot.slot_time.slice(0, 5)}
                          </span>
                          <span className="text-xs text-slate-400">
                            {slot.capacity - slot.booked_count} left
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </fieldset>
              ))}

            <button
              type="button"
              onClick={handleBookSlot}
              disabled={!selectedSlot || loadingBooking}
              className="w-full mt-5 bg-[#1C3FAA] hover:bg-[#1535a0] text-white font-semibold text-sm rounded-xl py-3 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loadingBooking ? "Booking…" : "Confirm Collection Slot"}
            </button>
          </section>
        )}

        {/* ── Booked ── */}
        {booking && (
          <section className="text-center">
            <p className="text-4xl mb-4" role="img" aria-label="Booked">
              🎉
            </p>
            <h1 className="text-xl font-bold text-[#0D1B4B] mb-2">
              You're all set!
            </h1>
            <p className="text-sm text-slate-500 mb-2">
              Your collection slot is booked. Head to the campus trade facility
              at your chosen time.
            </p>
            <p className="text-xs text-slate-400 mb-6">Booking ID: {booking}</p>
            <button
              type="button"
              onClick={() => navigate("/student-dashboard")}
              className="w-full bg-[#1C3FAA] text-white rounded-xl py-3 text-sm font-semibold cursor-pointer"
            >
              Back to Dashboard
            </button>
          </section>
        )}
      </article>
    </main>
  );
}
