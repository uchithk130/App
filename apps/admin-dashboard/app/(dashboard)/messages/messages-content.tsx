"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { MOCK_MESSAGES } from "@/lib/admin-header-mock";

export function MessagesContent() {
  const searchParams = useSearchParams();
  const thread = searchParams.get("thread");

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-2xl border border-orange-100 bg-orange-50/80 px-4 py-3 text-sm text-slate-700">
        <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-admin-orange" aria-hidden />
        <p>
          Internal messages inbox. Thread{" "}
          <span className="font-mono text-xs">{thread ? `"${thread}"` : "— pick from list or header menu"}</span>.
        </p>
      </div>
      <ul className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        {MOCK_MESSAGES.map((m) => (
          <li key={m.id} className="border-b border-slate-100 last:border-0">
            <Link
              href={`/messages?thread=${encodeURIComponent(m.id)}`}
              className={`block px-5 py-4 transition hover:bg-admin-canvas/70 ${thread === m.id ? "bg-orange-50/50" : ""}`}
            >
              <div className="font-semibold text-slate-900">{m.title}</div>
              {m.subtitle ? <div className="mt-0.5 text-sm text-slate-500">{m.subtitle}</div> : null}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
