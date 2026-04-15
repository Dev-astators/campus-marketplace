import { HERO_STATS } from "./dashboardData";

export default function HeroBanner() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#1a2744] px-9 py-8 flex items-center justify-between gap-6">
      {/* Background glows */}
      <div className="pointer-events-none absolute -top-16 -right-16 w-72 h-72 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 left-1/3 w-52 h-52 rounded-full bg-sky-400/10 blur-2xl" />

      {/* Text */}
      <div className="relative z-10">
        <h1 className="font-extrabold text-[26px] tracking-tight text-white mb-1.5 leading-tight">
          University Square Hub
        </h1>
        <p className="text-white/50 text-[13.5px] leading-relaxed max-w-sm">
          Trading Facility Staff Dashboard. Manage safe exchanges and item
          authenticity for the campus community.
        </p>
      </div>

      {/* Stats */}
      <div className="relative z-10 flex gap-3 shrink-0">
        {HERO_STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div className="min-w-32.5 bg-white/[0.07] border border-white/10 rounded-xl px-6 py-4 text-center backdrop-blur-md">
      <div className="text-[30px] font-extrabold text-white leading-none tracking-tight mb-1">
        {value}
      </div>
      <div className="text-[10.5px] font-semibold text-white/45 tracking-widest uppercase">
        {label}
      </div>
      <div className="text-[11px] text-white/30 mt-0.5">{sub}</div>
    </div>
  );
}
