"use client";

// components/booking/EventBookingWidget.tsx
// Event center booking flow:
//   1. Guest picks a single DATE
//   2. Guest selects a SPACE from the event center's spaces
//   3. Widget fetches booked time slots for that space+date
//   4. Guest picks START TIME and END TIME
//   5. Based on pricingMode, show pricing (hourly/daily/package/hybrid)
//   6. Guest enters event TYPE, ATTENDEE COUNT, special requests
//   7. Reserve & Pay → POST /event-bookings → POST /payments/initialize → redirect

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  FaExclamationTriangle,
  FaCalendarAlt,
  FaUsers,
  FaClock,
} from "react-icons/fa";
import { MdMeetingRoom } from "react-icons/md";
import { api } from "@/lib/api";
import { EventCenter, EventSpace } from "@/types";
import { formatPrice } from "@/lib/formatPrice";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/context/CurrencyContext";

interface Props {
  eventCenter: EventCenter;
}

interface BookedSlot {
  startTime: string;
  endTime: string;
}

function toYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseHours(start: string, end: string): number {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const diff = (eh * 60 + em - (sh * 60 + sm)) / 60;
  return Math.max(0, diff);
}

export default function EventBookingWidget({ eventCenter }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const { showUsd, toUsd } = useCurrency();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const minDate = toYMD(today);

  const [eventDate, setEventDate] = useState("");
  const [selectedSpaceId, setSelectedSpaceId] = useState("");
  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([]);
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);

  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [pricingChoice, setPricingChoice] = useState<"hourly" | "daily">("hourly");
  const [eventType, setEventType] = useState("");
  const [attendeeCount, setAttendeeCount] = useState(1);
  const [specialRequests, setSpecialRequests] = useState("");
  const [showRequests, setShowRequests] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  const spaces = eventCenter.spaces ?? [];
  const selectedSpace: EventSpace | null =
    spaces.find((s) => s.id === selectedSpaceId) ?? null;

  // Allowed event types for the dropdown
  const allowedTypes = (eventCenter.allowedEventTypes ?? []).filter(
    (t) => !(eventCenter.blockedEventTypes ?? []).includes(t)
  );

  // Fetch booked slots when space + date change
  useEffect(() => {
    if (!selectedSpaceId || !eventDate) {
      setBookedSlots([]);
      return;
    }
    setIsFetchingSlots(true);
    const timeout = setTimeout(() => {
      api
        .get(
          `/event-bookings/slots?eventSpaceId=${selectedSpaceId}&eventDate=${eventDate}`
        )
        .then((res) => setBookedSlots(res.data.data.slots ?? res.data.data ?? []))
        .catch(() => setBookedSlots([]))
        .finally(() => setIsFetchingSlots(false));
    }, 400);
    return () => clearTimeout(timeout);
  }, [selectedSpaceId, eventDate]);

  // Reset pricing choice when space changes
  useEffect(() => {
    if (selectedSpace) {
      if (selectedSpace.pricingMode === "hourly") setPricingChoice("hourly");
      else if (selectedSpace.pricingMode === "daily") setPricingChoice("daily");
      else if (selectedSpace.pricingMode === "package") setPricingChoice("daily");
      else setPricingChoice("hourly"); // hybrid default
    }
  }, [selectedSpaceId]);

  const hours = parseHours(startTime, endTime);

  // Compute total price
  let totalPrice = 0;
  let pricingUsed: "hourly" | "daily" | "package" = "hourly";
  if (selectedSpace) {
    const mode = selectedSpace.pricingMode;
    if (mode === "hourly") {
      totalPrice = Number(selectedSpace.hourlyRate ?? 0) * hours;
      pricingUsed = "hourly";
    } else if (mode === "daily") {
      totalPrice = Number(selectedSpace.dailyRate ?? 0);
      pricingUsed = "daily";
    } else if (mode === "package") {
      totalPrice = Number(selectedSpace.packageRate ?? 0);
      pricingUsed = "package";
    } else if (mode === "hybrid") {
      if (pricingChoice === "daily") {
        totalPrice = Number(selectedSpace.dailyRate ?? 0);
        pricingUsed = "daily";
      } else {
        totalPrice = Number(selectedSpace.hourlyRate ?? 0) * hours;
        pricingUsed = "hourly";
      }
    }
  }

  const meetsMinHours =
    !selectedSpace ||
    pricingUsed !== "hourly" ||
    hours >= (selectedSpace.minHours ?? 1);

  const canReserve =
    !!selectedSpace &&
    !!eventDate &&
    !!eventType &&
    attendeeCount > 0 &&
    attendeeCount <= (selectedSpace?.capacity ?? 0) &&
    totalPrice > 0 &&
    meetsMinHours &&
    (pricingUsed !== "hourly" || (!!startTime && !!endTime && hours > 0));

  const handleReserve = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!selectedSpace || !canReserve) return;

    setIsBooking(true);
    try {
      const bookingRes = await api.post("/event-bookings", {
        eventCenterId: eventCenter.id,
        eventSpaceId: selectedSpace.id,
        eventDate,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        eventType,
        attendeeCount,
        pricingUsed,
        specialRequests: specialRequests.trim() || undefined,
      });
      const bookingId =
        bookingRes.data.data.booking?.id ?? bookingRes.data.data.id;
      const payRes = await api.post("/payments/initialize", {
        eventBookingId: bookingId,
      });
      window.location.href = payRes.data.data.authorization_url;
    } catch {
      // interceptor handles toast
    } finally {
      setIsBooking(false);
    }
  };

  // "From" price — cheapest rate across all spaces
  const allRates = spaces.flatMap((s) =>
    [s.hourlyRate, s.dailyRate, s.packageRate]
      .filter((r): r is number => r != null && Number.isFinite(Number(r)) && Number(r) > 0)
      .map(Number)
  );
  const fromPrice = allRates.length > 0 ? Math.min(...allRates) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="border border-gray-200 rounded-2xl p-6 shadow-lg bg-white"
    >
      {/* Pricing header */}
      <div className="mb-5">
        {fromPrice ? (
          <>
            <div className="flex items-baseline gap-1">
              <span className="text-xs text-gray-400 uppercase tracking-wide mr-1">
                From
              </span>
              <span className="text-2xl font-bold">
                {showUsd && toUsd(fromPrice) ? toUsd(fromPrice) : formatPrice(fromPrice)}
              </span>
            </div>
            {toUsd(fromPrice) && (
              <p className="text-xs text-gray-400 mt-0.5">
                {showUsd ? formatPrice(fromPrice) : toUsd(fromPrice)}
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-400 italic">Spaces not set up yet.</p>
        )}
      </div>

      {/* Platform-only warning */}
      <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3 text-xs text-amber-800">
        <FaExclamationTriangle className="shrink-0 mt-0.5 text-amber-500" />
        <p>
          <strong>Book and pay on Asavio only.</strong> Payments made outside the
          platform are not protected.
        </p>
      </div>

      {/* Date picker */}
      <div className="border border-gray-200 rounded-xl p-3 mb-3">
        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
          <FaCalendarAlt className="inline mr-1 text-gray-400 text-[10px]" />
          Event date
        </label>
        <input
          type="date"
          min={minDate}
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          className="w-full text-sm outline-none text-gray-800 bg-transparent"
        />
      </div>

      {/* Space selector */}
      <div className="mb-3">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
          <MdMeetingRoom className="inline mr-1 text-gray-400 text-[10px]" />
          Choose a space
        </p>
        {spaces.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-4 text-center text-sm text-gray-400">
            No spaces available.
          </div>
        ) : (
          <div className="space-y-2">
            {spaces.map((space) => {
              const isSelected = selectedSpaceId === space.id;
              const rateLabel =
                space.pricingMode === "hourly"
                  ? `${formatPrice(space.hourlyRate ?? 0)}/hr`
                  : space.pricingMode === "daily"
                  ? `${formatPrice(space.dailyRate ?? 0)}/day`
                  : space.pricingMode === "package"
                  ? `${formatPrice(space.packageRate ?? 0)} (${space.packageName ?? "Package"})`
                  : `From ${formatPrice(space.hourlyRate ?? space.dailyRate ?? 0)}`;
              return (
                <button
                  key={space.id}
                  type="button"
                  onClick={() => setSelectedSpaceId(space.id)}
                  className={`w-full text-left p-3 rounded-xl border transition ${
                    isSelected
                      ? "border-black bg-gray-50"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900">
                        {space.name}
                      </p>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500 mt-0.5">
                        <span>Capacity: {space.capacity}</span>
                        <span className="capitalize">{space.pricingMode}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-sm text-gray-900">{rateLabel}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Booked slots display */}
      {selectedSpaceId && eventDate && (
        <div className="mb-3">
          {isFetchingSlots ? (
            <div className="bg-gray-50 rounded-xl p-3 text-center text-xs text-gray-400">
              Checking availability...
            </div>
          ) : bookedSlots.length > 0 ? (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-1">
              <p className="text-xs font-semibold text-red-700 mb-1">
                Already booked times:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {bookedSlots.map((slot, i) => (
                  <span
                    key={i}
                    className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full"
                  >
                    {slot.startTime} - {slot.endTime}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-700">
              No bookings on this date. All times available.
            </div>
          )}
        </div>
      )}

      {/* Time inputs — shown for hourly or hybrid-hourly */}
      {selectedSpace &&
        (selectedSpace.pricingMode === "hourly" ||
          (selectedSpace.pricingMode === "hybrid" && pricingChoice === "hourly")) && (
          <div className="border border-gray-200 rounded-xl overflow-hidden mb-3">
            <div className="grid grid-cols-2">
              <div className="p-3 border-r border-gray-200">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                  Start time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full text-sm outline-none text-gray-800 bg-transparent"
                />
              </div>
              <div className="p-3">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                  End time
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full text-sm outline-none text-gray-800 bg-transparent"
                />
              </div>
            </div>
            {startTime && endTime && hours > 0 && (
              <div className="border-t border-gray-100 px-3 py-2 flex items-center gap-1.5 text-xs text-gray-400">
                <FaClock className="text-xs" />
                {hours.toFixed(1)} hour{hours !== 1 ? "s" : ""}
                {selectedSpace.minHours > 1 && hours < selectedSpace.minHours && (
                  <span className="text-amber-600 ml-1">
                    (min {selectedSpace.minHours}h required)
                  </span>
                )}
              </div>
            )}
          </div>
        )}

      {/* Hybrid toggle */}
      {selectedSpace && selectedSpace.pricingMode === "hybrid" && (
        <div className="border border-gray-200 rounded-xl p-3 mb-3">
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
            Pricing option
          </label>
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setPricingChoice("hourly")}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${
                pricingChoice === "hourly"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Hourly ({formatPrice(selectedSpace.hourlyRate ?? 0)}/hr)
            </button>
            <button
              type="button"
              onClick={() => setPricingChoice("daily")}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${
                pricingChoice === "daily"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Full Day ({formatPrice(selectedSpace.dailyRate ?? 0)})
            </button>
          </div>
        </div>
      )}

      {/* Package info */}
      {selectedSpace && selectedSpace.pricingMode === "package" && (
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 mb-3">
          <p className="font-semibold text-sm text-gray-900">
            {selectedSpace.packageName ?? "Package"}
          </p>
          {selectedSpace.packageDescription && (
            <p className="text-xs text-gray-500 mt-1">
              {selectedSpace.packageDescription}
            </p>
          )}
          <p className="font-bold text-sm text-gray-900 mt-1">
            {showUsd && toUsd(selectedSpace.packageRate ?? 0)
              ? toUsd(selectedSpace.packageRate ?? 0)
              : formatPrice(selectedSpace.packageRate ?? 0)}
          </p>
        </div>
      )}

      {/* Event type */}
      <div className="border border-gray-200 rounded-xl p-3 mb-3">
        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
          Event type
        </label>
        {allowedTypes.length > 0 ? (
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="w-full text-sm outline-none text-gray-800 bg-transparent"
          >
            <option value="">Select event type</option>
            {allowedTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            placeholder="e.g. Wedding, Birthday"
            className="w-full text-sm outline-none text-gray-800 bg-transparent"
          />
        )}
      </div>

      {/* Attendee count */}
      <div className="border border-gray-200 rounded-xl p-3 mb-3">
        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
          <FaUsers className="inline mr-1 text-gray-400 text-[10px]" />
          Number of attendees
        </label>
        <input
          type="number"
          min={1}
          max={selectedSpace?.capacity ?? 10000}
          value={attendeeCount}
          onChange={(e) => setAttendeeCount(Math.max(1, Number(e.target.value)))}
          className="w-full text-sm outline-none text-gray-800 bg-transparent"
        />
        {selectedSpace && attendeeCount > selectedSpace.capacity && (
          <p className="text-xs text-amber-600 mt-1">
            This space has a max capacity of {selectedSpace.capacity}.
          </p>
        )}
      </div>

      {/* Special requests */}
      {canReserve && (
        <div className="mb-3">
          <button
            type="button"
            onClick={() => setShowRequests(!showRequests)}
            className="text-xs text-gray-500 underline hover:text-black transition"
          >
            {showRequests
              ? "Hide special requests"
              : "Add a special request (optional)"}
          </button>
          {showRequests && (
            <textarea
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              placeholder="Any requests for the event center (e.g. setup preferences, AV equipment)..."
              maxLength={500}
              rows={3}
              className="mt-2 w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-black resize-none"
            />
          )}
        </div>
      )}

      {/* Reserve button */}
      <button
        disabled={isAuthenticated ? !canReserve || isBooking : false}
        onClick={handleReserve}
        className="w-full bg-black text-white font-semibold py-3.5 rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isAuthenticated
          ? isBooking
            ? "Redirecting to payment\u2026"
            : !eventDate
            ? "Select a date"
            : !selectedSpace
            ? "Select a space"
            : !eventType
            ? "Select event type"
            : "Reserve & Pay"
          : "Log in to reserve"}
      </button>

      {/* Price breakdown */}
      {selectedSpace && totalPrice > 0 && (
        <div className="mt-5 space-y-2 text-sm border-t border-gray-100 pt-5">
          <div className="flex justify-between text-gray-500 text-xs">
            <span>Space</span>
            <span className="font-medium text-gray-700">{selectedSpace.name}</span>
          </div>
          {pricingUsed === "hourly" && hours > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>
                {showUsd && toUsd(selectedSpace.hourlyRate ?? 0)
                  ? toUsd(selectedSpace.hourlyRate ?? 0)
                  : formatPrice(selectedSpace.hourlyRate ?? 0)}{" "}
                x {hours.toFixed(1)} hr{hours !== 1 ? "s" : ""}
              </span>
              <span>
                {showUsd && toUsd(totalPrice)
                  ? toUsd(totalPrice)
                  : formatPrice(totalPrice)}
              </span>
            </div>
          )}
          {pricingUsed === "daily" && (
            <div className="flex justify-between text-gray-600">
              <span>Full day rate</span>
              <span>
                {showUsd && toUsd(totalPrice)
                  ? toUsd(totalPrice)
                  : formatPrice(totalPrice)}
              </span>
            </div>
          )}
          {pricingUsed === "package" && (
            <div className="flex justify-between text-gray-600">
              <span>{selectedSpace.packageName ?? "Package"}</span>
              <span>
                {showUsd && toUsd(totalPrice)
                  ? toUsd(totalPrice)
                  : formatPrice(totalPrice)}
              </span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-gray-900 border-t border-gray-100 pt-2">
            <span>Total</span>
            <div className="text-right">
              <span>
                {showUsd && toUsd(totalPrice)
                  ? toUsd(totalPrice)
                  : formatPrice(totalPrice)}
              </span>
              {toUsd(totalPrice) && (
                <p className="text-xs text-gray-400 font-normal">
                  {showUsd ? formatPrice(totalPrice) : toUsd(totalPrice)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <p className="text-center text-xs text-gray-400 mt-4">
        You&apos;ll be redirected to Paystack to complete payment securely.
      </p>
    </motion.div>
  );
}
