"use client";

// app/bookings/[id]/page.tsx
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaUsers,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaTrophy,
  FaPhone,
} from "react-icons/fa";
import { api } from "@/lib/api";
import { Booking } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";

const STATUS_CONFIG = {
  pending: {
    icon: <FaClock className="text-yellow-500" />,
    label: "Pending confirmation",
    desc: "Waiting for the host to confirm your booking.",
    classes: "bg-yellow-50 border-yellow-200 text-yellow-800",
  },
  confirmed: {
    icon: <FaCheckCircle className="text-green-500" />,
    label: "Confirmed",
    desc: "Your booking is confirmed. Enjoy your stay!",
    classes: "bg-green-50 border-green-200 text-green-800",
  },
  completed: {
    icon: <FaTrophy className="text-blue-500" />,
    label: "Completed",
    desc: "Your stay is complete. We hope you had a great time!",
    classes: "bg-blue-50 border-blue-200 text-blue-800",
  },
  cancelled: {
    icon: <FaTimesCircle className="text-red-500" />,
    label: "Cancelled",
    desc: "This booking has been cancelled.",
    classes: "bg-red-50 border-red-200 text-red-800",
  },
};

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function nightCount(checkIn: string | Date, checkOut: string | Date) {
  return Math.ceil(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
  );
}

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/login");
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!user) return;
    api
      .get(`/bookings/${id}`)
      .then((res) => setBooking(res.data.data.booking))
      .catch(() => router.push("/bookings"))
      .finally(() => setIsLoading(false));
  }, [id, user, router]);

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    setIsCancelling(true);
    try {
      await api.patch(`/bookings/${id}/status`, { status: "cancelled" });
      setBooking((prev) => (prev ? { ...prev, status: "cancelled" } : prev));
      toast.success("Booking cancelled");
    } catch {
      toast.error("Failed to cancel booking");
    } finally {
      setIsCancelling(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loader" />
      </div>
    );
  }

  if (!booking) return null;

  const statusCfg = STATUS_CONFIG[booking.status];
  const nights = nightCount(booking.checkIn, booking.checkOut);
  const canCancel = booking.status === "pending" || booking.status === "confirmed";
  const isGuest = user?.id === booking.userId;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8 max-w-2xl">
        {/* Back */}
        <Link
          href="/bookings"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black mb-6 transition-colors"
        >
          <FaArrowLeft />
          My bookings
        </Link>

        {/* Status banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-start gap-3 p-4 rounded-2xl border mb-6 ${statusCfg.classes}`}
        >
          <span className="text-xl mt-0.5">{statusCfg.icon}</span>
          <div>
            <p className="font-semibold">{statusCfg.label}</p>
            <p className="text-sm opacity-80 mt-0.5">{statusCfg.desc}</p>
          </div>
        </motion.div>

        {/* Property card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-4"
        >
          <div className="flex gap-4 p-5">
            <Link
              href={`/properties/${booking.property?.id}`}
              className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 block"
            >
              {booking.property?.images?.[0]?.url ? (
                <Image
                  src={booking.property.images[0].url}
                  alt={booking.property.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl">🏠</div>
              )}
            </Link>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-0.5">
                {booking.property?.propertyType}
              </p>
              <Link
                href={`/properties/${booking.property?.id}`}
                className="font-semibold text-gray-900 hover:underline block"
              >
                {booking.property?.title}
              </Link>
              <p className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                <FaMapMarkerAlt className="text-gray-400 text-xs" />
                {booking.property?.location.city}, {booking.property?.location.country}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Booking details */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl border border-gray-100 p-5 mb-4 space-y-4"
        >
          <h2 className="font-semibold text-gray-900">Booking details</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">
                Check-in
              </p>
              <p className="font-semibold text-gray-900 flex items-center gap-2">
                <FaCalendarAlt className="text-gray-400 text-xs" />
                {formatDate(booking.checkIn)}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">
                Check-out
              </p>
              <p className="font-semibold text-gray-900 flex items-center gap-2">
                <FaCalendarAlt className="text-gray-400 text-xs" />
                {formatDate(booking.checkOut)}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between py-3 border-t border-gray-100">
            <span className="flex items-center gap-2 text-gray-600">
              <FaUsers className="text-gray-400" />
              Guests
            </span>
            <span className="font-medium text-gray-900">
              {booking.guests} {booking.guests === 1 ? "guest" : "guests"}
            </span>
          </div>

          <div className="flex items-center justify-between py-3 border-t border-gray-100">
            <span className="text-gray-600">Duration</span>
            <span className="font-medium text-gray-900">
              {nights} {nights === 1 ? "night" : "nights"}
            </span>
          </div>

          {booking.specialRequests && (
            <div className="py-3 border-t border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Special requests</p>
              <p className="text-gray-700 text-sm">{booking.specialRequests}</p>
            </div>
          )}
        </motion.div>

        {/* Price breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-gray-100 p-5 mb-4"
        >
          <h2 className="font-semibold text-gray-900 mb-4">Price breakdown</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>${booking.property?.pricePerNight} × {nights} nights</span>
              <span>${Number(booking.totalPrice).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-gray-900 border-t border-gray-100 pt-3">
              <span>Total charged</span>
              <span>${Number(booking.totalPrice).toFixed(2)}</span>
            </div>
          </div>
        </motion.div>

        {/* Booking reference */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl border border-gray-100 p-5 mb-6"
        >
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">
            Booking reference
          </p>
          <p className="font-mono text-gray-700 text-sm">{booking.id}</p>
          <p className="text-xs text-gray-400 mt-2">
            Booked on {new Date(booking.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </motion.div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href={`/properties/${booking.property?.id}`}
            className="flex-1 text-center btn-secondary py-3"
          >
            View property
          </Link>

          {isGuest && canCancel && (
            <button
              onClick={handleCancel}
              disabled={isCancelling}
              className="flex-1 py-3 border-2 border-red-200 text-red-600 font-semibold rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {isCancelling ? "Cancelling…" : "Cancel booking"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
