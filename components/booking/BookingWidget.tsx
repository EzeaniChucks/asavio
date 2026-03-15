"use client";

// components/booking/BookingWidget.tsx
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FaCheckCircle, FaTimesCircle, FaExclamationTriangle } from "react-icons/fa";
import { api } from "@/lib/api";
import { Property } from "@/types";
import { useAuth } from "@/hooks/useAuth";

interface BookingWidgetProps {
  property: Property;
}

interface AvailabilityResult {
  available: boolean;
  nights: number;
  totalPrice: number;
}

export default function BookingWidget({ property }: BookingWidgetProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const today = new Date().toISOString().split("T")[0];

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [specialRequests, setSpecialRequests] = useState("");
  const [showRequests, setShowRequests] = useState(false);

  const [availability, setAvailability] = useState<AvailabilityResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  // Check availability whenever dates change
  useEffect(() => {
    if (!checkIn || !checkOut) {
      setAvailability(null);
      return;
    }
    if (new Date(checkOut) <= new Date(checkIn)) return;

    setIsChecking(true);
    const timeout = setTimeout(() => {
      api
        .get(
          `/bookings/availability?propertyId=${property.id}&checkIn=${checkIn}&checkOut=${checkOut}`
        )
        .then((res) => setAvailability(res.data.data))
        .catch(() => setAvailability(null))
        .finally(() => setIsChecking(false));
    }, 400);

    return () => clearTimeout(timeout);
  }, [checkIn, checkOut, property.id]);

  const handleReserve = async () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (!checkIn || !checkOut || !availability?.available) return;

    setIsBooking(true);
    try {
      const bookingRes = await api.post("/bookings", {
        propertyId: property.id,
        checkIn,
        checkOut,
        guests,
        specialRequests: specialRequests.trim() || undefined,
      });
      const bookingId = bookingRes.data.data.booking.id;

      const payRes = await api.post("/payments/initialize", { bookingId });
      const { authorization_url } = payRes.data.data;
      window.location.href = authorization_url;
    } catch {
      // axios interceptor shows toast
    } finally {
      setIsBooking(false);
    }
  };

  const nights = availability?.nights ?? 0;
  const canReserve = checkIn && checkOut && availability?.available && nights > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="border border-gray-200 rounded-2xl p-6 shadow-lg bg-white"
    >
      {/* Price */}
      <div className="flex items-baseline gap-1 mb-5">
        <span className="text-2xl font-bold">₦{Number(property.pricePerNight).toLocaleString()}</span>
        <span className="text-gray-500">/ night</span>
      </div>

      {/* Platform-only warning */}
      <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-800">
        <FaExclamationTriangle className="shrink-0 mt-0.5 text-amber-500" />
        <p>
          <strong>Book and pay on Asavio only.</strong> Payments made outside the platform are not
          protected. Asavio cannot guarantee refunds or dispute resolution for off-platform
          transactions.
        </p>
      </div>

      {/* Date + Guest inputs */}
      <div className="border border-gray-200 rounded-xl overflow-hidden mb-3">
        <div className="grid grid-cols-2">
          <div className="p-3 border-r border-gray-200">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
              Check-in
            </label>
            <input
              type="date"
              value={checkIn}
              min={today}
              onChange={(e) => setCheckIn(e.target.value)}
              className="w-full text-sm outline-none text-gray-800 cursor-pointer"
            />
          </div>
          <div className="p-3">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
              Check-out
            </label>
            <input
              type="date"
              value={checkOut}
              min={checkIn || today}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full text-sm outline-none text-gray-800 cursor-pointer"
            />
          </div>
        </div>
        <div className="border-t border-gray-200 p-3">
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
            Guests
          </label>
          <select
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="w-full text-sm outline-none text-gray-800 bg-transparent cursor-pointer"
          >
            {Array.from({ length: property.maxGuests }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "guest" : "guests"}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Availability indicator */}
      {checkIn && checkOut && (
        <div className="mb-3">
          {isChecking ? (
            <p className="text-xs text-gray-400 flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
              Checking availability…
            </p>
          ) : availability ? (
            <p
              className={`text-xs font-medium flex items-center gap-1.5 ${
                availability.available ? "text-green-600" : "text-red-500"
              }`}
            >
              {availability.available ? (
                <>
                  <FaCheckCircle /> Available for these dates
                </>
              ) : (
                <>
                  <FaTimesCircle /> Not available — try different dates
                </>
              )}
            </p>
          ) : null}
        </div>
      )}

      {/* Special requests toggle */}
      {checkIn && checkOut && availability?.available && (
        <div className="mb-3">
          <button
            type="button"
            onClick={() => setShowRequests(!showRequests)}
            className="text-xs text-gray-500 underline hover:text-black transition-colors"
          >
            {showRequests ? "Hide special requests" : "Add a special request (optional)"}
          </button>
          {showRequests && (
            <textarea
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              placeholder="Any special requests for the host…"
              maxLength={500}
              rows={3}
              className="mt-2 w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-black resize-none"
            />
          )}
        </div>
      )}

      {/* Reserve / Login button */}
      {isAuthenticated ? (
        <button
          disabled={!canReserve || isBooking}
          onClick={handleReserve}
          className="w-full bg-black text-white font-semibold py-3.5 rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isBooking
            ? "Redirecting to payment…"
            : !checkIn || !checkOut
            ? "Select dates to reserve"
            : "Reserve & Pay"}
        </button>
      ) : (
        <Link
          href="/login"
          className="block w-full text-center bg-black text-white font-semibold py-3.5 rounded-xl hover:bg-gray-800 transition-colors"
        >
          Log in to reserve
        </Link>
      )}

      {/* Price breakdown */}
      {nights > 0 && availability?.available && (
        <div className="mt-5 space-y-2 text-sm border-t border-gray-100 pt-5">
          <div className="flex justify-between text-gray-600">
            <span>
              ₦{Number(property.pricePerNight).toLocaleString()} × {nights}{" "}
              {nights === 1 ? "night" : "nights"}
            </span>
            <span>₦{availability.totalPrice.toLocaleString()}</span>
          </div>
          <div className="flex justify-between font-semibold text-gray-900 border-t border-gray-100 pt-2">
            <span>Total</span>
            <span>₦{availability.totalPrice.toLocaleString()}</span>
          </div>
        </div>
      )}

      <p className="text-center text-xs text-gray-400 mt-4">
        You&apos;ll be redirected to Paystack to complete payment securely.
      </p>
    </motion.div>
  );
}
