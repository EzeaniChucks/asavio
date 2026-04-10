"use client";

// components/booking/VehicleBookingWidget.tsx
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { DateRange } from "react-date-range";
import type { RangeKeyDict } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaCalendarAlt,
  FaUserTie,
} from "react-icons/fa";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  pricePerDay: number;
  priceWithDriverPerDay?: number | null;
  seats: number;
  travelZone?: string;
  allowInterstate?: boolean;
  interstateSurchargePerDay?: number | null;
}

interface VehicleBookingWidgetProps {
  vehicle: Vehicle;
}

interface AvailabilityResult {
  available: boolean;
  days: number;
  pricePerDay: number;
  priceWithDriverPerDay: number | null;
  totalPrice: number;
  interstateSurchargePerDay?: number | null;
  effectiveDailyRate?: number;
}

interface BookedRange {
  checkIn: string;
  checkOut: string;
}

function toYMD(date: Date): string {
  // Use local date parts — toISOString() is UTC and shifts dates in UTC+1 (Nigeria/WAT)
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDisplay(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function VehicleBookingWidget({ vehicle }: VehicleBookingWidgetProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [pickUp, setPickUp] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [withDriver, setWithDriver] = useState(false);
  const [travelScope, setTravelScope] = useState<"local" | "interstate">("local");
  const [destination, setDestination] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [showRequests, setShowRequests] = useState(false);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Calendar state
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selection, setSelection] = useState({
    startDate: today,
    endDate: today,
    key: "selection",
  });
  const calendarRef = useRef<HTMLDivElement>(null);

  const [bookedRanges, setBookedRanges] = useState<BookedRange[]>([]);
  const [availability, setAvailability] = useState<AvailabilityResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  const hasDriverOption = vehicle.priceWithDriverPerDay != null;

  // Fetch booked date ranges once on mount
  useEffect(() => {
    api
      .get(`/vehicles/${vehicle.id}/booked-dates`)
      .then((res) => setBookedRanges(res.data.data.bookedDates))
      .catch(() => {});
  }, [vehicle.id]);

  // Close calendar on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setCalendarOpen(false);
      }
    };
    if (calendarOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [calendarOpen]);

  // Uses local YYYY-MM-DD string comparison — avoids UTC shift bugs (Nigeria is UTC+1).
  const isDateBlocked = (date: Date): boolean => {
    const ymd = toYMD(date);
    return bookedRanges.some((range) => ymd >= range.checkIn && ymd < range.checkOut);
  };

  const handleRangeChange = (ranges: RangeKeyDict) => {
    const sel = ranges.selection;
    setSelection({
      startDate: sel.startDate ?? today,
      endDate: sel.endDate ?? today,
      key: "selection",
    });

    const start = sel.startDate ? toYMD(sel.startDate) : "";
    const end = sel.endDate ? toYMD(sel.endDate) : "";

    if (start && end && start !== end) {
      setPickUp(start);
      setReturnDate(end);
      setCalendarOpen(false);
    } else if (start) {
      setPickUp(start);
      setReturnDate("");
    }
  };

  // Check availability whenever dates, driver option, or travel scope changes
  useEffect(() => {
    if (!pickUp || !returnDate) {
      setAvailability(null);
      return;
    }
    if (new Date(returnDate) <= new Date(pickUp)) return;

    setIsChecking(true);
    const timeout = setTimeout(() => {
      api
        .get(
          `/bookings/availability/vehicle?vehicleId=${vehicle.id}&checkIn=${pickUp}&checkOut=${returnDate}&withDriver=${withDriver}&travelScope=${travelScope}`
        )
        .then((res) => setAvailability(res.data.data))
        .catch(() => setAvailability(null))
        .finally(() => setIsChecking(false));
    }, 400);

    return () => clearTimeout(timeout);
  }, [pickUp, returnDate, withDriver, travelScope, vehicle.id]);

  const handleBook = async () => {
    if (!isAuthenticated) { router.push(`/login?redirect=${encodeURIComponent(pathname)}`); return; }
    if (!pickUp || !returnDate || !availability?.available) return;

    setIsBooking(true);
    try {
      const bookingRes = await api.post("/bookings", {
        vehicleId: vehicle.id,
        checkIn: pickUp,
        checkOut: returnDate,
        guests: 1,
        withDriver,
        travelScope,
        destination: travelScope === "interstate" ? destination.trim() || undefined : undefined,
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

  const days = availability?.days ?? 0;
  const activeRate = availability?.effectiveDailyRate
    ?? (withDriver && availability?.priceWithDriverPerDay
      ? availability.priceWithDriverPerDay
      : availability?.pricePerDay ?? Number(vehicle.pricePerDay));
  const surcharge = travelScope === "interstate" && availability?.interstateSurchargePerDay
    ? Number(availability.interstateSurchargePerDay)
    : 0;
  const canBook =
    pickUp &&
    returnDate &&
    availability?.available &&
    days > 0 &&
    (travelScope !== "interstate" || destination.trim().length > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="border border-gray-200 rounded-2xl p-6 shadow-lg bg-white"
    >
      {/* Price */}
      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-2xl font-bold">₦{Number(vehicle.pricePerDay).toLocaleString()}</span>
        <span className="text-gray-500">/ day</span>
      </div>
      {hasDriverOption && (
        <p className="text-xs text-gray-400 mb-4">
          With driver: ₦{Number(vehicle.priceWithDriverPerDay).toLocaleString()} / day
        </p>
      )}

      {/* Platform-only warning */}
      <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-800">
        <FaExclamationTriangle className="shrink-0 mt-0.5 text-amber-500" />
        <p>
          <strong>Book and pay on Asavio only.</strong> Payments outside the platform are not protected.
        </p>
      </div>

      {/* Date picker trigger */}
      <div ref={calendarRef} className="relative mb-3">
        <button
          type="button"
          onClick={() => setCalendarOpen((o) => !o)}
          className="w-full border border-gray-200 rounded-xl overflow-hidden text-left hover:border-gray-400 transition-colors"
        >
          <div className="grid grid-cols-2">
            <div className="p-3 border-r border-gray-200">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Pick-up</p>
              <p className={`text-sm ${pickUp ? "text-gray-900" : "text-gray-400"}`}>
                {pickUp ? formatDisplay(pickUp) : "Add date"}
              </p>
            </div>
            <div className="p-3">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Return</p>
              <p className={`text-sm ${returnDate ? "text-gray-900" : "text-gray-400"}`}>
                {returnDate ? formatDisplay(returnDate) : "Add date"}
              </p>
            </div>
          </div>
          <div className="border-t border-gray-100 px-3 py-2 flex items-center gap-1.5 text-xs text-gray-400">
            <FaCalendarAlt className="text-xs" />
            {pickUp && returnDate ? "Click to change dates" : "Click to select dates"}
          </div>
        </button>

        {calendarOpen && (
          isMobile ? (
            <div className="fixed inset-0 z-50 flex flex-col bg-black/50" onClick={() => setCalendarOpen(false)}>
              <div
                className="mt-auto bg-white rounded-t-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <p className="font-semibold text-gray-900 text-sm">Select dates</p>
                  <button
                    type="button"
                    onClick={() => setCalendarOpen(false)}
                    className="text-gray-400 hover:text-black text-lg leading-none p-1"
                  >
                    ✕
                  </button>
                </div>
                <div className="overflow-y-auto max-h-[75vh] flex flex-col items-center">
                  <DateRange
                    ranges={[selection]}
                    onChange={handleRangeChange}
                    disabledDay={isDateBlocked}
                    minDate={today}
                    months={2}
                    direction="vertical"
                    showDateDisplay={false}
                    rangeColors={["#000000"]}
                  />
                </div>
              </div>
            </div>
          ) : (
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
          )
        )}
      </div>

      {/* Driver toggle */}
      {hasDriverOption && (
        <div className="border border-gray-200 rounded-xl p-3 mb-3">
          <button
            type="button"
            onClick={() => setWithDriver((w) => !w)}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center gap-2">
              <FaUserTie className="text-gray-500 text-sm" />
              <div className="text-left">
                <p className="text-sm font-medium text-gray-800">Add a driver</p>
                <p className="text-xs text-gray-400">
                  +₦{(Number(vehicle.priceWithDriverPerDay) - Number(vehicle.pricePerDay)).toLocaleString()} / day
                </p>
              </div>
            </div>
            <div
              className={`w-11 h-6 rounded-full transition-colors relative ${
                withDriver ? "bg-black" : "bg-gray-200"
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                  withDriver ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </div>
          </button>
        </div>
      )}

      {/* Travel scope selector */}
      {vehicle.allowInterstate && (
        <div className="border border-gray-200 rounded-xl p-3 mb-3">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Trip scope</p>
          <div className="flex gap-2 mb-1">
            <button
              type="button"
              onClick={() => setTravelScope("local")}
              className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${
                travelScope === "local"
                  ? "bg-black text-white border-black"
                  : "border-gray-200 text-gray-700 hover:border-gray-400"
              }`}
            >
              Within {vehicle.travelZone || "base zone"}
            </button>
            <button
              type="button"
              onClick={() => setTravelScope("interstate")}
              className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${
                travelScope === "interstate"
                  ? "bg-black text-white border-black"
                  : "border-gray-200 text-gray-700 hover:border-gray-400"
              }`}
            >
              Interstate
              {vehicle.interstateSurchargePerDay != null && Number(vehicle.interstateSurchargePerDay) > 0 && (
                <span className="text-xs opacity-70 ml-1">
                  +₦{Number(vehicle.interstateSurchargePerDay).toLocaleString()}/day
                </span>
              )}
            </button>
          </div>
          {travelScope === "interstate" && (
            <div className="mt-2">
              <label className="text-xs text-gray-500 mb-1 block">Destination *</label>
              <input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Abuja, FCT"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-black"
              />
              {!destination.trim() && (
                <p className="text-xs text-amber-600 mt-1">Please enter your destination to book.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Availability indicator */}
      {pickUp && returnDate && (
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
      {pickUp && returnDate && availability?.available && (
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
              placeholder="e.g. Please have the car cleaned before pick-up…"
              maxLength={500}
              rows={3}
              className="mt-2 w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-black resize-none"
            />
          )}
        </div>
      )}

      {/* Book button */}
      <button
        disabled={isAuthenticated ? (!canBook || isBooking) : false}
        onClick={handleBook}
        className="w-full bg-black text-white font-semibold py-3.5 rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isAuthenticated
          ? isBooking
            ? "Redirecting to payment…"
            : !pickUp || !returnDate
            ? "Select dates to book"
            : "Book & Pay"
          : "Log in to book"}
      </button>

      {/* Price breakdown */}
      {days > 0 && availability?.available && (
        <div className="mt-5 space-y-2 text-sm border-t border-gray-100 pt-5">
          {(withDriver && hasDriverOption) || travelScope === "interstate" ? (
            <div className="flex justify-between text-gray-500 text-xs gap-2">
              <span>Rate</span>
              <span className="font-medium text-gray-700 text-right">
                {withDriver && hasDriverOption ? "With driver" : ""}
                {withDriver && hasDriverOption && travelScope === "interstate" ? " + " : ""}
                {travelScope === "interstate" ? "Interstate" : ""}
              </span>
            </div>
          ) : null}
          <div className="flex justify-between text-gray-600">
            <span>
              ₦{Number(activeRate).toLocaleString()} × {days}{" "}
              {days === 1 ? "day" : "days"}
            </span>
            <span>₦{availability.totalPrice.toLocaleString()}</span>
          </div>
          {surcharge > 0 && (
            <div className="flex justify-between text-gray-400 text-xs">
              <span>Incl. interstate surcharge (₦{surcharge.toLocaleString()} × {days} days)</span>
            </div>
          )}
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
