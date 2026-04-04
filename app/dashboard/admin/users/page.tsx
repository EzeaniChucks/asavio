"use client";

// app/dashboard/admin/users/page.tsx
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaArrowLeft,
  FaSearch,
  FaCheckCircle,
  FaTrash,
  FaChevronLeft,
  FaChevronRight,
  FaUserShield,
  FaUserAlt,
  FaPercent,
  FaEye,
  FaTimes,
  FaHome,
  FaExclamationTriangle,
  FaExternalLinkAlt,
  FaCrown,
} from "react-icons/fa";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { User } from "@/types";
import toast from "react-hot-toast";

type RoleFilter = "all" | "user" | "host";

const ROLE_TABS: { label: string; value: RoleFilter }[] = [
  { label: "All", value: "all" },
  { label: "Users", value: "user" },
  { label: "Hosts", value: "host" },
];

const ROLE_BADGE: Record<string, string> = {
  user: "bg-gray-100 text-gray-700",
  host: "bg-blue-100 text-blue-700",
  admin: "bg-purple-100 text-purple-700",
};

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [commissionTarget, setCommissionTarget] = useState<User | null>(null);

  const [commissionInput, setCommissionInput] = useState("");
  const [demoteTarget, setDemoteTarget] = useState<User | null>(null);
  const [hostDetailTarget, setHostDetailTarget] = useState<User | null>(null);
  const [hostProperties, setHostProperties] = useState<any[]>([]);
  const [hostDetailLoading, setHostDetailLoading] = useState(false);

  const LIMIT = 20;

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { router.push("/login"); return; }
    if (user?.role !== "admin") { router.push("/"); return; }
  }, [authLoading, isAuthenticated, user, router]);

  const fetchUsers = useCallback(async () => {
    if (!user || user.role !== "admin") return;
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: LIMIT };
      if (roleFilter !== "all") params.role = roleFilter;
      if (search.trim()) params.search = search.trim();
      const res = await api.get("/admin/users", { params });
      const data = res.data.data ?? res.data;
      setUsers(data.users ?? data);
      setTotal(data.total ?? (data.users ?? data).length);
    } catch {
      // error handled by interceptor
    } finally {
      setIsLoading(false);
    }
  }, [user, page, roleFilter, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Debounce search reset page
  useEffect(() => {
    setPage(1);
  }, [search, roleFilter]);

  async function changeRole(u: User, role: "host" | "user") {
    setActionLoading(u.id + "-role");
    try {
      await api.patch(`/admin/users/${u.id}`, { role });
      toast.success(`${u.firstName} is now a ${role}`);
      setUsers((prev) =>
        prev.map((x) => (x.id === u.id ? { ...x, role } : x))
      );
    } catch {
      // handled
    } finally {
      setActionLoading(null);
    }
  }

  async function deleteUser(id: string) {
    setActionLoading(id + "-delete");
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success("User deleted");
      setUsers((prev) => prev.filter((x) => x.id !== id));
      setTotal((t) => t - 1);
    } catch {
      // handled
    } finally {
      setActionLoading(null);
      setDeleteTarget(null);
    }
  }

  function openCommissionModal(u: User) {
    setCommissionTarget(u);
    const existing = u.commissionRateOverride;
    setCommissionInput(
      existing !== null && existing !== undefined
        ? (Number(existing) * 100).toFixed(2)
        : ""
    );
  }

  async function saveCommissionRate() {
    if (!commissionTarget) return;
    const raw = commissionInput.trim();
    const override = raw === "" ? null : parseFloat(raw) / 100;
    if (override !== null && (isNaN(override) || override < 0 || override > 1)) {
      toast.error("Enter a percentage between 0 and 100, or leave blank to use the global rate");
      return;
    }
    setActionLoading(commissionTarget.id + "-commission");
    try {
      await api.patch(`/admin/users/${commissionTarget.id}/commission`, {
        commissionRateOverride: override,
      });
      toast.success(
        override === null
          ? `${commissionTarget.firstName} will now use the global commission rate`
          : `${commissionTarget.firstName}'s rate set to ${(override * 100).toFixed(2)}%`
      );
      setUsers((prev) =>
        prev.map((x) =>
          x.id === commissionTarget.id ? { ...x, commissionRateOverride: override } : x
        )
      );
      setCommissionTarget(null);
    } catch {
      // handled by interceptor
    } finally {
      setActionLoading(null);
    }
  }

  async function openHostDetail(u: User) {
    setHostDetailTarget(u);
    setHostProperties([]);
    setHostDetailLoading(true);
    try {
      const res = await api.get(`/admin/users/${u.id}/properties`);
      setHostProperties(res.data.data.properties ?? []);
    } catch {
      // handled by interceptor
    } finally {
      setHostDetailLoading(false);
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
            <h1 className="text-xl font-bold text-gray-900">User Management</h1>
            <p className="text-xs text-gray-400 mt-0.5">{total} total users</p>
          </div>
        </div>

        {/* Search + Role tabs */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-sm" />
            <input
              type="text"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {ROLE_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setRoleFilter(tab.value)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  roleFilter === tab.value
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="p-8 flex justify-center">
              <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-sm">
              No users found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-5 py-3 font-medium text-gray-500">
                      User
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500">
                      Role
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500">
                      KYC
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500">
                      Joined
                    </th>
                    <th className="text-right px-5 py-3 font-medium text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {users.map((u) => (
                      <motion.tr
                        key={u.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center font-semibold text-sm flex-shrink-0">
                              {u.firstName[0]}
                              {u.lastName[0]}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {u.firstName} {u.lastName}
                              </p>
                              <p className="text-xs text-gray-400">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                              ROLE_BADGE[u.role] ?? "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {u.role === "host" ? (
                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                              u.kycStatus === "approved"
                                ? "bg-emerald-100 text-emerald-700"
                                : u.kycStatus === "pending"
                                ? "bg-amber-100 text-amber-700"
                                : u.kycStatus === "rejected"
                                ? "bg-red-100 text-red-600"
                                : "bg-gray-100 text-gray-400"
                            }`}>
                              {u.kycStatus === "approved" && <FaCheckCircle className="text-[10px]" />}
                              {u.kycStatus?.replace("_", " ") ?? "not submitted"}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-gray-400 text-xs">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-2">
                            {/* View host detail */}
                            {u.role === "host" && (
                              <button
                                onClick={() => openHostDetail(u)}
                                title="View host properties"
                                className="w-8 h-8 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 flex items-center justify-center transition"
                              >
                                <FaEye className="text-xs" />
                              </button>
                            )}

                            {/* Change role */}
                            {u.role !== "admin" && (
                              <button
                                onClick={() =>
                                  u.role === "host"
                                    ? setDemoteTarget(u)
                                    : changeRole(u, "host")
                                }
                                disabled={actionLoading === u.id + "-role"}
                                title={
                                  u.role === "host"
                                    ? "Demote to user"
                                    : "Promote to host"
                                }
                                className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition flex items-center gap-1"
                              >
                                {u.role === "host" ? (
                                  <FaUserAlt className="text-xs" />
                                ) : (
                                  <FaUserShield className="text-xs" />
                                )}
                                {u.role === "host" ? "User" : "Host"}
                              </button>
                            )}

                            {/* Per-host commission override */}
                            {u.role === "host" && (
                              <button
                                onClick={() => openCommissionModal(u)}
                                title={
                                  u.commissionRateOverride !== null && u.commissionRateOverride !== undefined
                                    ? `Custom rate: ${(Number(u.commissionRateOverride) * 100).toFixed(2)}%`
                                    : "Set custom commission rate"
                                }
                                className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 transition ${
                                  u.commissionRateOverride !== null && u.commissionRateOverride !== undefined
                                    ? "border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100"
                                    : "border-gray-200 text-gray-500 hover:bg-gray-100"
                                }`}
                              >
                                <FaPercent className="text-[10px]" />
                                {u.commissionRateOverride !== null && u.commissionRateOverride !== undefined
                                  ? `${(Number(u.commissionRateOverride) * 100).toFixed(0)}%`
                                  : "Rate"}
                              </button>
                            )}

                            {/* Delete */}
                            {u.role !== "admin" && (
                              <button
                                onClick={() => setDeleteTarget(u.id)}
                                title="Delete user"
                                className="w-8 h-8 rounded-lg border border-red-100 text-red-400 hover:bg-red-50 flex items-center justify-center transition"
                              >
                                <FaTrash className="text-xs" />
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
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

      {/* Commission rate modal */}
      <AnimatePresence>
        {commissionTarget && (
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
              <h3 className="font-bold text-gray-900 text-base mb-1">
                Commission rate — {commissionTarget.firstName} {commissionTarget.lastName}
              </h3>
              <p className="text-sm text-gray-500 mb-5">
                Set a custom commission rate for this host. Leave blank to use the global platform rate.
              </p>
              <div className="relative mb-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={commissionInput}
                  onChange={(e) => setCommissionInput(e.target.value)}
                  placeholder="e.g. 8 (leave blank for global rate)"
                  className="w-full pr-8 pl-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                  autoFocus
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
              </div>
              {commissionInput.trim() !== "" && !isNaN(parseFloat(commissionInput)) && (
                <p className="text-xs text-gray-500 mb-4">
                  On a $1,000 booking: platform earns <strong>${(parseFloat(commissionInput) * 10).toFixed(2)}</strong>, host receives <strong>${(1000 - parseFloat(commissionInput) * 10).toFixed(2)}</strong>
                </p>
              )}
              {commissionInput.trim() === "" && (
                <p className="text-xs text-amber-600 mb-4">Blank = this host uses the global platform rate.</p>
              )}
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setCommissionTarget(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={saveCommissionRate}
                  disabled={actionLoading === commissionTarget.id + "-commission"}
                  className="flex-1 py-2.5 rounded-xl bg-black text-white text-sm font-medium hover:bg-gray-900 disabled:opacity-50 transition"
                >
                  {actionLoading === commissionTarget.id + "-commission" ? "Saving…" : "Save"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Demotion warning modal */}
      <AnimatePresence>
        {demoteTarget && (
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
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <FaExclamationTriangle className="text-amber-500 text-sm" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">
                    Demote {demoteTarget.firstName} to User?
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">{demoteTarget.email}</p>
                </div>
              </div>
              <ul className="text-sm text-gray-600 space-y-2 mb-6 bg-amber-50 rounded-xl p-4 list-disc list-inside">
                <li>All their property listings will be <strong>hidden from guests immediately</strong></li>
                <li>They will <strong>lose access</strong> to the host dashboard and property management</li>
                <li>Existing bookings remain, but they <strong>cannot manage payouts</strong> as a user</li>
              </ul>
              <div className="flex gap-3">
                <button
                  onClick={() => setDemoteTarget(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    changeRole(demoteTarget, "user");
                    setDemoteTarget(null);
                  }}
                  disabled={actionLoading === demoteTarget.id + "-role"}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 disabled:opacity-50 transition"
                >
                  Demote anyway
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Host detail slide-over */}
      <AnimatePresence>
        {hostDetailTarget && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setHostDetailTarget(null)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-full bg-black text-white flex items-center justify-center font-semibold text-sm flex-shrink-0 overflow-hidden">
                    {hostDetailTarget.profileImage ? (
                      <Image src={hostDetailTarget.profileImage} alt={hostDetailTarget.firstName} fill className="object-cover" />
                    ) : (
                      <>{hostDetailTarget.firstName[0]}{hostDetailTarget.lastName[0]}</>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">
                        {hostDetailTarget.firstName} {hostDetailTarget.lastName}
                      </p>
                      {hostDetailTarget.isVerified && (
                        <FaCheckCircle className="text-emerald-500 text-xs" />
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{hostDetailTarget.email}</p>
                    {hostDetailTarget.phone && (
                      <p className="text-xs text-gray-400">{hostDetailTarget.phone}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`/hosts/${hostDetailTarget.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-100 transition"
                    title="View public profile"
                  >
                    <FaExternalLinkAlt className="text-xs" />
                  </a>
                  <button
                    onClick={() => setHostDetailTarget(null)}
                    className="text-gray-400 hover:text-black transition"
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>

              {/* Host meta stats */}
              <div className="px-6 py-4 border-b border-gray-100 grid grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-gray-50 rounded-xl py-3">
                  <p className="font-semibold text-gray-900 capitalize">
                    {hostDetailTarget.hostTier?.replace("_", " ") ?? "—"}
                  </p>
                  <p className="text-gray-400 mt-0.5">Host tier</p>
                </div>
                <div className="bg-gray-50 rounded-xl py-3">
                  <p className="font-semibold text-gray-900">
                    {hostDetailTarget.responseRate !== undefined && hostDetailTarget.responseRate !== null
                      ? `${Math.round(Number(hostDetailTarget.responseRate) * 100)}%`
                      : "—"}
                  </p>
                  <p className="text-gray-400 mt-0.5">Response</p>
                </div>
                <div className="bg-gray-50 rounded-xl py-3">
                  <p className={`font-semibold capitalize ${
                    hostDetailTarget.kycStatus === "approved"
                      ? "text-emerald-600"
                      : hostDetailTarget.kycStatus === "rejected"
                      ? "text-red-500"
                      : "text-amber-500"
                  }`}>
                    {hostDetailTarget.kycStatus?.replace("_", " ") ?? "—"}
                  </p>
                  <p className="text-gray-400 mt-0.5">KYC</p>
                </div>
                <div className="bg-gray-50 rounded-xl py-3">
                  <div className="flex items-center justify-center gap-1">
                    <FaCrown className={`text-xs ${
                      hostDetailTarget.subscriptionTier === "elite" ? "text-amber-500"
                      : hostDetailTarget.subscriptionTier === "pro" ? "text-blue-500"
                      : "text-gray-400"
                    }`} />
                    <p className="font-semibold text-gray-900 capitalize">
                      {hostDetailTarget.subscriptionTier ?? "starter"}
                    </p>
                  </div>
                  <p className="text-gray-400 mt-0.5">Plan</p>
                </div>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto">
              {/* Profile info */}
              <div className="px-6 py-4 border-b border-gray-100 space-y-3">
                <h3 className="font-semibold text-gray-900 text-sm">Profile</h3>
                {hostDetailTarget.bio ? (
                  <p className="text-sm text-gray-600 leading-relaxed">{hostDetailTarget.bio}</p>
                ) : (
                  <p className="text-xs text-gray-400 italic">No bio added</p>
                )}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  {hostDetailTarget.occupation && (
                    <div>
                      <span className="text-gray-400">Occupation</span>
                      <p className="text-gray-700 font-medium mt-0.5">{hostDetailTarget.occupation}</p>
                    </div>
                  )}
                  {hostDetailTarget.city && (
                    <div>
                      <span className="text-gray-400">City</span>
                      <p className="text-gray-700 font-medium mt-0.5">{hostDetailTarget.city}</p>
                    </div>
                  )}
                  {hostDetailTarget.school && (
                    <div>
                      <span className="text-gray-400">School</span>
                      <p className="text-gray-700 font-medium mt-0.5">{hostDetailTarget.school}</p>
                    </div>
                  )}
                  {hostDetailTarget.languages && hostDetailTarget.languages.length > 0 && (
                    <div className="col-span-2">
                      <span className="text-gray-400">Languages</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {hostDetailTarget.languages.map((lang) => (
                          <span key={lang} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {hostDetailTarget.whyIHost && (
                    <div className="col-span-2">
                      <span className="text-gray-400">Why they host</span>
                      <p className="text-gray-700 mt-0.5 leading-relaxed">{hostDetailTarget.whyIHost}</p>
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-400">
                  Member since {new Date(hostDetailTarget.createdAt).toLocaleDateString("en-NG", { month: "long", year: "numeric" })}
                </div>
              </div>

              {/* Properties */}
              <div className="px-6 py-5">
                <div className="flex items-center gap-2 mb-4">
                  <FaHome className="text-gray-400 text-sm" />
                  <h3 className="font-semibold text-gray-900 text-sm">
                    Properties
                    {!hostDetailLoading && (
                      <span className="ml-1.5 text-xs font-normal text-gray-400">
                        ({hostProperties.length})
                      </span>
                    )}
                  </h3>
                </div>

                {hostDetailLoading ? (
                  <div className="flex justify-center py-10">
                    <div className="w-6 h-6 border-4 border-black border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : hostProperties.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-10">No properties found.</p>
                ) : (
                  <div className="space-y-3">
                    {hostProperties.map((p: any) => (
                      <div
                        key={p.id}
                        className="flex gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition"
                      >
                        {p.images?.[0]?.url ? (
                          <img
                            src={p.images[0].url}
                            alt={p.title}
                            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <FaHome className="text-gray-300 text-xl" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{p.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {p.location?.city ?? ""}
                            {p.location?.state ? `, ${p.location.state}` : ""}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                              p.status === "approved"
                                ? "bg-emerald-100 text-emerald-700"
                                : p.status === "rejected"
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-700"
                            }`}>
                              {p.status}
                            </span>
                            <span className="text-xs text-gray-500">
                              ₦{Number(p.pricePerNight).toLocaleString()}/night
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              </div>{/* end scrollable body */}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete confirm dialog */}
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
              <h3 className="font-bold text-gray-900 text-base mb-2">
                Delete user?
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                This action is permanent and cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteUser(deleteTarget)}
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
    </div>
  );
}
