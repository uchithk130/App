"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { MOCK_NOTIFICATIONS } from "@/lib/admin-header-mock";

export default function AdminNotificationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-2xl border border-orange-100 bg-orange-50/80 px-4 py-3 text-sm text-slate-700">
        <Bell className="mt-0.5 h-5 w-5 shrink-0 text-admin-orange" aria-hidden />
        <p>
          Preview notifications. Wire <code className="rounded bg-white px-1 py-0.5 text-xs">/api/v1/admin/...</code> when
          your backend exposes alerts.
        </p>
      </div>
      <ul className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        {MOCK_NOTIFICATIONS.map((n) => (
          <li key={n.id} className="border-b border-slate-100 last:border-0">
            <Link href={n.href} className="block px-5 py-4 transition hover:bg-admin-canvas/70">
              <div className="font-semibold text-slate-900">{n.title}</div>
              {n.subtitle ? <div className="mt-0.5 text-sm text-slate-500">{n.subtitle}</div> : null}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
