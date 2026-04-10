"use client";

// app/dashboard/host/page.tsx
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaToggleOn,
  FaToggleOff,
  FaStar,
  FaBed,
  FaHome,
  FaEye,
  FaUniversity,
  FaMoneyBillWave,
  FaIdCard,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaCalendarTimes,
  FaCrown,
  FaUser,
  FaCar,
} from "react-icons/fa";
import SubscriptionBadge from "@/components/ui/SubscriptionBadge";
import { SubscriptionTier } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { Property, Vehicle } from "@/types";
import toast from "react-hot-toast";

export default function HostDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [properties, setProperties] = useState<Property[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [activeTab, setActiveTab] = useState<"properties" | "vehicles">("properties");
  const [isLoading, setIsLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState<"not_submitted" | "pending" | "approved" | "rejected" | null>(null);
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>("starter");

  // Auth guard
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || (user?.role !== "host" && user?.role !== "admin"))) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.get("/properties/mine").then((res) => setProperties(res.data.data.properties)).catch(() => setProperties([])),
      api.get("/vehicles/host/my").then((res) => setVehicles(res.data.data.vehicles ?? [])).catch(() => setVehicles([])),
    ]).finally(() => setIsLoading(false));

    api
      .get("/kyc/status")
      .then((res) => setKycStatus(res.data.data.kycStatus))
      .catch(() => {});

    api
      .get("/subscriptions/me")
      .then((res) => setSubscriptionTier(res.data.data.currentTier ?? "starter"))
      .catch(() => {});
  }, [user]);

  const toggleAvailability = async (property: Property) => {
    try {
      await api.patch(`/properties/${property.id}`, {
        isAvailable: !property.isAvailable,
      });
      setProperties((prev) =>
        prev.map((p) =>
          p.id === property.id ? { ...p, isAvailable: !p.isAvailable } : p
        )
      );
      toast.success(
        `Listing ${!property.isAvailable ? "published" : "hidden"}`
      );
    } catch {
      toast.error("Failed to update listing");
    }
  };

  const deleteProperty = async (id: string) => {
    if (!confirm("Delete this listing? This cannot be undone.")) return;
    try {
      await api.delete(`/properties/${id}`);
      setProperties((prev) => prev.filter((p) => p.id !== id));
      toast.success("Listing deleted");
    } catch {
      toast.error("Failed to delete listing");
    }
  };

  const toggleVehicleAvailability = async (vehicle: Vehicle) => {
    try {
      await api.patch(`/vehicles/${vehicle.id}/toggle-availability`);
      setVehicles((prev) =>
        prev.map((v) => v.id === vehicle.id ? { ...v, isAvailable: !v.isAvailable } : v)
      );
      toast.success(`Vehicle ${vehicle.isAvailable ? "hidden" : "published"}`);
    } catch {
      toast.error("Failed to update vehicle");
    }
  };

  const deleteVehicle = async (id: string) => {
    if (!confirm("Delete this vehicle? This cannot be undone.")) return;
    try {
      await api.delete(`/vehicles/${id}`);
      setVehicles((prev) => prev.filter((v) => v.id !== id));
      toast.success("Vehicle deleted");
    } catch {
      toast.error("Failed to delete vehicle");
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loader" />
      </div>
    );
  }

  const totalRevenue = properties.reduce((sum, p) => sum + Number(p.pricePerNight), 0);
  const activeCount = properties.filter((p) => p.isAvailable && p.status === "approved").length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.firstName}
            </h1>
            <p className="text-gray-500 mt-1">
              Manage your listings and track performance
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href="/dashboard/host/properties/new"
              className="inline-flex items-center gap-2 btn-primary text-sm"
            >
              <FaPlus className="text-xs" />
              Add property
            </Link>
            <Link
              href="/dashboard/host/vehicles/new"
              className="inline-flex items-center gap-2 btn-secondary text-sm"
            >
              <FaCar className="text-xs" />
              Add vehicle
            </Link>
          </div>
        </div>

        {/* Quick nav */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-6 border-b border-gray-200 -mx-1 px-1">
          <Link
            href="/dashboard/host/kyc"
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
              kycStatus === "approved"
                ? "text-green-700 bg-green-50 hover:bg-green-100"
                : kycStatus === "pending"
                ? "text-amber-700 bg-amber-50 hover:bg-amber-100"
                : "text-red-700 bg-red-50 hover:bg-red-100"
            }`}
          >
            {kycStatus === "approved" ? (
              <FaCheckCircle className="text-xs" />
            ) : kycStatus === "pending" ? (
              <FaClock className="text-xs" />
            ) : (
              <FaExclamationTriangle className="text-xs" />
            )}
            {kycStatus === "approved" ? "Verified" : kycStatus === "pending" ? "KYC pending" : "Verify identity"}
          </Link>

          <span className="w-px h-5 bg-gray-200 mx-1 flex-shrink-0" />

          {[
            { href: "/dashboard/host/profile", icon: <FaUser />, label: "Profile" },
            { href: "/dashboard/host/availability", icon: <FaCalendarTimes />, label: "Availability" },
            { href: "/dashboard/host/earnings", icon: <FaMoneyBillWave />, label: "Earnings" },
            { href: "/dashboard/host/bank-details", icon: <FaUniversity />, label: "Bank details" },
            { href: "/dashboard/host/subscription", icon: <FaCrown />, label: "Subscription" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 whitespace-nowrap transition-colors flex-shrink-0"
            >
              <span className="text-xs text-gray-400">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>

        {/* KYC warning banner */}
        {kycStatus && kycStatus !== "approved" && (
          <div className={`rounded-xl border p-4 mb-6 flex items-start gap-3 ${
            kycStatus === "pending"
              ? "bg-amber-50 border-amber-200"
              : kycStatus === "rejected"
              ? "bg-red-50 border-red-200"
              : "bg-orange-50 border-orange-200"
          }`}>
            <FaIdCard className={`text-lg mt-0.5 flex-shrink-0 ${
              kycStatus === "pending" ? "text-amber-500" : "text-red-500"
            }`} />
            <div className="flex-1 min-w-0">
              <p className={`font-semibold text-sm ${
                kycStatus === "pending" ? "text-amber-800" : "text-red-800"
              }`}>
                {kycStatus === "pending"
                  ? "Identity verification in progress"
                  : kycStatus === "rejected"
                  ? "Identity verification failed — action required"
                  : "Identity verification required"}
              </p>
              <p className={`text-xs mt-0.5 ${
                kycStatus === "pending" ? "text-amber-700" : "text-red-700"
              }`}>
                {kycStatus === "pending"
                  ? "Your documents are being reviewed. Your listings will go live once approved."
                  : kycStatus === "rejected"
                  ? "Your documents were not approved. Please re-submit to make your listings visible."
                  : "Submit your government ID to make your listings discoverable to guests."}
              </p>
            </div>
            <Link
              href="/dashboard/host/kyc"
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0 transition-colors ${
                kycStatus === "pending"
                  ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                  : "bg-red-100 text-red-800 hover:bg-red-200"
              }`}
            >
              {kycStatus === "pending" ? "View status" : "Submit now"}
            </Link>
          </div>
        )}

        {/* Subscription status */}
        <div className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3.5 mb-6 ${
          subscriptionTier === "elite"
            ? "bg-amber-50 border-amber-200"
            : subscriptionTier === "pro"
            ? "bg-blue-50 border-blue-200"
            : "bg-gray-50 border-gray-200"
        }`}>
          <div className="flex items-center gap-2.5 min-w-0">
            {subscriptionTier === "elite" ? (
              <FaCrown className="text-amber-500 flex-shrink-0" />
            ) : subscriptionTier === "pro" ? (
              <FaCrown className="text-blue-500 flex-shrink-0" />
            ) : (
              <FaCrown className="text-gray-400 flex-shrink-0" />
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-gray-800">
                  {subscriptionTier === "starter" ? "Starter plan" : subscriptionTier === "pro" ? "Pro plan" : "Elite plan"}
                </span>
                <SubscriptionBadge tier={subscriptionTier} />
              </div>
              {subscriptionTier === "starter" && (
                <p className="text-xs text-gray-500 mt-0.5">Upgrade to unlock more listings, lower commission, and feature videos.</p>
              )}
            </div>
          </div>
          <Link
            href="/dashboard/host/subscription"
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0 transition-colors ${
              subscriptionTier === "elite"
                ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                : subscriptionTier === "pro"
                ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                : "bg-black text-white hover:bg-gray-800"
            }`}
          >
            {subscriptionTier === "starter" ? "Upgrade plan" : "Manage subscription"}
          </Link>
        </div>

        {/* Profile completeness prompt */}
        {(() => {
          const score =
            (user?.profileImage ? 20 : 0) +
            (user?.bio ? 20 : 0) +
            (user?.languages?.length ? 15 : 0) +
            (user?.whyIHost ? 15 : 0) +
            (user?.occupation ? 10 : 0) +
            (user?.city ? 10 : 0) +
            (user?.school ? 10 : 0);
          if (score >= 100) return null;
          return (
            <div className="flex items-center justify-between gap-4 bg-white border border-gray-200 rounded-xl px-4 py-3.5 mb-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-sm font-semibold text-gray-800">Complete your host profile</p>
                  <span className="text-xs text-gray-500">{score}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-black h-1.5 rounded-full transition-all"
                    style={{ width: `${score}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1.5">A complete profile builds trust and helps guests choose you.</p>
              </div>
              <Link
                href="/dashboard/host/profile"
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-black text-white hover:bg-gray-800 transition-colors flex-shrink-0"
              >
                Complete profile
              </Link>
            </div>
          );
        })()}

        {/* Co-host notice */}
        <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3.5 mb-6 text-sm text-amber-800">
          <span className="text-amber-500 mt-0.5 text-base shrink-0">⚠️</span>
          <p>
            <span className="font-semibold">Important:</span> If your property will be unavailable for any reason, please inform your co-host at least <span className="font-semibold">6 hours in advance</span>. This ensures guests are not left without accommodation and helps maintain your hosting reputation.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: <FaHome />, label: "Total listings", value: properties.length, color: "bg-blue-50 text-blue-600" },
            { icon: <FaToggleOn />, label: "Active", value: activeCount, color: "bg-green-50 text-green-600" },
            { icon: <FaStar />, label: "Avg. rating", value: properties.length ? (properties.reduce((s, p) => s + p.averageRating, 0) / properties.length).toFixed(1) : "—", color: "bg-yellow-50 text-yellow-600" },
            { icon: <FaBed />, label: "Total capacity", value: `${properties.reduce((s, p) => s + p.maxGuests, 0)} guests`, color: "bg-purple-50 text-purple-600" },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
            >
              <div className={`inline-flex p-2.5 rounded-lg mb-3 ${stat.color}`}>
                {stat.icon}
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Listings — tabbed */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Tab header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setActiveTab("properties")}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  activeTab === "properties" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <FaHome className="text-xs" /> Properties
                <span className="text-xs text-gray-400 font-normal">({properties.length})</span>
              </button>
              <button
                onClick={() => setActiveTab("vehicles")}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  activeTab === "vehicles" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <FaCar className="text-xs" /> Vehicles
                <span className="text-xs text-gray-400 font-normal">({vehicles.length})</span>
              </button>
            </div>
            <Link
              href={activeTab === "properties" ? "/dashboard/host/properties/new" : "/dashboard/host/vehicles/new"}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-black transition-colors"
            >
              <FaPlus className="text-xs" /> Add new
            </Link>
          </div>

          {/* Properties tab */}
          {activeTab === "properties" && (
            properties.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-5xl mb-4">🏠</p>
                <h3 className="text-xl font-semibold mb-2">No properties yet</h3>
                <p className="text-gray-500 mb-6">Create your first listing to start earning</p>
                <Link href="/dashboard/host/properties/new" className="btn-primary">
                  Add a property
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {properties.map((property, i) => (
                  <motion.div
                    key={property.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex gap-4 p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                      {property.images?.[0]?.url ? (
                        <Image src={property.images[0].url} alt={property.title} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-2xl">🏠</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">{property.title}</h3>
                          <p className="text-sm text-gray-500 mt-0.5">{property.location.city}, {property.location.country}</p>
                          {property.status === "rejected" && property.rejectionReason && (
                            <p className="text-xs text-red-500 mt-0.5 italic">Reason: {property.rejectionReason}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1.5 text-sm text-gray-500">
                            <span className="font-semibold text-gray-900">₦{Number(property.pricePerNight).toLocaleString("en-NG")}/night</span>
                            <span>·</span>
                            <span className="flex items-center gap-1"><FaStar className="text-yellow-400 text-xs" />{property.averageRating.toFixed(1)}</span>
                          </div>
                        </div>
                        <span className={`flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${
                          property.status === "approved" && property.isAvailable ? "bg-green-100 text-green-700"
                          : property.status === "pending" ? "bg-yellow-100 text-yellow-700"
                          : property.status === "rejected" ? "bg-red-100 text-red-600"
                          : "bg-gray-100 text-gray-500"
                        }`}>
                          {property.status === "approved" && property.isAvailable ? "Live"
                            : property.status === "approved" ? "Hidden"
                            : property.status === "pending" ? "Pending review"
                            : "Not approved"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Link href={`/properties/${property.id}`} className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors" title="View"><FaEye /></Link>
                      <button onClick={() => toggleAvailability(property)} className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors" title={property.isAvailable ? "Hide listing" : "Publish listing"}>
                        {property.isAvailable ? <FaToggleOn className="text-green-500" /> : <FaToggleOff />}
                      </button>
                      <Link href={`/dashboard/host/availability?type=property&id=${property.id}`} className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors" title="Block dates"><FaCalendarTimes /></Link>
                      <Link href={`/dashboard/host/properties/${property.id}/edit`} className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors" title="Edit"><FaEdit /></Link>
                      <button onClick={() => deleteProperty(property.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><FaTrash /></button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )
          )}

          {/* Vehicles tab */}
          {activeTab === "vehicles" && (
            vehicles.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-5xl mb-4">🚗</p>
                <h3 className="text-xl font-semibold mb-2">No vehicles yet</h3>
                <p className="text-gray-500 mb-6">List your first vehicle to start earning</p>
                <Link href="/dashboard/host/vehicles/new" className="btn-primary">
                  Add a vehicle
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {vehicles.map((vehicle, i) => (
                  <motion.div
                    key={vehicle.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex gap-4 p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                      {vehicle.images?.[0]?.url ? (
                        <Image src={vehicle.images[0].url} alt={`${vehicle.make} ${vehicle.model}`} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-2xl">🚗</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">{vehicle.year} {vehicle.make} {vehicle.model}</h3>
                          <p className="text-sm text-gray-500 mt-0.5 capitalize">{vehicle.vehicleType} · {vehicle.seats} seats{vehicle.location ? ` · ${vehicle.location}` : ""}</p>
                          <div className="flex items-center gap-3 mt-1.5 text-sm text-gray-500">
                            <span className="font-semibold text-gray-900">₦{Number(vehicle.pricePerDay).toLocaleString("en-NG")}/day</span>
                            {vehicle.withDriver && vehicle.priceWithDriverPerDay && (
                              <><span>·</span><span>₦{Number(vehicle.priceWithDriverPerDay).toLocaleString("en-NG")}/day with driver</span></>
                            )}
                          </div>
                        </div>
                        <span className={`flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${
                          vehicle.status === "pending" ? "bg-yellow-100 text-yellow-700"
                          : vehicle.status === "rejected" ? "bg-red-100 text-red-600"
                          : vehicle.isAvailable ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                        }`}>
                          {vehicle.status === "pending" ? "Pending review"
                            : vehicle.status === "rejected" ? "Not approved"
                            : vehicle.isAvailable ? "Live" : "Hidden"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {vehicle.status === "approved" && (
                        <Link href={`/vehicles/${vehicle.id}`} className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors" title="View"><FaEye /></Link>
                      )}
                      {vehicle.status === "approved" && (
                        <button onClick={() => toggleVehicleAvailability(vehicle)} className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors" title={vehicle.isAvailable ? "Hide listing" : "Publish listing"}>
                          {vehicle.isAvailable ? <FaToggleOn className="text-green-500" /> : <FaToggleOff />}
                        </button>
                      )}
                      <Link href={`/dashboard/host/availability?type=vehicle&id=${vehicle.id}`} className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors" title="Block dates"><FaCalendarTimes /></Link>
                      <Link href={`/dashboard/host/vehicles/${vehicle.id}/edit`} className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors" title="Edit"><FaEdit /></Link>
                      <button onClick={() => deleteVehicle(vehicle.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><FaTrash /></button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
