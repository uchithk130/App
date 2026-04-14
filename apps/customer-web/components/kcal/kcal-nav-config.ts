import type { LucideIcon } from "lucide-react";
import { Bell, ClipboardList, Heart, Home, User } from "lucide-react";

export type KcalMainNavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  match: (pathname: string) => boolean;
  /** Home tab uses elevated “floating” treatment on mobile. */
  homeLift?: boolean;
};

export const kcalMainNavItems: readonly KcalMainNavItem[] = [
  { href: "/", icon: Home, label: "Home", match: (p) => p === "/", homeLift: true },
  { href: "/orders", icon: ClipboardList, label: "Orders", match: (p) => p.startsWith("/orders") },
  { href: "/favorites", icon: Heart, label: "Favorites", match: (p) => p.startsWith("/favorites") },
  { href: "/notifications", icon: Bell, label: "Alerts", match: (p) => p.startsWith("/notifications") },
  { href: "/profile", icon: User, label: "Profile", match: (p) => p.startsWith("/profile") },
];
