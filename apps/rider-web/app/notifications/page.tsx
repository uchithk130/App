"use client";

"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Bell, CheckCheck } from "lucide-react";
import { useNotifications, useMarkRead, useMarkAllRead } from "@/lib/use-notifications";

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return mins + "m ago";
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + "h ago";
  return Math.floor(hrs / 24) + "d ago";
}

export default function RiderNotificationsPage() {
  const notifs = useNotifications();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const items = notifs.data?.items ?? [];
  const unread = notifs.data?.unreadCount ?? 0;

  return (
    <div className="min-h-dvh bg-slate-50 pb-28">
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/95 backdrop-blur-md">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-slate-100">
            <ArrowLeft className="h-5 w-5 text-slate-800" />
          </Link>
          <h1 className="flex-1 text-lg font-bold text-slate-900">Notifications</h1>
          {unread > 0 && (
            <button type="button" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending} className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1.5 text-[11px] font-bold text-amber-600 transition hover:bg-amber-100 disabled:opacity-50">
              <CheckCheck className="h-3.5 w-3.5" /> Mark all read
            </button>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 pt-4">
        {notifs.isLoading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-white" />)}</div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center pt-20 text-center">
            <Bell className="mb-4 h-12 w-12 text-slate-300" strokeWidth={1.5} />
            <p className="text-sm font-semibold text-slate-600">No notifications</p>
            <p className="mt-1 text-xs text-slate-400">Delivery assignments will appear here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => { if (!n.readAt) markRead.mutate(n.id); }}
                className={`flex w-full items-start gap-3 rounded-xl p-3.5 text-left transition ${n.readAt ? "bg-white" : "bg-amber-50/50 ring-1 ring-amber-100"}`}
              >
                <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${n.readAt ? "bg-slate-100 text-slate-400" : "bg-amber-100 text-amber-600"}`}>
                  <Bell className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm ${n.readAt ? "text-slate-700" : "font-semibold text-slate-900"}`}>{n.title}</p>
                  {n.body && <p className="mt-0.5 text-xs text-slate-500">{n.body}</p>}
                  <p className="mt-1 text-[10px] text-slate-400">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.readAt && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-500" />}
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
