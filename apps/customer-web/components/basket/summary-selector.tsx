"use client";

import { ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Props = {
  icon: LucideIcon;
  label: string;
  value: string;
  onClick?: () => void;
  badge?: string | null;
};

export function SummarySelector({ icon: Icon, label, value, onClick, badge }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3.5 text-left shadow-sm ring-1 ring-slate-100 transition hover:ring-emerald-200 active:bg-slate-50"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50">
        <Icon className="h-4.5 w-4.5 text-emerald-600" strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="truncate text-sm font-semibold text-slate-900">{value}</p>
      </div>
      {badge && (
        <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
          {badge}
        </span>
      )}
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
    </button>
  );
}
