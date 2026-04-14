"use client";

import { Flame, Beef, Wheat, Droplets, Leaf } from "lucide-react";

type NutritionData = {
  calories: number;
  proteinG: string;
  carbG: string;
  fatG: string;
  fiberG: string;
};

type Props = {
  nutrition: NutritionData | null;
};

const items = [
  { key: "calories" as const, label: "Calories", unit: "kcal", icon: Flame, color: "bg-orange-50 text-orange-600 ring-orange-100" },
  { key: "proteinG" as const, label: "Protein", unit: "g", icon: Beef, color: "bg-emerald-50 text-emerald-700 ring-emerald-100" },
  { key: "carbG" as const, label: "Carbs", unit: "g", icon: Wheat, color: "bg-amber-50 text-amber-700 ring-amber-100" },
  { key: "fatG" as const, label: "Fat", unit: "g", icon: Droplets, color: "bg-rose-50 text-rose-600 ring-rose-100" },
  { key: "fiberG" as const, label: "Fiber", unit: "g", icon: Leaf, color: "bg-teal-50 text-teal-700 ring-teal-100" },
] as const;

export function NutritionGrid({ nutrition }: Props) {
  if (!nutrition) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-kcal-charcoal">Nutrition Information</h3>
      <div className="grid grid-cols-5 gap-2">
        {items.map((item) => {
          const raw = item.key === "calories" ? nutrition.calories : nutrition[item.key];
          if (raw == null || raw === "" || raw === "0" || raw === "0.00") return null;
          const value = item.key === "calories" ? String(nutrition.calories) : nutrition[item.key];
          const Icon = item.icon;
          return (
            <div
              key={item.key}
              className="flex flex-col items-center rounded-xl bg-[#f0f7ef] px-1.5 py-3 ring-1 ring-emerald-100/60"
            >
              <div className={`mb-1.5 flex h-8 w-8 items-center justify-center rounded-full ${item.color} ring-1`}>
                <Icon className="h-4 w-4" strokeWidth={2} />
              </div>
              <span className="text-sm font-bold text-kcal-charcoal tabular-nums">
                {value}
              </span>
              <span className="text-[10px] font-medium text-kcal-muted">{item.unit}</span>
              <span className="mt-0.5 text-[10px] font-semibold text-slate-500">{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
