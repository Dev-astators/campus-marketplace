export default function AdminSidebar({ items, activeItem, onNavigate }) {
  return (
    <aside
      className="w-44 shrink-0 bg-white border-r border-gray-200 flex flex-col pt-6 px-3 sticky top-0 h-full"
      aria-label="Admin navigation"
    >
      <header className="px-2 mb-6">
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
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <span>{item.label}</span>
                  {item.badge ? (
                    <span className="ml-auto rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
                      {item.badge}
                    </span>
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
