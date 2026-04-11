/**
 * Formats a monetary amount for display.
 *
 * - NGN (default): renders as ₦100,000 — no decimal places (kobo not shown in UI)
 * - Other currencies: uses the browser/Node Intl API with the supplied currency code
 *
 * When international markets are added, pass the booking's `currency` field here
 * and every display will automatically render in the correct symbol/format.
 *
 * @example
 *   formatPrice(125000)           // "₦125,000"
 *   formatPrice(125000, "NGN")    // "₦125,000"
 *   formatPrice(99, "USD")         // "$99" (future multi-currency)
 *   formatPrice(85, "GBP")        // "£85" (future multi-currency)
 */
export function formatPrice(amount: number | string, currency = "NGN"): string {
  const n = Number(amount);
  if (isNaN(n)) return "—";

  if (currency === "NGN") {
    return `₦${Math.round(n).toLocaleString("en-NG")}`;
  }

  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}
