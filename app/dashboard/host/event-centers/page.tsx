"use client";

// app/dashboard/host/event-centers/page.tsx
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  FaArrowLeft,
  FaPlus,
  FaEdit,
  FaTrash,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaUsers,
} from "react-icons/fa";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { EventCenter } from "@/types";
import { formatPrice } from "@/lib/formatPrice";
import { useCurrency } from "@/context/CurrencyContext";
import toast from "react-hot-toast";

const STATUS_STYLE: Record<string, { badge: string; icon: React.ReactNode; label: string }> = {
  approved: { badge: "bg-emerald-100 text-emerald-700", icon: <FaCheckCircle className="text-[10px]" />, label: "Approved" },
  pending:  { badge: "bg-amber-100 text-amber-700",     icon: <FaClock className="text-[10px]" />,       label: "Pending review" },
  rejected: { badge: "bg-red-100 text-red-600",         icon: <FaTimesCircle className="text-[10px]" />, label: "Rejected" },
};

export default function HostEventCentersPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { showUsd, toUsd } = useCurrency();

  const [eventCenters, setEventCenters] = useState<EventCenter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { router.push("/login"); return; }
    if (user?.role !== "host" && user?.role !== "admin") { router.push("/"); return; }
  }, [authLoading, isAuthenticated, user, router]);

  const fetchEventCenters = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/event-centers/host/my");
      setEventCenters(res.data.data.eventCenters ?? []);
    } catch {
      // interceptor handles
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchEventCenters();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this event center and all its spaces? This cannot be undone.")) return;
    setDeleting(id);
    try {
      await api.delete(`/event-centers/${id}`);
      setEventCenters((ecs) => ecs.filter((ec) => ec.id !== id));
      toast.success("Event center deleted");
    } catch {
      // interceptor handles
    } finally {
      setDeleting(null);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8 max-w-4xl">
        <Link
          href="/dashboard/host"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-black text-sm mb-6 transition-colors"
        >
          <FaArrowLeft /> Back to dashboard
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Event Centers</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {eventCenters.length} {eventCenters.length === 1 ? "event center" : "event centers"}
            </p>
          </div>
          <Link
            href="/dashboard/host/event-centers/new"
            className="inline-flex items-center gap-2 bg-black text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-800 transition"
          >
            <FaPlus className="text-xs" />
            Add event center
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 h-36 animate-pulse" />
            ))}
          </div>
        ) : eventCenters.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <FaCalendarAlt className="text-4xl text-gray-300 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">No event centers yet</h3>
            <p className="text-gray-500 text-sm mb-6">Create your first event center listing to get started.</p>
            <Link
              href="/dashboard/host/event-centers/new"
              className="inline-flex items-center gap-2 bg-black text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-800 transition"
            >
              <FaPlus className="text-xs" />
              Add event center
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {eventCenters.map((ec, i) => {
              const status = STATUS_STYLE[ec.status] ?? STATUS_STYLE.pending;
              const primaryImage = ec.images?.find((img) => img.isPrimary)?.url ?? ec.images?.[0]?.url;

              const allRates = (ec.spaces ?? []).flatMap((s) => [
                s.hourlyRate,
                s.dailyRate,
                s.packageRate,
              ]);
              const startingFrom = allRates
                .filter((r): r is number => r != null && Number.isFinite(r) && r > 0)
                .sort((a, b) => a - b)[0];

              return (
                <motion.div
                  key={ec.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="flex gap-4 p-4">
                    <div className="relative w-28 h-28 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                      {primaryImage ? (
                        <img src={primaryImage} alt={ec.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">{"\uD83C\uDFAA"}</div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">{ec.name}</h3>
                        <span className={`flex items-center gap-1 flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${status.badge}`}>
                          {status.icon}
                          {status.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                        <span className="flex items-center gap-1">
                          <FaMapMarkerAlt className="text-gray-400 text-[10px]" />
                          {ec.location.city}, {ec.location.state}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
                        <span className="flex items-center gap-1">
                          <FaUsers className="text-gray-400" />
                          {ec.spaces?.length ?? 0} {(ec.spaces?.length ?? 0) === 1 ? "space" : "spaces"}
                        </span>
                        {startingFrom && (
                          <span>
                            Starting from{" "}
                            <span className="font-semibold text-gray-800">
                              {showUsd && toUsd(startingFrom) ? toUsd(startingFrom) : formatPrice(startingFrom)}
                            </span>
                          </span>
                        )}
                      </div>

                      {ec.status === "rejected" && ec.rejectionReason && (
                        <p className="text-xs text-red-500 italic mb-2 line-clamp-2">
                          Reason: {ec.rejectionReason}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/dashboard/host/event-centers/${ec.id}/edit`}
                          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 transition"
                        >
                          <FaEdit className="text-[10px]" />
                          Edit details
                        </Link>
                        <Link
                          href={`/dashboard/host/event-centers/${ec.id}/spaces`}
                          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 transition"
                        >
                          <FaCalendarAlt className="text-[10px]" />
                          Manage spaces
                        </Link>
                        <button
                          onClick={() => handleDelete(ec.id)}
                          disabled={deleting === ec.id}
                          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 border border-red-100 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-40 transition"
                        >
                          <FaTrash className="text-[10px]" />
                          {deleting === ec.id ? "Deleting\u2026" : "Delete"}
                        </button>
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
