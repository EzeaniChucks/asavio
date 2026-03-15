"use client";

// app/dashboard/admin/page.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FaUsers,
  FaHome,
  FaCar,
  FaCalendarAlt,
  FaStar,
  FaMoneyBillWave,
  FaClock,
  FaUserTie,
  FaEnvelope,
  FaArrowRight,
  FaChartBar,
} from "react-icons/fa";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import StatsCard from "@/components/admin/StatsCard";

interface AdminStats {
  totalUsers: number;
  totalHosts: number;
  totalProperties: number;
  totalVehicles: number;
  totalBookings: number;
  totalReviews: number;
  pendingBookings: number;
  totalRevenue: number;
}

const NAV_LINKS = [
  {
    href: "/dashboard/admin/users",
    icon: <FaUsers className="text-xl" />,
    label: "Users",
    desc: "Manage all registered users and hosts",
    color: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    href: "/dashboard/admin/properties",
    icon: <FaHome className="text-xl" />,
    label: "Properties",
    desc: "Review and moderate property listings",
    color: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    href: "/dashboard/admin/vehicles",
    icon: <FaCar className="text-xl" />,
    label: "Vehicles",
    desc: "Manage vehicle listings and availability",
    color: "bg-orange-50",
    iconColor: "text-orange-600",
  },
  {
    href: "/dashboard/admin/bookings",
    icon: <FaCalendarAlt className="text-xl" />,
    label: "Bookings",
    desc: "Track and update booking statuses",
    color: "bg-purple-50",
    iconColor: "text-purple-600",
  },
  {
    href: "/dashboard/admin/reviews",
    icon: <FaStar className="text-xl" />,
    label: "Reviews",
    desc: "Moderate reviews and send broadcasts",
    color: "bg-yellow-50",
    iconColor: "text-yellow-600",
  },
  {
    href: "/dashboard/admin/reviews",
    icon: <FaEnvelope className="text-xl" />,
    label: "Email Broadcast",
    desc: "Send announcements to users and hosts",
    color: "bg-red-50",
    iconColor: "text-red-600",
  },
  {
    href: "/dashboard/admin/payouts",
    icon: <FaMoneyBillWave className="text-xl" />,
    label: "Payouts",
    desc: "Transfer earnings to hosts after check-in",
    color: "bg-green-50",
    iconColor: "text-green-600",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { router.push("/login"); return; }
    if (user?.role !== "admin") { router.push("/"); return; }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    api
      .get("/admin/stats")
      .then((res) => setStats(res.data.data.stats))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [user]);

  if (authLoading || !user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <FaChartBar className="text-white text-sm" />
            </div>
            <span className="font-bold text-gray-900 text-lg">Asavio Admin</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            {user.firstName} {user.lastName}
          </div>
        </div>

        {/* Tab nav */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto pb-0 scrollbar-hide">
          {[
            { href: "/dashboard/admin", label: "Overview" },
            { href: "/dashboard/admin/users", label: "Users" },
            { href: "/dashboard/admin/properties", label: "Properties" },
            { href: "/dashboard/admin/vehicles", label: "Vehicles" },
            { href: "/dashboard/admin/bookings", label: "Bookings" },
            { href: "/dashboard/admin/reviews", label: "Reviews" },
            { href: "/dashboard/admin/payouts", label: "Payouts" },
          ].map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab.href === "/dashboard/admin"
                  ? "border-black text-black"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
          <p className="text-gray-500 text-sm mt-1">
            Platform-wide statistics and quick access
          </p>
        </motion.div>

        {/* Stats grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-100 p-5 h-24 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
          >
            <motion.div variants={item}>
              <StatsCard
                icon={<FaUsers className="text-blue-600" />}
                label="Total Users"
                value={stats?.totalUsers ?? 0}
                color="bg-blue-50"
              />
            </motion.div>
            <motion.div variants={item}>
              <StatsCard
                icon={<FaUserTie className="text-indigo-600" />}
                label="Total Hosts"
                value={stats?.totalHosts ?? 0}
                color="bg-indigo-50"
              />
            </motion.div>
            <motion.div variants={item}>
              <StatsCard
                icon={<FaHome className="text-emerald-600" />}
                label="Properties"
                value={stats?.totalProperties ?? 0}
                color="bg-emerald-50"
              />
            </motion.div>
            <motion.div variants={item}>
              <StatsCard
                icon={<FaCar className="text-orange-600" />}
                label="Vehicles"
                value={stats?.totalVehicles ?? 0}
                color="bg-orange-50"
              />
            </motion.div>
            <motion.div variants={item}>
              <StatsCard
                icon={<FaCalendarAlt className="text-purple-600" />}
                label="Total Bookings"
                value={stats?.totalBookings ?? 0}
                color="bg-purple-50"
              />
            </motion.div>
            <motion.div variants={item}>
              <StatsCard
                icon={<FaClock className="text-yellow-600" />}
                label="Pending Bookings"
                value={stats?.pendingBookings ?? 0}
                sub="Awaiting action"
                color="bg-yellow-50"
              />
            </motion.div>
            <motion.div variants={item}>
              <StatsCard
                icon={<FaStar className="text-amber-500" />}
                label="Total Reviews"
                value={stats?.totalReviews ?? 0}
                color="bg-amber-50"
              />
            </motion.div>
            <motion.div variants={item}>
              <StatsCard
                icon={<FaMoneyBillWave className="text-green-600" />}
                label="Total Revenue"
                value={`$${(stats?.totalRevenue ?? 0).toLocaleString()}`}
                sub="All time"
                color="bg-green-50"
              />
            </motion.div>
          </motion.div>
        )}

        {/* Quick nav */}
        <div className="mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Quick Navigation
          </h2>
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {NAV_LINKS.map((link) => (
              <motion.div key={link.label + link.href} variants={item}>
                <Link
                  href={link.href}
                  className="group bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 hover:border-gray-300 hover:shadow-sm transition-all"
                >
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${link.color}`}
                  >
                    <span className={link.iconColor}>{link.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">
                      {link.label}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {link.desc}
                    </p>
                  </div>
                  <FaArrowRight className="text-gray-300 group-hover:text-gray-600 text-xs transition-colors flex-shrink-0" />
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
