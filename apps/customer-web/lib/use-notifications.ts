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

/** Single source of truth for notifications. Polls every 15s, pauses in background. */
export function useNotifications(enabled = true) {
  const authed = typeof window !== "undefined" && !!getAccessToken();
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => api<NotifResponse>("/api/v1/notifications?limit=30"),
    enabled: enabled && authed,
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    staleTime: 10_000,
  });
}

/** Derive unread count from the main notifications query -- no extra API call. */
export function useUnreadCount() {
  const { data } = useQuery<NotifResponse>({
    queryKey: ["notifications"],
    queryFn: () => api<NotifResponse>("/api/v1/notifications?limit=30"),
    enabled: false,
    staleTime: Infinity,
  });
  return data?.unreadCount ?? 0;
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/api/v1/notifications/${id}`, { method: "PATCH" }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["notifications"] });
      const prev = qc.getQueryData<NotifResponse>(["notifications"]);
      if (prev) {
        qc.setQueryData<NotifResponse>(["notifications"], {
          ...prev,
          items: prev.items.map((n) => n.id === id ? { ...n, readAt: new Date().toISOString() } : n),
          unreadCount: Math.max(0, prev.unreadCount - 1),
        });
      }
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["notifications"], ctx.prev);
    },
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api("/api/v1/notifications/read-all", { method: "POST" }),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["notifications"] });
      const prev = qc.getQueryData<NotifResponse>(["notifications"]);
      if (prev) {
        const now = new Date().toISOString();
        qc.setQueryData<NotifResponse>(["notifications"], {
          ...prev,
          items: prev.items.map((n) => ({ ...n, readAt: n.readAt ?? now })),
          unreadCount: 0,
        });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["notifications"], ctx.prev);
    },
  });
}

