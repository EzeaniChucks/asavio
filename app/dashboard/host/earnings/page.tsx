"use client";

// app/dashboard/host/earnings/page.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FaArrowLeft,
  FaMoneyBillWave,
  FaInfoCircle,
  FaCheckCircle,
  FaClock,
  FaBan,
} from "react-icons/fa";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { Booking } from "@/types";

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function nightsBetween(checkIn: string, checkOut: string) {
  return Math.ceil(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
      (1000 * 60 * 60 * 24)
  );
}

const PAYOUT_STATUS_STYLES: Record<string, { label: string; classes: string }> = {
  pending:    { label: "Pending",     classes: "bg-yellow-100 text-yellow-700" },
  processing: { label: "Processing",  classes: "bg-blue-100 text-blue-700" },
  transferred:{ label: "Paid out",    classes: "bg-green-100 text-green-700" },
  failed:     { label: "Failed",      classes: "bg-red-100 text-red-700" },
};

const BOOKING_STATUS_ICON: Record<string, React.ReactNode> = {
  confirmed:        <FaCheckCircle className="text-green-500" />,
  completed:        <FaCheckCircle className="text-blue-500" />,
  awaiting_payment: <FaClock className="text-yellow-500" />,
  cancelled:        <FaBan className="text-red-400" />,
};

type Filter = "all" | "confirmed" | "completed" | "pending" | "transferred";

export default function HostEarningsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || (user?.role !== "host" && user?.role !== "admin")) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (!user) return;
    api
      .get("/bookings/host")
      .then((res) => {
        const data = res.data.data ?? res.data;
        setBookings(data.bookings ?? data);
      })
      .catch(() => setBookings([]))
      .finally(() => setIsLoading(false));
  }, [user]);

  // Only count paid/confirmed/completed bookings towards earnings
  const paidBookings = bookings.filter(
    (b) => b.paymentStatus === "paid" && b.status !== "cancelled"
  );

  const totalEarned = paidBookings.reduce((s, b) => s + Number(b.hostPayout), 0);
  const totalRevenue = paidBookings.reduce((s, b) => s + Number(b.totalPrice), 0);
  const totalCommission = paidBookings.reduce((s, b) => s + Number(b.platformCommission), 0);

  const transferredPayout = paidBookings
    .filter((b) => b.hostPayoutStatus === "transferred")
    .reduce((s, b) => s + Number(b.hostPayout), 0);

  const pendingPayout = paidBookings
    .filter((b) => b.hostPayoutStatus === "pending" || b.hostPayoutStatus === "processing")
    .reduce((s, b) => s + Number(b.hostPayout), 0);

  const filtered = filter === "all"
    ? bookings
    : filter === "transferred"
    ? bookings.filter((b) => b.hostPayoutStatus === "transferred")
    : filter === "pending"
    ? bookings.filter((b) => b.hostPayoutStatus === "pending" || b.hostPayoutStatus === "processing")
    : bookings.filter((b) => b.status === filter);

  const FILTER_TABS: { label: string; value: Filter }[] = [
    { label: "All", value: "all" },
    { label: "Confirmed", value: "confirmed" },
    { label: "Completed", value: "completed" },
    { label: "Payout pending", value: "pending" },
    { label: "Paid out", value: "transferred" },
  ];

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/dashboard/host"
            className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition"
          >
            <FaArrowLeft className="text-sm" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Earnings</h1>
            <p className="text-xs text-gray-400 mt-0.5">Your payout history and commission breakdown</p>
          </div>
        </div>

        {/* Summary cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          {[
            {
              label: "Total earned",
              value: `₦${totalEarned.toLocaleString()}`,
              sub: "After platform fees",
              color: "bg-green-50",
              text: "text-green-700",
            },
            {
              label: "Pending payout",
              value: `₦${pendingPayout.toLocaleString()}`,
              sub: "Awaiting transfer",
              color: "bg-yellow-50",
              text: "text-yellow-700",
            },
            {
              label: "Transferred",
              value: `₦${transferredPayout.toLocaleString()}`,
              sub: "Successfully paid out",
              color: "bg-blue-50",
              text: "text-blue-700",
            },
            {
              label: "Platform fees",
              value: `₦${totalCommission.toLocaleString()}`,
              sub: `From ₦${totalRevenue.toLocaleString()} total`,
              color: "bg-gray-50",
              text: "text-gray-700",
            },
          ].map((s) => (
            <div
              key={s.label}
              className={`rounded-2xl border border-gray-100 p-5 ${s.color}`}
            >
              <p className="text-xs text-gray-500 mb-1">{s.label}</p>
              <p className={`text-xl font-bold ${s.text}`}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </motion.div>

        {/* Commission info banner */}
        {paidBookings.length > 0 && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 mb-6 flex gap-3 text-sm text-blue-800">
            <FaInfoCircle className="text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium mb-0.5">How your payout is calculated</p>
              <p className="text-blue-700">
                Asavio deducts a platform service fee from each booking before transferring your earnings.
                The applied rate is shown per booking below. Your custom rate (if any) is set by the Asavio team.
                Payouts are processed after your guest&apos;s check-in date.
              </p>
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-1 bg-white border border-gray-100 rounded-xl p-1 mb-4 overflow-x-auto">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                filter === tab.value
                  ? "bg-black text-white"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Bookings list */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <FaMoneyBillWave className="text-4xl text-gray-300 mx-auto mb-3" />
            <p className="font-semibold text-gray-600">No bookings found</p>
            <p className="text-sm text-gray-400 mt-1">Earnings will appear here once guests book your properties.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((booking) => {
              const nights = nightsBetween(booking.checkIn, booking.checkOut);
              const rate = booking.appliedCommissionRate
                ? (Number(booking.appliedCommissionRate) * 100).toFixed(1)
                : null;
              const payoutInfo = PAYOUT_STATUS_STYLES[booking.hostPayoutStatus] ?? PAYOUT_STATUS_STYLES.pending;

              return (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white rounded-2xl border border-gray-100 p-5"
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Left: booking info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-1">
                        <span className="mt-0.5">{BOOKING_STATUS_ICON[booking.status]}</span>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">
                            {booking.property?.title ?? "Property"}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatDate(booking.checkIn)} → {formatDate(booking.checkOut)}
                            {" · "}
                            {nights} {nights === 1 ? "night" : "nights"}
                            {" · "}
                            {booking.guests} {booking.guests === 1 ? "guest" : "guests"}
                          </p>
                        </div>
                        <span className={`ml-auto flex-shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${payoutInfo.classes}`}>
                          {payoutInfo.label}
                        </span>
                      </div>

                      {booking.payoutReference && (
                        <p className="text-xs text-gray-400 mt-1 ml-6">
                          Ref: {booking.payoutReference}
                        </p>
                      )}
                    </div>

                    {/* Right: earnings breakdown */}
                    <div className="sm:text-right flex sm:flex-col gap-4 sm:gap-1 flex-wrap">
                      <div>
                        <p className="text-xs text-gray-400">Guest paid</p>
                        <p className="font-medium text-gray-700">₦{Number(booking.totalPrice).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">
                          Platform fee{rate ? ` (${rate}%)` : ""}
                        </p>
                        <p className="font-medium text-gray-500">−₦{Number(booking.platformCommission).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Your payout</p>
                        <p className="text-lg font-bold text-gray-900">₦{Number(booking.hostPayout).toLocaleString()}</p>
                      </div>
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
