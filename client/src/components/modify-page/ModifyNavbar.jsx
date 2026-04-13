export default function ModifyNavbar() {
  return (
    <header className="border-b border-gray-100 bg-white px-10 py-4">
      <nav aria-label="Site navigation">
        <a href="/" className="inline-flex items-baseline gap-0 no-underline">
          <strong className="text-black font-bold text-xl tracking-tight font-['inter',sans-serif]">
            Uni
          </strong>
          <strong className="text-blue-600 font-bold text-xl tracking-tight font-['inter',sans-serif]">
            Square
          </strong>
        </a>
      </nav>
    </header>
  );
}