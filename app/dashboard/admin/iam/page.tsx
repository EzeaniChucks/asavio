"use client";

// app/dashboard/admin/iam/page.tsx
import { useEffect, useState } from "react";
import Link from "next/link";
import { FaArrowLeft, FaPlus, FaTrash, FaEdit, FaShieldAlt, FaTimes } from "react-icons/fa";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

const PERMISSIONS = [
  { key: "manage_users",      label: "Manage Users" },
  { key: "manage_properties", label: "Manage Properties" },
  { key: "manage_vehicles",   label: "Manage Vehicles" },
  { key: "manage_bookings",   label: "Manage Bookings" },
  { key: "manage_payouts",    label: "Manage Payouts" },
  { key: "manage_reviews",    label: "Manage Reviews" },
  { key: "manage_marketing",  label: "Send Marketing Emails" },
  { key: "manage_settings",   label: "Platform Settings" },
  { key: "manage_kyc",        label: "KYC Review" },
  { key: "manage_admins",     label: "Admin Management (IAM)" },
  { key: "view_audit_logs",   label: "View Audit Logs" },
];

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isSuperAdmin: boolean;
  adminPermissions: string[] | null;
  createdAt: string;
}

const emptyForm = {
  email: "",
  firstName: "",
  lastName: "",
  password: "",
  adminPermissions: [] as string[],
};

export default function IAMPage() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create modal state
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);

  // Edit permissions modal state
  const [editAdmin, setEditAdmin] = useState<AdminUser | null>(null);
  const [editPerms, setEditPerms] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const isSuperAdmin = user?.isSuperAdmin || user?.adminPermissions === null;

  useEffect(() => {
    api
      .get("/admin/iam/admins")
      .then((res) => setAdmins(res.data.data.admins))
      .catch(() => toast.error("Failed to load admins"))
      .finally(() => setIsLoading(false));
  }, []);

  const togglePerm = (key: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(key) ? list.filter((p) => p !== key) : [...list, key]);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.email || !createForm.firstName || !createForm.lastName || !createForm.password) {
      toast.error("Please fill in all required fields");
      return;
    }
    setCreating(true);
    try {
      const res = await api.post("/admin/iam/admins", createForm);
      setAdmins((prev) => [...prev, res.data.data.admin]);
      setShowCreate(false);
      setCreateForm(emptyForm);
      toast.success("Admin created successfully");
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (admin: AdminUser) => {
    setEditAdmin(admin);
    setEditPerms(admin.adminPermissions ?? []);
  };

  const handleSavePermissions = async () => {
    if (!editAdmin) return;
    setSaving(true);
    try {
      const res = await api.patch(`/admin/iam/admins/${editAdmin.id}/permissions`, {
        adminPermissions: editPerms,
      });
      setAdmins((prev) =>
        prev.map((a) => (a.id === editAdmin.id ? res.data.data.admin : a))
      );
      setEditAdmin(null);
      toast.success("Permissions updated");
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async (admin: AdminUser) => {
    if (!confirm(`Revoke admin access for ${admin.firstName} ${admin.lastName}? They will become a regular user.`)) return;
    try {
      await api.delete(`/admin/iam/admins/${admin.id}`);
      setAdmins((prev) => prev.filter((a) => a.id !== admin.id));
      toast.success("Admin access revoked");
    } catch {
      // interceptor handles toast
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8 max-w-4xl">
        <Link
          href="/dashboard/admin"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black mb-6 transition-colors"
        >
          <FaArrowLeft /> Back to dashboard
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Identity &amp; Access Management</h1>
            <p className="text-sm text-gray-500 mt-1">Manage admin accounts and their permissions</p>
          </div>
          {isSuperAdmin && (
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 btn-primary"
            >
              <FaPlus className="text-xs" /> Add admin
            </button>
          )}
        </div>

        {/* Admin list */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="divide-y divide-gray-50">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-5">
                  <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3" />
                    <div className="h-2.5 bg-gray-100 rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : admins.length === 0 ? (
            <div className="text-center py-16 text-gray-400">No admin accounts found.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {admins.map((admin) => (
                <div key={admin.id} className="flex items-start gap-4 p-5">
                  <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                    <FaShieldAlt className="text-white text-sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-gray-900">
                        {admin.firstName} {admin.lastName}
                      </span>
                      {admin.isSuperAdmin ? (
                        <span className="text-xs bg-black text-white px-2 py-0.5 rounded-full">Super Admin</span>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Admin</span>
                      )}
                      {admin.id === user?.id && (
                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">You</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{admin.email}</p>
                    {!admin.isSuperAdmin && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {(admin.adminPermissions ?? []).length === 0 ? (
                          <span className="text-xs text-gray-400 italic">No permissions assigned</span>
                        ) : (
                          (admin.adminPermissions ?? []).map((p) => (
                            <span key={p} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                              {PERMISSIONS.find((x) => x.key === p)?.label ?? p}
                            </span>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  {isSuperAdmin && !admin.isSuperAdmin && admin.id !== user?.id && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => openEdit(admin)}
                        className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit permissions"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleRevoke(admin)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Revoke admin access"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create admin modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Create admin account</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-black">
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First name *</label>
                  <input
                    value={createForm.firstName}
                    onChange={(e) => setCreateForm((f) => ({ ...f, firstName: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="Jane"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last name *</label>
                  <input
                    value={createForm.lastName}
                    onChange={(e) => setCreateForm((f) => ({ ...f, lastName: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="admin@asavio.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Temporary password *</label>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Min. 8 characters"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                  {PERMISSIONS.map((p) => (
                    <label key={p.key} className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={createForm.adminPermissions.includes(p.key)}
                        onChange={() =>
                          togglePerm(p.key, createForm.adminPermissions, (v) =>
                            setCreateForm((f) => ({ ...f, adminPermissions: v }))
                          )
                        }
                        className="w-4 h-4 accent-black"
                      />
                      <span className="text-sm text-gray-700">{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={creating} className="flex-1 btn-primary disabled:opacity-50">
                  {creating ? "Creating…" : "Create admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit permissions modal */}
      {editAdmin && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold">Edit permissions</h2>
                <p className="text-sm text-gray-500">{editAdmin.firstName} {editAdmin.lastName}</p>
              </div>
              <button onClick={() => setEditAdmin(null)} className="text-gray-400 hover:text-black">
                <FaTimes />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-1 mb-5">
              {PERMISSIONS.map((p) => (
                <label key={p.key} className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editPerms.includes(p.key)}
                    onChange={() => togglePerm(p.key, editPerms, setEditPerms)}
                    className="w-4 h-4 accent-black"
                  />
                  <span className="text-sm text-gray-700">{p.label}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEditAdmin(null)} className="flex-1 btn-secondary">
                Cancel
              </button>
              <button onClick={handleSavePermissions} disabled={saving} className="flex-1 btn-primary disabled:opacity-50">
                {saving ? "Saving…" : "Save permissions"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
