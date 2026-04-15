import ScheduleItem from "./ScheduleItem";
import { SCHEDULE_ITEMS } from "./dashboardData";

export default function TodaysSchedule() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
        <h2 className="text-[15.5px] font-bold text-slate-900 tracking-tight">
          Today's Schedule
        </h2>
        <button className="text-right text-blue-600 text-[12.5px] font-semibold hover:text-blue-700 transition-colors leading-tight">
          <span className="block">View All</span>
          <span className="block">Schedule</span>
        </button>
      </div>

      {/* Items */}
      <div>
        {SCHEDULE_ITEMS.map((item) => (
          <ScheduleItem key={item.id} {...item} />
        ))}
      </div>
    </div>
  );
}
