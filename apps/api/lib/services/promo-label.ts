/**
 * Generates a display label from a structured promo tag.
 *
 * Backend returns both raw data AND the generated label so the frontend
 * does not need to duplicate formatting logic across multiple clients.
 */

type PromoTagConfig = Record<string, unknown>;

const INR = "\u20B9"; // ?

export function generatePromoLabel(
  type: string | null | undefined,
  config: PromoTagConfig | null | undefined,
  textOverride: string | null | undefined,
): string | null {
  if (textOverride) return textOverride;
  if (!type) return null;

  const num = (key: string): number | null => {
    const v = config?.[key];
    if (v == null) return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  };

  switch (type) {
    case "CUSTOM_TEXT":
      return (config?.text as string) ?? null;

    case "ITEMS_AT_PRICE": {
      const price = num("price");
      return price != null ? `ITEMS AT ${INR}${price}` : null;
    }

    case "PERCENT_OFF_ABOVE_AMOUNT": {
      const pct = num("percent");
      const min = num("minAmount");
      if (pct == null) return null;
      return min != null
        ? `${pct}% OFF ABOVE ${INR}${min}`
        : `${pct}% OFF`;
    }

    case "PERCENT_OFF_UPTO_AMOUNT": {
      const pct = num("percent");
      const max = num("maxDiscount");
      if (pct == null) return null;
      return max != null
        ? `${pct}% OFF UPTO ${INR}${max}`
        : `${pct}% OFF`;
    }

    case "FLAT_OFF": {
      const amt = num("amount");
      return amt != null ? `FLAT ${INR}${amt} OFF` : null;
    }

    case "FREE_DELIVERY":
      return "FREE DELIVERY";

    default:
      return null;
  }
}
