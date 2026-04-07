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
  FaCog,
  FaIdCard,
  FaBullhorn,
  FaShieldAlt,
  FaClipboardList,
  FaCreditCard,
  FaHeadset,
} from "react-icons/fa";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import StatsCard from "@/components/admin/StatsCard";
import { hasAdminPermission, ADMIN_PERMISSIONS as P } from "@/lib/adminPermissions";

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

const ALL_NAV_LINKS = [
  {
    href: "/dashboard/admin/users",
    permission: P.MANAGE_USERS,
    tabLabel: "Users",
    icon: <FaUsers className="text-xl" />,
    label: "Users",
    desc: "Manage all registered users and hosts",
    color: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    href: "/dashboard/admin/properties",
    permission: P.MANAGE_PROPERTIES,
    tabLabel: "Properties",
    icon: <FaHome className="text-xl" />,
    label: "Properties",
    desc: "Review and moderate property listings",
    color: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    href: "/dashboard/admin/vehicles",
    permission: P.MANAGE_VEHICLES,
    tabLabel: "Vehicles",
    icon: <FaCar className="text-xl" />,
    label: "Vehicles",
    desc: "Manage vehicle listings and availability",
    color: "bg-orange-50",
    iconColor: "text-orange-600",
  },
  {
    href: "/dashboard/admin/bookings",
    permission: P.MANAGE_BOOKINGS,
    tabLabel: "Bookings",
    icon: <FaCalendarAlt className="text-xl" />,
    label: "Bookings",
    desc: "Track and update booking statuses",
    color: "bg-purple-50",
    iconColor: "text-purple-600",
  },
  {
    href: "/dashboard/admin/reviews",
    permission: P.MANAGE_REVIEWS,
    tabLabel: "Reviews",
    icon: <FaStar className="text-xl" />,
    label: "Reviews",
    desc: "Moderate guest reviews",
    color: "bg-yellow-50",
    iconColor: "text-yellow-600",
  },
  {
    href: "/dashboard/admin/payouts",
    permission: P.MANAGE_PAYOUTS,
    tabLabel: "Payouts",
    icon: <FaMoneyBillWave className="text-xl" />,
    label: "Payouts",
    desc: "Transfer earnings to hosts after check-in",
    color: "bg-green-50",
    iconColor: "text-green-600",
  },
  {
    href: "/dashboard/admin/kyc",
    permission: P.MANAGE_KYC,
    tabLabel: "KYC",
    icon: <FaIdCard className="text-xl" />,
    label: "KYC Verification",
    desc: "Review and approve host identity documents",
    color: "bg-rose-50",
    iconColor: "text-rose-600",
  },
  {
    href: "/dashboard/admin/marketing",
    permission: P.MANAGE_MARKETING,
    tabLabel: "Marketing",
    icon: <FaBullhorn className="text-xl" />,
    label: "Marketing",
    desc: "Send targeted email campaigns to users and hosts",
    color: "bg-violet-50",
    iconColor: "text-violet-600",
  },
  {
    href: "/dashboard/admin/settings",
    permission: P.MANAGE_SETTINGS,
    tabLabel: "Settings",
    icon: <FaCog className="text-xl" />,
    label: "Settings",
    desc: "Manage platform commission rate and preferences",
    color: "bg-slate-50",
    iconColor: "text-slate-600",
  },
  {
    href: "/dashboard/admin/iam",
    permission: P.MANAGE_ADMINS,
    tabLabel: "IAM",
    icon: <FaShieldAlt className="text-xl" />,
    label: "IAM",
    desc: "Manage admin accounts and their permissions",
    color: "bg-indigo-50",
    iconColor: "text-indigo-600",
  },
  {
    href: "/dashboard/admin/audit-logs",
    permission: P.VIEW_AUDIT_LOGS,
    tabLabel: "Audit Logs",
    icon: <FaClipboardList className="text-xl" />,
    label: "Audit Logs",
    desc: "Full history of admin actions on the platform",
    color: "bg-teal-50",
    iconColor: "text-teal-600",
  },
  {
    href: "/dashboard/admin/payments",
    permission: P.MANAGE_BOOKINGS,
    tabLabel: "Payments",
    icon: <FaCreditCard className="text-xl" />,
    label: "Pending Payments",
    desc: "Verify Paystack charges and resolve stuck bookings",
    color: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  {
    href: "/dashboard/admin/support",
    permission: P.MANAGE_SUPPORT,
    tabLabel: "Support",
    icon: <FaHeadset className="text-xl" />,
    label: "Guest Support",
    desc: "View and respond to guest complaints and platform issues",
    color: "bg-cyan-50",
    iconColor: "text-cyan-600",
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

  const navLinks = ALL_NAV_LINKS.filter((l) => hasAdminPermission(user, l.permission));

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

        {/* Tab nav — filtered by permission */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto pb-0 scrollbar-hide">
          <Link
            href="/dashboard/admin"
            className="px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 border-black text-black"
          >
            Overview
          </Link>
          {navLinks.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className="px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 border-transparent text-gray-500 hover:text-gray-900 transition-colors"
            >
              {tab.tabLabel}
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
            {navLinks.map((link) => (
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
