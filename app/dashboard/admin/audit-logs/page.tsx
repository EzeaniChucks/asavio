"use client";

// app/dashboard/admin/audit-logs/page.tsx
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { FaArrowLeft, FaSearch, FaFilter } from "react-icons/fa";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import AdminPageGuard from "@/components/admin/AdminPageGuard";
import { ADMIN_PERMISSIONS as P } from "@/lib/adminPermissions";

interface AuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  adminName: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  details: Record<string, any> | null;
  createdAt: string;
}

const ACTION_LABELS: Record<string, string> = {
  approve_property: "Approved listing",
  reject_property: "Rejected listing",
  delete_property: "Deleted listing",
  update_property: "Updated listing",
  delete_vehicle: "Deleted vehicle",
  update_booking_status: "Updated booking status",
  delete_review: "Deleted review",
  update_user: "Updated user",
  delete_user: "Deleted user",
  update_settings: "Changed platform settings",
  send_broadcast: "Sent broadcast email",
  set_host_commission: "Set host commission rate",
  create_admin: "Created admin",
  update_admin_permissions: "Updated admin permissions",
  revoke_admin: "Revoked admin access",
};

const ACTION_COLORS: Record<string, string> = {
  approve_property: "bg-green-100 text-green-700",
  reject_property: "bg-red-100 text-red-700",
  delete_property: "bg-red-100 text-red-700",
  delete_vehicle: "bg-red-100 text-red-700",
  delete_user: "bg-red-100 text-red-700",
  delete_review: "bg-red-100 text-red-700",
  revoke_admin: "bg-red-100 text-red-700",
  create_admin: "bg-blue-100 text-blue-700",
  update_admin_permissions: "bg-blue-100 text-blue-700",
  send_broadcast: "bg-purple-100 text-purple-700",
  update_settings: "bg-amber-100 text-amber-700",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-NG", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const limit = 20;

  const fetchLogs = useCallback(() => {
    setIsLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (actionFilter) params.set("action", actionFilter);

    api
      .get(`/admin/audit-logs?${params}`)
      .then((res) => {
        setLogs(res.data.data.logs);
        setTotal(res.data.data.total);
      })
      .catch(() => toast.error("Failed to load audit logs"))
      .finally(() => setIsLoading(false));
  }, [page, actionFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const totalPages = Math.ceil(total / limit);

  return (
    <AdminPageGuard permission={P.VIEW_AUDIT_LOGS}>
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8 max-w-5xl">
        <Link
          href="/dashboard/admin"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black mb-6 transition-colors"
        >
          <FaArrowLeft /> Back to dashboard
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
            <p className="text-sm text-gray-500 mt-1">
              {total.toLocaleString()} action{total !== 1 ? "s" : ""} recorded
            </p>
          </div>
          <div className="flex items-center gap-2">
            <FaFilter className="text-gray-400 text-sm" />
            <input
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
              placeholder="Filter by action…"
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black w-48"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="divide-y divide-gray-50">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="w-24 h-3 bg-gray-200 rounded animate-pulse" />
                  <div className="w-32 h-3 bg-gray-100 rounded animate-pulse" />
                  <div className="flex-1 h-3 bg-gray-100 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16 text-gray-400">No audit logs found.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {logs.map((log) => (
                <div key={log.id}>
                  <button
                    onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                    className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-36 shrink-0 text-xs text-gray-400 tabular-nums">
                      {formatDate(log.createdAt)}
                    </div>
                    <div className="w-36 shrink-0">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ACTION_COLORS[log.action] ?? "bg-gray-100 text-gray-600"}`}>
                        {ACTION_LABELS[log.action] ?? log.action}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-gray-800 font-medium truncate">{log.adminName}</span>
                      <span className="text-xs text-gray-400 ml-2">{log.adminEmail}</span>
                    </div>
                    {log.targetType && (
                      <div className="text-xs text-gray-400 shrink-0">
                        {log.targetType} {log.targetId ? `· ${log.targetId.slice(0, 8)}…` : ""}
                      </div>
                    )}
                  </button>

                  {expandedId === log.id && log.details && (
                    <div className="px-5 pb-4 bg-gray-50 border-t border-gray-100">
                      <pre className="text-xs text-gray-600 overflow-x-auto bg-white border border-gray-100 rounded-xl p-3 mt-2">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 text-sm border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
    </AdminPageGuard>
  );
}
