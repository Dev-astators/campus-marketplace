// client/src/components/listing/BuyButton.jsx
// Handles the full buy flow:
// 1. Calls the backend to create a transaction
// 2. Receives PayFast form fields
// 3. Auto-submits a hidden form to redirect the student to PayFast

import { useState, useRef } from "react";
import { supabase } from "../../config/supabaseClient";

const SERVER_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function BuyButton({ listing }) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const formRef               = useRef(null);

  // PayFast form fields stored in state so they render into the hidden form
  const [payfastData, setPayfastData] = useState(null);

  const handleBuy = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Get the current logged-in user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("You must be signed in to buy.");
        setLoading(false);
        return;
      }

      // 2. Get their profile id (not auth user id)
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", session.user.id)
        .single();

      if (!profile) {
        setError("Profile not found. Please sign in again.");
        setLoading(false);
        return;
      }

      // 3. Call the backend to create the transaction and get PayFast payload
      const response = await fetch(`${SERVER_URL}/api/payments/initiate`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id,
          buyerId:   profile.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to initiate payment.");
        setLoading(false);
        return;
      }

      // 4. Set the PayFast form fields — React will re-render the hidden form
      //    then we auto-submit it to redirect the student to PayFast
      setPayfastData(data.payfast);

      // Submit on next tick after React re-renders the form
      setTimeout(() => {
        if (formRef.current) formRef.current.submit();
      }, 100);

    } catch (err) {
      console.error("Buy error:", err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <section aria-label="Purchase action">
      {/* Hidden PayFast form — auto-submitted after initiation */}
      {payfastData && (
        <form
          ref={formRef}
          action={payfastData.url}
          method="POST"
          style={{ display: "none" }}
          aria-hidden="true"
        >
          {Object.entries(payfastData.fields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
        </form>
      )}

      {/* Error message */}
      {error && (
        <output
          role="alert"
          className="block text-sm text-red-600 mb-3"
        >
          {error}
        </output>
      )}

      {/* Buy button */}
      <button
        type="button"
        onClick={handleBuy}
        disabled={loading || listing.status !== "active"}
        className="w-full bg-[#1C3FAA] hover:bg-[#1535a0] active:scale-[.98] text-white font-semibold text-sm rounded-xl py-3 px-6 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {loading
          ? "Preparing payment…"
          : listing.status !== "active"
          ? "No longer available"
          : `Buy Now — R${Number(listing.price).toFixed(2)}`}
      </button>

      <p className="text-xs text-slate-400 text-center mt-2">
        Secured by PayFast · No card details stored
      </p>
    </section>
  );
}