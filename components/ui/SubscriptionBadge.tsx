"use client";

// components/ui/SubscriptionBadge.tsx
import { SubscriptionTier } from "@/types";

interface Props {
  tier: SubscriptionTier;
  size?: "sm" | "md";
}

const BADGE_STYLES: Record<SubscriptionTier, string> = {
  starter: "bg-gray-100 text-gray-500",
  pro: "bg-blue-100 text-blue-700",
  elite: "bg-amber-100 text-amber-700",
};

const BADGE_LABELS: Record<SubscriptionTier, string> = {
  starter: "Starter",
  pro: "Pro",
  elite: "Elite",
};

export default function SubscriptionBadge({ tier, size = "sm" }: Props) {
  if (tier === "starter") return null;

  const sizeClass = size === "md" ? "text-xs px-3 py-1" : "text-[10px] px-2 py-0.5";

  return (
    <span className={`inline-flex items-center font-semibold rounded-full ${sizeClass} ${BADGE_STYLES[tier]}`}>
      {BADGE_LABELS[tier]}
    </span>
  );
}
