import { useState } from "react";
import Icon from "./Icon";

export default function Topbar() {
  const [query, setQuery] = useState("");

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 h-16 flex items-center gap-4 px-7">
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Icon
          name="search"
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search items, meetups, members…"
          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-transparent rounded-xl text-[13.5px] text-slate-800 placeholder-slate-400 outline-none transition-all duration-150 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:bg-white"
        />
      </div>

      {/* Actions */}
      <nav
        className="flex items-center gap-1.5 ml-auto"
        aria-label="Topbar actions"
      >
        <IconButton>
          <div className="relative">
            <Icon name="bell" size={18} />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 border-2 border-white rounded-full" />
          </div>
        </IconButton>

        <IconButton>
          <Icon name="settings" size={18} />
        </IconButton>

        <div className="w-9 h-9 rounded-full bg-linear-to-br from-indigo-400 to-purple-600 border-2 border-slate-200 flex items-center justify-center text-white text-[12px] font-bold cursor-pointer hover:border-blue-400 transition-colors duration-150 ml-1 select-none">
          ST
        </div>
      </nav>
    </header>
  );
}

function IconButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-9 h-9 rounded-xl bg-slate-50 border border-transparent flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-all duration-150"
    >
      {children}
    </button>
  );
}
