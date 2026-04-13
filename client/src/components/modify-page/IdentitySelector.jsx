const StudentIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
  </svg>
);

const FacilitatorIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z" />
  </svg>
);

const ROLES = [
  { id: "student",     label: "Student",             icon: StudentIcon     },
  { id: "facilitator", label: "Trading Facilitator",  icon: FacilitatorIcon },
];

export default function IdentitySelector({ selected, onChange }) {
  return (
    <fieldset className="border-0 p-0 m-0">
      <legend className="text-[11px] font-bold tracking-[0.15em] text-blue-700 uppercase mb-4 font-['inter',sans-serif]">
        Choose Your Identity
      </legend>

      <ul className="flex gap-4 list-none p-0 m-0">
        {ROLES.map((role) => {
          const { id, label } = role;
          const Icon = role.icon;
          const isSelected = selected === id;
          return (
            <li key={id}>
              <button
                type="button"
                aria-pressed={isSelected}
                onClick={() => onChange(id)}
                className={`
                  flex flex-col items-center justify-center gap-3
                  w-27.5 h-27.5 rounded-2xl border-2 transition-all duration-200
                  font-['inter',sans-serif] text-[10px] font-bold tracking-widest uppercase
                  cursor-pointer
                  ${isSelected
                    ? "border-blue-600 bg-white text-blue-700 shadow-[0_0_0_4px_rgba(37,99,235,0.12)]"
                    : "border-slate-200 bg-slate-50 text-slate-500 hover:border-blue-300 hover:bg-white"
                  }
                `}
              >
                <i aria-hidden="true" className={isSelected ? "text-blue-600" : "text-slate-400"}>
                  <Icon />
                </i>
                {label}
              </button>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}