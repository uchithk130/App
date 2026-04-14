"use client";

import * as React from "react";
import { DesktopSidebarNav } from "./desktop-sidebar-nav";
import { CustomerBottomNav } from "@/components/customer/customer-bottom-nav";

/**
 * Mobile: floating bottom nav (reference-style). Desktop: left sidebar + content.
 */
export function KcalAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DesktopSidebarNav />
      <div className="relative z-10 min-h-dvh bg-[#f7f8f7] lg:pl-56 lg:bg-gradient-to-br lg:from-emerald-50/30 lg:via-white lg:to-slate-50">
        {children}
      </div>
      <CustomerBottomNav />
    </>
  );
}
