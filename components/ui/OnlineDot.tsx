"use client";

// components/ui/OnlineDot.tsx
interface OnlineDotProps {
  isOnline: boolean;
  size?: "sm" | "md";
  className?: string;
}

export default function OnlineDot({ isOnline, size = "sm", className = "" }: OnlineDotProps) {
  const sizeClass = size === "md" ? "w-3 h-3" : "w-2.5 h-2.5";
  return (
    <span
      className={`inline-block rounded-full border-2 border-white ${sizeClass} ${
        isOnline ? "bg-green-500" : "bg-gray-300"
      } ${className}`}
      title={isOnline ? "Online" : "Offline"}
    />
  );
}
