import { HERO_STATS } from "./dashboardData";

export default function HeroBanner({
  eyebrow = "Student Marketplace Dashboard",
  title = "University Square Hub",
  description = "Manage student listings, secure exchanges, verification requests, and marketplace activities across campus.",
  stats = HERO_STATS,
}) {
  return (
    <article className="relative overflow-hidden rounded-[30px] bg-linear-to-r from-[#1d4ed8] via-[#2563eb] to-[#3b82f6] px-10 py-9 shadow-lg">
      {/* Background Shapes */}
      <aside className="absolute top-0 right-0 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
      <aside className="absolute bottom-0 left-20 h-52 w-52 rounded-full bg-sky-300/10 blur-2xl" />

      <section className="relative z-10 flex items-center justify-between gap-10">
        {/* Left */}
        <header>
          <p className="mb-2 text-[13px] font-medium text-blue-100">
            {eyebrow}
          </p>

          <h1 className="mb-3 text-[34px] font-extrabold leading-tight tracking-tight text-white">
            {title}
          </h1>

          <p className="max-w-lg text-[14px] leading-relaxed text-blue-100/80">
            {description}
          </p>
        </header>

        {/* Stats */}
        <section className="flex gap-4" aria-label="Staff dashboard summary">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </section>
      </section>
    </article>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <article className="min-w-33.75 rounded-2xl border border-white/15 bg-white/10 px-5 py-5 text-center backdrop-blur-md">
      <h2 className="text-[32px] font-extrabold text-white leading-none">
        {value}
      </h2>

      <p className="text-[11px] uppercase tracking-widest text-blue-100 mt-2 font-semibold">
        {label}
      </p>

      <p className="text-[11px] text-white/60 mt-1">
        {sub}
      </p>
    </article>
  );
}
