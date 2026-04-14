"use client";

type Props = {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  size?: "sm" | "md";
};

export function CartQtyStepper({ value, onChange, min = 1, max = 50, disabled, size = "sm" }: Props) {
  const btn =
    size === "sm"
      ? "flex h-8 w-8 items-center justify-center rounded-full text-lg font-medium text-kcal-charcoal transition hover:bg-kcal-mint disabled:opacity-40"
      : "flex h-10 w-10 items-center justify-center rounded-full text-xl font-medium text-kcal-charcoal transition hover:bg-kcal-mint disabled:opacity-40";
  const track = size === "sm" ? "h-8 min-w-[7.5rem]" : "h-10 min-w-[9rem]";

  return (
    <div
      className={`inline-flex items-center justify-center gap-0 rounded-full border border-kcal-cream bg-white shadow-sm ${track}`}
      role="group"
      aria-label="Quantity"
    >
      <button
        type="button"
        className={btn}
        disabled={disabled || value <= min}
        aria-label="Decrease quantity"
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        −
      </button>
      <span className="min-w-[1.75rem] text-center text-sm font-bold tabular-nums text-kcal-charcoal">{value}</span>
      <button
        type="button"
        className={btn}
        disabled={disabled || value >= max}
        aria-label="Increase quantity"
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        +
      </button>
    </div>
  );
}
