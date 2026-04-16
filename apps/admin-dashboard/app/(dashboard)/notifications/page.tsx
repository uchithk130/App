"use client";

import { Bell, CheckCheck } from "lucide-react";
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

export default function AdminNotificationsPage() {
  const notifs = useNotifications();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const items = notifs.data?.items ?? [];
  const unread = notifs.data?.unreadCount ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-50">Notifications</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400">{unread} unread</p>
        </div>
        {unread > 0 && (
          <button type="button" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending} className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-600 transition hover:bg-emerald-100 disabled:opacity-50">
            <CheckCheck className="h-4 w-4" /> Mark all read
          </button>
        )}
      </div>

      {notifs.isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-white dark:bg-zinc-800" />)}</div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-200 py-16 text-center dark:border-zinc-700">
          <Bell className="mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm font-semibold text-slate-600 dark:text-zinc-300">No notifications</p>
          <p className="mt-1 text-xs text-slate-400">Platform alerts will appear here.</p>
        </div>
      ) : (
        <ul className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
          {items.map((n) => (
            <li key={n.id} className={`border-b border-slate-100 last:border-0 dark:border-zinc-800 ${!n.readAt ? "bg-orange-50/40 dark:bg-orange-900/10" : ""}`}>
              <button type="button" onClick={() => { if (!n.readAt) markRead.mutate(n.id); }} className="flex w-full items-start gap-3 px-5 py-4 text-left transition hover:bg-slate-50/50 dark:hover:bg-zinc-800/50">
                <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${!n.readAt ? "bg-admin-orange/10 text-admin-orange" : "bg-slate-100 text-slate-400 dark:bg-zinc-800"}`}>
                  <Bell className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm ${!n.readAt ? "font-semibold text-slate-900 dark:text-zinc-100" : "text-slate-700 dark:text-zinc-300"}`}>{n.title}</p>
                  {n.body && <p className="mt-0.5 text-xs text-slate-500">{n.body}</p>}
                  <p className="mt-1 text-[10px] text-slate-400">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.readAt && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-admin-orange" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}