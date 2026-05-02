import { useState } from "react";
import Icon from "./Icon";

const boothStyles = {
  green: "bg-green-50 text-green-700",
  blue: "bg-blue-50 text-blue-600",
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
    <li className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors duration-150 cursor-pointer border-b border-slate-100 last:border-b-0">
      {/* Time */}
      <div className="w-14 shrink-0 text-center">
        <p className="text-[14px] font-bold text-slate-800 leading-none">
          {time}
        </p>
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-1">
          {period}
        </p>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-semibold text-slate-800 truncate mb-1">
          {item}
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <PersonTag icon="user">{seller}</PersonTag>
          <PersonTag icon="bag">{buyer}</PersonTag>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2.5 shrink-0">
        <span
          className={`text-[11.5px] font-semibold px-3 py-1 rounded-full ${boothStyles[boothVariant]}`}
        >
          {booth}
        </span>
        <button
          type="button"
          onClick={() => setChecked((c) => !c)}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm
            ${
              checked
                ? "bg-green-700 shadow-green-200"
                : "bg-green-500 hover:bg-green-600 shadow-green-200 hover:scale-105"
            }`}
          title="Mark complete"
        >
          <Icon
            name="check"
            size={13}
            className="text-white"
            strokeWidth={2.8}
          />
        </button>
      </div>
    </li>
  );
}

function PersonTag({ icon, children }) {
  return (
    <span className="flex items-center gap-1 text-[11.5px] text-slate-400 font-medium">
      <Icon name={icon} size={12} className="text-slate-300" />
      {children}
    </span>
  );
}
