const priorityStyles = {
  high:       "bg-amber-100 text-amber-800",
  standard:   "bg-slate-100 text-slate-500",
  processing: "bg-green-50 text-green-700",
};

export default function VerificationItem({ id, priority, priorityLabel, name, dropper, emoji, status, onVerify, onDecline }) {
  return (
    <div className="px-5 py-4 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors duration-150">
      {/* Item row */}
      <div className="flex items-start gap-3">
        {/* Emoji thumbnail */}
        <div className="w-13 h-13 shrink-0 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-[22px] select-none">
          {emoji}
        </div>

        {/* Meta */}
        <div className="flex-1 min-w-0">
          <span className={`inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded mb-1.5 ${priorityStyles[priority]}`}>
            {priorityLabel}
          </span>
          <p className="text-[13px] font-bold text-slate-800 leading-snug">{name}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{dropper}</p>
        </div>
      </div>

      {/* Actions / Status */}
      <div className="mt-3">
        {status === "verified"   && <VerifiedState />}
        {status === "pending"    && (
          <div className="flex gap-2">
            <button
              onClick={() => onDecline(id)}
              className="flex-1 py-2 rounded-lg border border-slate-200 text-[12px] font-semibold text-slate-500 hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-all duration-150"
            >
              Decline
            </button>
            <button
              onClick={() => onVerify(id)}
              className="flex-1 py-2 rounded-lg bg-[#1a2744] text-[12px] font-semibold text-white hover:bg-blue-600 transition-all duration-150"
            >
              Verify Item
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


function VerifiedState() {
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="text-sm">✅</span>
      <span className="text-[11.5px] text-green-600 font-semibold">Item verified</span>
    </div>
  );
}
