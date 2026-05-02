import Icon from "./Icon";
import { NAV_ITEMS } from "./dashboardData";

export default function Sidebar({ activeNav, onNavChange }) {
  return (
    <aside className="fixed top-0 left-0 h-screen w-55 bg-white border-r border-slate-200 flex flex-col z-50">
      {/* Logo */}
      <header className="flex items-center gap-3 px-5 py-5.5 border-b border-slate-100">
        <span className="font-bold text-[15px] text-slate-900 tracking-tight">
          UniSquare
        </span>
      </header>

      {/* Navigation */}
      <nav className="px-3 py-4 flex-1" aria-label="Staff navigation">
        <ul className="flex flex-col gap-0.5" role="list">
          {NAV_ITEMS.map((item) => {
            const isActive = activeNav === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onNavChange(item.id)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13.5px] font-medium w-full text-left transition-all duration-150 
                    ${
                      isActive
                        ? "bg-blue-50 text-blue-600 font-semibold"
                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                    }`}
                >
                  <Icon
                    name={item.icon}
                    size={17}
                    className={isActive ? "text-blue-600" : "text-slate-400"}
                    strokeWidth={isActive ? 2.2 : 1.8}
                  />
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
