import { useState } from "react";
import Icon from "./Icon";

export default function Topbar({
  staffProfile,
  onMenuToggle,
  onSidebarToggle,
  isSidebarCollapsed = false,
}) {
  const [query, setQuery] = useState("");

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
      <section className="flex flex-wrap items-center gap-3 lg:gap-5">
        <button
          type="button"
          onClick={onMenuToggle}
          aria-label="Open sidebar"
          className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-100 lg:hidden"
        >
          <Icon name="menu" size={20} />
        </button>

        <button
          type="button"
          onClick={onSidebarToggle}
          aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-100 lg:inline-flex"
        >
          <Icon
            name={isSidebarCollapsed ? "chevron-right" : "chevron-left"}
            size={20}
          />
        </button>

        <section className="order-3 relative w-full md:order-none md:flex-1 md:max-w-3xl">
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
        </section>

        <section className="ml-auto flex items-center gap-3">
          <article className="flex items-center gap-3 pl-2">
          <header className="hidden text-right md:block">
            <p className="text-[13px] font-semibold text-slate-700">
              {staffProfile?.email || "Facility staff"}
            </p>
            <p className="mt-1 text-[12px] text-slate-400">
              {staffProfile?.fullName || "Staff member"}
            </p>
          </header>

          <figure className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-slate-300 bg-slate-200">
            <Icon
              name="user"
              size={20}
              className="text-slate-600"
            />
          </figure>
          </article>
        </section>
      </section>
    </header>
  );
}
