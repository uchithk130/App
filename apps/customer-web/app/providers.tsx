"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { getAccessToken } from "@/lib/auth-store";
import { setCustomerLoggedInCookie } from "@/lib/kcal-gate-cookies";

let _qc: QueryClient | null = null;

/** Get the app-wide QueryClient (for cache clearing on logout). */
export function getQueryClient(): QueryClient | null {
  return _qc;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const clientRef = useRef<QueryClient | null>(null);
  if (!clientRef.current) {
    clientRef.current = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 10_000,
          refetchOnWindowFocus: false,
          retry: 1,
        },
      },
    });
    _qc = clientRef.current;
  }

  useEffect(() => {
    if (getAccessToken()) setCustomerLoggedInCookie();
  }, []);

  return <QueryClientProvider client={clientRef.current}>{children}</QueryClientProvider>;
}
