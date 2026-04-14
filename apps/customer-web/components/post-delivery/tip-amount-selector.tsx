"use client";

type Props = {
  amounts: number[];
  selected: number | null;
  onSelect: (v: number) => void;
  customValue: string;
  onCustomChange: (v: string) => void;
  currency?: string;
};

export function TipAmountSelector({ amounts, selected, onSelect, customValue, onCustomChange, currency = "\u20b9" }: Props) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2">
        {amounts.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => { onSelect(a); onCustomChange(""); }}
            className={`rounded-xl py-3 text-sm font-bold transition ${
              selected === a && !customValue
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                : "bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
            }`}
          >
            {currency}{a}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200 focus-within:ring-emerald-400">
        <span className="text-sm font-semibold text-slate-500">{currency}</span>
        <input
          type="number"
          min="1"
          max="10000"
          value={customValue}
          onChange={(e) => { onCustomChange(e.target.value); onSelect(0); }}
          placeholder="Custom amount"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
      </div>
    </div>
  );
}
