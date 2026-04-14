"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { KcalAppLayout } from "@/components/kcal/kcal-app-layout";
import { KcalViewportShell } from "@/components/kcal/kcal-viewport-shell";
import { API_BASE } from "@/lib/config";

type Cat = { id: string; name: string; slug: string; iconUrl: string | null };

async function fetchCats(): Promise<{ items: Cat[] }> {
  const res = await fetch(`${API_BASE}/api/v1/categories`);
  if (!res.ok) throw new Error("Failed");
  return res.json() as Promise<{ items: Cat[] }>;
}

export default function CategoriesPage() {
  const q = useQuery({ queryKey: ["categories-all"], queryFn: fetchCats });
  const items = q.data?.items ?? [];

  return (
    <KcalViewportShell>
      <KcalAppLayout>
        <div className="min-h-dvh bg-white pb-28 pt-3 lg:pb-12">
          <header className="mb-6 flex items-center gap-3 px-4">
            <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-slate-100">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="flex-1 text-center text-lg font-bold text-slate-900">Categories</h1>
            <span className="w-10" />
          </header>

          {q.isLoading ? (
            <div className="grid grid-cols-4 gap-2.5 px-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="aspect-square animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2.5 px-4 sm:gap-3 lg:grid-cols-6">
              {items.map((c) => (
                <Link
                  key={c.id}
                  href={`/meals?categorySlug=${encodeURIComponent(c.slug)}`}
                  className="flex flex-col items-center rounded-2xl bg-white py-3 shadow-sm ring-1 ring-slate-100 transition hover:ring-emerald-200"
                >
                  <div className="mb-1.5 flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-emerald-50">
                    {c.iconUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.iconUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-700">{c.name.slice(0, 2)}</span>
                    )}
                  </div>
                  <span className="line-clamp-2 px-1 text-center text-[10px] font-semibold leading-tight text-slate-800">{c.name}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </KcalAppLayout>
    </KcalViewportShell>
  );
}
