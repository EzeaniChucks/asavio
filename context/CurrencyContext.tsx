"use client";

// context/CurrencyContext.tsx
// Provides exchange rate and currency display preference to all client components.
// - Reads the geo cookie set by middleware to detect diaspora users
// - Fetches the NGN/USD rate from our server-cached API route
// - Allows manual toggle (₦ / $), persisted in localStorage

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";

interface CurrencyContextValue {
  /** True when the user's region is outside Nigeria OR they have manually toggled USD */
  showUsd: boolean;
  /** Whether the user is detected as being outside Nigeria */
  isDiaspora: boolean;
  /** NGN units per 1 USD (e.g. 1600 means ₦1,600 = $1) */
  ngnPerUsd: number | null;
  /** Toggle between ₦ and $ display — stored in localStorage */
  toggleCurrency: () => void;
  /**
   * Convert an NGN amount to a formatted USD string, e.g. "~$94".
   * Returns null if the rate is not yet loaded.
   * DISPLAY ONLY — never used for charging.
   */
  toUsd: (ngnAmount: number | string) => string | null;
}

const CurrencyContext = createContext<CurrencyContextValue>({
  showUsd: false,
  isDiaspora: false,
  ngnPerUsd: null,
  toggleCurrency: () => {},
  toUsd: () => null,
});

function readCountryCookie(): string {
  if (typeof document === "undefined") return "NG";
  const match = document.cookie.match(/(?:^|;\s*)asavio_country=([^;]+)/);
  return match ? match[1] : "NG";
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [ngnPerUsd, setNgnPerUsd] = useState<number | null>(null);
  const [isDiaspora, setIsDiaspora] = useState(false);
  const [showUsd, setShowUsd] = useState(false);

  // Detect diaspora and load saved preference on mount
  useEffect(() => {
    const country = readCountryCookie();
    const diaspora = country !== "NG";
    setIsDiaspora(diaspora);

    // Load persisted preference; diaspora users default to USD on first visit
    const saved = localStorage.getItem("asavio_currency");
    if (saved === "USD") {
      setShowUsd(true);
    } else if (saved === "NGN") {
      setShowUsd(false);
    } else {
      // No saved preference — default to USD for diaspora, NGN for locals
      setShowUsd(diaspora);
    }
  }, []);

  // Fetch rate only when needed (diaspora user or user toggled to USD)
  useEffect(() => {
    fetch("/api/exchange-rate")
      .then((r) => r.json())
      .then((d) => setNgnPerUsd(d.ngnPerUsd ?? null))
      .catch(() => {});
  }, []);

  const toggleCurrency = useCallback(() => {
    setShowUsd((prev) => {
      const next = !prev;
      localStorage.setItem("asavio_currency", next ? "USD" : "NGN");
      return next;
    });
  }, []);

  const toUsd = useCallback(
    (ngnAmount: number | string): string | null => {
      if (!ngnPerUsd) return null;
      const n = Number(ngnAmount);
      if (isNaN(n)) return null;
      const usd = Math.round(n / ngnPerUsd);
      return `~$${usd.toLocaleString("en-US")}`;
    },
    [ngnPerUsd]
  );

  return (
    <CurrencyContext.Provider
      value={{ showUsd, isDiaspora, ngnPerUsd, toggleCurrency, toUsd }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
