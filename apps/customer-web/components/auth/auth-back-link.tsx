"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

type Props = {
  href: string;
  children: React.ReactNode;
};

export function AuthBackLink({ href, children }: Props) {
  return (
    <Link
      href={href}
      className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-emerald-800"
    >
      <ChevronLeft className="h-4 w-4" aria-hidden />
      {children}
    </Link>
  );
}
