"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { formatInr } from "@fitmeals/utils";

export type AddOnItem = {
  id: string;
  name: string;
  price: number;
  parentGroup?: string;
  required?: boolean;
};

export type AddOnGroup = {
  label: string;
  items: AddOnItem[];
};

type Props = {
  groups: AddOnGroup[];
  selected: Set<string>;
  onToggle: (id: string) => void;
};

export function AddOnOptionList({ groups, selected, onToggle }: Props) {
  if (!groups.length) return null;

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.label}>
          <h3 className="mb-2.5 text-sm font-bold text-kcal-charcoal">{group.label}</h3>
          <div className="divide-y divide-slate-100 rounded-xl bg-white ring-1 ring-slate-100">
            {group.items.map((item) => {
              const isSelected = selected.has(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onToggle(item.id)}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-emerald-50/30 active:bg-emerald-50/50"
                >
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-500"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                  </div>
                  <span className="flex-1 text-sm font-medium text-kcal-charcoal">{item.name}</span>
                  <span className="text-sm font-semibold text-kcal-muted">
                    +{formatInr(item.price)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
