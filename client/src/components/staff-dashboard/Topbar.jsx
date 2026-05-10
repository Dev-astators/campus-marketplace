import { useState } from "react";
import Icon from "./Icon";

export default function Topbar({ staffProfile }) {
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
    </header>
  );
}
