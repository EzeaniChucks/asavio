"use client";

// app/dashboard/host/hotels/page.tsx
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  FaArrowLeft,
  FaPlus,
  FaEdit,
  FaBed,
  FaTrash,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaStar,
  FaHotel,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { Hotel } from "@/types";
import { formatPrice } from "@/lib/formatPrice";
import { useCurrency } from "@/context/CurrencyContext";
import toast from "react-hot-toast";

const STATUS_STYLE: Record<string, { badge: string; icon: React.ReactNode; label: string }> = {
  approved: { badge: "bg-emerald-100 text-emerald-700", icon: <FaCheckCircle className="text-[10px]" />, label: "Approved" },
  pending:  { badge: "bg-amber-100 text-amber-700",     icon: <FaClock className="text-[10px]" />,       label: "Pending review" },
  rejected: { badge: "bg-red-100 text-red-600",         icon: <FaTimesCircle className="text-[10px]" />, label: "Rejected" },
};

export default function HostHotelsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { showUsd, toUsd } = useCurrency();

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { router.push("/login"); return; }
    if (user?.role !== "host" && user?.role !== "admin") { router.push("/"); return; }
  }, [authLoading, isAuthenticated, user, router]);

  const fetchHotels = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/hotels/host/my");
      setHotels(res.data.data.hotels ?? []);
    } catch {
      // interceptor handles
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchHotels();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this hotel and all its rooms? This cannot be undone.")) return;
    setDeleting(id);
    try {
      await api.delete(`/hotels/${id}`);
      setHotels((hs) => hs.filter((h) => h.id !== id));
      toast.success("Hotel deleted");
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
            <h1 className="text-2xl font-bold text-gray-900">My Hotels</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {hotels.length} {hotels.length === 1 ? "hotel" : "hotels"}
            </p>
          </div>
          <Link
            href="/dashboard/host/hotels/new"
            className="inline-flex items-center gap-2 bg-black text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-800 transition"
          >
            <FaPlus className="text-xs" />
            Add hotel
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 h-36 animate-pulse" />
            ))}
          </div>
        ) : hotels.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <FaHotel className="text-4xl text-gray-300 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">No hotels yet</h3>
            <p className="text-gray-500 text-sm mb-6">Create your first hotel listing to get started.</p>
            <Link
              href="/dashboard/host/hotels/new"
              className="inline-flex items-center gap-2 bg-black text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-800 transition"
            >
              <FaPlus className="text-xs" />
              Add hotel
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {hotels.map((h, i) => {
              const status = STATUS_STYLE[h.status] ?? STATUS_STYLE.pending;
              const primaryImage = h.images?.find((img) => img.isPrimary)?.url ?? h.images?.[0]?.url;
              const startingFrom = (h.roomTypes ?? [])
                .map((r) => Number(r.pricePerNight))
                .filter((n) => Number.isFinite(n) && n > 0)
                .sort((a, b) => a - b)[0];

              return (
                <motion.div
                  key={h.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="flex gap-4 p-4">
                    <div className="relative w-28 h-28 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                      {primaryImage ? (
                        <img src={primaryImage} alt={h.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">🏨</div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">{h.name}</h3>
                        <span className={`flex items-center gap-1 flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${status.badge}`}>
                          {status.icon}
                          {status.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                        <span className="flex items-center gap-1">
                          <FaMapMarkerAlt className="text-gray-400 text-[10px]" />
                          {h.location.city}, {h.location.state}
                        </span>
                        {typeof h.starRating === "number" && h.starRating > 0 && (
                          <span className="flex items-center gap-0.5 text-amber-500">
                            {Array.from({ length: h.starRating }).map((_, n) => (
                              <FaStar key={n} className="text-[10px]" />
                            ))}
                            {h.verifiedStarRating && (
                              <FaCheckCircle className="text-emerald-500 ml-1 text-[10px]" />
                            )}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
                        <span className="flex items-center gap-1">
                          <FaBed className="text-gray-400" />
                          {h.roomTypes?.length ?? 0} room {h.roomTypes?.length === 1 ? "type" : "types"}
                        </span>
                        {startingFrom && (
                          <span>
                            From{" "}
                            <span className="font-semibold text-gray-800">
                              {showUsd && toUsd(startingFrom) ? toUsd(startingFrom) : formatPrice(startingFrom)}
                            </span>{" "}
                            / night
                          </span>
                        )}
                      </div>

                      {h.status === "rejected" && h.rejectionReason && (
                        <p className="text-xs text-red-500 italic mb-2 line-clamp-2">
                          Reason: {h.rejectionReason}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/dashboard/host/hotels/${h.id}/edit`}
                          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 transition"
                        >
                          <FaEdit className="text-[10px]" />
                          Edit details
                        </Link>
                        <Link
                          href={`/dashboard/host/hotels/${h.id}/rooms`}
                          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 transition"
                        >
                          <FaBed className="text-[10px]" />
                          Manage rooms
                        </Link>
                        <button
                          onClick={() => handleDelete(h.id)}
                          disabled={deleting === h.id}
                          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 border border-red-100 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-40 transition"
                        >
                          <FaTrash className="text-[10px]" />
                          {deleting === h.id ? "Deleting…" : "Delete"}
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
