import { useState } from "react";
import VerificationItem from "./VerificationItem";
import { VERIFICATION_ITEMS } from "./dashboardData";
import Icon from "./Icon";

export default function VerificationQueue() {
  const [items, setItems] = useState(VERIFICATION_ITEMS);

  const handleVerify = (id) =>
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "verified" } : item
      )
    );

  const handleDecline = (id) =>
    setItems((prev) => prev.filter((item) => item.id !== id));


  return (
    <section className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
      {/* Header */}
      <section className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
        <section>
          <h2 className="text-[18px] font-bold text-slate-800">
            Verification Queue
          </h2>
          <p className="text-[12px] text-slate-400 mt-1">
            Pending student verifications
          </p>
        </section>

        
      </section>

      {/* Content */}
      <section className="divide-y divide-slate-100">
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
      </section>
    </section>
  );
}

function EmptyState() {
  return (
    <section className="flex flex-col items-center justify-center py-14">
      <section className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-4">
        <span className="text-3xl">✅</span>
      </section>

      <p className="text-[15px] font-semibold text-slate-700">
        All items verified
      </p>

      <p className="text-[12px] text-slate-400 mt-1">
        There are currently no pending requests
      </p>
    </section>
  );
}