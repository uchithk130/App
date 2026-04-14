"use client";

import { Check } from "lucide-react";

type Step = {
  label: string;
  time?: string;
  done: boolean;
  active: boolean;
};

type Props = {
  steps: Step[];
};

export function ProgressTracker({ steps }: Props) {
  return (
    <div className="space-y-0">
      {steps.map((step, i) => (
        <div key={step.label} className="flex gap-3">
          {/* Timeline dot + line */}
          <div className="flex flex-col items-center">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition ${
                step.done
                  ? "border-emerald-500 bg-emerald-500"
                  : step.active
                  ? "border-emerald-500 bg-white"
                  : "border-slate-200 bg-white"
              }`}
            >
              {step.done ? (
                <Check className="h-4 w-4 text-white" strokeWidth={3} />
              ) : step.active ? (
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              ) : null}
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-0.5 flex-1 min-h-[2rem] ${
                  step.done ? "bg-emerald-500" : "bg-slate-200"
                }`}
              />
            )}
          </div>

          {/* Content */}
          <div className="pb-5 pt-0.5">
            <p
              className={`text-sm font-semibold ${
                step.done || step.active ? "text-slate-900" : "text-slate-400"
              }`}
            >
              {step.label}
            </p>
            {step.time && (
              <p className="text-xs text-slate-400">{step.time}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
