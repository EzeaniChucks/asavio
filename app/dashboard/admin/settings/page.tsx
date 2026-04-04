"use client";

// app/dashboard/admin/settings/page.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaArrowLeft, FaPercent, FaSave, FaInfoCircle } from "react-icons/fa";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import AdminPageGuard from "@/components/admin/AdminPageGuard";
import { ADMIN_PERMISSIONS as P } from "@/lib/adminPermissions";

interface PlatformSettings {
  commissionRate: number;
  updatedAt: string;
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Display value in percent (e.g. 0.10 → "10")
  const [rateInput, setRateInput] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { router.push("/login"); return; }
    if (user?.role !== "admin") { router.push("/"); return; }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    api
      .get("/admin/settings")
      .then((res) => {
        const s: PlatformSettings = res.data.data.settings;
        setSettings(s);
        setRateInput((Number(s.commissionRate) * 100).toFixed(2));
      })
      .catch(() => toast.error("Failed to load settings"))
      .finally(() => setIsLoading(false));
  }, [user]);

  async function handleSave() {
    const pct = parseFloat(rateInput);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      toast.error("Enter a valid percentage between 0 and 100");
      return;
    }
    setIsSaving(true);
    try {
      const res = await api.patch("/admin/settings", {
        commissionRate: pct / 100,
      });
      const s: PlatformSettings = res.data.data.settings;
      setSettings(s);
      setRateInput((Number(s.commissionRate) * 100).toFixed(2));
      toast.success("Commission rate updated");
    } catch {
      // handled by interceptor
    } finally {
      setIsSaving(false);
    }
  }

  if (authLoading || !user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentRate = settings ? Number(settings.commissionRate) * 100 : null;

  return (
    <AdminPageGuard permission={P.MANAGE_SETTINGS}>
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/dashboard/admin"
            className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition"
          >
            <FaArrowLeft className="text-sm" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Platform Settings</h1>
            <p className="text-xs text-gray-400 mt-0.5">Manage global commission rate and platform-wide preferences</p>
          </div>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 flex justify-center">
            <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Commission rate card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
                  <FaPercent className="text-green-600 text-sm" />
                </div>
                <h2 className="font-semibold text-gray-900">Global Commission Rate</h2>
              </div>
              <p className="text-sm text-gray-500 mb-6 ml-12">
                Applied to all bookings unless a host has a custom rate set.
              </p>

              {/* Current rate banner */}
              <div className="bg-gray-50 rounded-xl px-5 py-4 mb-6 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Current rate</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {currentRate !== null ? `${currentRate.toFixed(2)}%` : "—"}
                  </p>
                </div>
                {settings && (
                  <p className="text-xs text-gray-400 text-right">
                    Last updated<br />
                    {new Date(settings.updatedAt).toLocaleDateString("en-GB", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </p>
                )}
              </div>

              {/* Example breakdown at current rate */}
              {currentRate !== null && (
                <div className="bg-blue-50 rounded-xl px-5 py-4 mb-6 text-sm space-y-1">
                  <p className="font-medium text-blue-800 mb-2 flex items-center gap-1.5">
                    <FaInfoCircle className="text-blue-500" />
                    Example: $1,000 booking
                  </p>
                  <p className="text-blue-700">
                    Platform earns: <strong>${(1000 * currentRate / 100).toFixed(2)}</strong>
                  </p>
                  <p className="text-blue-700">
                    Host receives: <strong>${(1000 - 1000 * currentRate / 100).toFixed(2)}</strong>
                  </p>
                </div>
              )}

              {/* Input */}
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    New rate (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={rateInput}
                      onChange={(e) => setRateInput(e.target.value)}
                      className="w-full pr-8 pl-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                      placeholder="e.g. 10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">%</span>
                  </div>
                </div>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-900 disabled:opacity-50 transition"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FaSave className="text-xs" />
                  )}
                  Save
                </button>
              </div>
            </div>

            {/* Info card */}
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 text-sm text-amber-800">
              <p className="font-semibold mb-1">How commission rates work</p>
              <ul className="space-y-1 list-disc list-inside text-amber-700">
                <li>The global rate applies to all bookings by default.</li>
                <li>Individual hosts can have a custom rate set from the <Link href="/dashboard/admin/users" className="underline font-medium">Users page</Link>.</li>
                <li>The rate is locked in at booking creation time and stored with each booking record.</li>
                <li>Changing the rate only affects future bookings — existing bookings are unaffected.</li>
              </ul>
            </div>
          </motion.div>
        )}
      </div>
    </div>
    </AdminPageGuard>
  );
}
