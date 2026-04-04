"use client";

// components/ui/TierGate.tsx
// Wraps a feature that requires a minimum subscription tier.
// If the user's tier is too low, shows a locked overlay with upgrade CTA.
import Link from "next/link";
import { SubscriptionTier } from "@/types";

const TIER_ORDER: SubscriptionTier[] = ["starter", "pro", "elite"];
const TIER_LABELS: Record<SubscriptionTier, string> = {
  starter: "Starter",
  pro: "Pro",
  elite: "Elite",
};

function tierMeetsMinimum(candidate: SubscriptionTier, required: SubscriptionTier): boolean {
  return TIER_ORDER.indexOf(candidate) >= TIER_ORDER.indexOf(required);
}

interface Props {
  currentTier: SubscriptionTier;
  requiredTier: SubscriptionTier;
  children: React.ReactNode;
  /** Label shown on the locked state. Defaults to "This feature requires {tier} plan." */
  lockedMessage?: string;
}

export default function TierGate({ currentTier, requiredTier, children, lockedMessage }: Props) {
  if (tierMeetsMinimum(currentTier, requiredTier)) {
    return <>{children}</>;
  }

  const message = lockedMessage ?? `This feature requires the ${TIER_LABELS[requiredTier]} plan.`;

  return (
    <div className="relative">
      {/* Blurred preview of the children */}
      <div className="pointer-events-none select-none blur-sm opacity-50" aria-hidden>
        {children}
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-xl p-6 text-center">
        <span className="text-3xl mb-3">🔒</span>
        <p className="text-sm font-semibold text-gray-800 mb-1">{message}</p>
        <p className="text-xs text-gray-500 mb-4">
          You&apos;re on the <strong>{TIER_LABELS[currentTier]}</strong> plan.
        </p>
        <Link
          href="/dashboard/host/subscription"
          className="inline-flex items-center gap-1.5 bg-black text-white text-xs font-semibold px-4 py-2 rounded-full hover:bg-gray-800 transition-colors"
        >
          Upgrade to {TIER_LABELS[requiredTier]}
        </Link>
      </div>
    </div>
  );
}
