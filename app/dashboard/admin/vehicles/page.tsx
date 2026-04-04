"use client";

// app/dashboard/admin/vehicles/page.tsx
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaArrowLeft,
  FaSearch,
  FaTrash,
  FaExternalLinkAlt,
  FaEdit,
  FaChevronLeft,
  FaChevronRight,
  FaCar,
  FaToggleOn,
  FaToggleOff,
  FaCheck,
  FaTimes,
} from "react-icons/fa";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { Vehicle } from "@/types";
import toast from "react-hot-toast";
import AdminPageGuard from "@/components/admin/AdminPageGuard";
import { ADMIN_PERMISSIONS as P } from "@/lib/adminPermissions";
import AdminGalleryModal from "@/components/admin/AdminGalleryModal";

type StatusFilter = "all" | "pending" | "approved" | "rejected";

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

export default function AdminVehiclesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Vehicle | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [galleryTarget, setGalleryTarget] = useState<Vehicle | null>(null);

  const LIMIT = 20;

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { router.push("/login"); return; }
    if (user?.role !== "admin") { router.push("/"); return; }
  }, [authLoading, isAuthenticated, user, router]);

  const fetchVehicles = useCallback(async () => {
    if (!user || user.role !== "admin") return;
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: LIMIT };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== "all") params.status = statusFilter;
      const res = await api.get("/admin/vehicles", { params });
      const data = res.data.data ?? res.data;
      setVehicles(data.vehicles ?? data);
      setTotal(data.total ?? (data.vehicles ?? data).length);
    } catch {
      // handled by interceptor
    } finally {
      setIsLoading(false);
    }
  }, [user, page, search, statusFilter]);

  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  async function setStatus(v: Vehicle, status: "approved" | "rejected", reason?: string) {
    setActionLoading(v.id + "-" + status);
    try {
      await api.patch(`/admin/vehicles/${v.id}`, {
        status,
        ...(status === "approved" ? { isAvailable: true } : {}),
        ...(reason ? { rejectionReason: reason } : {}),
      });
      toast.success(
        status === "approved"
          ? `"${v.year} ${v.make} ${v.model}" approved and is now live`
          : `"${v.year} ${v.make} ${v.model}" rejected`
      );
      fetchVehicles();
    } catch {
      // handled
    } finally {
      setActionLoading(null);
      setRejectTarget(null);
      setRejectionReason("");
    }
  }

  async function toggleAvailability(v: Vehicle) {
    setActionLoading(v.id + "-toggle");
    try {
      await api.patch(`/admin/vehicles/${v.id}`, { isAvailable: !v.isAvailable });
      toast.success(`"${v.year} ${v.make} ${v.model}" marked ${!v.isAvailable ? "available" : "unavailable"}`);
      setVehicles((prev) => prev.map((x) => x.id === v.id ? { ...x, isAvailable: !x.isAvailable } : x));
    } catch {
      // handled
    } finally {
      setActionLoading(null);
    }
  }

  async function deleteVehicle(id: string) {
    setActionLoading(id + "-delete");
    try {
      await api.delete(`/admin/vehicles/${id}`);
      toast.success("Vehicle deleted");
      setVehicles((prev) => prev.filter((x) => x.id !== id));
      setTotal((t) => t - 1);
    } catch {
      // handled
    } finally {
      setActionLoading(null);
      setDeleteTarget(null);
    }
  }

  const totalPages = Math.ceil(total / LIMIT);

  const statusBadge = (v: Vehicle) => {
    if (v.status === "approved")
      return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Approved</span>;
    if (v.status === "rejected")
      return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">Rejected</span>;
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Pending</span>;
  };

  if (authLoading || !user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AdminPageGuard permission={P.MANAGE_VEHICLES}>
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/admin"
              className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition"
            >
              <FaArrowLeft className="text-sm" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Vehicle Management</h1>
              <p className="text-xs text-gray-400 mt-0.5">{total} {statusFilter === "all" ? "total" : statusFilter} vehicles</p>
            </div>
          </div>
          <Link
            href="/dashboard/host/vehicles/new"
            className="flex items-center gap-2 bg-black text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-gray-800 transition-colors"
          >
            + New vehicle
          </Link>
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 bg-white rounded-2xl border border-gray-100 p-1.5 mb-4">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`flex-1 py-2 text-sm font-medium rounded-xl transition-colors ${
                statusFilter === tab.key ? "bg-black text-white" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-sm" />
            <input
              type="text"
              placeholder="Search by make, model, or host…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>
        </div>

        {/* Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 h-64 animate-pulse" />
            ))}
          </div>
        ) : vehicles.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 text-sm">
            No {statusFilter === "all" ? "" : statusFilter + " "}vehicles found.
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {vehicles.map((v) => {
                const imgUrl = v.images?.[0]?.url;
                return (
                  <motion.div
                    key={v.id}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-gray-200 hover:shadow-sm transition-all"
                  >
                    {/* Image */}
                    <div
                      className="relative h-40 bg-gray-100 cursor-pointer group"
                      onClick={() => v.images?.length && setGalleryTarget(v)}
                    >
                      {imgUrl ? (
                        <Image
                          src={imgUrl}
                          alt={`${v.year} ${v.make} ${v.model}`}
                          fill
                          className="object-cover group-hover:opacity-90 transition-opacity"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-4xl">🚗</div>
                      )}
                      <div className="absolute top-2 left-2">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-black/70 text-white capitalize">
                          {v.vehicleType}
                        </span>
                      </div>
                      <div className="absolute top-2 right-2">{statusBadge(v)}</div>
                      {v.images?.length > 1 && (
                        <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                          {v.images.length} photos
                        </span>
                      )}
                      {v.images?.length > 0 && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="bg-black/50 text-white text-xs px-3 py-1.5 rounded-lg font-medium">
                            View gallery
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <p className="font-semibold text-gray-900 text-sm">
                        {v.year} {v.make} {v.model}
                      </p>
                      {v.location && <p className="text-xs text-gray-400 mt-0.5">{v.location}</p>}
                      <p className="text-xs text-gray-400 mt-1">
                        Host: <span className="text-gray-600">{v.host?.firstName} {v.host?.lastName}</span>
                      </p>
                      {v.status === "rejected" && v.rejectionReason && (
                        <p className="text-xs text-red-500 mt-1 italic line-clamp-2">
                          Reason: {v.rejectionReason}
                        </p>
                      )}
                      <p className="text-sm font-bold text-gray-900 mt-1">
                        ₦{Number(v.pricePerDay).toLocaleString("en-NG")}
                        <span className="text-xs font-normal text-gray-400">/day</span>
                      </p>

                      <div className="flex gap-2 mt-2 flex-wrap">
                        {v.seats && (
                          <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-500">
                            {v.seats} seats
                          </span>
                        )}
                        {v.withDriver && (
                          <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-500">
                            With driver
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-100 flex-wrap">
                        {/* Approve */}
                        {v.status !== "approved" && (
                          <button
                            onClick={() => setStatus(v, "approved")}
                            disabled={actionLoading === v.id + "-approved"}
                            title="Approve vehicle"
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium hover:bg-emerald-100 disabled:opacity-40 transition"
                          >
                            <FaCheck className="text-[10px]" /> Approve
                          </button>
                        )}

                        {/* Reject */}
                        {v.status !== "rejected" && (
                          <button
                            onClick={() => { setRejectTarget(v); setRejectionReason(""); }}
                            title="Reject vehicle"
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 transition"
                          >
                            <FaTimes className="text-[10px]" /> Reject
                          </button>
                        )}

                        {/* Toggle availability (approved only) */}
                        {v.status === "approved" && (
                          <button
                            onClick={() => toggleAvailability(v)}
                            disabled={actionLoading === v.id + "-toggle"}
                            title={v.isAvailable ? "Hide vehicle" : "Show vehicle"}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition"
                          >
                            {v.isAvailable ? (
                              <FaToggleOn className="text-emerald-500 text-sm" />
                            ) : (
                              <FaToggleOff className="text-gray-400 text-sm" />
                            )}
                            {v.isAvailable ? "Hide" : "Show"}
                          </button>
                        )}

                        <div className="ml-auto flex items-center gap-1">
                          <Link
                            href={`/vehicles/${v.id}`}
                            target="_blank"
                            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition"
                            title="View listing"
                          >
                            <FaExternalLinkAlt className="text-xs" />
                          </Link>
                          <Link
                            href={`/dashboard/host/vehicles/${v.id}/edit`}
                            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition"
                            title="Edit vehicle"
                          >
                            <FaEdit className="text-xs" />
                          </Link>
                          <button
                            onClick={() => setDeleteTarget(v.id)}
                            title="Delete vehicle"
                            className="w-8 h-8 rounded-lg border border-red-100 text-red-400 hover:bg-red-50 flex items-center justify-center transition"
                          >
                            <FaTrash className="text-xs" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
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

      {/* Reject modal */}
      <AnimatePresence>
        {rejectTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
            >
              <h3 className="font-bold text-gray-900 text-base mb-1">Reject vehicle?</h3>
              <p className="text-sm text-gray-500 mb-4">
                {rejectTarget.year} {rejectTarget.make} {rejectTarget.model}
              </p>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason <span className="text-gray-400 font-normal">(shown to host)</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                placeholder="e.g. Image quality too low, incomplete information…"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => { setRejectTarget(null); setRejectionReason(""); }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setStatus(rejectTarget, "rejected", rejectionReason)}
                  disabled={!!actionLoading}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-50 transition"
                >
                  Reject
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
            >
              <h3 className="font-bold text-gray-900 text-base mb-2">Delete vehicle?</h3>
              <p className="text-sm text-gray-500 mb-6">
                This will permanently remove the vehicle listing.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteVehicle(deleteTarget)}
                  disabled={!!actionLoading}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-50 transition"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gallery modal */}
      {galleryTarget && galleryTarget.images?.length > 0 && (
        <AdminGalleryModal
          images={galleryTarget.images}
          title={`${galleryTarget.year} ${galleryTarget.make} ${galleryTarget.model}`}
          onClose={() => setGalleryTarget(null)}
        />
      )}
    </div>
    </AdminPageGuard>
  );
}
