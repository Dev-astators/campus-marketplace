export default function AdminSidebar({ items, activeItem, onNavigate }) {
  return (
    <aside
      className="h-full border-r border-gray-200 bg-white px-3 pt-6"
      aria-label="Admin navigation"
    >
      <header className="mb-6 px-2">
        <p className="text-sm font-bold text-blue-700">Admin Dashboard</p>
        <p className="text-xs text-gray-400">University Square</p>
      </header>

      <nav aria-label="Admin navigation">
        <ul className="flex flex-col gap-1" role="list">
          {items.map((item) => {
            const isActive = activeItem === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <p>{item.label}</p>
                  {item.badge ? (
                    <mark className="ml-auto rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
                      {item.badge}
                    </mark>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
