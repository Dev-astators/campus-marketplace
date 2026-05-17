import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="absolute left-0 top-0 z-50 w-full px-8 pt-5">
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between rounded-[22px] border border-white/60 bg-white/70 px-7 py-3 shadow-[0_14px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl"
        aria-label="Main navigation"
      >
        <Link
          to="/"
          className="text-xl font-black tracking-tight text-slate-950"
          aria-label="UniSquare home"
        >
          Uni
          <strong className="font-black text-blue-600">Square</strong>
        </Link>

        <ul className="hidden items-center gap-8 text-sm font-semibold text-slate-700 md:flex">
          <li>
            <Link
              to="/"
              className="relative text-blue-600 transition hover:text-blue-700 after:absolute after:-bottom-4 after:left-0 after:h-[2px] after:w-full after:rounded-full after:bg-blue-600"
            >
              Home
            </Link>
          </li>

          <li>
            <Link to="/about" className="transition hover:text-blue-600">
              About
            </Link>
          </li>
        </ul>

        <menu className="flex list-none items-center gap-2 p-0">
          <li>
            <Link
              to="/signin"
              className="hidden rounded-full border border-slate-200 bg-white/70 px-5 py-2 text-sm font-bold text-slate-800 transition hover:bg-white md:inline-flex"
            >
              Sign In
            </Link>
          </li>

          <li>
            <Link
              to="/signup"
              className="rounded-full bg-blue-600 px-6 py-2 text-sm font-bold text-white shadow-[0_10px_24px_rgba(21,93,252,0.25)] transition hover:bg-blue-700"
            >
              Get Started
            </Link>
          </li>
        </menu>
      </nav>
    </header>
  );
}