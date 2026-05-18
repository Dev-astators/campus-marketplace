// client/src/pages/PaymentPage.jsx
import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/apiBaseUrl";

const IS_SANDBOX = import.meta.env.VITE_PAYFAST_SANDBOX === "true";

export default function PaymentPage({ result }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const transactionId = searchParams.get("transaction_id");
  const confirmedRef = useRef(false);

  const [status, setStatus] = useState(
    result === "cancel" || !transactionId ? "cancelled" : "checking",
  );
  const [error, setError] = useState(null);

  // ── Main effect: confirm payment ─────────────────────────────────────────
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
            `${API_BASE_URL}/api/payments/confirm-dev`,
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
        } else {
          // Production: poll until PayFast ITN webhook has updated the DB
          let attempts = 0;
          const MAX_ATTEMPTS = 15;

          const poll = async () => {
            const res = await fetch(
              `${API_BASE_URL}/api/payments/status/${transactionId}`,
            );
            const data = await res.json();

            if (data.status === "confirmed" || data.status === "complete") {
              setStatus("confirmed");
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
  }, [transactionId, result]);

  return (
    <main className="min-h-screen bg-[#F4F6FB] flex items-center justify-center px-4 py-12 font-['inter',sans-serif]">
      <article className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-[0_4px_24px_rgba(28,63,170,0.07)] p-8">
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

        {status === "confirmed" && (
          <section className="text-center">
            <p className="text-4xl mb-4" role="img" aria-label="Success">
              ✅
            </p>
            <h1 className="text-xl font-bold text-[#0D1B4B] mb-2">
              Payment confirmed
            </h1>
            <p className="text-sm text-slate-500 mb-6">
              The seller will book a drop-off slot next. We'll notify you when
              it's ready so you can choose your collection time.
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

        {status === "failed" && (
          <section className="text-center">
            <p className="text-4xl mb-4" role="img" aria-label="Failed">
              ⚠️
            </p>
            <h1 className="text-xl font-bold text-[#0D1B4B] mb-2">
              Payment issue
            </h1>
            <p className="text-sm text-slate-500 mb-6">
              {error || "We couldn't confirm your payment yet."}
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
      </article>
    </main>
  );
}
