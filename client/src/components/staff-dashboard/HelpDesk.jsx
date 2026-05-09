import Icon from "./Icon";

export default function HelpDesk() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-orange-100 bg-linear-to-br from-orange-50 via-amber-50 to-white p-6 shadow-sm">
      {/* Glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-200/40 rounded-full blur-3xl" />

      <div className="relative z-10">
        <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center shadow-md shadow-orange-200 mb-4">
          <Icon
            name="phone"
            size={20}
            className="text-white"
            strokeWidth={2.4}
          />
        </div>

        <h3 className="text-[18px] font-bold text-slate-800 mb-2">
          Help Desk
        </h3>

        <p className="text-[13px] text-slate-500 leading-relaxed mb-5">
          Urgent issue with a member or transaction? Contact the university
          supervisor support line immediately.
        </p>

        <button className="w-full h-11 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-[13px] font-semibold transition-all duration-200 shadow-md shadow-orange-200 hover:shadow-lg">
          Contact Admin
        </button>
      </div>
    </div>
  );
}