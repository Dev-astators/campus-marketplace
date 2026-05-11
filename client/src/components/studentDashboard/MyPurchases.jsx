// client/src/components/studentDashboard/MyPurchases.jsx
// Shows a buyer's transaction history with status and collection slot details.
import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

const STATUS_STYLES = {
  pending:   "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  complete:  "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const BOOKING_STATUS = {
  pending:   "⏳ Awaiting staff",
  confirmed: "✅ Confirmed",
  complete:  "🎉 Collected",
};

export default function MyPurchases({ profileId }) {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  useEffect(() => {
    if (!profileId) return;

    const fetch_ = async () => {
      try {
        const res  = await fetch(`${API_URL}/api/payments/my-purchases/${profileId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setPurchases(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetch_();
  }, [profileId]);

  if (loading) return <p className="text-sm text-slate-400 py-4">Loading purchases…</p>;
  if (error)   return <p className="text-sm text-red-500 py-4">Error: {error}</p>;
  if (purchases.length === 0) return (
    <p className="text-sm text-slate-400 py-4">You haven't bought anything yet.</p>
  );

  return (
    <section aria-label="My Purchases">
      <h2 className="text-lg font-bold text-[#0D1B4B] mb-4">My Purchases</h2>
      <ul className="flex flex-col gap-4 list-none p-0 m-0">
        {purchases.map((tx) => {
          const collection = tx.facility_bookings?.find(b => b.booking_type === "collection");
          const slot       = collection?.facility_slots;

          return (
            <li key={tx.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <header className="flex items-start justify-between gap-3 mb-3">
                <h3 className="font-semibold text-[#0D1B4B] text-sm">
                  {tx.listings?.title || "Unknown item"}
                </h3>
                <mark className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${STATUS_STYLES[tx.status] || "bg-slate-100 text-slate-600"}`}>
                  {tx.status}
                </mark>
              </header>

              <dl className="text-sm text-slate-600 grid grid-cols-2 gap-x-4 gap-y-1">
                <dt className="font-medium text-slate-400">Amount paid online</dt>
                <dd>R{Number(tx.online_amount).toFixed(2)}</dd>

                {Number(tx.cash_shortfall) > 0 && (
                  <>
                    <dt className="font-medium text-slate-400">Cash to pay at facility</dt>
                    <dd className="text-amber-600 font-semibold">R{Number(tx.cash_shortfall).toFixed(2)}</dd>
                    <dt className="font-medium text-slate-400">Cash settled</dt>
                    <dd>{tx.cash_settled ? "✅ Yes" : "⏳ Pending at facility"}</dd>
                  </>
                )}

                <dt className="font-medium text-slate-400">Seller</dt>
                <dd>{tx.seller?.full_name || "—"}</dd>

                <dt className="font-medium text-slate-400">Collection slot</dt>
                <dd>
                  {slot
                    ? `${new Date(slot.slot_date).toDateString()} · ${slot.slot_time?.slice(0, 5)}`
                    : "Not booked yet"}
                </dd>

                <dt className="font-medium text-slate-400">Collection status</dt>
                <dd>{collection ? BOOKING_STATUS[collection.status] : "—"}</dd>
              </dl>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
