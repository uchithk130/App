"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { kcalMainNavItems } from "@/components/kcal/kcal-nav-config";
import { useUnreadCount } from "@/lib/use-notifications";

export function CustomerBottomNav() {
const pathname = usePathname();
const unread = useUnreadCount();
const unreadCount = unread.data?.count ?? 0;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Main"
    >
      <div className="mx-auto max-w-kcal px-3 pb-2 pt-1">
        <div className="relative flex items-end justify-between rounded-[1.75rem] bg-white px-1 py-2 shadow-[0_-4px_24px_-4px_rgba(15,23,42,0.12)] ring-1 ring-slate-100">
          {kcalMainNavItems.map((t) => {
            const active = t.match(pathname);
            const Icon = t.icon;
            const homeLift = active && t.homeLift;
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`relative flex min-w-[3rem] flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[10px] font-semibold transition-colors ${
                  active ? "text-emerald-600" : "text-slate-400 hover:text-slate-600"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {homeLift ? (
                  <span className="absolute -top-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
                    <Icon className="h-6 w-6" strokeWidth={2.2} aria-hidden />
                  </span>
                ) : (
                  <span className="relative flex h-9 w-9 items-center justify-center">
                    <Icon className="h-6 w-6" strokeWidth={active ? 2.4 : 1.8} aria-hidden />
                    {t.href === "/notifications" && unreadCount > 0 && (
                      <span className="absolute -right-0.5 top-0 flex min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 py-0.5 text-[9px] font-bold leading-none text-white">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </span>
                )}
                <span className={homeLift ? "mt-7" : active ? "mt-0.5" : ""}>{t.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
