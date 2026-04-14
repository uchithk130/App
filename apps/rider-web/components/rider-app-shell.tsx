"use client";

import { usePathname } from "next/navigation";
import { RiderBottomNav } from "./rider-bottom-nav";

const NO_NAV = ["/login", "/register"];

export function RiderAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showNav = !NO_NAV.some((p) => pathname.startsWith(p));

  return (
    <div className="mx-auto max-w-lg min-h-dvh bg-rider-surface">
      {children}
      {showNav && <RiderBottomNav />}
    </div>
  );
}
