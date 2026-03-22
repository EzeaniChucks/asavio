"use client";

// app/account/settings/page.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FaLock, FaEnvelope, FaEye, FaEyeSlash, FaCheckCircle } from "react-icons/fa";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

function PasswordField({
  label,
  value,
  onChange,
  placeholder = "••••••••",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {show ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>
    </div>
  );
}

export default function AccountSettingsPage() {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const router = useRouter();

  // Change password state
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwDone, setPwDone] = useState(false);

  // Change email state
  const [emailForm, setEmailForm] = useState({ password: "", newEmail: "" });
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailDone, setEmailDone] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    router.replace("/login?redirect=/account/settings");
    return null;
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) { toast.error("New passwords do not match"); return; }
    setPwLoading(true);
    try {
      await api.patch("/auth/change-password", {
        currentPassword: pwForm.current,
        newPassword: pwForm.next,
      });
      setPwDone(true);
      setPwForm({ current: "", next: "", confirm: "" });
      toast.success("Password updated successfully");
    } catch {
      // Error toast handled by interceptor
    } finally {
      setPwLoading(false);
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);
    try {
      await api.patch("/auth/change-email", {
        password: emailForm.password,
        newEmail: emailForm.newEmail,
      });
      setEmailDone(true);
      setEmailForm({ password: "", newEmail: "" });
      toast.success("Email updated. Please log in again with your new email.");
      setTimeout(() => {
        logout();
        router.push("/login");
      }, 2000);
    } catch {
      // Error toast handled by interceptor
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Account settings</h1>
          <p className="text-gray-500 mb-10">
            Signed in as <span className="font-medium text-gray-700">{user?.email}</span>
          </p>

          {/* ── Change password ─────────────────────────────────────── */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
                <FaLock className="text-gray-600 text-sm" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Change password</h2>
                <p className="text-xs text-gray-400">Must be 8+ chars with uppercase, lowercase, and a number</p>
              </div>
            </div>

            {pwDone ? (
              <div className="flex items-center gap-2 text-green-600 text-sm py-2">
                <FaCheckCircle /> Password changed successfully.
              </div>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <PasswordField
                  label="Current password"
                  value={pwForm.current}
                  onChange={(v) => setPwForm((f) => ({ ...f, current: v }))}
                  autoComplete="current-password"
                />
                <PasswordField
                  label="New password"
                  value={pwForm.next}
                  onChange={(v) => setPwForm((f) => ({ ...f, next: v }))}
                  autoComplete="new-password"
                />
                <PasswordField
                  label="Confirm new password"
                  value={pwForm.confirm}
                  onChange={(v) => setPwForm((f) => ({ ...f, confirm: v }))}
                  autoComplete="new-password"
                />
                <button
                  type="submit"
                  disabled={pwLoading}
                  className="w-full bg-black text-white font-semibold py-3 rounded-xl hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors mt-2"
                >
                  {pwLoading ? "Updating…" : "Update password"}
                </button>
              </form>
            )}
          </section>

          {/* ── Change email ────────────────────────────────────────── */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
                <FaEnvelope className="text-gray-600 text-sm" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Change email</h2>
                <p className="text-xs text-gray-400">You will be signed out after updating</p>
              </div>
            </div>

            {emailDone ? (
              <div className="flex items-center gap-2 text-green-600 text-sm py-2">
                <FaCheckCircle /> Email updated. Redirecting to sign in…
              </div>
            ) : (
              <form onSubmit={handleChangeEmail} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">New email address</label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                    <input
                      type="email"
                      value={emailForm.newEmail}
                      onChange={(e) => setEmailForm((f) => ({ ...f, newEmail: e.target.value }))}
                      placeholder="new@example.com"
                      autoComplete="email"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition"
                    />
                  </div>
                </div>
                <PasswordField
                  label="Confirm with current password"
                  value={emailForm.password}
                  onChange={(v) => setEmailForm((f) => ({ ...f, password: v }))}
                  autoComplete="current-password"
                />
                <button
                  type="submit"
                  disabled={emailLoading}
                  className="w-full bg-black text-white font-semibold py-3 rounded-xl hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors mt-2"
                >
                  {emailLoading ? "Updating…" : "Update email"}
                </button>
              </form>
            )}
          </section>
        </motion.div>
      </div>
    </div>
  );
}
