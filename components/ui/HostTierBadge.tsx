"use client";

// components/ui/HostTierBadge.tsx
type HostTier = "new_host" | "trusted_host" | "top_host";

interface HostTierBadgeProps {
  tier?: HostTier;
  size?: "xs" | "sm";
}

const TIER_CONFIG: Record<HostTier, { label: string; emoji: string; className: string }> = {
  new_host: {
    label: "New Host",
    emoji: "🌱",
    className: "bg-gray-100 text-gray-600",
  },
  trusted_host: {
    label: "Trusted Host",
    emoji: "✅",
    className: "bg-blue-50 text-blue-700",
  },
  top_host: {
    label: "Top Host",
    emoji: "⭐",
    className: "bg-yellow-50 text-yellow-700",
  },
};

export default function HostTierBadge({ tier = "new_host", size = "xs" }: HostTierBadgeProps) {
  if (tier === "new_host") return null; // Don't show badge for new hosts — avoid friction

  const config = TIER_CONFIG[tier];
  const textSize = size === "xs" ? "text-[10px]" : "text-xs";

  return (
    <span
      className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-semibold ${textSize} ${config.className}`}
    >
      {config.emoji} {config.label}
    </span>
  );
}
