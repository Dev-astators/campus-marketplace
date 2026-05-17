import Icon from "./Icon";
import { NAV_ITEMS } from "./dashboardData";

export default function Sidebar({
  activeNav,
  onNavChange,
  isCollapsed = false,
  onToggleCollapse,
  isMobileOpen = false,
}) {
  const filteredNavItems = NAV_ITEMS.filter(
    (item) =>
      item.label !== "Marketplace" &&
      item.label !== "My Listings"
  );

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex h-screen flex-col border-r border-slate-200 bg-white shadow-xl transition-all duration-300 lg:shadow-none ${
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      } ${isCollapsed ? "w-[16rem] lg:w-[5.5rem]" : "w-[16rem]"}`}
    >
      <section
        className={`flex h-20 items-center border-b border-slate-100 ${
          isCollapsed ? "justify-center px-3 lg:px-2" : "justify-between px-5 lg:px-6"
        }`}
      >
        <section className={`min-w-0 ${isCollapsed ? "lg:hidden" : ""}`}>
          <h1 className="text-[30px] font-extrabold tracking-tight text-blue-600">
            UniSquare
          </h1>
          <p className="mt-1 text-[12px] text-slate-400">
            University Square
          </p>
        </section>

        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-100 hover:text-slate-800"
        >
          <Icon
            name={isCollapsed ? "chevron-right" : "chevron-left"}
            size={18}
          />
        </button>
      </section>

      <nav className="flex-1 space-y-2 px-3 py-6">
        {filteredNavItems.map((item) => {
          const isActive = activeNav === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavChange(item.id)}
              title={item.label}
              aria-label={item.label}
              className={`flex w-full items-center rounded-2xl px-4 py-3 text-left transition-all duration-200 ${
                isCollapsed ? "justify-center lg:px-3" : "gap-3"
              }
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

              <span className={`text-[15px] ${isCollapsed ? "lg:hidden" : ""}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
