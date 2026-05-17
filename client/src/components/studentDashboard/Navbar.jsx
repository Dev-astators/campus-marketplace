export default function Navbar({ user, searchValue = "", onSearch }) {
  const displayName = user?.fullName || user?.name || "Student";
  const notificationCount = 0;

  return (
    <header className="w-full border-b border-gray-200 bg-gray-100 px-4 py-3 sm:px-6">
      <section className="flex flex-wrap items-center gap-3 sm:gap-6">
        <a
          href="/student-dashboard"
          className="shrink-0 text-2xl font-extrabold tracking-tight text-blue-700"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          UniSquare
        </a>

        <form
          className="order-3 w-full md:order-none md:max-w-xl md:flex-1"
          role="search"
          onSubmit={(event) => event.preventDefault()}
        >
          <fieldset className="relative m-0 border-0 p-0">
            <legend className="sr-only">Search listings</legend>

            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
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
              className="w-full rounded-full border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </fieldset>
        </form>

        <nav aria-label="User menu" className="ml-auto flex shrink-0 items-center gap-3">
          <a
            href="/notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition hover:bg-blue-50 hover:text-blue-600"
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
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>

            {notificationCount > 0 ? (
              <strong className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
                {notificationCount}
              </strong>
            ) : null}
          </a>

          <p className="hidden text-sm font-medium text-gray-800 sm:block">
            {displayName}
          </p>

          <figure className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gray-300">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={`${displayName} avatar`}
                className="h-full w-full object-cover"
              />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-6 w-6 text-gray-500"
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
      </section>
    </header>
  );
}
