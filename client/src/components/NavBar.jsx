import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav
      className="flex items-center justify-between px-16 py-5 border-b border-gray-100"
      aria-label="Primary navigation"
    >
      {/* Logo */}
      <Link
        to="/"
        className="text-blue-600 font-['inter',sans-serif] font-bold text-xl tracking-tight select-none"
      >
        <span className="text-black">Uni</span>Square
      </Link>

      {/* Auth Buttons */}
      <ul className="flex items-center gap-4">
        <li>
          <button
            type="button"
            className="text-sm font-['inter',sans-serif] font-medium text-gray-700 hover:text-blue-600 transition-colors cursor-pointer"
          >
            About
          </button>
        </li>

        <li>
          <Link
            to="/signin"
            className="text-sm font-['inter',sans-serif] font-medium text-gray-700 hover:text-blue-600 transition-colors cursor-pointer"
          >
            Sign In
          </Link>
        </li>
        <li>
          <Link
            to="/signup"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-['inter',sans-serif] font-semibold px-5 py-2.5 rounded-full transition-colors shadow-sm cursor-pointer"
          >
            Get Started
          </Link>
        </li>
      </ul>
    </nav>
  );
}
