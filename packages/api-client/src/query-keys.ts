export const queryKeys = {
  me: ["auth", "me"] as const,
  meals: (params?: Record<string, string | undefined>) => ["meals", params ?? {}] as const,
  meal: (slug: string) => ["meal", slug] as const,
  cart: ["cart"] as const,
  orders: (cursor?: string) => ["orders", cursor ?? "first"] as const,
  order: (id: string) => ["order", id] as const,
  adminOverview: ["admin", "overview"] as const,
  riderOrders: (status?: string) => ["rider", "orders", status ?? "all"] as const,
  riderWallet: ["rider", "wallet"] as const,
};
