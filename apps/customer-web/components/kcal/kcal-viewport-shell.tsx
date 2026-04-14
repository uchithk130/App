import * as React from "react";

type Props = {
  children: React.ReactNode;
  /** Inner surface (e.g. splash green vs default white). */
  innerClassName?: string;
};

/**
 * Mobile: optional “device” frame (rounded column on gray). Desktop: full viewport width — no phone shell.
 */
export function KcalViewportShell({ children, innerClassName = "bg-white" }: Props) {
  return (
    <div className="min-h-dvh bg-neutral-100 max-lg:flex max-lg:justify-center max-lg:px-0 lg:bg-white">
      <div
        className={`relative min-h-dvh w-full max-lg:max-w-kcal max-lg:overflow-x-hidden max-lg:rounded-[2.25rem] max-lg:shadow-2xl max-lg:ring-1 max-lg:ring-black/10 lg:mx-0 lg:max-w-none lg:rounded-none lg:shadow-none lg:ring-0 lg:overflow-visible ${innerClassName}`}
      >
        {children}
      </div>
    </div>
  );
}
