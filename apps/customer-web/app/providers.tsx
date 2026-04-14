"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getAccessToken } from "@/lib/auth-store";
import { setCustomerLoggedInCookie } from "@/lib/kcal-gate-cookies";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());

  useEffect(() => {
    if (getAccessToken()) setCustomerLoggedInCookie();
  }, []);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
