import { useState } from "react";
import Icon from "./Icon";

const boothStyles = {
  green: "bg-green-50 text-green-700 border border-green-100",
  blue: "bg-blue-50 text-blue-700 border border-blue-100",
};

export default function ScheduleItem({
  time,
  period,
  item,
  seller,
  buyer,
  booth,
  boothVariant,
}) {
  const [checked, setChecked] = useState(false);

  return (
    <section className="flex items-center gap-5 px-6 py-5 hover:bg-slate-50 transition-all duration-200">
      {/* Time */}
      <section className="w-16 shrink-0 text-center">
        <p className="text-[16px] font-bold text-slate-800">
          {time}
        </p>

        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mt-1">
          {period}
        </p>
      </section>

      {/* Divider */}
      <section className="w-px h-12 bg-slate-200" />

      {/* Content */}
      <section className="flex-1">
        <h3 className="text-[14px] font-semibold text-slate-800 mb-2">
          {item}
        </h3>

        <section className="flex flex-wrap gap-4">
          <PersonTag icon="user">{seller}</PersonTag>
          <PersonTag icon="bag">{buyer}</PersonTag>
        </section>
      </section>

      {/* Right */}
      <section className="flex items-center gap-3">
        <span
          className={`px-3 py-1.5 rounded-full text-[11px] font-semibold ${boothStyles[boothVariant]}`}
        >
          {booth}
        </span>

        <button
          onClick={() => setChecked((prev) => !prev)}
          className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200
            ${
              checked
                ? "bg-green-600 shadow-md shadow-green-200"
                : "bg-slate-100 hover:bg-green-500"
            }
          `}
        >
          <Icon
            name="check"
            size={16}
            className={checked ? "text-white" : "text-slate-500"}
          />
        </button>
      </section>
    </section>
  );
}

function PersonTag({ icon, children }) {
  return (
    <section className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl">
      <Icon
        name={icon}
        size={13}
        className="text-slate-400"
      />

      <span className="text-[11.5px] text-slate-600 font-medium">
        {children}
      </span>
    </section>
  );
}