"use client";

// components/booking/BookingWidget.tsx
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { DateRange } from "react-date-range";
import type { RangeKeyDict } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaCalendarAlt } from "react-icons/fa";
import { api } from "@/lib/api";
import { Property } from "@/types";
import { useAuth } from "@/hooks/useAuth";

interface BookingWidgetProps {
  property: Property;
}

interface AvailabilityResult {
  available: boolean;
  nights: number;
  pricePerNight: number;
  totalPrice: number;
}

interface BookedRange {
  checkIn: string;
  checkOut: string;
}

function toYMD(date: Date): string {
  return date.toISOString().split("T")[0];
}

function formatDisplay(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function BookingWidget({ property }: BookingWidgetProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [purpose, setPurpose] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [showRequests, setShowRequests] = useState(false);

  // Calendar state
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selection, setSelection] = useState({
    startDate: today,
    endDate: today,
    key: "selection",
  });
  const calendarRef = useRef<HTMLDivElement>(null);

  // Booked / blocked ranges fetched from API
  const [bookedRanges, setBookedRanges] = useState<BookedRange[]>([]);

  // Availability check result
  const [availability, setAvailability] = useState<AvailabilityResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  // Only entries with a valid finite positive price — filters out NaN, null, Infinity, 0, negatives
  const validPurposeEntries = Object.entries(property.purposePricing ?? {}).filter(
    ([, price]) => typeof price === "number" && Number.isFinite(price) && price > 0
  );
  const hasPurposePricing = validPurposeEntries.length > 0;

  // Fetch booked + blocked date ranges once on mount
  useEffect(() => {
    api
      .get(`/properties/${property.id}/booked-dates`)
      .then((res) => setBookedRanges(res.data.data.bookedDates))
      .catch(() => {});
  }, [property.id]);

  // Close calendar when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setCalendarOpen(false);
      }
    };
    if (calendarOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [calendarOpen]);

  // Returns true if a date falls within any booked/blocked range
  const isDateBlocked = (date: Date): boolean => {
    const d = date.getTime();
    return bookedRanges.some((range) => {
      const from = new Date(range.checkIn).getTime();
      const to = new Date(range.checkOut).getTime();
      return d >= from && d < to;
    });
  };

  // Handle calendar selection
  const handleRangeChange = (ranges: RangeKeyDict) => {
    const sel = ranges.selection;
    setSelection({
      startDate: sel.startDate ?? today,
      endDate: sel.endDate ?? today,
      key: "selection",
    });

    const start = sel.startDate ? toYMD(sel.startDate) : "";
    const end = sel.endDate ? toYMD(sel.endDate) : "";

    // Only commit when both dates are different (range selected)
    if (start && end && start !== end) {
      setCheckIn(start);
      setCheckOut(end);
      setCalendarOpen(false);
    } else if (start) {
      // First click — keep open
      setCheckIn(start);
      setCheckOut("");
    }
  };

  // Check availability whenever dates change
  useEffect(() => {
    if (!checkIn || !checkOut) {
      setAvailability(null);
      return;
    }
    if (new Date(checkOut) <= new Date(checkIn)) return;

    setIsChecking(true);
    const timeout = setTimeout(() => {
      const purposeParam = purpose ? `&purpose=${encodeURIComponent(purpose)}` : "";
      api
        .get(`/bookings/availability?propertyId=${property.id}&checkIn=${checkIn}&checkOut=${checkOut}${purposeParam}`)
        .then((res) => setAvailability(res.data.data))
        .catch(() => setAvailability(null))
        .finally(() => setIsChecking(false));
    }, 400);

    return () => clearTimeout(timeout);
  }, [checkIn, checkOut, purpose, property.id]);

  const handleReserve = async () => {
    if (!isAuthenticated) { router.push(`/login?redirect=${encodeURIComponent(pathname)}`); return; }
    if (!checkIn || !checkOut || !availability?.available) return;

    setIsBooking(true);
    try {
      const bookingRes = await api.post("/bookings", {
        propertyId: property.id,
        checkIn,
        checkOut,
        guests,
        purpose: purpose || undefined,
        specialRequests: specialRequests.trim() || undefined,
      });
      const bookingId = bookingRes.data.data.booking.id;
      const payRes = await api.post("/payments/initialize", { bookingId });
      window.location.href = payRes.data.data.authorization_url;
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
        {hasPurposePricing && purpose && property.purposePricing?.[purpose] ? (
          <>
            <span className="text-2xl font-bold">₦{Number(property.purposePricing[purpose]).toLocaleString()}</span>
            <span className="text-gray-500">/ night</span>
            <span className="ml-2 text-xs text-gray-400 line-through">₦{Number(property.pricePerNight).toLocaleString()}</span>
          </>
        ) : (
          <>
            <span className="text-2xl font-bold">₦{Number(property.pricePerNight).toLocaleString()}</span>
            <span className="text-gray-500">/ night</span>
          </>
        )}
      </div>

      {/* Platform-only warning */}
      <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3 text-xs text-amber-800">
        <FaExclamationTriangle className="shrink-0 mt-0.5 text-amber-500" />
        <p>
          <strong>Book and pay on Asavio only.</strong> Payments made outside the platform are not
          protected.
        </p>
      </div>

      {/* Caution fee notice */}
      {property.cautionFee != null && Number(property.cautionFee) > 0 && (
        <div className="flex gap-2 bg-blue-50 border border-blue-200 rounded-xl p-3 mb-3 text-xs text-blue-800">
          <span className="shrink-0">🔒</span>
          <p>
            <strong>Caution fee: ₦{Number(property.cautionFee).toLocaleString("en-NG")}</strong> — refundable deposit collected by the host on arrival. Not charged through Asavio.
          </p>
        </div>
      )}

      {/* Date picker trigger */}
      <div ref={calendarRef} className="relative mb-3">
        <button
          type="button"
          onClick={() => setCalendarOpen((o) => !o)}
          className="w-full border border-gray-200 rounded-xl overflow-hidden text-left hover:border-gray-400 transition-colors"
        >
          <div className="grid grid-cols-2">
            <div className="p-3 border-r border-gray-200">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Check-in</p>
              <p className={`text-sm ${checkIn ? "text-gray-900" : "text-gray-400"}`}>
                {checkIn ? formatDisplay(checkIn) : "Add date"}
              </p>
            </div>
            <div className="p-3">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Check-out</p>
              <p className={`text-sm ${checkOut ? "text-gray-900" : "text-gray-400"}`}>
                {checkOut ? formatDisplay(checkOut) : "Add date"}
              </p>
            </div>
          </div>
          <div className="border-t border-gray-100 px-3 py-2 flex items-center gap-1.5 text-xs text-gray-400">
            <FaCalendarAlt className="text-xs" />
            {checkIn && checkOut
              ? "Click to change dates"
              : "Click to select dates — booked dates are greyed out"}
          </div>
        </button>

        {/* Calendar popup */}
        {calendarOpen && (
          <div className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-2 shadow-2xl rounded-2xl overflow-hidden border border-gray-200 bg-white">
            <DateRange
              ranges={[selection]}
              onChange={handleRangeChange}
              disabledDay={isDateBlocked}
              minDate={today}
              months={2}
              direction="horizontal"
              showDateDisplay={false}
              rangeColors={["#000000"]}
            />
          </div>
        )}
      </div>

      {/* Guests */}
      <div className="border border-gray-200 rounded-xl p-3 mb-3">
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

      {hasPurposePricing && (
        <div className="border border-gray-200 rounded-xl p-3 mb-3">
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
            Purpose
          </label>
          <select
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className="w-full text-sm outline-none text-gray-800 bg-transparent cursor-pointer"
          >
            <option value="">Regular stay (base price)</option>
            {validPurposeEntries.map(([p, price]) => (
              <option key={p} value={p}>
                {p} — ₦{Number(price).toLocaleString()}/night
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Availability indicator */}
      {checkIn && checkOut && (
        <div className="mb-3">
          {isChecking ? (
            <p className="text-xs text-gray-400 flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
              Checking availability…
            </p>
          ) : availability ? (
            <p className={`text-xs font-medium flex items-center gap-1.5 ${availability.available ? "text-green-600" : "text-red-500"}`}>
              {availability.available
                ? <><FaCheckCircle /> Available for these dates</>
                : <><FaTimesCircle /> Not available — try different dates</>}
            </p>
          ) : null}
        </div>
      )}

      {/* Special requests */}
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
      <button
        disabled={isAuthenticated ? (!canReserve || isBooking) : false}
        onClick={handleReserve}
        className="w-full bg-black text-white font-semibold py-3.5 rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isAuthenticated
          ? isBooking
            ? "Redirecting to payment…"
            : !checkIn || !checkOut
            ? "Select dates to reserve"
            : "Reserve & Pay"
          : "Log in to reserve"}
      </button>

      {/* Price breakdown */}
      {nights > 0 && availability?.available && (
        <div className="mt-5 space-y-2 text-sm border-t border-gray-100 pt-5">
          {purpose && (
            <div className="flex justify-between text-gray-500 text-xs">
              <span>Purpose</span>
              <span className="font-medium text-gray-700">{purpose}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-600">
            <span>
              ₦{Number(availability.pricePerNight).toLocaleString()} × {nights}{" "}
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
