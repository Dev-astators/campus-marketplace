import { useNavigate } from "react-router-dom";

// src/components/dashboard/Navbar.jsx

/**
 * Navbar component
 * Displays the UniSquare brand, search bar, notifications and user profile info.
 * Props:
 *  - user: { name: string, avatarUrl: string | null }
 *  - searchValue: string
 *  - onSearch: function
 */

export default function Navbar({ user, searchValue = "", onSearch }) {
  const navigate = useNavigate();
  const displayName = user?.fullName || user?.name || "Student";
  const notificationCount = 0; // temporary for now

  return (
    <header className="w-full bg-gray-100 px-6 py-3 flex items-center gap-6 border-b border-gray-200">
      {/* Brand */}
      <a
        href="/student-dashboard"
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
        <fieldset className="relative border-0 m-0 p-0">
          <legend className="sr-only">Search listings</legend>

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
            value={searchValue}
            onChange={(event) => onSearch?.(event.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-full bg-white border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </fieldset>
      </form>

      {/* User actions */}
      <nav
        aria-label="User menu"
        className="flex items-center gap-3 ml-auto shrink-0"
      >
        {/* Notification bell */}
        <button
          type="button"
          onClick={() => navigate("/notifications")}
          className="relative w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition"
          aria-label={`View notifications. ${notificationCount} unread notifications.`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5"
            aria-hidden="true"
          >
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>

          {notificationCount > 0 && (
            <strong className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
              {notificationCount}
            </strong>
          )}
        </button>

        {/* Username */}
        <p className="text-sm font-medium text-gray-800">{displayName}</p>

        {/* Avatar */}
        <figure className="w-9 h-9 rounded-full bg-gray-300 overflow-hidden flex items-center justify-center">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={`${displayName} avatar`}
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
            {displayName} profile picture
          </figcaption>
        </figure>
      </nav>
    </header>
  );
}