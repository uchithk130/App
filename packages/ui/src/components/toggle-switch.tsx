"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  label,
  className,
}: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "group relative inline-flex h-[22px] w-[42px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        checked
          ? "bg-emerald-500 focus-visible:ring-emerald-400"
          : "bg-slate-200 focus-visible:ring-slate-400",
        disabled && "cursor-not-allowed opacity-40",
        !disabled && !checked && "hover:bg-slate-300",
        !disabled && checked && "hover:bg-emerald-600",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none inline-block h-[18px] w-[18px] rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out",
          checked ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  );
}
