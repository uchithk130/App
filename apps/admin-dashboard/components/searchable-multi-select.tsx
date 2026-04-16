"use client";

import * as React from "react";
import { Search, X, Loader2 } from "lucide-react";

export type SelectOption = {
  id: string;
  label: string;
  sub?: string | null;
};

type Props = {
  selected: string[];
  onChange: (ids: string[]) => void;
  onSearch: (query: string) => Promise<SelectOption[]>;
  placeholder?: string;
  disabled?: boolean;
};

export function SearchableMultiSelect({
  selected,
  onChange,
  onSearch,
  placeholder = "Search...",
  disabled = false,
}: Props) {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SelectOption[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [selectedMap, setSelectedMap] = React.useState<Map<string, SelectOption>>(new Map());
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  React.useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await onSearch(query);
        setResults(r);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, query.length > 0 ? 300 : 0);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, onSearch]);

  function toggle(opt: SelectOption) {
    const next = new Map(selectedMap);
    if (selected.includes(opt.id)) {
      next.delete(opt.id);
      onChange(selected.filter((id) => id !== opt.id));
    } else {
      next.set(opt.id, opt);
      onChange([...selected, opt.id]);
    }
    setSelectedMap(next);
  }

  function remove(id: string) {
    const next = new Map(selectedMap);
    next.delete(id);
    setSelectedMap(next);
    onChange(selected.filter((i) => i !== id));
  }

  function clearAll() {
    setSelectedMap(new Map());
    onChange([]);
  }

  React.useEffect(() => {
    setSelectedMap((prev) => {
      const next = new Map<string, SelectOption>();
      for (const id of selected) {
        const existing = prev.get(id);
        if (existing) next.set(id, existing);
      }
      return next;
    });
  }, [selected]);

  const selectedChips = selected
    .map((id) => selectedMap.get(id))
    .filter((o): o is SelectOption => !!o);

  return (
    <div ref={wrapRef} className={`relative ${disabled ? "pointer-events-none opacity-50" : ""}`}>
      {selectedChips.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {selectedChips.map((opt) => (
            <span
              key={opt.id}
              className="inline-flex items-center gap-1 rounded-full bg-slate-100 py-1 pl-3 pr-1.5 text-xs font-medium text-slate-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              <span className="max-w-[180px] truncate">{opt.label}</span>
              <button
                type="button"
                onClick={() => remove(opt.id)}
                className="flex h-4 w-4 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-zinc-700"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {selectedChips.length > 1 && (
            <button
              type="button"
              onClick={clearAll}
              className="rounded-full px-2 py-1 text-[10px] font-semibold text-red-500 transition hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 dark:border-zinc-700 dark:bg-zinc-800"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
        )}
      </div>

      {open && !loading && (
        <div className="absolute z-50 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          {results.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-slate-400">
              {query ? "No results found" : "Type to search"}
            </div>
          ) : (
            results.map((opt) => {
              const isSelected = selected.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggle(opt)}
                  className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition hover:bg-slate-50 dark:hover:bg-zinc-800 ${isSelected ? "bg-emerald-50/50 dark:bg-emerald-900/10" : ""}`}
                >
                  <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${isSelected ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 dark:border-zinc-600"}`}>
                    {isSelected && (
                      <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate font-medium ${isSelected ? "text-emerald-700 dark:text-emerald-400" : "text-slate-800 dark:text-zinc-100"}`}>{opt.label}</p>
                    {opt.sub && <p className="truncate text-[11px] text-slate-400">{opt.sub}</p>}
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}