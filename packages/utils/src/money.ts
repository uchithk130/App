const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

export function formatInr(amount: number | string): string {
  const n = typeof amount === "string" ? Number.parseFloat(amount) : amount;
  if (Number.isNaN(n)) return INR.format(0);
  return INR.format(n);
}
