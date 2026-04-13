"use client";

// app/dashboard/admin/users/[id]/page.tsx
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaExclamationTriangle,
  FaPhone,
  FaEnvelope,
  FaUserShield,
  FaUserAlt,
  FaPercent,
  FaTrash,
  FaCrown,
  FaHome,
  FaCar,
  FaExternalLinkAlt,
  FaStar,
} from "react-icons/fa";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/formatPrice";
import toast from "react-hot-toast";
import AdminPageGuard from "@/components/admin/AdminPageGuard";
import { ADMIN_PERMISSIONS as P } from "@/lib/adminPermissions";
import type { User, Property } from "@/types";

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  vehicleType: string;
  pricePerDay: number;
  status: string;
  isAvailable: boolean;
  images: { url: string }[];
  location: string;
  averageRating: number;
  totalReviews: number;
}

const KYC_STYLE: Record<string, { badge: string; icon: React.ReactNode; label: string }> = {
  approved:      { badge: "bg-emerald-100 text-emerald-700", icon: <FaCheckCircle className="text-[10px]" />, label: "Approved" },
  pending:       { badge: "bg-amber-100 text-amber-700",     icon: <FaClock className="text-[10px]" />,       label: "Pending" },
  rejected:      { badge: "bg-red-100 text-red-600",         icon: <FaTimesCircle className="text-[10px]" />, label: "Rejected" },
  not_submitted: { badge: "bg-gray-100 text-gray-400",       icon: null,                                      label: "Not submitted" },
};

const TIER_BADGE: Record<string, string> = {
  starter: "bg-gray-100 text-gray-600",
  pro:     "bg-purple-100 text-purple-700",
  elite:   "bg-amber-100 text-amber-700",
};

const STATUS_BADGE: Record<string, string> = {
  approved: "bg-emerald-100 text-emerald-700",
  pending:  "bg-amber-100 text-amber-700",
  rejected: "bg-red-100 text-red-600",
};

type Tab = "properties" | "vehicles";

