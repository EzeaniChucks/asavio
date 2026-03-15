"use client";

// app/bookings/page.tsx
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  FaCalendarAlt,
  FaUsers,
  FaArrowRight,
  FaTimes,
  FaCreditCard,
} from "react-icons/fa";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { Booking } from "@/types";
import toast from "react-hot-toast";

type Tab = "all" | "awaiting_payment" | "confirmed" | "completed" | "cancelled";

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  awaiting_payment: { label: "Awaiting payment", classes: "bg-orange-100 text-orange-800" },
  confirmed:        { label: "Confirmed",         classes: "bg-green-100  text-green-800"  },
  completed:        { label: "Completed",         classes: "bg-blue-100   text-blue-800"   },
  cancelled:        { label: "Cancelled",         classes: "bg-red-100    text-red-700"    },
};

function formatDateRange(checkIn: string, checkOut: string) {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
  return `${new Date(checkIn).toLocaleDateString("en-GB", opts)} – ${new Date(checkOut).toLocaleDateString("en-GB", opts)}`;
}

function nightCount(checkIn: string, checkOut: string) {
  return Math.ceil(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
  );
}

export default function BookingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [payingNow, setPayingNow] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/login");
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!user) return;
    api
      .get("/bookings/my")
      .then((res) => setBookings(res.data.data.bookings))
      .catch(() => setBookings([]))
      .finally(() => setIsLoading(false));
  }, [user]);

  const handlePayNow = async (bookingId: string) => {
    setPayingNow(bookingId);
    try {
      const res = await api.post("/payments/initialize", { bookingId });
      window.location.href = res.data.data.authorization_url;
    } catch {
      toast.error("Could not initialize payment. Please try again.");
      setPayingNow(null);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Cancel this booking?")) return;
    setCancelling(id);
    try {
      await api.patch(`/bookings/${id}/status`, { status: "cancelled" });
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b))
      );
      toast.success("Booking cancelled");
    } catch {
      toast.error("Failed to cancel booking");
    } finally {
      setCancelling(null);
    }
  };

  const tabs: Tab[] = ["all", "awaiting_payment", "confirmed", "completed", "cancelled"];

  const filtered =
    activeTab === "all" ? bookings : bookings.filter((b) => b.status === activeTab);

  const counts = tabs.reduce(
    (acc, t) => ({
      ...acc,
      [t]: t === "all" ? bookings.length : bookings.filter((b) => b.status === t).length,
    }),
    {} as Record<Tab, number>
  );

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loader" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8 max-w-4xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">My Bookings</h1>
        <p className="text-gray-500 mb-6">
          {bookings.length} {bookings.length === 1 ? "booking" : "bookings"} total
        </p>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl border border-gray-100 p-1 mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? "bg-black text-white"
                  : "text-gray-500 hover:text-black hover:bg-gray-50"
              }`}
            >
              <span className="capitalize">{tab === "all" ? "All" : STATUS_CONFIG[tab]?.label ?? tab}</span>
              {counts[tab] > 0 && (
                <span
                  className={`text-xs rounded-full px-1.5 py-0.5 font-semibold ${
                    activeTab === tab
                      ? "bg-white/20 text-white"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {counts[tab]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Booking cards */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <p className="text-4xl mb-3">📅</p>
            <h3 className="text-lg font-semibold mb-2">No bookings here</h3>
            <p className="text-gray-400 mb-5">
              {activeTab === "all"
                ? "You haven't made any bookings yet."
                : `No ${activeTab} bookings.`}
            </p>
            <Link href="/properties" className="btn-primary">
              Browse properties
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((booking, i) => {
              const nights = nightCount(String(booking.checkIn), String(booking.checkOut));
              const cfg = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.confirmed;
              const canCancel = booking.status === "confirmed" || booking.status === "awaiting_payment";
              const canPayNow = booking.status === "awaiting_payment";

              return (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="flex gap-4 p-4">
                    {/* Property image */}
                    <Link
                      href={`/properties/${booking.property?.id}`}
                      className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 block"
                    >
                      {booking.property?.images?.[0]?.url ? (
                        <Image
                          src={booking.property.images[0].url}
                          alt={booking.property.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">🏠</div>
                      )}
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <Link
                          href={`/properties/${booking.property?.id}`}
                          className="font-semibold text-gray-900 hover:text-black truncate"
                        >
                          {booking.property?.title ?? "Property"}
                        </Link>
                        <span className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.classes}`}>
                          {cfg.label}
                        </span>
                      </div>

                      <p className="text-sm text-gray-500 mb-2">
                        {booking.property?.location.city}, {booking.property?.location.country}
                      </p>

                      <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                        <span className="flex items-center gap-1.5">
                          <FaCalendarAlt className="text-gray-400 text-xs" />
                          {formatDateRange(String(booking.checkIn), String(booking.checkOut))}
                          <span className="text-gray-400">· {nights} {nights === 1 ? "night" : "nights"}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <FaUsers className="text-gray-400 text-xs" />
                          {booking.guests} {booking.guests === 1 ? "guest" : "guests"}
                        </span>
                      </div>

                      <p className="text-sm font-semibold text-gray-900 mt-1.5">
                        Total: ${Number(booking.totalPrice).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-4 pb-4 flex items-center justify-between gap-3 border-t border-gray-50 pt-3">
                    <Link
                      href={`/bookings/${booking.id}`}
                      className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-black transition-colors"
                    >
                      View details
                      <FaArrowRight className="text-xs" />
                    </Link>

                    <div className="flex items-center gap-3">
                      {canPayNow && (
                        <button
                          onClick={() => handlePayNow(booking.id)}
                          disabled={payingNow === booking.id}
                          className="flex items-center gap-1.5 text-sm font-semibold text-white bg-black px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                        >
                          <FaCreditCard className="text-xs" />
                          {payingNow === booking.id ? "Redirecting…" : "Pay now"}
                        </button>
                      )}

                      {canCancel && (
                        <button
                          onClick={() => handleCancel(booking.id)}
                          disabled={cancelling === booking.id}
                          className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 font-medium transition-colors disabled:opacity-50"
                        >
                          <FaTimes className="text-xs" />
                          {cancelling === booking.id ? "Cancelling…" : "Cancel"}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
