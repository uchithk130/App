"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ClipboardList, Bell, Wallet, User } from "lucide-react";
import { useUnreadCount } from "@/lib/use-notifications";

const tabs = [
  { href: "/", icon: Home, label: "Home", match: (p: string) => p === "/" },
  { href: "/orders", icon: ClipboardList, label: "Orders", match: (p: string) => p.startsWith("/orders") },
  { href: "/notifications", icon: Bell, label: "Alerts", match: (p: string) => p.startsWith("/notifications") },
  { href: "/wallet", icon: Wallet, label: "Wallet", match: (p: string) => p.startsWith("/wallet") },
  { href: "/profile", icon: User, label: "Profile", match: (p: string) => p.startsWith("/profile") },
] as const;

export function RiderBottomNav() {
const pathname = usePathname();
const unread = useUnreadCount();
const unreadCount = unread.data?.count ?? 0;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="mx-auto max-w-lg px-3 pb-2 pt-1">
        <div className="flex items-center justify-around rounded-2xl bg-white px-1 py-2 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.1)] ring-1 ring-slate-100">
          {tabs.map((t) => {
            const active = t.match(pathname);
            const Icon = t.icon;
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[10px] font-semibold transition ${
                  active ? "text-amber-600" : "text-slate-400"
                }`}
              >
                <span className={`relative flex h-8 w-8 items-center justify-center rounded-xl transition ${
                  active ? "bg-amber-100 text-amber-600" : ""
                }`}>
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 1.8} />
                  {t.href === "/notifications" && unreadCount > 0 && (
                    <span className="absolute -right-1 -top-0.5 flex min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 py-0.5 text-[9px] font-bold leading-none text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </span>
                <span>{t.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
