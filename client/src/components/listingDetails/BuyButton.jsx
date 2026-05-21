// client/src/components/listing/BuyButton.jsx
import { useState, useRef } from "react";
import { supabase } from "../../config/supabaseClient";
import { API_BASE_URL } from "../../config/apiBaseUrl";

export default function BuyButton({ listing }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [payfastData, setPayfastData] = useState(null);
  const [_CASH_SHORTFALL, set_CASH_SHORTFALL] = useState(0);

  // Cash shortfall toggle
  const [usePartial, setUsePartial] = useState(false);
  const [onlineAmount, setOnlineAmount] = useState("");

  const formRef = useRef(null);

  const totalPrice = Number(listing.price);
  const parsedOnline = parseFloat(onlineAmount);
  const shortfall =
    usePartial && !isNaN(parsedOnline)
      ? Math.max(0, totalPrice - parsedOnline)
      : 0;

  const handleBuy = async () => {
    setLoading(true);
    setError(null);

    // Validate partial amount
    if (usePartial) {
      if (isNaN(parsedOnline) || parsedOnline < 1) {
        setError("Online amount must be at least R1.00.");
        setLoading(false);
        return;
      }
      if (parsedOnline > totalPrice) {
        setError(`Online amount cannot exceed R${totalPrice.toFixed(2)}.`);
        setLoading(false);
        return;
      }
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setError("You must be signed in to buy.");
        setLoading(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", session.user.id)
        .single();

      if (profileError || !profile) {
        setError("Profile not found. Please sign in again.");
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/payments/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id,
          buyerId: profile.id,
          onlineAmount: usePartial ? parsedOnline : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to initiate payment.");
        setLoading(false);
        return;
      }

      set_CASH_SHORTFALL(data.cashShortfall || 0);
      setPayfastData(data.payfast);
      setTimeout(() => {
        if (formRef.current) formRef.current.submit();
      }, 100);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <section aria-label="Purchase action" className="flex flex-col gap-3">
      {/* Hidden PayFast form */}
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

      {/* Cash shortfall toggle */}
      {listing.status === "active" && (
        <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-600">
          <input
            type="checkbox"
            checked={usePartial}
            onChange={(e) => {
              setUsePartial(e.target.checked);
              setOnlineAmount("");
              setError(null);
            }}
            className="rounded"
          />
          I can't pay the full amount online
        </label>
      )}

      {/* Partial amount input */}
      {usePartial && (
        <section className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col gap-2">
          <label
            htmlFor="online-amount"
            className="text-xs font-semibold text-amber-800"
          >
            How much can you pay online? (Total: R{totalPrice.toFixed(2)})
          </label>
          <section className="flex items-center gap-2">
            <strong className="text-sm font-bold text-slate-600">R</strong>
            <input
              id="online-amount"
              type="number"
              min="1"
              max={totalPrice}
              step="0.01"
              value={onlineAmount}
              onChange={(e) => setOnlineAmount(e.target.value)}
              placeholder={`e.g. ${(totalPrice / 2).toFixed(2)}`}
              className="flex-1 border border-amber-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </section>
          {onlineAmount &&
            !isNaN(parsedOnline) &&
            parsedOnline > 0 &&
            parsedOnline <= totalPrice && (
              <p className="text-xs text-amber-700">
                You'll pay <strong>R{parsedOnline.toFixed(2)}</strong> online
                now and
                <strong> R{shortfall.toFixed(2)}</strong> in cash at the
                facility. Staff must confirm cash receipt before the item is
                released.
              </p>
            )}
        </section>
      )}

      {/* Error */}
      {error && (
        <output role="alert" className="text-sm text-red-600">
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
            : usePartial && parsedOnline > 0 && parsedOnline <= totalPrice
              ? `Pay R${parsedOnline.toFixed(2)} Online + R${shortfall.toFixed(2)} Cash`
              : `Buy Now — R${totalPrice.toFixed(2)}`}
      </button>

      <p className="text-xs text-slate-400 text-center">
        Secured by PayFast · No card details stored
      </p>
    </section>
  );
}
