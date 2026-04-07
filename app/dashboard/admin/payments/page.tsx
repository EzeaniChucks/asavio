"use client";

// app/dashboard/admin/payments/page.tsx
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaSync,
  FaChevronLeft,
  FaChevronRight,
  FaExternalLinkAlt,
} from "react-icons/fa";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { Booking } from "@/types";
import toast from "react-hot-toast";
import AdminPageGuard from "@/components/admin/AdminPageGuard";
import { ADMIN_PERMISSIONS as P } from "@/lib/adminPermissions";

type PaymentFilter = "all" | "pending" | "paid" | "failed";

const TABS: { label: string; value: PaymentFilter }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Paid", value: "paid" },
  { label: "Failed", value: "failed" },
];

const PAYMENT_STATUS_STYLE: Record<string, string> = {
  pending: "bg-orange-100 text-orange-700",
  paid:    "bg-green-100 text-green-700",
  failed:  "bg-red-100 text-red-700",
  refunded:"bg-blue-100 text-blue-700",
};

export default function AdminPaymentsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<PaymentFilter>("pending");
  const [isLoading, setIsLoading] = useState(true);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const LIMIT = 20;

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { router.push("/login"); return; }
    if (user?.role !== "admin") { router.push("/"); return; }
  }, [authLoading, isAuthenticated, user, router]);

  const load = useCallback(async () => {
    if (!user || user.role !== "admin") return;
    setIsLoading(true);
    try {
      // Filter by booking status awaiting_payment for pending payments view
      const statusParam = tab === "all" ? "" : tab === "pending" ? "&status=awaiting_payment" : "";
      const res = await api.get(`/admin/bookings?page=${page}&limit=${LIMIT}${statusParam}`);
      let results: Booking[] = res.data.data.bookings;

      // Client-side filter by paymentStatus when needed
      if (tab === "pending") {
        results = results.filter((b: Booking) => b.paymentStatus === "pending");
      } else if (tab === "paid") {
        results = results.filter((b: Booking) => b.paymentStatus === "paid");
      } else if (tab === "failed") {
        results = results.filter((b: Booking) => b.paymentStatus === "failed");
      }

      setBookings(results);
      setTotal(res.data.data.total);
    } catch {
      // error toast handled by interceptor
    } finally {
      setIsLoading(false);
    }
  }, [user, page, tab]);

  useEffect(() => { load(); }, [load]);

  const handleVerify = async (bookingId: string) => {
    setVerifying(bookingId);
    try {
      const res = await api.post(`/admin/bookings/${bookingId}/verify-payment`);
      const updated: Booking = res.data.data.booking;
      toast.success(`Payment status: ${updated.paymentStatus}`);
      load();
    } catch {
      // interceptor handles
    } finally {
      setVerifying(null);
    }
  };

  const handleCancel = async (bookingId: string) => {
    if (!confirm("Cancel this booking? This will free the dates.")) return;
    setCancelling(bookingId);
    try {
      await api.patch(`/admin/bookings/${bookingId}/status`, { status: "cancelled" });
      toast.success("Booking cancelled");
      load();
    } catch {
      // interceptor handles
    } finally {
      setCancelling(null);
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <AdminPageGuard permission={P.MANAGE_BOOKINGS}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Link href="/dashboard/admin" className="text-gray-400 hover:text-black transition-colors">
              <FaArrowLeft />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Pending Payments</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Verify Paystack charges and resolve stuck bookings
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => { setTab(t.value); setPage(1); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tab === t.value
                    ? "bg-black text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-gray-400"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Info banner */}
          {tab === "pending" && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 text-sm text-amber-800">
              <strong>How to use:</strong> Click <em>Check Paystack</em> to query the live Paystack API for that booking's reference.
              If the customer was charged, the booking will be automatically confirmed and they'll receive a confirmation email.
              If not charged, cancel the booking to free the calendar dates.
            </div>
          )}

          {/* Table */}
          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
              No bookings found for this filter.
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                >
                  {/* Booking info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PAYMENT_STATUS_STYLE[booking.paymentStatus] ?? "bg-gray-100 text-gray-600"}`}>
                        {booking.paymentStatus}
                      </span>
                      <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                        {booking.status}
                      </span>
                    </div>
                    <p className="font-semibold text-gray-900 truncate">
                      {(booking as any).property?.title ?? (booking as any).vehicle ? `${(booking as any).vehicle?.make} ${(booking as any).vehicle?.model}` : "—"}
                    </p>
                    <p className="text-sm text-gray-500">
                      Guest: <span className="font-medium text-gray-700">{(booking as any).user?.email ?? booking.userId}</span>
                    </p>
                    <p className="text-sm text-gray-500">
                      Dates: {String(booking.checkIn)} → {String(booking.checkOut)}
                    </p>
                    <p className="text-sm text-gray-500">
                      Amount: <span className="font-semibold text-gray-800">₦{Number(booking.totalPrice).toLocaleString()}</span>
                    </p>
                    {booking.paystackReference && (
                      <p className="text-xs text-gray-400 mt-1 font-mono truncate">
                        Ref: {booking.paystackReference}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Created: {new Date(booking.createdAt).toLocaleString("en-GB")}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 min-w-[160px]">
                    {booking.paystackReference && (
                      <button
                        onClick={() => handleVerify(booking.id)}
                        disabled={verifying === booking.id}
                        className="flex items-center justify-center gap-2 bg-black text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors"
                      >
                        <FaSync className={verifying === booking.id ? "animate-spin" : ""} />
                        {verifying === booking.id ? "Checking…" : "Check Paystack"}
                      </button>
                    )}
                    {booking.status !== "cancelled" && booking.status !== "completed" && (
                      <button
                        onClick={() => handleCancel(booking.id)}
                        disabled={cancelling === booking.id}
                        className="flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-200 text-sm font-medium px-4 py-2 rounded-xl hover:bg-red-100 disabled:opacity-50 transition-colors"
                      >
                        <FaTimesCircle />
                        {cancelling === booking.id ? "Cancelling…" : "Cancel Booking"}
                      </button>
                    )}
                    {booking.paymentStatus === "paid" && booking.status !== "confirmed" && booking.status !== "completed" && (
                      <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                        <FaCheckCircle />
                        Paid — confirm via Bookings
                      </div>
                    )}
                    {!booking.paystackReference && (
                      <div className="flex items-center gap-1.5 text-xs text-orange-500">
                        <FaClock />
                        No payment reference
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-gray-200 hover:border-gray-400 disabled:opacity-40 transition-colors"
                >
                  <FaChevronLeft className="text-xs" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg border border-gray-200 hover:border-gray-400 disabled:opacity-40 transition-colors"
                >
                  <FaChevronRight className="text-xs" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminPageGuard>
  );
}
