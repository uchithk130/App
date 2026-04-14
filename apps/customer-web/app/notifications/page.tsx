"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { KcalAppLayout } from "@/components/kcal/kcal-app-layout";
import { KcalViewportShell } from "@/components/kcal/kcal-viewport-shell";

export default function NotificationsPage() {
  return (
    <KcalViewportShell>
      <KcalAppLayout>
        <div className="min-h-dvh bg-white px-4 pb-28 pt-10 lg:pb-12">
          <h1 className="text-center text-lg font-bold text-slate-900">Alerts</h1>
          <div className="mt-12 flex flex-col items-center text-center">
            <Bell className="mb-4 h-12 w-12 text-slate-300" strokeWidth={1.5} />
            <p className="text-sm text-slate-500">You&apos;re all caught up. Order updates will appear here.</p>
            <Link href="/orders" className="mt-6 text-sm font-semibold text-emerald-700 underline">
              View orders
            </Link>
          </div>
        </div>
      </KcalAppLayout>
    </KcalViewportShell>
  );
}
