"use client";

// app/dashboard/admin/subscriptions/page.tsx
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaExclamationTriangle,
  FaChevronLeft,
  FaChevronRight,
  FaCrown,
  FaUsers,
  FaChartLine,
  FaEdit,
  FaSave,
  FaTimes,
} from "react-icons/fa";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import AdminPageGuard from "@/components/admin/AdminPageGuard";
import { ADMIN_PERMISSIONS as P } from "@/lib/adminPermissions";
import type { Subscription } from "@/types";

type StatusFilter = "all" | "active" | "cancelled" | "expired" | "past_due";
type TierFilter = "all" | "pro" | "elite";

const STATUS_STYLE: Record<string, { badge: string; icon: React.ReactNode }> = {
  active:    { badge: "bg-green-100 text-green-700",  icon: <FaCheckCircle className="text-xs" /> },
  cancelled: { badge: "bg-orange-100 text-orange-700", icon: <FaClock className="text-xs" /> },
  expired:   { badge: "bg-gray-100 text-gray-500",    icon: <FaTimesCircle className="text-xs" /> },
  past_due:  { badge: "bg-red-100 text-red-700",      icon: <FaExclamationTriangle className="text-xs" /> },
};

const TIER_BADGE: Record<string, string> = {
  starter: "bg-gray-100 text-gray-600",
  pro:     "bg-purple-100 text-purple-700",
  elite:   "bg-amber-100 text-amber-700",
};

interface Stats {
  activeSubscribers: number;
  byTier: Record<string, number>;
  byStatus: Record<string, number>;
  estimatedMRR: number;
}

