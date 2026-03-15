"use client";

// app/dashboard/user/page.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  FaCalendarAlt,
  FaUser,
  FaCheckCircle,
  FaClock,
  FaTrophy,
  FaTimesCircle,
  FaArrowRight,
  FaEdit,
} from "react-icons/fa";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { Booking } from "@/types";
import toast from "react-hot-toast";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  completed: "bg-blue-100 text-blue-800",
  cancelled: "bg-red-100 text-red-700",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <FaClock className="text-yellow-500" />,
  confirmed: <FaCheckCircle className="text-green-500" />,
  completed: <FaTrophy className="text-blue-500" />,
  cancelled: <FaTimesCircle className="text-red-500" />,
};

export default function UserDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, refreshUser } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Profile edit state
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/login");
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setPhone(user.phone ?? "");

    api
      .get("/bookings/my")
      .then((res) => setBookings(res.data.data.bookings))
      .catch(() => setBookings([]))
      .finally(() => setIsLoading(false));
  }, [user]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await api.patch("/auth/me", { firstName, lastName, phone });
      await refreshUser();
      toast.success("Profile updated");
      setEditing(false);
    } catch {
      // interceptor handles toast
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loader" />
      </div>
    );
  }

  const stats = {
    total: bookings.length,
    upcoming: bookings.filter((b) => b.status === "confirmed" || b.status === "pending").length,
    completed: bookings.filter((b) => b.status === "completed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  };

  const recent = bookings.slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
            <p className="text-gray-500 mt-0.5">Welcome back, {user?.firstName}</p>
          </div>
          {user?.role === "host" && (
            <Link href="/dashboard/host" className="btn-primary text-sm">
              Host dashboard
            </Link>
          )}
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          {/* Left */}
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total", value: stats.total, icon: "📅" },
                { label: "Upcoming", value: stats.upcoming, icon: "🏠" },
                { label: "Completed", value: stats.completed, icon: "🏆" },
                { label: "Cancelled", value: stats.cancelled, icon: "❌" },
              ].map((s) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border border-gray-100 p-4 text-center"
                >
                  <p className="text-2xl mb-1">{s.icon}</p>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Recent bookings */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-gray-50">
                <h2 className="font-semibold text-gray-900">Recent bookings</h2>
                <Link
                  href="/bookings"
                  className="text-sm text-gray-500 hover:text-black flex items-center gap-1"
                >
                  View all <FaArrowRight className="text-xs" />
                </Link>
              </div>

              {recent.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-400 mb-4">No bookings yet</p>
                  <Link href="/properties" className="btn-primary text-sm">
                    Browse properties
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {recent.map((booking) => (
                    <Link
                      key={booking.id}
                      href={`/bookings/${booking.id}`}
                      className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                        {booking.property?.images?.[0]?.url ? (
                          <Image
                            src={booking.property.images[0].url}
                            alt={booking.property.title ?? ""}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl">🏠</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {booking.property?.title ?? "Property"}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                          <FaCalendarAlt className="text-gray-400" />
                          {new Date(booking.checkIn).toLocaleDateString("en-GB", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {STATUS_ICONS[booking.status]}
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[booking.status]}`}>
                          {booking.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right — Profile card */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FaUser className="text-gray-400" /> Profile
                </h2>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <FaEdit className="text-sm" />
                  </button>
                )}
              </div>

              {/* Avatar */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-black font-bold text-xl">
                  {user?.firstName?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize mt-1 inline-block ${
                    user?.role === "host" ? "bg-black text-white" : "bg-gray-100 text-gray-600"
                  }`}>
                    {user?.role}
                  </span>
                </div>
              </div>

              {editing ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">First name</label>
                      <input
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Last name</label>
                      <input
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Phone</label>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setEditing(false)}
                      className="flex-1 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="flex-1 py-2 bg-black text-white rounded-lg text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors"
                    >
                      {isSaving ? "Saving…" : "Save"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-t border-gray-50">
                    <span className="text-gray-500">Email</span>
                    <span className="text-gray-900">{user?.email}</span>
                  </div>
                  <div className="flex justify-between py-2 border-t border-gray-50">
                    <span className="text-gray-500">Phone</span>
                    <span className="text-gray-900">{user?.phone ?? "—"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-t border-gray-50">
                    <span className="text-gray-500">Verified</span>
                    <span className={user?.isVerified ? "text-green-600 font-medium" : "text-gray-400"}>
                      {user?.isVerified ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/bookings"
              className="block w-full text-center py-3 bg-black text-white rounded-xl font-semibold text-sm hover:bg-gray-800 transition-colors"
            >
              All bookings
            </Link>
            <Link
              href="/properties"
              className="block w-full text-center py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-black transition-colors"
            >
              Browse properties
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
