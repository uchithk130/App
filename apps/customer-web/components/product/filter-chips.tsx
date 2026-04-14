"use client";

type FilterOption = {
  key: string;
  label: string;
};

type Props = {
  options: FilterOption[];
  active: string;
  onChange: (key: string) => void;
};

export function FilterChips({ options, active, onChange }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {options.map((opt) => {
        const isActive = opt.key === active;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${
              isActive
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