export default function AdminSubscriptionsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [subs, setSubs] = useState<(Subscription & { host?: any })[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [tierFilter, setTierFilter] = useState<TierFilter>("all");
  const [page, setPage] = useState(1);
  const [cancelModal, setCancelModal] = useState<(Subscription & { host?: any }) | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // Plan config editor
  const [tierConfig, setTierConfig] = useState<Record<string, any> | null>(null);
  const [editingTier, setEditingTier] = useState<"pro" | "elite" | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [savingConfig, setSavingConfig] = useState(false);

  const LIMIT = 20;

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { router.push("/login"); return; }
    if (user?.role !== "admin") { router.push("/"); return; }
  }, [authLoading, isAuthenticated, user, router]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get("/subscriptions/admin/stats");
      setStats(res.data.data.stats);
    } catch {
      // handled by interceptor
    }
  }, []);

  const fetchTierConfig = useCallback(async () => {
    try {
      const res = await api.get("/subscriptions/admin/tier-config");
      setTierConfig(res.data.data.config);
    } catch {
      // handled by interceptor
    }
  }, []);

  const openEdit = (tier: "pro" | "elite") => {
    const cfg = tierConfig?.[tier] ?? {};
    setEditForm({
      priceMonthly: String(cfg.priceMonthly ?? ""),
      priceAnnual:  String(cfg.priceAnnual  ?? ""),
      maxProperties: cfg.maxProperties == null ? "" : String(cfg.maxProperties),
      maxVehicles:   cfg.maxVehicles   == null ? "" : String(cfg.maxVehicles),
      maxPhotos:     String(cfg.maxPhotos ?? ""),
      commissionRate: String(Math.round((cfg.commissionRate ?? 0) * 100)),
    });
    setEditingTier(tier);
  };

  const saveConfig = async () => {
    if (!editingTier) return;
    setSavingConfig(true);
    try {
      const payload: Record<string, number> = {};
      if (editForm.priceMonthly)  payload.priceMonthly  = Number(editForm.priceMonthly);
      if (editForm.priceAnnual)   payload.priceAnnual   = Number(editForm.priceAnnual);
      if (editForm.maxProperties) payload.maxProperties = Number(editForm.maxProperties);
      if (editForm.maxVehicles)   payload.maxVehicles   = Number(editForm.maxVehicles);
      if (editForm.maxPhotos)     payload.maxPhotos     = Number(editForm.maxPhotos);
      if (editForm.commissionRate) payload.commissionRate = Number(editForm.commissionRate) / 100;

      const res = await api.patch(`/subscriptions/admin/tier-config/${editingTier}`, payload);
      setTierConfig(res.data.data.config);
      setEditingTier(null);
      toast.success(`${editingTier.charAt(0).toUpperCase() + editingTier.slice(1)} plan updated and synced to Paystack`);
    } catch {
      // interceptor handles
    } finally {
      setSavingConfig(false);
    }
  };

  const fetchSubs = useCallback(async () => {
    if (!user || user.role !== "admin") return;
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: LIMIT };
      if (statusFilter !== "all") params.status = statusFilter;
      if (tierFilter !== "all") params.tier = tierFilter;
      const res = await api.get("/subscriptions/admin", { params });
      setSubs(res.data.data.subscriptions);
      setTotal(res.data.data.total);
    } catch {
      // handled by interceptor
    } finally {
      setIsLoading(false);
    }
  }, [user, page, statusFilter, tierFilter]);

  useEffect(() => { fetchStats(); fetchSubs(); fetchTierConfig(); }, [fetchStats, fetchSubs, fetchTierConfig]);
  useEffect(() => { setPage(1); }, [statusFilter, tierFilter]);

  const handleCancel = async () => {
    if (!cancelModal) return;
    setCancelling(true);
    try {
      await api.delete(`/subscriptions/admin/${cancelModal.id}`);
      toast.success("Subscription cancelled and host downgraded to Starter");
      setCancelModal(null);
      fetchStats();
      fetchSubs();
    } catch {
      // interceptor handles
    } finally {
      setCancelling(false);
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
    <AdminPageGuard permission={P.MANAGE_SUBSCRIPTIONS}>
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
              <h1 className="text-xl font-bold text-gray-900">Subscriptions</h1>
              <p className="text-xs text-gray-400 mt-0.5">{total} records · {stats?.activeSubscribers ?? 0} active</p>
            </div>
          </div>

          {/* Stats cards */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <FaUsers className="text-gray-400 text-sm" />
                  <p className="text-xs text-gray-500 font-medium">Active subscribers</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.activeSubscribers}</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <FaCrown className="text-purple-400 text-sm" />
                  <p className="text-xs text-gray-500 font-medium">Pro</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.byTier.pro ?? 0}</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <FaCrown className="text-amber-400 text-sm" />
                  <p className="text-xs text-gray-500 font-medium">Elite</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.byTier.elite ?? 0}</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <FaChartLine className="text-green-400 text-sm" />
                  <p className="text-xs text-gray-500 font-medium">Est. MRR</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  ₦{(stats.estimatedMRR / 1000).toFixed(0)}k
                </p>
              </div>
            </div>
          )}

          {/* Plan configuration */}
          {tierConfig && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 text-sm">Plan Configuration</h2>
                <p className="text-xs text-gray-400">Price changes sync to Paystack for new subscriptions</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(["pro", "elite"] as const).map((tier) => {
                  const cfg = tierConfig[tier] ?? {};
                  const isEditing = editingTier === tier;
                  const label = tier === "pro" ? "Pro" : "Elite";
                  const badgeColor = tier === "pro" ? "bg-purple-100 text-purple-700" : "bg-amber-100 text-amber-700";

                  return (
                    <div key={tier} className={`rounded-xl border p-4 ${isEditing ? "border-black" : "border-gray-100"}`}>
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${badgeColor}`}>
                          <FaCrown className="text-xs" /> {label}
                        </span>
                        {!isEditing ? (
                          <button
                            onClick={() => openEdit(tier)}
                            className="flex items-center gap-1 text-xs text-gray-500 hover:text-black transition"
                          >
                            <FaEdit className="text-xs" /> Edit
                          </button>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={saveConfig}
                              disabled={savingConfig}
                              className="flex items-center gap-1 text-xs bg-black text-white px-2.5 py-1 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition"
                            >
                              <FaSave className="text-xs" /> {savingConfig ? "Saving…" : "Save"}
                            </button>
                            <button
                              onClick={() => setEditingTier(null)}
                              className="flex items-center gap-1 text-xs border border-gray-200 px-2.5 py-1 rounded-lg hover:border-gray-400 transition"
                            >
                              <FaTimes className="text-xs" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        {[
                          { key: "priceMonthly",  label: "Monthly price (₦)",    suffix: "" },
                          { key: "priceAnnual",   label: "Annual price (₦)",     suffix: "" },
                          { key: "maxProperties", label: "Max properties",       suffix: "" },
                          { key: "maxVehicles",   label: "Max vehicles",         suffix: "" },
                          { key: "maxPhotos",     label: "Max photos/listing",   suffix: "" },
                          { key: "commissionRate", label: "Commission rate",      suffix: "%" },
                        ].map(({ key, label: fieldLabel, suffix }) => {
                          const rawVal = key === "commissionRate"
                            ? Math.round((cfg[key] ?? 0) * 100)
                            : (cfg[key] ?? (key === "maxProperties" || key === "maxVehicles" ? "Unlimited" : "—"));

                          return (
                            <div key={key} className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">{fieldLabel}</span>
                              {isEditing ? (
                                <input
                                  type="number"
                                  min="0"
                                  value={editForm[key] ?? ""}
                                  onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))}
                                  className="w-28 px-2 py-1 border border-gray-200 rounded-lg text-xs text-right focus:outline-none focus:border-black"
                                  placeholder={String(rawVal)}
                                />
                              ) : (
                                <span className="font-semibold text-gray-800">
                                  {rawVal == null ? "Unlimited" : `${rawVal}${suffix}`}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            {/* Status tabs */}
            <div className="bg-white rounded-xl border border-gray-100 p-1 flex gap-1">
              {(["active", "cancelled", "past_due", "expired", "all"] as StatusFilter[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    statusFilter === s ? "bg-black text-white" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {s === "past_due" ? "Past due" : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>

            {/* Tier filter */}
            <div className="bg-white rounded-xl border border-gray-100 p-1 flex gap-1">
              {(["all", "pro", "elite"] as TierFilter[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTierFilter(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    tierFilter === t ? "bg-black text-white" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Subscription list */}
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 h-24 animate-pulse" />
              ))}
            </div>
          ) : subs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 text-sm">
              No subscriptions found.
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {subs.map((sub) => {
                  const statusStyle = STATUS_STYLE[sub.status] ?? STATUS_STYLE["expired"];
                  const isActive = sub.status === "active";
                  const periodEnd = sub.currentPeriodEnd
                    ? new Date(sub.currentPeriodEnd).toLocaleDateString("en-GB")
                    : "—";

                  return (
                    <motion.div
                      key={sub.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="bg-white rounded-2xl border border-gray-100 p-4 hover:border-gray-200 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex-1 min-w-0">
                          {/* Badges */}
                          <div className="flex items-center flex-wrap gap-1.5 mb-1.5">
                            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${TIER_BADGE[sub.tier] ?? TIER_BADGE.starter}`}>
                              <FaCrown className="text-xs" />
                              {sub.tier.charAt(0).toUpperCase() + sub.tier.slice(1)}
                            </span>
                            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle.badge}`}>
                              {statusStyle.icon}
                              {sub.status}
                            </span>
                            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                              {sub.billingCycle}
                            </span>
                          </div>

                          {/* Host info */}
                          <p className="font-semibold text-gray-900 text-sm truncate">
                            {sub.host?.firstName} {sub.host?.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{sub.host?.email}</p>

                          {/* Dates */}
                          <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1.5 text-xs text-gray-400">
                            <span>Renews/ends: <span className="text-gray-600">{periodEnd}</span></span>
                            {sub.paystackSubscriptionCode && (
                              <span className="font-mono">
                                {sub.paystackSubscriptionCode}
                              </span>
                            )}
                            {sub.cancelledAt && (
                              <span>Cancelled: {new Date(sub.cancelledAt).toLocaleDateString("en-GB")}</span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                          {sub.host?.id && (
                            <Link
                              href={`/dashboard/admin/users/${sub.host.id}`}
                              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-gray-400 transition"
                            >
                              View host
                            </Link>
                          )}
                          {isActive && (
                            <button
                              onClick={() => setCancelModal(sub)}
                              className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition"
                            >
                              Force cancel
                            </button>
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

      {/* Force-cancel confirmation modal */}
      <AnimatePresence>
        {cancelModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
            onClick={() => setCancelModal(null)}
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
                <h2 className="font-semibold text-gray-900">Force-cancel subscription?</h2>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-1.5 text-sm">
                <p className="text-gray-700">
                  <span className="font-medium">Host:</span>{" "}
                  {cancelModal.host?.firstName} {cancelModal.host?.lastName} ({cancelModal.host?.email})
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Plan:</span>{" "}
                  {cancelModal.tier.charAt(0).toUpperCase() + cancelModal.tier.slice(1)} · {cancelModal.billingCycle}
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Period end:</span>{" "}
                  {cancelModal.currentPeriodEnd
                    ? new Date(cancelModal.currentPeriodEnd).toLocaleDateString("en-GB")
                    : "—"}
                </p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-sm text-red-700">
                This will immediately disable the subscription on Paystack, downgrade the host to Starter, and remove any paid plan benefits. This cannot be undone.
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setCancelModal(null)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-gray-400 transition-colors"
                >
                  Keep subscription
                </button>
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {cancelling ? "Cancelling…" : "Yes, cancel"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminPageGuard>
  );
}
