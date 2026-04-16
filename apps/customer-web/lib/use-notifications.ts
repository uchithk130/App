"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-store";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
};

type NotifResponse = { items: Notification[]; unreadCount: number };
type CountResponse = { count: number };

/**
 * Fetch full notification list. Refetches every 30s.
 */
export function useNotifications(enabled = true) {
  const authed = typeof window !== "undefined" && !!getAccessToken();
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => api<NotifResponse>("/api/v1/notifications?limit=30"),
    enabled: enabled && authed,
    refetchInterval: 5_000,
    staleTime: 3_000,
  });
}

/**
 * Lightweight unread count. Polls every 30s. Use for badge only.
 */
export function useUnreadCount() {
  const authed = typeof window !== "undefined" && !!getAccessToken();
  return useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: () => api<CountResponse>("/api/v1/notifications/unread-count"),
    enabled: authed,
    refetchInterval: 5_000,
    staleTime: 3_000,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/api/v1/notifications/${id}`, { method: "PATCH" }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["notifications"] });
      void qc.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api("/api/v1/notifications/read-all", { method: "POST" }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["notifications"] });
      void qc.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });
}
