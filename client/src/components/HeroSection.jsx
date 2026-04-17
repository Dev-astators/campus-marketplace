export default function HeroSection() {
  return (
    <section className="px-16 pt-20 pb-24" aria-labelledby="hero-heading">
      <header className="max-w-xl">
        {/* Headline */}
        <h1
          id="hero-heading"
          className="text-[4.5rem] leading-[1.05] font-['inter',sans-serif] text-blue-700 tracking-tight mb-6"
        >
          Discover, Buy, Sell & Connect{" "}
          <span className="text-black font-light">-Right On Your Campus</span>
        </h1>

        {/* Badge */}
        <p className="mb-6 font-['inter',sans-serif] bg-blue-300 text-blue-600 text-sm font-medium inline-flex items-center px-3 py-1 rounded-full">
          EXCLUSIVE TO WITS STUDENTS
        </p>

        {/* Description */}
        <p className="text-gray-600 font-['inter',sans-serif] text-base leading-relaxed mb-10 max-w-md">
          A refined ecosystem for university life. Trade essentials with
          verified peers in a secure, editorial-first marketplace designed for
          the modern scholar.
        </p>
      </header>
    </section>
  );
}
