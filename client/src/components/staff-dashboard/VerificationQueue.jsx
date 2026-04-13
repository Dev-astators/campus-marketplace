import { useState } from "react";
import VerificationItem from "./VerificationItem";
import { VERIFICATION_ITEMS } from "./dashboardData";

export default function VerificationQueue() {
  const [items, setItems] = useState(VERIFICATION_ITEMS);

  const handleVerify = (id) =>
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: "verified" } : item))
    );

  const handleDecline = (id) =>
    setItems((prev) => prev.filter((item) => item.id !== id));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-slate-100">
        <h2 className="text-[15.5px] font-bold text-slate-900 tracking-tight">
          Verification Queue
        </h2>
        <span className="text-[11px] font-bold bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full">
          {items.filter((i) => i.status === "pending").length} pending
        </span>
      </div>

      {/* Items */}
      <div>
        {items.length === 0 ? (
          <EmptyState />
        ) : (
          items.map((item) => (
            <VerificationItem
              key={item.id}
              {...item}
              onVerify={handleVerify}
              onDecline={handleDecline}
            />
          ))
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-10 text-center text-slate-400 text-[13px]">
      <div className="text-3xl mb-2">✅</div>
      All items verified!
    </div>
  );
}
