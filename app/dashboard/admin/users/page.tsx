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
  FaTimesCircle,
  FaTrash,
  FaChevronLeft,
  FaChevronRight,
  FaUserShield,
  FaUserAlt,
} from "react-icons/fa";
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

  async function toggleVerified(u: User) {
    setActionLoading(u.id + "-verify");
    try {
      await api.patch(`/admin/users/${u.id}`, { isVerified: !u.isVerified });
      toast.success(
        `${u.firstName} ${u.isVerified ? "unverified" : "verified"}`
      );
      setUsers((prev) =>
        prev.map((x) =>
          x.id === u.id ? { ...x, isVerified: !x.isVerified } : x
        )
      );
    } catch {
      // handled
    } finally {
      setActionLoading(null);
    }
  }

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
                      Verified
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
                          {u.isVerified ? (
                            <FaCheckCircle className="text-emerald-500 text-base" />
                          ) : (
                            <FaTimesCircle className="text-gray-300 text-base" />
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-gray-400 text-xs">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-2">
                            {/* Toggle verified */}
                            <button
                              onClick={() => toggleVerified(u)}
                              disabled={actionLoading === u.id + "-verify"}
                              title={
                                u.isVerified ? "Mark unverified" : "Mark verified"
                              }
                              className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition"
                            >
                              {u.isVerified ? "Unverify" : "Verify"}
                            </button>

                            {/* Change role */}
                            {u.role !== "admin" && (
                              <button
                                onClick={() =>
                                  changeRole(
                                    u,
                                    u.role === "host" ? "user" : "host"
                                  )
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
