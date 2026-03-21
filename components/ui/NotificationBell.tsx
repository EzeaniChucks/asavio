"use client";

// components/ui/NotificationBell.tsx
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaBell } from "react-icons/fa";
import { useNotifications } from "@/hooks/useNotifications";
import { Notification } from "@/types";
import { useRouter } from "next/navigation";

const TYPE_ICON: Record<string, string> = {
  message: "💬",
  booking_request: "📩",
  booking_confirmed: "✅",
  booking_cancelled: "❌",
  booking_completed: "🏆",
  review_received: "⭐",
  kyc_approved: "🪪",
  kyc_rejected: "🚫",
  listing_approved: "🏡",
  listing_rejected: "🚫",
  payout_transferred: "💰",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationBell({ textColor }: { textColor?: string }) {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleClick = (notif: Notification) => {
    if (!notif.isRead) markRead(notif.id);
    if (notif.data?.url) router.push(notif.data.url);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`relative p-2 rounded-full hover:bg-black/10 transition-colors ${textColor ?? "text-gray-700"}`}
        aria-label="Notifications"
      >
        <FaBell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="font-semibold text-gray-900 text-sm">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-8">No notifications yet</p>
              ) : (
                notifications.slice(0, 20).map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => handleClick(notif)}
                    className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${
                      !notif.isRead ? "bg-blue-50/40" : ""
                    }`}
                  >
                    <span className="text-lg shrink-0 mt-0.5">
                      {TYPE_ICON[notif.type] ?? "🔔"}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 leading-snug">{notif.title}</p>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{notif.body}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{timeAgo(notif.createdAt)}</p>
                    </div>
                    {!notif.isRead && (
                      <span className="shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1.5" />
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
