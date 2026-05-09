import Icon from "./Icon";
import { NAV_ITEMS } from "./dashboardData";

export default function Sidebar({ activeNav, onNavChange }) {
  // Remove Marketplace and My Listings
  const filteredNavItems = NAV_ITEMS.filter(
    (item) =>
      item.label !== "Marketplace" &&
      item.label !== "My Listings"
  );

  return (
    <aside className="fixed top-0 left-0 h-screen w-62.5 bg-white border-r border-slate-200 flex flex-col z-50">
      {/* Logo */}
      <div className="h-20 flex items-center px-7 border-b border-slate-100">
        <div>
          <h1 className="text-[34px] font-extrabold text-blue-600 tracking-tight">
            UniSquare
          </h1>

          <p className="text-[12px] text-slate-400 mt-1">
            University Square
          </p>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {filteredNavItems.map((item) => {
          const isActive = activeNav === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all duration-200
              ${
                isActive
                  ? "bg-blue-50 text-blue-600 shadow-sm font-semibold"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              }`}
            >
              <Icon
                name={item.icon}
                size={19}
                className={
                  isActive
                    ? "text-blue-600"
                    : "text-slate-400"
                }
              />

              <span className="text-[15px]">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}