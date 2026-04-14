"use client";

import { formatInr } from "@fitmeals/utils";

type Props = {
  basePrice: string;
  compareAtPrice?: string | null;
};

export function ProductPriceBlock({ basePrice, compareAtPrice }: Props) {
  const hasDiscount = compareAtPrice && Number(compareAtPrice) > Number(basePrice);

  return (
    <div className="flex items-baseline gap-2.5">
      {hasDiscount && (
        <span className="text-base text-kcal-muted line-through">{formatInr(compareAtPrice)}</span>
      )}
      <span className="text-2xl font-bold text-kcal-charcoal">{formatInr(basePrice)}</span>
    </div>
  );
}
