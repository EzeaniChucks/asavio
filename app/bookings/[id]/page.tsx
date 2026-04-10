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
  FaTimesCircle,
  FaTrophy,
  FaPhone,
  FaCreditCard,
  FaShieldAlt,
} from "react-icons/fa";
import { api } from "@/lib/api";
import { Booking } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";

const POLICY_DETAILS: Record<string, { name: string; summary: string }> = {
  flexible: { name: "Flexible", summary: "Full refund up to 24 h before check-in." },
  moderate: { name: "Moderate", summary: "Full refund up to 5 days before check-in." },
  firm:     { name: "Firm",     summary: "Full refund 14+ days · 50% refund 7–14 days · No refund within 7 days." },
  strict:   { name: "Strict",  summary: "Full refund 30+ days · 50% refund 14–30 days · No refund within 14 days." },
};

const STATUS_CONFIG = {
  awaiting_payment: {
    icon: <FaCreditCard className="text-orange-500" />,
    label: "Awaiting payment",
    desc: "Your booking is reserved — complete payment to confirm.",
    classes: "bg-orange-50 border-orange-200 text-orange-800",
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

interface CancellationEstimate {
  refundAmount: number;
  inGracePeriod: boolean;
  reason: string;
  policy: string;
  totalPaid: number;
  listingTitle: string;
}

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
  const [isRedirectingToPayment, setIsRedirectingToPayment] = useState(false);

  // Cancellation flow state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [estimate, setEstimate] = useState<CancellationEstimate | null>(null);
  const [isFetchingEstimate, setIsFetchingEstimate] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");

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

  const handlePayNow = async () => {
    if (!booking) return;
    setIsRedirectingToPayment(true);
    try {
      const res = await api.post("/payments/initialize", { bookingId: booking.id });
      window.location.href = res.data.data.authorization_url;
    } catch {
      toast.error("Could not initialize payment. Please try again.");
    } finally {
      setIsRedirectingToPayment(false);
    }
  };

  const openCancelModal = async () => {
    setShowCancelModal(true);
    setIsFetchingEstimate(true);
    try {
      const res = await api.get(`/bookings/${id}/cancellation-estimate`);
      setEstimate(res.data.data);
    } catch {
      setEstimate(null);
    } finally {
      setIsFetchingEstimate(false);
    }
  };

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await api.patch(`/bookings/${id}/status`, {
        status: "cancelled",
        cancellationReason: cancellationReason.trim() || undefined,
      });
      setBooking((prev) => (prev ? { ...prev, status: "cancelled" } : prev));
      setShowCancelModal(false);
      toast.success(
        estimate && estimate.refundAmount > 0
          ? `Booking cancelled — ₦${Number(estimate.refundAmount).toLocaleString("en-NG")} refund is being processed`
          : "Booking cancelled"
      );
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

  const statusCfg = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.confirmed;
  const nights = nightCount(booking.checkIn, booking.checkOut);
  const canCancel = booking.status === "confirmed" || booking.status === "awaiting_payment";
  const canPayNow = booking.status === "awaiting_payment";
  const isGuest = user?.id === booking.userId;
  const isHostOrAdmin = user?.role === "host" || user?.role === "admin";

  const listingTitle = booking.property?.title
    ?? (booking.vehicle ? `${booking.vehicle.year} ${booking.vehicle.make} ${booking.vehicle.model}` : "your booking");
  const listingPolicy = (booking.property as any)?.cancellationPolicy
    ?? (booking.vehicle as any)?.cancellationPolicy
    ?? "flexible";
  const policyInfo = POLICY_DETAILS[listingPolicy] ?? POLICY_DETAILS.flexible;

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

        {/* Property/vehicle card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-4"
        >
          <div className="flex gap-4 p-5">
            <Link
              href={booking.property ? `/properties/${booking.property?.id}` : `/vehicles/${booking.vehicle?.id}`}
              className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 block"
            >
              {(booking.property?.images?.[0]?.url || (booking.vehicle as any)?.images?.[0]?.url) ? (
                <Image
                  src={booking.property?.images?.[0]?.url ?? (booking.vehicle as any)?.images?.[0]?.url}
                  alt={listingTitle}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl">
                  {booking.vehicle ? "🚗" : "🏠"}
                </div>
              )}
            </Link>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-0.5">
                {booking.property?.propertyType ?? booking.vehicle?.vehicleType}
              </p>
              <Link
                href={booking.property ? `/properties/${booking.property?.id}` : `/vehicles/${booking.vehicle?.id}`}
                className="font-semibold text-gray-900 hover:underline block"
              >
                {listingTitle}
              </Link>
              {booking.property && (
                <p className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                  <FaMapMarkerAlt className="text-gray-400 text-xs" />
                  {booking.property?.location?.city}, {booking.property?.location?.country}
                </p>
              )}
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
                {booking.vehicle ? "Pick-up" : "Check-in"}
              </p>
              <p className="font-semibold text-gray-900 flex items-center gap-2">
                <FaCalendarAlt className="text-gray-400 text-xs" />
                {formatDate(booking.checkIn)}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">
                {booking.vehicle ? "Return" : "Check-out"}
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
              {nights} {nights === 1 ? (booking.vehicle ? "day" : "night") : (booking.vehicle ? "days" : "nights")}
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
              <span>
                ₦{booking.vehicle
                  ? Number(booking.vehicle.pricePerDay).toLocaleString()
                  : Number(booking.property?.pricePerNight).toLocaleString()} × {nights} {booking.vehicle ? "days" : "nights"}
              </span>
              <span>₦{Number(booking.totalPrice).toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-semibold text-gray-900 border-t border-gray-100 pt-3">
              <span>Total charged</span>
              <span>₦{Number(booking.totalPrice).toLocaleString()}</span>
            </div>

            {/* Host / admin view: commission breakdown */}
            {isHostOrAdmin && (
              <>
                <div className="flex justify-between text-gray-500 border-t border-gray-100 pt-3">
                  <span>Platform commission</span>
                  <span>− ₦{Number(booking.platformCommission).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-medium text-gray-800">
                  <span>Host payout</span>
                  <span>₦{Number(booking.hostPayout).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Payout status</span>
                  <span className={`capitalize font-medium ${
                    booking.hostPayoutStatus === "transferred"
                      ? "text-green-600"
                      : booking.hostPayoutStatus === "failed"
                      ? "text-red-500"
                      : booking.hostPayoutStatus === "processing"
                      ? "text-blue-500"
                      : "text-orange-500"
                  }`}>
                    {booking.hostPayoutStatus}
                  </span>
                </div>
                {booking.payoutReference && (
                  <div className="flex justify-between text-gray-500">
                    <span>Payout ref</span>
                    <span className="font-mono text-xs">{booking.payoutReference}</span>
                  </div>
                )}
              </>
            )}

            <div className="flex justify-between text-sm border-t border-gray-100 pt-3">
              <span className="text-gray-500">Payment status</span>
              <span className={`font-medium capitalize ${
                booking.paymentStatus === "paid"
                  ? "text-green-600"
                  : booking.paymentStatus === "refunded"
                  ? "text-blue-600"
                  : booking.paymentStatus === "failed"
                  ? "text-red-500"
                  : "text-orange-500"
              }`}>
                {booking.paymentStatus}
              </span>
            </div>

            {/* Refund row — shown when booking is cancelled and refund was issued */}
            {booking.status === "cancelled" && booking.refundedAmount != null && Number(booking.refundedAmount) > 0 && (
              <div className="flex justify-between text-sm text-blue-700 font-medium border-t border-blue-100 pt-3">
                <span>Refund issued</span>
                <span>₦{Number(booking.refundedAmount).toLocaleString()}</span>
              </div>
            )}
            {booking.status === "cancelled" && (booking.refundedAmount == null || Number(booking.refundedAmount) === 0) && booking.paymentStatus === "paid" && (
              <div className="flex justify-between text-sm text-gray-500 border-t border-gray-100 pt-3">
                <span>Refund</span>
                <span>None (non-refundable)</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Cancellation policy — shown when booking is active */}
        {(booking.status === "confirmed" || booking.status === "awaiting_payment") && isGuest && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 }}
            className="bg-white rounded-2xl border border-gray-100 p-5 mb-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <FaShieldAlt className="text-gray-400 text-sm" />
              <h2 className="font-semibold text-gray-900">Cancellation policy</h2>
              <span className="ml-auto text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {policyInfo.name}
              </span>
            </div>
            <p className="text-sm text-gray-600">{policyInfo.summary}</p>
            <p className="text-xs text-gray-400 mt-1">
              Free cancellation within 24 h of booking applies if check-in is 7+ days away.
            </p>
          </motion.div>
        )}

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
          {booking.cancelledAt && (
            <p className="text-xs text-red-400 mt-1">
              Cancelled on {new Date(booking.cancelledAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
              {booking.cancelledBy ? ` by ${booking.cancelledBy}` : ""}
            </p>
          )}
        </motion.div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          {isGuest && canPayNow && (
            <button
              onClick={handlePayNow}
              disabled={isRedirectingToPayment}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-black text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              <FaCreditCard />
              {isRedirectingToPayment ? "Redirecting…" : "Pay now"}
            </button>
          )}

          <Link
            href={booking.property ? `/properties/${booking.property?.id}` : `/vehicles/${booking.vehicle?.id}`}
            className="flex-1 text-center btn-secondary py-3"
          >
            View listing
          </Link>

          {isGuest && canCancel && (
            <button
              onClick={openCancelModal}
              className="flex-1 py-3 border-2 border-red-200 text-red-600 font-semibold rounded-lg hover:bg-red-50 transition-colors"
            >
              Cancel booking
            </button>
          )}
        </div>
      </div>

      {/* Cancellation confirmation modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            <h2 className="text-lg font-bold text-gray-900 mb-1">Cancel booking?</h2>
            <p className="text-sm text-gray-500 mb-5">
              This cannot be undone. Please review your refund below before confirming.
            </p>

            {isFetchingEstimate ? (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
              </div>
            ) : estimate ? (
              <div className="bg-gray-50 rounded-xl p-4 mb-5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Amount paid</span>
                  <span className="font-medium text-gray-900">₦{Number(estimate.totalPaid).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-gray-600">Your refund</span>
                  <span className={`font-bold text-lg ${estimate.refundAmount > 0 ? "text-green-600" : "text-red-500"}`}>
                    {estimate.refundAmount > 0
                      ? `₦${Number(estimate.refundAmount).toLocaleString()}`
                      : "₦0 (no refund)"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 border-t border-gray-200 pt-3">{estimate.reason}</p>
                {estimate.refundAmount > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    Refunds typically appear within 5–7 business days depending on your bank.
                  </p>
                )}
              </div>
            ) : null}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for cancellation (optional)
              </label>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="e.g. Plans changed, emergency came up…"
                rows={2}
                maxLength={300}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={isCancelling}
                className="flex-1 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                Keep booking
              </button>
              <button
                onClick={handleCancel}
                disabled={isCancelling || isFetchingEstimate}
                className="flex-1 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isCancelling ? "Cancelling…" : "Yes, cancel"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
