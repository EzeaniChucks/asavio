"use client";

// app/dashboard/admin/bookings/page.tsx
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaArrowLeft,
  FaChevronLeft,
  FaChevronRight,
  FaCalendarAlt,
  FaUser,
  FaCheckCircle,
  FaClock,
  FaTrophy,
  FaTimesCircle,
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

const STATUS_STYLES: Record<string, { badge: string; icon: React.ReactNode }> = {
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

function nightsBetween(checkIn: string, checkOut: string) {
  const diff =
    new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

export default function AdminBookingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  async function updateStatus(
    id: string,
    status: "confirmed" | "cancelled" | "completed"
  ) {
    setActionLoading(id + "-" + status);
    try {
      await api.patch(`/admin/bookings/${id}/status`, { status });
      toast.success(`Booking ${status}`);
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status } : b))
      );
    } catch {
      // handled
    } finally {
      setActionLoading(null);
    }
  }

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
            <h1 className="text-xl font-bold text-gray-900">
              Booking Management
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">{total} total bookings</p>
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

        {/* Booking cards */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-100 h-28 animate-pulse"
              />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 text-sm">
            No bookings found.
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {bookings.map((b) => {
                const nights = nightsBetween(b.checkIn, b.checkOut);
                const statusStyle =
                  STATUS_STYLES[b.status] ?? STATUS_STYLES["awaiting_payment"];
                return (
                  <motion.div
                    key={b.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="bg-white rounded-2xl border border-gray-100 p-4 hover:border-gray-200 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3 mb-2">
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate">
                              {b.property?.title ?? "Unknown property"}
                            </p>
                            <span
                              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${statusStyle.badge}`}
                            >
                              {statusStyle.icon}
                              {b.status}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                          <Link
                            href={`/users/${b.user?.id}`}
                            className="flex items-center gap-1 hover:text-black transition"
                            title="View guest profile"
                          >
                            <FaUser className="text-gray-300" />
                            {b.user?.firstName} {b.user?.lastName}
                          </Link>
                          <span className="flex items-center gap-1">
                            <FaCalendarAlt className="text-gray-300" />
                            {new Date(b.checkIn).toLocaleDateString()} —{" "}
                            {new Date(b.checkOut).toLocaleDateString()}
                          </span>
                          <span>{nights} night{nights !== 1 ? "s" : ""}</span>
                          <span>{b.guests} guest{b.guests !== 1 ? "s" : ""}</span>
                        </div>

                        <p className="text-sm font-bold text-gray-900 mt-2">
                          ${b.totalPrice.toLocaleString()}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
                        {b.status === "awaiting_payment" && (
                          <>
                            <button
                              onClick={() => updateStatus(b.id, "confirmed")}
                              disabled={!!actionLoading}
                              className="px-3 py-1.5 rounded-lg bg-black text-white text-xs font-medium hover:bg-gray-800 disabled:opacity-40 transition"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => updateStatus(b.id, "cancelled")}
                              disabled={!!actionLoading}
                              className="px-3 py-1.5 rounded-lg border border-red-200 text-red-500 text-xs font-medium hover:bg-red-50 disabled:opacity-40 transition"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {b.status === "confirmed" && (
                          <>
                            <button
                              onClick={() => updateStatus(b.id, "completed")}
                              disabled={!!actionLoading}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-40 transition"
                            >
                              Complete
                            </button>
                            <button
                              onClick={() => updateStatus(b.id, "cancelled")}
                              disabled={!!actionLoading}
                              className="px-3 py-1.5 rounded-lg border border-red-200 text-red-500 text-xs font-medium hover:bg-red-50 disabled:opacity-40 transition"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {(b.status === "completed" ||
                          b.status === "cancelled") && (
                          <span className="text-xs text-gray-300 italic">
                            No actions
                          </span>
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
            <p className="text-xs text-gray-400">
              Page {page} of {totalPages}
            </p>
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
    </AdminPageGuard>
  );
}
