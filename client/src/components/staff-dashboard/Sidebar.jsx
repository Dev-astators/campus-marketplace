import Icon from "./Icon";
import { NAV_ITEMS } from "./dashboardData";

export default function Sidebar({ activeNav, onNavChange }) {
  return (
    <aside className="fixed top-0 left-0 h-screen w-55 bg-white border-r border-slate-200 flex flex-col z-50">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5.5 border-b border-slate-100">
        <LogoMark />
        <span className="font-bold text-[15px] text-slate-900 tracking-tight">
          UniSquare
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-0.5 px-3 py-4 flex-1">
        {NAV_ITEMS.map((item) => {
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavChange(item.id)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13.5px] font-medium w-full text-left transition-all duration-150 
                ${isActive
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
          );
        })}
      </nav>
    </aside>
  );
}

function LogoMark() {
  return (
    <div className="w-8.5 h-8.5 bg-[#1a2744] rounded-[10px] flex items-center justify-center shrink-0">
      <div className="w-4 h-4 border-[2.5px] border-dashed border-white/70 rounded" />
    </div>
  );
}
