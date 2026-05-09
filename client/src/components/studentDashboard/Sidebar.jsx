// src/components/dashboard/Sidebar.jsx

/**
 * Sidebar component
 * Left navigation panel for the student dashboard.
 * Props:
 *  - activeItem: string — currently active nav item key
 *  - onNavigate: (item: string) => void
 */

const NAV_ITEMS = [
  {
    key: "marketplace",
    label: "Marketplace",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.8}
        stroke="currentColor"
        className="w-5 h-5"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13.5 21v-7.5A2.25 2.25 0 0 1 15.75 11.25h3a2.25 2.25 0 0 1 2.25 2.25V21m-10.5 0V15a2.25 2.25 0 0 0-2.25-2.25H6a2.25 2.25 0 0 0-2.25 2.25v6M3 21h18"
        />
      </svg>
    ),
  },
  {
    key: "my-listings",
    label: "My Listings",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.8}
        stroke="currentColor"
        className="w-5 h-5"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.25 6.75h7.5M8.25 12h7.5m-7.5 5.25h7.5M3.75 6.375a2.625 2.625 0 0 1 5.25 0v11.25a2.625 2.625 0 0 1-5.25 0V6.375Z"
        />
      </svg>
    ),
  },
  {
    key: "messages",
    label: "Messages",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.8}
        stroke="currentColor"
        className="w-5 h-5"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
        />
      </svg>
    ),
  },
  {
    key: "profile",
    label: "Profile Settings",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.8}
        stroke="currentColor"
        className="w-5 h-5"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
        />
      </svg>
    ),
  },
];

export default function Sidebar({ activeItem = "marketplace", onNavigate }) {
  return (
    <aside className="w-44 shrink-0 bg-white border-r border-gray-200 flex flex-col pt-6 px-3 sticky top-0 h-full">
      {/* Dashboard label */}
      <header className="px-2 mb-6">
        <p className="text-sm font-bold text-blue-700">Student Dashboard</p>
        <p className="text-xs text-gray-400">University Square</p>
      </header>

      {/* Nav links */}
      <nav aria-label="Dashboard navigation">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = activeItem === item.key;
            return (
              <li key={item.key}>
                <button
                  onClick={() => onNavigate?.(item.key)}
                  aria-current={isActive ? "page" : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left cursor-pointer
                    ${
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
