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
    <article className="px-5 py-5 hover:bg-white/10 transition-all duration-200">
      
      {/* ================= ITEM ROW ================= */}
      <section className="flex items-start gap-4">

        {/* Thumbnail */}
        <figure className="w-14 h-14 shrink-0 rounded-2xl bg-white/10 border border-slate-700 flex items-center justify-center text-2xl shadow-sm select-none">
          {emoji}
        </figure>

        {/* ================= META ================= */}
        <section className="flex-1 min-w-0">
          
          {/* Priority Badge */}
          <mark
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 ${priorityStyles[priority]}`}
          >
            {priorityLabel}
          </mark>

          {/* Item Name */}
          <h3 className="text-[14px] font-semibold text-white leading-snug truncate">
            {name}
          </h3>

          {/* User / Dropper */}
          <p className="text-[12px] text-slate-400 mt-1">
            {dropper}
          </p>
        </section>
      </section>

      {/* ================= ACTIONS ================= */}
      <section className="mt-4">
        
        {status === "verified" && <VerifiedState />}

        {status === "pending" && (
          <menu className="m-0 flex list-none gap-3 p-0">

            {/* Decline */}
            <li className="flex-1">
              <button
                onClick={() => onDecline(id)}
                className="
                  w-full py-2.5 rounded-xl
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
            </li>

            {/* Verify */}
            <li className="flex-1">
              <button
                onClick={() => onVerify(id)}
                className="
                  w-full py-2.5 rounded-xl
                  bg-blue-600
                  text-[12px] font-semibold text-white
                  hover:bg-blue-500
                  shadow-md shadow-blue-900/20
                  transition-all duration-200
                "
              >
                Verify Item
              </button>
            </li>
          </menu>
        )}
      </section>
    </article>
  );
}
/* ================= VERIFIED STATE ================= */

function VerifiedState() {
  return (
    <section className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
      
      <strong className="text-sm">✅</strong>

      <strong className="text-[12px] font-medium text-emerald-400">
        Item verified successfully
      </strong>
    </section>
  );
}
