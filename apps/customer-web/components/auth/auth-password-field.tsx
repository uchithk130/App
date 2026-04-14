"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  /** Omit to hide the label row (use when label is rendered externally). */
  label?: string;
  error?: string;
};

export const AuthPasswordField = React.forwardRef<HTMLInputElement, Props>(function AuthPasswordField(
  { id, label, error, className = "", autoComplete = "current-password", ...rest },
  ref,
) {
  const [visible, setVisible] = React.useState(false);
  const errId = `${id}-error`;

  return (
    <div className="space-y-2">
      {label ? (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      ) : null}
      <div className="relative">
        <input
          ref={ref}
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errId : undefined}
          className={`w-full rounded-2xl border bg-white py-3.5 pl-4 pr-12 text-base text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 disabled:cursor-not-allowed disabled:bg-slate-50 ${error ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : "border-slate-200"} ${className}`}
          {...rest}
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
      {error ? (
        <p id={errId} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
});
