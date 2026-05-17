import ScheduleItem from "./ScheduleItem";
import { SCHEDULE_ITEMS } from "./dashboardData";

export default function TodaysSchedule() {
  return (
    <section className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
      {/* Header */}
      <section className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
        <section>
          <h2 className="text-[18px] font-bold text-slate-800">
            Today's Schedule
          </h2>

          <p className="text-[12px] text-slate-400 mt-1">
            Upcoming exchange meetups
          </p>
        </section>

        <button className="text-blue-600 text-[13px] font-semibold hover:text-blue-700 transition-colors">
          View All
        </button>
      </section>

      {/* Schedule */}
      <section>
        {SCHEDULE_ITEMS.map((item) => (
          <ScheduleItem key={item.id} {...item} />
        ))}
      </section>
    </section>
  );
}