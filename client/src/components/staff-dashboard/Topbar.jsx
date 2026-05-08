import { useState } from "react";
import Icon from "./Icon";

export default function Topbar() {
  const [query, setQuery] = useState("");

  return (
    <header className="sticky top-0 z-40 h-20 bg-white border-b border-slate-200 px-8 flex items-center gap-5">
      {/* Search */}
      <div className="relative flex-1 max-w-3xl">
        <Icon
          name="search"
          size={18}
          className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search listings, students, categories..."
          className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl pl-14 pr-5 text-[14px] text-slate-700 placeholder-slate-400 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all duration-200"
        />
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Profile */}
        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden md:block">
            <p className="text-[13px] font-semibold text-slate-700">
              tlakakarabo98@gmail.com
            </p>   
          </div>

          <div className="w-11 h-11 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border border-slate-300">
            <Icon
              name="user"
              size={20}
              className="text-slate-600"
            />
          </div>
        </div>
      </div>
    </header>
  );
}

function IconButton({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all duration-200"
    >
      {children}
    </button>
  );
}