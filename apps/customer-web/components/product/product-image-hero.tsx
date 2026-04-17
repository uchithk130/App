"use client";

import * as React from "react";
import { ArrowLeft, Heart, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@fitmeals/ui";

type Props = {
  images: { url: string }[];
  alt: string;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  backHref?: string;
  promoLabel?: string | null;
};

export function ProductImageHero({ images, alt, isFavorite, onToggleFavorite, backHref = "/menu", promoLabel }: Props) {
  const [idx, setIdx] = React.useState(0);
  const [loaded, setLoaded] = React.useState(false);
  const src = images[idx]?.url;

  return (
    <div className="relative w-full">
      {/* Image area */}
      <div className="relative aspect-[4/3.2] w-full overflow-hidden bg-kcal-cream lg:aspect-[4/3] lg:rounded-2xl">
        {!loaded && (
          <Skeleton className="absolute inset-0 rounded-none lg:rounded-2xl" />
        )}
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt}
            className={`h-full w-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setLoaded(true)}
            data-testid="product-hero-img"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-kcal-muted">
            <ShoppingBag className="h-16 w-16 opacity-30" />
          </div>
        )}
      </div>

      {/* Overlay controls */}
      <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between p-4">
        <Link
          href={backHref}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm transition hover:bg-white"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5 text-kcal-charcoal" />
        </Link>
        {onToggleFavorite && (
          <button
            type="button"
            onClick={onToggleFavorite}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm transition hover:bg-white"
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart
              className={`h-5 w-5 transition ${isFavorite ? "fill-rose-500 text-rose-500" : "text-kcal-charcoal"}`}
              strokeWidth={2}
            />
          </button>
        )}
      </div>

      {/* Promo tag overlay */}
      {promoLabel && (
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 via-black/50 to-transparent px-4 pb-3 pt-6">
          <span className="text-xs font-extrabold uppercase tracking-wider text-white drop-shadow-sm">
            {promoLabel}
          </span>
        </div>
      )}

      {/* Image pagination dots */}
      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { setIdx(i); setLoaded(false); }}
              className={`h-2 rounded-full transition-all ${i === idx ? "w-6 bg-white shadow" : "w-2 bg-white/60"}`}
              aria-label={`Image ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
