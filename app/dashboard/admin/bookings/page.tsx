"use client";

// app/dashboard/admin/bookings/page.tsx
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaUser,
  FaCheckCircle,
  FaClock,
  FaTrophy,
  FaTimesCircle,
  FaSync,
  FaChevronLeft,
  FaChevronRight,
  FaExclamationTriangle,
} from "react-icons/fa";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { Booking } from "@/types";
import toast from "react-hot-toast";
import AdminPageGuard from "@/components/admin/AdminPageGuard";
import { ADMIN_PERMISSIONS as P } from "@/lib/adminPermissions";

type StatusFilter = "all" | "awaiting_payment" | "confirmed" | "completed" | "cancelled";

const STATUS_TABS: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "all" },
  { label: "Awaiting payment", value: "awaiting_payment" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

const BOOKING_STATUS_STYLE: Record<string, { badge: string; icon: React.ReactNode }> = {
  awaiting_payment: {
    badge: "bg-orange-100 text-orange-700",
    icon: <FaClock className="text-orange-500 text-xs" />,
  },
  confirmed: {
    badge: "bg-green-100 text-green-700",
    icon: <FaCheckCircle className="text-green-500 text-xs" />,
  },
  completed: {
    badge: "bg-blue-100 text-blue-700",
    icon: <FaTrophy className="text-blue-500 text-xs" />,
  },
  cancelled: {
    badge: "bg-red-100 text-red-700",
    icon: <FaTimesCircle className="text-red-500 text-xs" />,
  },
};

const PAYMENT_STATUS_STYLE: Record<string, string> = {
  pending:  "bg-orange-100 text-orange-700",
  paid:     "bg-green-100 text-green-700",
  failed:   "bg-red-100 text-red-700",
  refunded: "bg-blue-100 text-blue-700",
};

function nightsBetween(checkIn: string, checkOut: string) {
  return Math.round(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
  );
}

export default function AdminBookingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Action loading states
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);

  // Cancel confirmation modal
  const [confirmModal, setConfirmModal] = useState<Booking | null>(null);

  // Optimistic post-verify state
  const [verifiedBookings, setVerifiedBookings] = useState<Record<string, Booking>>({});

  const LIMIT = 20;

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { router.push("/login"); return; }
    if (user?.role !== "admin") { router.push("/"); return; }
  }, [authLoading, isAuthenticated, user, router]);

  const fetchBookings = useCallback(async () => {
    if (!user || user.role !== "admin") return;
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: LIMIT };
      if (statusFilter !== "all") params.status = statusFilter;
      const res = await api.get("/admin/bookings", { params });
      const data = res.data.data ?? res.data;
      setBookings(data.bookings ?? data);
      setTotal(data.total ?? (data.bookings ?? data).length);
    } catch {
      // handled by interceptor
    } finally {
      setIsLoading(false);
    }
  }, [user, page, statusFilter]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);
  useEffect(() => { setPage(1); }, [statusFilter]);

  async function updateStatus(id: string, status: "confirmed" | "cancelled" | "completed") {
    setActionLoading(id + "-" + status);
    try {
      await api.patch(`/admin/bookings/${id}/status`, { status });
      toast.success(`Booking ${status}`);
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
    } catch {
      // handled
    } finally {
      setActionLoading(null);
    }
  }

  const handleVerify = async (bookingId: string) => {
    setVerifying(bookingId);
    try {
      const res = await api.post(`/admin/bookings/${bookingId}/verify-payment`);
      const updated: Booking = res.data.data.booking;
      setVerifiedBookings((prev) => ({ ...prev, [bookingId]: updated }));
      toast.success(
        updated.paymentStatus === "paid"
          ? "Payment confirmed — booking is now confirmed"
          : `Paystack returned: ${updated.paymentStatus}`
      );
      fetchBookings();
    } catch {
      // interceptor handles
    } finally {
      setVerifying(null);
    }
  };

  const handleCancelConfirmed = async () => {
    if (!confirmModal) return;
    const bookingId = confirmModal.id;
    setConfirmModal(null);
    setCancelling(bookingId);
    try {
      await api.patch(`/admin/bookings/${bookingId}/status`, { status: "cancelled" });
      toast.success("Booking cancelled");
      setVerifiedBookings((prev) => {
        const next = { ...prev };
        delete next[bookingId];
        return next;
      });
      fetchBookings();
    } catch {
      // interceptor handles
    } finally {
      setCancelling(null);
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  if (authLoading || !user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AdminPageGuard permission={P.MANAGE_BOOKINGS}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Link
              href="/dashboard/admin"
              className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition"
            >
              <FaArrowLeft className="text-sm" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Booking Management</h1>
              <p className="text-xs text-gray-400 mt-0.5">{total} bookings · Verify Paystack charges and update statuses</p>
            </div>
          </div>

          {/* Status filter tabs */}
          <div className="bg-white rounded-2xl border border-gray-100 p-1.5 mb-4 flex gap-1 overflow-x-auto">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`flex-1 min-w-max px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  statusFilter === tab.value
                    ? "bg-black text-white"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Paystack info banner on awaiting_payment tab */}
          {statusFilter === "awaiting_payment" && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 text-sm text-amber-800">
              <strong>Payment verification:</strong> Click <em>Check Paystack</em> to query the live Paystack API for that booking&apos;s reference.
              If the customer was charged, the booking will be automatically confirmed and they&apos;ll receive a confirmation email.
              If not charged, cancel the booking to free up the calendar dates.
            </div>
          )}

          {/* Booking cards */}
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 h-32 animate-pulse" />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 text-sm">
              No bookings found.
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {bookings.map((rawBooking) => {
                  const booking: Booking = verifiedBookings[rawBooking.id]
                    ? { ...rawBooking, ...verifiedBookings[rawBooking.id] }
                    : rawBooking;

                  const nights = nightsBetween(String(booking.checkIn), String(booking.checkOut));
                  const bookingStyle = BOOKING_STATUS_STYLE[booking.status] ?? BOOKING_STATUS_STYLE["awaiting_payment"];
                  const isPaid = booking.paymentStatus === "paid";
                  const isTerminal = booking.status === "cancelled" || booking.status === "completed";
                  const canVerify = !!(booking as any).paystackReference && !isPaid;

                  return (
                    <motion.div
                      key={booking.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className={`bg-white rounded-2xl border p-4 hover:border-gray-200 transition-colors ${
                        isPaid ? "border-green-200" : "border-gray-100"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          {/* Status badges */}
                          <div className="flex items-center flex-wrap gap-1.5 mb-1.5">
                            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${bookingStyle.badge}`}>
                              {bookingStyle.icon}
                              {booking.status}
                            </span>
                            {booking.paymentStatus && (
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PAYMENT_STATUS_STYLE[booking.paymentStatus] ?? "bg-gray-100 text-gray-600"}`}>
                                {booking.paymentStatus}
                              </span>
                            )}
                            {isPaid && (
                              <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                                <FaCheckCircle className="text-xs" /> Verified
                              </span>
                            )}
                          </div>

                          {/* Listing title */}
                          <p className="font-semibold text-gray-900 text-sm truncate mb-1">
                            {(booking as any).property?.title
                              ?? ((booking as any).vehicle
                                ? `${(booking as any).vehicle?.make ?? ""} ${(booking as any).vehicle?.model ?? ""}`.trim()
                                : "—")}
                          </p>

                          {/* Meta */}
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                            <Link
                              href={`/users/${(booking as any).user?.id ?? booking.userId}`}
                              className="flex items-center gap-1 hover:text-black transition"
                            >
                              <FaUser className="text-gray-300" />
                              {(booking as any).user?.firstName} {(booking as any).user?.lastName}
                              {(booking as any).user?.email && (
                                <span className="text-gray-400">· {(booking as any).user.email}</span>
                              )}
                            </Link>
                            <span className="flex items-center gap-1">
                              <FaCalendarAlt className="text-gray-300" />
                              {new Date(booking.checkIn).toLocaleDateString()} — {new Date(booking.checkOut).toLocaleDateString()}
                            </span>
                            <span>{nights} night{nights !== 1 ? "s" : ""}</span>
                            {booking.guests && <span>{booking.guests} guest{booking.guests !== 1 ? "s" : ""}</span>}
                          </div>

                          {/* Amount & ref */}
                          <p className="text-sm font-bold text-gray-900 mt-1.5">
                            ₦{Number(booking.totalPrice).toLocaleString()}
                          </p>
                          {(booking as any).paystackReference && (
                            <p className="text-xs text-gray-400 font-mono truncate mt-0.5">
                              Ref: {(booking as any).paystackReference}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-0.5">
                            Created: {new Date(booking.createdAt).toLocaleString("en-GB")}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap sm:flex-col gap-2 sm:items-end sm:min-w-[148px]">
                          {/* Verify Paystack */}
                          {canVerify && (
                            <button
                              onClick={() => handleVerify(booking.id)}
                              disabled={verifying === booking.id}
                              className="flex items-center justify-center gap-1.5 bg-black text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition"
                            >
                              <FaSync className={verifying === booking.id ? "animate-spin" : ""} />
                              {verifying === booking.id ? "Checking…" : "Check Paystack"}
                            </button>
                          )}

                          {/* Confirm (awaiting_payment only) */}
                          {booking.status === "awaiting_payment" && (
                            <button
                              onClick={() => updateStatus(booking.id, "confirmed")}
                              disabled={!!actionLoading}
                              className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 disabled:opacity-40 transition"
                            >
                              Confirm
                            </button>
                          )}

                          {/* Complete (confirmed only) */}
                          {booking.status === "confirmed" && (
                            <button
                              onClick={() => updateStatus(booking.id, "completed")}
                              disabled={!!actionLoading}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-40 transition"
                            >
                              Complete
                            </button>
                          )}

                          {/* Cancel (non-terminal) */}
                          {!isTerminal && (
                            <button
                              onClick={() => setConfirmModal(booking)}
                              disabled={cancelling === booking.id}
                              className="px-3 py-1.5 rounded-lg border border-red-200 text-red-500 text-xs font-medium hover:bg-red-50 disabled:opacity-40 transition"
                            >
                              {cancelling === booking.id ? "Cancelling…" : "Cancel"}
                            </button>
                          )}

                          {/* No-ref notice */}
                          {!(booking as any).paystackReference && booking.status === "awaiting_payment" && (
                            <span className="flex items-center gap-1 text-xs text-orange-500">
                              <FaClock /> No ref
                            </span>
                          )}

                          {isTerminal && !canVerify && (
                            <span className="text-xs text-gray-300 italic">No actions</span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 bg-white rounded-2xl border border-gray-100 px-5 py-4">
              <p className="text-xs text-gray-400">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-40 transition"
                >
                  <FaChevronLeft className="text-xs" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-40 transition"
                >
                  <FaChevronRight className="text-xs" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cancel confirmation modal */}
      <AnimatePresence>
        {confirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
            onClick={() => setConfirmModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <FaExclamationTriangle className="text-red-600" />
                </div>
                <h2 className="font-semibold text-gray-900">Cancel this booking?</h2>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-1.5 text-sm">
                <p className="text-gray-700">
                  <span className="font-medium">Guest:</span>{" "}
                  {(confirmModal as any).user?.email ?? confirmModal.userId}
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Dates:</span>{" "}
                  {String(confirmModal.checkIn)} → {String(confirmModal.checkOut)}
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Amount:</span>{" "}
                  ₦{Number(confirmModal.totalPrice).toLocaleString()}
                </p>
                <p className={`font-semibold ${confirmModal.paymentStatus === "paid" ? "text-red-600" : "text-orange-600"}`}>
                  Payment status: {confirmModal.paymentStatus}
                </p>
              </div>

              {confirmModal.paymentStatus === "paid" && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-sm text-red-700">
                  <strong>Warning:</strong> This booking shows as paid. Cancelling will NOT automatically refund the customer — process any refund manually via the Paystack dashboard.
                </div>
              )}

              <p className="text-sm text-gray-500 mb-5">
                Cancelling will free up the calendar dates for other guests. This cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmModal(null)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-gray-400 transition-colors"
                >
                  Keep booking
                </button>
                <button
                  onClick={handleCancelConfirmed}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors"
                >
                  Yes, cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminPageGuard>
  );
}
