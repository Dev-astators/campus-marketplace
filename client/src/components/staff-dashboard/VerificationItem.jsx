const priorityStyles = {
  high:
    "bg-amber-500/10 text-amber-400 border border-amber-500/20",

  standard:
    "bg-slate-700/30 text-slate-300 border border-slate-600",

  processing:
    "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
};

export default function VerificationItem({
  id,
  priority,
  priorityLabel,
  name,
  dropper,
  emoji,
  status,
  onVerify,
  onDecline,
}) {
  return (
    <div className="px-5 py-5 hover:bg-white/10 transition-all duration-200">
      
      {/* ================= ITEM ROW ================= */}
      <div className="flex items-start gap-4">

        {/* Thumbnail */}
        <div className="w-14 h-14 shrink-0 rounded-2xl bg-white/10 border border-slate-700 flex items-center justify-center text-2xl shadow-sm select-none">
          {emoji}
        </div>

        {/* ================= META ================= */}
        <div className="flex-1 min-w-0">
          
          {/* Priority Badge */}
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 ${priorityStyles[priority]}`}
          >
            {priorityLabel}
          </span>

          {/* Item Name */}
          <h3 className="text-[14px] font-semibold text-white leading-snug truncate">
            {name}
          </h3>

          {/* User / Dropper */}
          <p className="text-[12px] text-slate-400 mt-1">
            {dropper}
          </p>
        </div>
      </div>

      {/* ================= ACTIONS ================= */}
      <div className="mt-4">
        
        {status === "verified" && <VerifiedState />}

        {status === "pending" && (
          <div className="flex gap-3">

            {/* Decline */}
            <button
              onClick={() => onDecline(id)}
              className="
                flex-1 py-2.5 rounded-xl
                border border-slate-700
                bg-white/10
                text-[12px] font-semibold text-black/80
                hover:bg-red-500/10
                hover:border-red-500/30
                hover:text-red-400
                transition-all duration-200
              "
            >
              Decline
            </button>

            {/* Verify */}
            <button
              onClick={() => onVerify(id)}
              className="
                flex-1 py-2.5 rounded-xl
                bg-blue-600
                text-[12px] font-semibold text-white
                hover:bg-blue-500
                shadow-md shadow-blue-900/20
                transition-all duration-200
              "
            >
              Verify Item
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
/* ================= VERIFIED STATE ================= */

function VerifiedState() {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
      
      <span className="text-sm">✅</span>

      <span className="text-[12px] font-medium text-emerald-400">
        Item verified successfully
      </span>
    </div>
  );
}