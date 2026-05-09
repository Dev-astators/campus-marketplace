import { HERO_STATS } from "./dashboardData";

export default function HeroBanner() {
  return (
    <div className="relative overflow-hidden rounded-[30px] bg-linear-to-r from-[#1d4ed8] via-[#2563eb] to-[#3b82f6] px-10 py-9 shadow-lg">
      {/* Background Shapes */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-20 w-52 h-52 bg-sky-300/10 rounded-full blur-2xl" />

      <div className="relative z-10 flex items-center justify-between gap-10">
        {/* Left */}
        <div>
          <p className="text-blue-100 text-[13px] font-medium mb-2">
            Student Marketplace Dashboard
          </p>

          <h1 className="text-[34px] font-extrabold text-white leading-tight tracking-tight mb-3">
            University Square Hub
          </h1>

          <p className="max-w-lg text-[14px] text-blue-100/80 leading-relaxed">
            Manage student listings, secure exchanges, verification requests,
            and marketplace activities across campus.
          </p>
        </div>

        {/* Stats */}
        <div className="flex gap-4">
          {HERO_STATS.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div className="min-w-33.75 rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md px-5 py-5 text-center">
      <h2 className="text-[32px] font-extrabold text-white leading-none">
        {value}
      </h2>

      <p className="text-[11px] uppercase tracking-widest text-blue-100 mt-2 font-semibold">
        {label}
      </p>

      <p className="text-[11px] text-white/60 mt-1">
        {sub}
      </p>
    </div>
  );
}