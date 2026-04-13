// app/api/exchange-rate/route.ts
// Server-side cached exchange rate endpoint.
// Uses open.er-api.com — free tier, no API key, updates every 24 h.
// Next.js caches this response on the server for 1 hour.

export const revalidate = 3600; // 1-hour ISR cache

const FALLBACK_NGN_PER_USD = 1600; // Conservative fallback if API is unreachable

export async function GET() {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 3600 },
    });

    if (!res.ok) throw new Error("Rate fetch failed");

    const data = await res.json();
    const ngnPerUsd: number = data.rates?.NGN;

    if (!ngnPerUsd || typeof ngnPerUsd !== "number") {
      throw new Error("NGN rate missing from response");
    }

    return Response.json({
      ngnPerUsd,
      updatedAt: data.time_last_update_utc ?? null,
    });
  } catch {
    // Return fallback — display-only, never used for charging
    return Response.json({
      ngnPerUsd: FALLBACK_NGN_PER_USD,
      updatedAt: null,
      fallback: true,
    });
  }
}
