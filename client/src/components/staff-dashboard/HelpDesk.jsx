import Icon from "./Icon";

export default function HelpDesk() {
  return (
    <div className="rounded-2xl border border-orange-200 bg-linear-to-br from-orange-50 to-amber-50 p-5">
      <p className="text-[14px] font-bold text-orange-900 mb-1">🎧 Help Desk</p>
      <p className="text-[12.5px] text-orange-700 leading-relaxed mb-4">
        Urgent issue with a member? Our supervisor line is open.
      </p>
      <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-[13px] font-bold rounded-xl transition-all duration-150 shadow-md shadow-orange-200 hover:-translate-y-px hover:shadow-lg hover:shadow-orange-200">
        <Icon name="phone" size={15} strokeWidth={2.5} />
        Contact Admin
      </button>
    </div>
  );
}
