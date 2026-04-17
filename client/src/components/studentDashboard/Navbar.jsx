// src/components/dashboard/Navbar.jsx

/**
 * Navbar component
 * Displays the UniSquare brand, search bar and user profile info.
 * Props:
 *  - user: { name: string, avatarUrl: string | null }
 */

export default function Navbar({ user }) {
  return (
    <header className="w-full bg-gray-100 px-6 py-3 flex items-center gap-6 border-b border-gray-200">
      {/* Brand */}
      <a
        href="/"
        className="text-2xl font-extrabold text-blue-700 tracking-tight shrink-0"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        UniSquare
      </a>

      {/* Search */}
      <form
        className="flex-1 max-w-xl"
        role="search"
        onSubmit={(event) => event.preventDefault()}
      >
        <label htmlFor="search-input" className="sr-only">
          Search listings
        </label>
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0Z"
            />
          </svg>
          <input
            id="search-input"
            type="search"
            placeholder="Search"
            className="w-full pl-9 pr-4 py-2 rounded-full bg-white border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
      </form>

      {/* User info */}
      <nav
        aria-label="User menu"
        className="flex items-center gap-3 ml-auto shrink-0"
      >
        <span className="text-sm font-medium text-gray-800">
          {user?.name ?? "Student"}
        </span>
        <figure className="w-9 h-9 rounded-full bg-gray-300 overflow-hidden flex items-center justify-center">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={`${user.name} avatar`}
              className="w-full h-full object-cover"
            />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6 text-gray-500"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm-7 8a7 7 0 0 1 14 0H5Z"
                clipRule="evenodd"
              />
            </svg>
          )}
          <figcaption className="sr-only">
            {user?.name ?? "Student"} profile picture
          </figcaption>
        </figure>
      </nav>
    </header>
  );
}
