export default function HeroSection() {
  return (
    <aside
      aria-label="Brand panel"
      className="hidden md:flex flex-col justify-center px-16 py-20 bg-linear-to-br from-[#dce8f8] via-[#e8f0fb] to-[#c8daf5] relative overflow-hidden"
    >
      {/* Decorative blobs */}
      <figure
        aria-hidden="true"
        className="absolute -bottom-20 -left-15 w-72 h-72 rounded-full bg-blue-200/40 blur-3xl pointer-events-none"
      />
      <figure
        aria-hidden="true"
        className="absolute -top-10 -right-10 w-56 h-56 rounded-full bg-slate-300/30 blur-2xl pointer-events-none"
      />

      <section className="relative z-10 max-w-sm">
        {/* Badge */}
        <p className="inline-block bg-blue-700 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-7 font-['inter',sans-serif]">
          Exclusive to Wits Students
        </p>

        {/* Headline */}
        <h1 className="font-['inter',sans-serif] font-extrabold text-blue-800 text-5xl leading-[1.1] mb-6">
          The campus{" "}
          <em className="not-italic text-green-700 font-['Georgia',serif] font-bold">
            marketplace
          </em>
          ,{" "}
          <br />
          reimagined.
        </h1>

        {/* Body */}
        <p className="text-slate-500 text-base leading-relaxed font-['inter',sans-serif]">
          A curated ecosystem for students and staff to exchange resources,
          services, and local expertise with scholarly rigor.
        </p>
      </section>
    </aside>
  );
}