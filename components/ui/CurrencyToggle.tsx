"use client";

// components/ui/CurrencyToggle.tsx
// Small ₦ / $ pill shown in the Navbar for all users once the exchange rate loads.
// Allows anyone — diaspora or local — to toggle the price display.

import { useCurrency } from "@/context/CurrencyContext";

interface CurrencyToggleProps {
  /** Pass the current text colour class so it adapts to the transparent/solid navbar */
  textColor?: string;
}

export default function CurrencyToggle({ textColor = "text-gray-700" }: CurrencyToggleProps) {
  const { showUsd, toggleCurrency, ngnPerUsd } = useCurrency();

  // Don't render until the rate has loaded — avoids a layout shift
  if (!ngnPerUsd) return null;

  return (
    <button
      onClick={toggleCurrency}
      title={showUsd ? "Switch to Naira (₦)" : "Switch to US Dollar ($)"}
      className={`flex items-center gap-0.5 text-xs font-semibold border rounded-full px-2.5 py-1 transition-colors
        ${showUsd
          ? "border-current bg-black/10 " + textColor
          : "border-current/30 hover:border-current/60 " + textColor
        }`}
    >
      <span className={showUsd ? "opacity-40" : "opacity-100"}>₦</span>
      <span className="opacity-30 mx-0.5">/</span>
      <span className={showUsd ? "opacity-100" : "opacity-40"}>$</span>
    </button>
  );
}