export default function AdminUserDetailPage() {
  const params = useParams();
  const userId = params.id as string;
  const router = useRouter();
  const { user: adminUser, isAuthenticated, isLoading: authLoading } = useAuth();

  const [profile, setProfile]       = useState<User | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [vehicles, setVehicles]     = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [tab, setTab]               = useState<Tab>("properties");

  // Action states
  const [actionLoading, setActionLoading]   = useState<string | null>(null);
  const [deleteModal, setDeleteModal]       = useState(false);
  const [commissionModal, setCommissionModal] = useState(false);
  const [commissionInput, setCommissionInput] = useState("");
  const [emailModal, setEmailModal]         = useState(false);
  const [emailSubject, setEmailSubject]     = useState("");
  const [emailMessage, setEmailMessage]     = useState("");
  const [emailSending, setEmailSending]     = useState(false);
  const [demoteModal, setDemoteModal]       = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { router.push("/login"); return; }
    if (adminUser?.role !== "admin") { router.push("/"); return; }
  }, [authLoading, isAuthenticated, adminUser, router]);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/admin/users/${userId}`);
      setProfile(res.data.data.user);
    } catch {
      // interceptor handles
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const fetchHostListings = useCallback(async () => {
    try {
      const [propRes, vehRes] = await Promise.all([
        api.get(`/admin/users/${userId}/properties`),
        api.get(`/admin/users/${userId}/vehicles`),
      ]);
      setProperties(propRes.data.data.properties ?? []);
      setVehicles(vehRes.data.data.vehicles ?? []);
    } catch {
      // interceptor handles
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (profile?.role === "host") {
      fetchHostListings();
    }
  }, [profile?.role, fetchHostListings]);

  // ── Actions ──────────────────────────────────────────────────

  async function changeRole(role: "host" | "user") {
    if (!profile) return;
    setActionLoading("role");
    try {
      await api.patch(`/admin/users/${userId}`, { role });
      setProfile((p) => p ? { ...p, role } : p);
      toast.success(`${profile.firstName} is now a ${role}`);
      setDemoteModal(false);
    } catch {
      // interceptor handles
    } finally {
      setActionLoading(null);
    }
  }

  async function saveCommission() {
    if (!profile) return;
    const raw = commissionInput.trim();
    const override = raw === "" ? null : parseFloat(raw) / 100;
    if (override !== null && (isNaN(override) || override < 0 || override > 1)) {
      toast.error("Enter 0–100, or leave blank to use the global rate");
      return;
    }
    setActionLoading("commission");
    try {
      await api.patch(`/admin/users/${userId}/commission`, { commissionRateOverride: override });
      setProfile((p) => p ? { ...p, commissionRateOverride: override } : p);
      toast.success(override === null ? "Using global commission rate" : `Rate set to ${(override * 100).toFixed(2)}%`);
      setCommissionModal(false);
    } catch {
      // interceptor handles
    } finally {
      setActionLoading(null);
    }
  }

  async function sendEmail() {
    if (!emailSubject.trim() || !emailMessage.trim()) return;
    setEmailSending(true);
    try {
      await api.post("/admin/email/direct", {
        userId,
        subject: emailSubject.trim(),
        message: emailMessage.trim(),
      });
      toast.success("Email sent");
      setEmailModal(false);
      setEmailSubject("");
      setEmailMessage("");
    } catch {
      // interceptor handles
    } finally {
      setEmailSending(false);
    }
  }

  async function deleteUser() {
    setActionLoading("delete");
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success("User deleted");
      router.push("/dashboard/admin/users");
    } catch {
      // interceptor handles
    } finally {
      setActionLoading(null);
      setDeleteModal(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────

  if (authLoading || !adminUser || adminUser.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AdminPageGuard permission={P.MANAGE_USERS}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition"
            >
              <FaArrowLeft className="text-sm" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">User Profile</h1>
              <p className="text-xs text-gray-400 mt-0.5">Admin view</p>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 h-28 animate-pulse" />
              ))}
            </div>
          ) : !profile ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 text-sm">
              User not found.
            </div>
          ) : (
            <>
              {/* Profile card */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
                <div className="flex flex-col sm:flex-row sm:items-start gap-5">
                  {/* Avatar */}
                  <div className="w-16 h-16 rounded-2xl bg-black text-white flex items-center justify-center text-2xl font-bold flex-shrink-0">
                    {profile.firstName[0]}{profile.lastName[0]}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h2 className="text-lg font-bold text-gray-900">
                        {profile.firstName} {profile.lastName}
                      </h2>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                        profile.role === "host" ? "bg-blue-100 text-blue-700"
                        : profile.role === "admin" ? "bg-purple-100 text-purple-700"
                        : "bg-gray-100 text-gray-700"
                      }`}>
                        {profile.role}
                      </span>
                      {profile.subscriptionTier && profile.subscriptionTier !== "starter" && (
                        <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${TIER_BADGE[profile.subscriptionTier]}`}>
                          <FaCrown className="text-xs" />
                          {profile.subscriptionTier.charAt(0).toUpperCase() + profile.subscriptionTier.slice(1)}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500 mb-3">
                      <span className="flex items-center gap-1.5">
                        <FaEnvelope className="text-gray-300" /> {profile.email}
                      </span>
                      {profile.phone && (
                        <span className="flex items-center gap-1.5">
                          <FaPhone className="text-gray-300" /> {profile.phone}
                        </span>
                      )}
                      <span className="text-gray-400">
                        Joined {new Date(profile.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>

                    {/* KYC / host tier */}
                    {profile.role === "host" && (
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          const kyc = profile.kycStatus ?? "not_submitted";
                          const style = KYC_STYLE[kyc] ?? KYC_STYLE.not_submitted;
                          return (
                            <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${style.badge}`}>
                              {style.icon} KYC: {style.label}
                            </span>
                          );
                        })()}
                        {profile.hostTier && profile.hostTier !== "new_host" && (
                          <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full text-xs font-medium capitalize">
                            {profile.hostTier.replace("_", " ")}
                          </span>
                        )}
                        {profile.commissionRateOverride !== null && profile.commissionRateOverride !== undefined && (
                          <span className="bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full text-xs font-medium">
                            Custom rate: {(Number(profile.commissionRateOverride) * 100).toFixed(2)}%
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap sm:flex-col gap-2 sm:items-end">
                    {profile.role !== "admin" && (
                      <>
                        <button
                          onClick={() => {
                            if (profile.role === "host") {
                              setDemoteModal(true);
                            } else {
                              changeRole("host");
                            }
                          }}
                          disabled={actionLoading === "role"}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition"
                        >
                          {profile.role === "host" ? <FaUserAlt className="text-xs" /> : <FaUserShield className="text-xs" />}
                          {profile.role === "host" ? "Demote to user" : "Promote to host"}
                        </button>

                        {profile.role === "host" && (
                          <button
                            onClick={() => {
                              setCommissionInput(
                                profile.commissionRateOverride !== null && profile.commissionRateOverride !== undefined
                                  ? (Number(profile.commissionRateOverride) * 100).toFixed(2)
                                  : ""
                              );
                              setCommissionModal(true);
                            }}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-100 transition"
                          >
                            <FaPercent className="text-xs" /> Commission
                          </button>
                        )}

                        <button
                          onClick={() => { setEmailSubject(""); setEmailMessage(""); setEmailModal(true); }}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-100 transition"
                        >
                          <FaEnvelope className="text-xs" /> Email
                        </button>

                        {profile.phone && (
                          <a
                            href={`tel:${profile.phone}`}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium text-green-600 hover:bg-green-50 transition"
                          >
                            <FaPhone className="text-xs" /> Call
                          </a>
                        )}

                        <button
                          onClick={() => setDeleteModal(true)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-100 text-xs font-medium text-red-500 hover:bg-red-50 transition"
                        >
                          <FaTrash className="text-xs" /> Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Bank info (host only) */}
              {profile.role === "host" && profile.bankAccountName && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Payout Account</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Account name</p>
                      <p className="font-medium text-gray-800">{profile.bankAccountName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Account number</p>
                      <p className="font-medium text-gray-800">{profile.bankAccountNumber ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Bank</p>
                      <p className="font-medium text-gray-800">{profile.bankName ?? "—"}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Listings (host only) */}
              {profile.role === "host" && (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  {/* Tabs */}
                  <div className="flex border-b border-gray-100">
                    <button
                      onClick={() => setTab("properties")}
                      className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors ${
                        tab === "properties"
                          ? "border-b-2 border-black text-gray-900"
                          : "text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      <FaHome className="text-xs" />
                      Properties
                      <span className="ml-1 bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">{properties.length}</span>
                    </button>
                    <button
                      onClick={() => setTab("vehicles")}
                      className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors ${
                        tab === "vehicles"
                          ? "border-b-2 border-black text-gray-900"
                          : "text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      <FaCar className="text-xs" />
                      Vehicles
                      <span className="ml-1 bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">{vehicles.length}</span>
                    </button>
                  </div>

                  {/* Properties tab */}
                  {tab === "properties" && (
                    <div>
                      {properties.length === 0 ? (
                        <div className="p-10 text-center text-gray-400 text-sm">No properties.</div>
                      ) : (
                        <div className="divide-y divide-gray-50">
                          {properties.map((p) => (
                            <div key={p.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors">
                              {/* Thumbnail */}
                              <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                                {p.images?.[0]?.url ? (
                                  <img src={p.images[0].url} alt={p.title} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-xl">🏠</div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 text-sm truncate">{p.title}</p>
                                <p className="text-xs text-gray-400 truncate">
                                  {p.location.city}, {p.location.state} · {formatPrice(p.pricePerNight)}/night
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[p.status] ?? "bg-gray-100 text-gray-500"}`}>
                                    {p.status}
                                  </span>
                                  {!p.isAvailable && p.status === "approved" && (
                                    <span className="text-xs text-gray-400">Unavailable</span>
                                  )}
                                  {p.totalReviews > 0 && (
                                    <span className="flex items-center gap-0.5 text-xs text-gray-400">
                                      <FaStar className="text-yellow-400 text-[10px]" />
                                      {Number(p.averageRating).toFixed(1)} ({p.totalReviews})
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Link
                                href={`/properties/${p.id}`}
                                target="_blank"
                                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition flex-shrink-0"
                                title="View listing"
                              >
                                <FaExternalLinkAlt className="text-xs" />
                              </Link>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Vehicles tab */}
                  {tab === "vehicles" && (
                    <div>
                      {vehicles.length === 0 ? (
                        <div className="p-10 text-center text-gray-400 text-sm">No vehicles.</div>
                      ) : (
                        <div className="divide-y divide-gray-50">
                          {vehicles.map((v) => (
                            <div key={v.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors">
                              {/* Thumbnail */}
                              <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                                {v.images?.[0]?.url ? (
                                  <img src={v.images[0].url} alt={`${v.make} ${v.model}`} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-xl">🚗</div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 text-sm truncate">
                                  {v.year} {v.make} {v.model}
                                </p>
                                <p className="text-xs text-gray-400 truncate">
                                  {v.location} · {formatPrice(v.pricePerDay)}/day
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[v.status] ?? "bg-gray-100 text-gray-500"}`}>
                                    {v.status}
                                  </span>
                                  {!v.isAvailable && v.status === "approved" && (
                                    <span className="text-xs text-gray-400">Unavailable</span>
                                  )}
                                  {v.totalReviews > 0 && (
                                    <span className="flex items-center gap-0.5 text-xs text-gray-400">
                                      <FaStar className="text-yellow-400 text-[10px]" />
                                      {Number(v.averageRating).toFixed(1)} ({v.totalReviews})
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Link
                                href={`/vehicles/${v.id}`}
                                target="_blank"
                                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition flex-shrink-0"
                                title="View listing"
                              >
                                <FaExternalLinkAlt className="text-xs" />
                              </Link>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────────── */}
      <AnimatePresence>

        {/* Demote confirmation */}
        {demoteModal && profile && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
            onClick={() => setDemoteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <FaExclamationTriangle className="text-amber-500" />
                </div>
                <h2 className="font-semibold text-gray-900">Demote to user?</h2>
              </div>
              <p className="text-sm text-gray-600 mb-5">
                {profile.firstName} will lose host privileges. Their listings will remain but won't be bookable until they become a host again.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDemoteModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-gray-400 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => changeRole("user")}
                  disabled={actionLoading === "role"}
                  className="flex-1 py-2.5 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition"
                >
                  {actionLoading === "role" ? "Saving…" : "Demote"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Commission modal */}
        {commissionModal && profile && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
            onClick={() => setCommissionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="font-semibold text-gray-900 mb-1">Commission override</h2>
              <p className="text-xs text-gray-500 mb-4">
                Override the platform commission rate for {profile.firstName}. Leave blank to use the global rate.
              </p>
              <div className="relative mb-5">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={commissionInput}
                  onChange={(e) => setCommissionInput(e.target.value)}
                  placeholder="e.g. 8 (for 8%)"
                  className="w-full pr-10 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setCommissionModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-gray-400 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={saveCommission}
                  disabled={actionLoading === "commission"}
                  className="flex-1 py-2.5 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition"
                >
                  {actionLoading === "commission" ? "Saving…" : "Save"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Email modal */}
        {emailModal && profile && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
            onClick={() => setEmailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="font-semibold text-gray-900 mb-1">Email {profile.firstName}</h2>
              <p className="text-xs text-gray-400 mb-4">{profile.email}</p>
              <div className="space-y-3 mb-5">
                <input
                  type="text"
                  placeholder="Subject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                />
                <textarea
                  placeholder="Message"
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-black/10"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setEmailModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-gray-400 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={sendEmail}
                  disabled={emailSending || !emailSubject.trim() || !emailMessage.trim()}
                  className="flex-1 py-2.5 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition"
                >
                  {emailSending ? "Sending…" : "Send"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Delete confirmation */}
        {deleteModal && profile && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
            onClick={() => setDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <FaTrash className="text-red-600" />
                </div>
                <h2 className="font-semibold text-gray-900">Delete {profile.firstName}?</h2>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 text-sm text-red-700">
                This permanently deletes the account, all listings, and booking history. This cannot be undone.
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-gray-400 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteUser}
                  disabled={actionLoading === "delete"}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition"
                >
                  {actionLoading === "delete" ? "Deleting…" : "Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>
    </AdminPageGuard>
  );
}
