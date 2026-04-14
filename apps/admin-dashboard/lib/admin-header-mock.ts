export type AdminHeaderListItem = { id: string; title: string; subtitle?: string; href: string };

export const MOCK_NOTIFICATIONS: AdminHeaderListItem[] = [
  { id: "n1", title: "New order #1042", subtitle: "2 min ago · Paid", href: "/orders" },
  { id: "n2", title: "Low stock: Protein bowl", subtitle: "1 hr ago", href: "/meals" },
  { id: "n3", title: "Rider assigned #1038", subtitle: "3 hr ago", href: "/delivery" },
];

export const MOCK_MESSAGES: AdminHeaderListItem[] = [
  { id: "m1", title: "Kitchen lead", subtitle: "Prep window OK for lunch rush", href: "/messages?thread=m1" },
  { id: "m2", title: "Dispatch", subtitle: "2 riders available near Zone B", href: "/messages?thread=m2" },
];
