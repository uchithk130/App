"use client";

import * as React from "react";
import { API_BASE } from "@/lib/config";
import { getAccessToken } from "@/lib/auth-store";
import { extractMealsKeyFromUrl } from "@/lib/s3-meal-url";

type Props = {
  coverUrl: string | null;
  alt: string;
  className?: string;
};

/**
 * Meal thumbnail for admin grid: private S3 objects under `meals/` load via authenticated API;
 * other URLs use a normal &lt;img&gt; (public CDN, Unsplash mock, etc.).
 */
export function AdminMealCover({ coverUrl, alt, className }: Props) {
  const [blobSrc, setBlobSrc] = React.useState<string | null>(null);
  const [directBroken, setDirectBroken] = React.useState(false);
  const blobRef = React.useRef<string | null>(null);

  const revokeBlob = React.useCallback(() => {
    if (blobRef.current?.startsWith("blob:")) URL.revokeObjectURL(blobRef.current);
    blobRef.current = null;
  }, []);

  const trimmed = coverUrl?.trim() ?? "";
  const mealsKey = trimmed ? extractMealsKeyFromUrl(trimmed) : null;
  const useDirect = Boolean(trimmed && !mealsKey);

  React.useEffect(() => {
    setDirectBroken(false);
  }, [trimmed]);

  React.useEffect(() => {
    revokeBlob();
    setBlobSrc(null);
    if (!trimmed || !mealsKey) return;

    let cancelled = false;
    void (async () => {
      const token = getAccessToken();
      if (!token) return;
      try {
        const r = await fetch(`${API_BASE}/api/v1/admin/uploads/read?key=${encodeURIComponent(mealsKey)}`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });
        if (!r.ok || cancelled) return;
        const blob = await r.blob();
        const u = URL.createObjectURL(blob);
        blobRef.current = u;
        if (!cancelled) setBlobSrc(u);
      } catch {
        /* ignore */
      }
    })();

    return () => {
      cancelled = true;
      revokeBlob();
    };
  }, [trimmed, mealsKey, revokeBlob]);

  const showSrc = blobSrc ?? (useDirect ? trimmed : null);

  return (
    <div
      className={`relative aspect-[4/3] w-full overflow-hidden bg-[#fdf2f8] ${className ?? ""}`}
      data-testid="admin-meal-cover"
    >
      {showSrc && !(useDirect && directBroken) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={showSrc}
          alt={alt}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => {
            if (useDirect) setDirectBroken(true);
          }}
        />
      ) : null}
    </div>
  );
}
