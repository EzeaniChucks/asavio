"use client";

// app/dashboard/admin/event-centers/page.tsx
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
  FaChevronLeft,
  FaChevronRight,
  FaCheck,
  FaTimes,
  FaMapMarkerAlt,
  FaToggleOn,
  FaToggleOff,
  FaImages,
  FaEdit,
} from "react-icons/fa";
import { MdMeetingRoom } from "react-icons/md";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { EventCenter } from "@/types";
import toast from "react-hot-toast";
import AdminPageGuard from "@/components/admin/AdminPageGuard";
import { ADMIN_PERMISSIONS as P } from "@/lib/adminPermissions";

type StatusFilter = "all" | "pending" | "approved" | "rejected" | "archived";

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "archived", label: "Archived" },
];

export default function AdminEventCentersPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [eventCenters, setEventCenters] = useState<EventCenter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<EventCenter | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [galleryTarget, setGalleryTarget] = useState<EventCenter | null>(null);

  const LIMIT = 20;

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (user?.role !== "admin") {
      router.push("/");
      return;
    }
  }, [authLoading, isAuthenticated, user, router]);

  const fetchEventCenters = useCallback(async () => {
    if (!user || user.role !== "admin") return;
    setIsLoading(true);
    try {
      const params: Record<string, string | number | boolean> = {
        page,
        limit: LIMIT,
      };
      if (search.trim()) params.search = search.trim();
      if (statusFilter === "archived") {
        params.status = "approved";
        params.isAvailable = false;
      } else if (statusFilter === "approved") {
        params.status = "approved";
        params.isAvailable = true;
      } else if (statusFilter === "pending" || statusFilter === "rejected") {
        params.status = statusFilter;
      }
      const res = await api.get("/admin/event-centers", { params });
      const data = res.data.data ?? res.data;
      setEventCenters(data.eventCenters ?? []);
      setTotal(data.total ?? 0);
    } catch {
      // interceptor handles
    } finally {
      setIsLoading(false);
    }
  }, [user, page, search, statusFilter]);

  useEffect(() => {
    fetchEventCenters();
  }, [fetchEventCenters]);
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const toggleAvailability = async (ec: EventCenter) => {
    setActionLoading(ec.id + "-toggle");
    try {
      await api.patch(`/admin/event-centers/${ec.id}`, { isAvailable: !ec.isAvailable });
      toast.success(ec.isAvailable ? `"${ec.name}" archived` : `"${ec.name}" restored`);
      fetchEventCenters();
    } catch {
      // interceptor handles
    } finally {
      setActionLoading(null);
    }
  };

  const approve = async (id: string) => {
    setActionLoading(id + "-approve");
    try {
      await api.patch(`/admin/event-centers/${id}`, { status: "approved", isAvailable: true });
      toast.success("Event center approved and is now live");
      fetchEventCenters();
    } catch {
      // interceptor handles
    } finally {
      setActionLoading(null);
    }
  };

  const reject = async () => {
    if (!rejectTarget) return;
    setActionLoading(rejectTarget.id + "-reject");
    try {
      await api.patch(`/admin/event-centers/${rejectTarget.id}`, {
        status: "rejected",
        rejectionReason: rejectionReason.trim() || undefined,
      });
      toast.success("Event center rejected");
      setRejectTarget(null);
      setRejectionReason("");
      fetchEventCenters();
    } catch {
      // interceptor handles
    } finally {
      setActionLoading(null);
    }
  };

  const deleteEventCenter = async (id: string) => {
    setActionLoading(id + "-delete");
    try {
      await api.delete(`/admin/event-centers/${id}`);
      toast.success("Event center deleted");
      setEventCenters((ecs) => ecs.filter((ec) => ec.id !== id));
      setTotal((t) => t - 1);
      setDeleteTarget(null);
    } catch {
      // interceptor handles
    } finally {
      setActionLoading(null);
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
    <AdminPageGuard permission={P.MANAGE_EVENT_CENTERS}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
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
                Event centers moderation
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">{total} total</p>
            </div>
          </div>

          {/* Search + tabs */}
          <div className="bg-white rounded-2xl border border-gray-100 p-3 mb-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-sm" />
              <input
                type="text"
                placeholder="Search by name, city, or host\u2026"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              {STATUS_TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setStatusFilter(t.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    statusFilter === t.key
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-gray-100 h-32 animate-pulse"
                />
              ))}
            </div>
          ) : eventCenters.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 text-sm">
              No event centers found.
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {eventCenters.map((ec) => {
                  const primary =
                    ec.images?.find((i) => i.isPrimary)?.url ??
                    ec.images?.[0]?.url;
                  const statusClass =
                    ec.status === "approved"
                      ? "bg-emerald-100 text-emerald-700"
                      : ec.status === "pending"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-600";

                  return (
                    <motion.div
                      key={ec.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4 items-start"
                    >
                      <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                        {primary ? (
                          <Image
                            src={primary}
                            alt={ec.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl">
                            {"\uD83C\uDFAA"}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {ec.name}
                          </h3>
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${statusClass}`}
                          >
                            {ec.status}
                          </span>
                          {!ec.isAvailable && ec.status === "approved" && (
                            <span className="text-xs text-gray-400 italic">
                              Archived
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 mb-2">
                          <span className="flex items-center gap-1">
                            <FaMapMarkerAlt className="text-gray-400" />
                            {ec.location.city}, {ec.location.state}
                          </span>
                          <span className="flex items-center gap-1">
                            <MdMeetingRoom className="text-gray-400" />
                            {ec.spaces?.length ?? 0}{" "}
                            {(ec.spaces?.length ?? 0) === 1 ? "space" : "spaces"}
                          </span>
                          {ec.host && (
                            <span>
                              Host: {ec.host.firstName} {ec.host.lastName}
                            </span>
                          )}
                        </div>

                        {ec.status === "rejected" && ec.rejectionReason && (
                          <p className="text-xs text-red-500 italic mb-2">
                            Reason: {ec.rejectionReason}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-2">
                          {ec.status !== "approved" && (
                            <button
                              onClick={() => approve(ec.id)}
                              disabled={actionLoading === ec.id + "-approve"}
                              className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-40 transition"
                            >
                              <FaCheck className="text-[10px]" />
                              Approve
                            </button>
                          )}
                          {ec.status !== "rejected" && (
                            <button
                              onClick={() => {
                                setRejectTarget(ec);
                                setRejectionReason("");
                              }}
                              className="inline-flex items-center gap-1 text-xs px-3 py-1.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                            >
                              <FaTimes className="text-[10px]" />
                              Reject
                            </button>
                          )}
                          {ec.status === "approved" && (
                            <button
                              onClick={() => toggleAvailability(ec)}
                              disabled={actionLoading === ec.id + "-toggle"}
                              className={`inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-medium disabled:opacity-40 transition ${
                                ec.isAvailable
                                  ? "border border-gray-200 text-gray-600 hover:bg-gray-100"
                                  : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                              }`}
                            >
                              {ec.isAvailable ? (
                                <><FaToggleOn className="text-emerald-500 text-sm" /> Archive</>
                              ) : (
                                <><FaToggleOff className="text-amber-500 text-sm" /> Restore</>
                              )}
                            </button>
                          )}
                          {ec.images?.length > 0 && (
                            <button
                              onClick={() => setGalleryTarget(ec)}
                              className="inline-flex items-center gap-1 text-xs px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-100 transition"
                            >
                              <FaImages className="text-[10px]" />
                              Gallery ({ec.images.length})
                            </button>
                          )}
                          <Link
                            href={`/dashboard/host/event-centers/${ec.id}/edit`}
                            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-100 transition"
                            title="Edit venue details"
                          >
                            <FaEdit className="text-[10px]" />
                            Edit
                          </Link>
                          <Link
                            href={`/dashboard/host/event-centers/${ec.id}/spaces`}
                            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-100 transition"
                            title="Manage spaces"
                          >
                            <FaMapMarkerAlt className="text-[10px]" />
                            Spaces
                          </Link>
                          <Link
                            href={`/events/${ec.id}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-100 transition"
                          >
                            <FaExternalLinkAlt className="text-[10px]" />
                            View
                          </Link>
                          <button
                            onClick={() => setDeleteTarget(ec.id)}
                            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 border border-red-100 text-red-500 rounded-lg hover:bg-red-50 transition"
                          >
                            <FaTrash className="text-[10px]" />
                            Delete
                          </button>
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

      {/* Reject modal */}
      <AnimatePresence>
        {rejectTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
            onClick={() => setRejectTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="font-semibold text-gray-900 mb-1">
                Reject &quot;{rejectTarget.name}&quot;?
              </h2>
              <p className="text-xs text-gray-400 mb-4">
                Host will be notified with your reason.
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Reason (optional but recommended)\u2026"
                rows={4}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-4 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setRejectTarget(null)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={reject}
                  disabled={actionLoading === rejectTarget.id + "-reject"}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
                >
                  {actionLoading === rejectTarget.id + "-reject"
                    ? "Rejecting\u2026"
                    : "Reject"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Delete modal */}
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
            onClick={() => setDeleteTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="font-semibold text-gray-900 mb-3">
                Delete this event center?
              </h2>
              <p className="text-sm text-gray-500 mb-5">
                This permanently removes the event center, all its spaces, and
                all its images. Cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteEventCenter(deleteTarget)}
                  disabled={actionLoading === deleteTarget + "-delete"}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
                >
                  {actionLoading === deleteTarget + "-delete"
                    ? "Deleting\u2026"
                    : "Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gallery modal */}
      <AnimatePresence>
        {galleryTarget && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
            onClick={() => setGalleryTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl p-6 max-w-3xl w-full max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">{galleryTarget.name} — Photos</h2>
                <button onClick={() => setGalleryTarget(null)} className="text-gray-400 hover:text-black">
                  <FaTimes />
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {galleryTarget.images?.map((img, i) => (
                  <div key={img.id || i} className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100">
                    <Image src={img.url} alt={galleryTarget.name} fill className="object-cover" />
                    {img.isPrimary && (
                      <span className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                        Primary
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminPageGuard>
  );
}
