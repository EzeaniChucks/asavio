"use client";

// components/booking/HotelBookingWidget.tsx
// Hotel booking flow:
//   1. Guest picks date range + guest count
//   2. Widget calls /hotels/:id/room-availability → shows each room type with remaining units
//   3. Guest selects a room type + quantity → confirms → Pay via Paystack

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { DateRange } from "react-date-range";
import type { RangeKeyDict } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { FaCheckCircle, FaExclamationTriangle, FaCalendarAlt, FaBed, FaUsers } from "react-icons/fa";
import { api } from "@/lib/api";
import { Hotel, RoomType } from "@/types";
import { formatPrice } from "@/lib/formatPrice";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/context/CurrencyContext";

interface Props {
  hotel: Hotel;
}

interface AvailableRoomType extends RoomType {
  available: number;
}

function toYMD(date: Date): string {
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

export default function HotelBookingWidget({ hotel }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const { showUsd, toUsd } = useCurrency();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [specialRequests, setSpecialRequests] = useState("");
  const [showRequests, setShowRequests] = useState(false);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selection, setSelection] = useState({ startDate: today, endDate: today, key: "selection" });
  const calendarRef = useRef<HTMLDivElement>(null);

  const [rooms, setRooms] = useState<AvailableRoomType[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [quantity, setQuantity] = useState(1);

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
      setCheckIn(start);
      setCheckOut(end);
      setCalendarOpen(false);
    } else if (start) {
      setCheckIn(start);
      setCheckOut("");
    }
  };

  // Fetch availability whenever dates change
  useEffect(() => {
    if (!checkIn || !checkOut) {
      setRooms([]);
      return;
    }
    if (new Date(checkOut) <= new Date(checkIn)) return;

    setIsChecking(true);
    const timeout = setTimeout(() => {
      api
        .get(`/hotels/${hotel.id}/room-availability?checkIn=${checkIn}&checkOut=${checkOut}`)
        .then((res) => setRooms(res.data.data.rooms ?? []))
        .catch(() => setRooms([]))
        .finally(() => setIsChecking(false));
    }, 400);

    return () => clearTimeout(timeout);
  }, [checkIn, checkOut, hotel.id]);

  const nights = checkIn && checkOut
    ? Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)
    : 0;

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId) ?? null;
  const totalPrice = selectedRoom ? Number(selectedRoom.pricePerNight) * nights * quantity : 0;

  // Cap quantity by availability + accommodate guests (each room fits maxGuests)
  useEffect(() => {
    if (selectedRoom) {
      const maxByAvail = selectedRoom.available;
      const needed = Math.ceil(guests / Math.max(1, selectedRoom.maxGuests));
      setQuantity((q) => Math.min(Math.max(q, needed), Math.max(1, maxByAvail)));
    }
  }, [selectedRoomId, guests]);

  const canReserve =
    !!selectedRoom &&
    nights > 0 &&
    quantity > 0 &&
    quantity <= (selectedRoom?.available ?? 0) &&
    guests <= (selectedRoom?.maxGuests ?? 0) * quantity;

  const handleReserve = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!selectedRoom || !canReserve) return;

    setIsBooking(true);
    try {
      const bookingRes = await api.post("/bookings", {
        hotelId: hotel.id,
        roomTypeId: selectedRoom.id,
        quantity,
        checkIn,
        checkOut,
        guests,
        specialRequests: specialRequests.trim() || undefined,
      });
      const bookingId = bookingRes.data.data.booking?.id ?? bookingRes.data.data.id;
      const payRes = await api.post("/payments/initialize", { bookingId });
      window.location.href = payRes.data.data.authorization_url;
    } catch {
      // interceptor handles toast
    } finally {
      setIsBooking(false);
    }
  };

  // Pricing header — "from" price (cheapest room)
  const fromPrice = (hotel.roomTypes ?? [])
    .map((r) => Number(r.pricePerNight))
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => a - b)[0];

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
              <span className="text-xs text-gray-400 uppercase tracking-wide mr-1">From</span>
              <span className="text-2xl font-bold">
                {showUsd && toUsd(fromPrice) ? toUsd(fromPrice) : formatPrice(fromPrice)}
              </span>
              <span className="text-gray-500">/ night</span>
            </div>
            {toUsd(fromPrice) && (
              <p className="text-xs text-gray-400 mt-0.5">
                {showUsd ? formatPrice(fromPrice) : toUsd(fromPrice)}
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-400 italic">Room types not set up yet.</p>
        )}
      </div>

      {/* Platform-only warning */}
      <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3 text-xs text-amber-800">
        <FaExclamationTriangle className="shrink-0 mt-0.5 text-amber-500" />
        <p>
          <strong>Book and pay on Asavio only.</strong> Payments made outside the platform are not protected.
        </p>
      </div>

      {/* Date picker */}
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
            {checkIn && checkOut ? "Click to change dates" : "Click to select dates"}
          </div>
        </button>

        {calendarOpen && (
          isMobile ? (
            <div className="fixed inset-0 z-50 flex flex-col bg-black/50" onClick={() => setCalendarOpen(false)}>
              <div className="mt-auto bg-white rounded-t-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <p className="font-semibold text-gray-900 text-sm">Select dates</p>
                  <button type="button" onClick={() => setCalendarOpen(false)} className="text-gray-400 hover:text-black text-lg leading-none p-1">✕</button>
                </div>
                <div className="overflow-y-auto max-h-[75vh] flex flex-col items-center">
                  <DateRange
                    ranges={[selection]}
                    onChange={handleRangeChange}
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

      {/* Guests */}
      <div className="border border-gray-200 rounded-xl p-3 mb-3">
        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
          <FaUsers className="inline mr-1 text-gray-400 text-[10px]" />
          Total guests
        </label>
        <input
          type="number"
          min={1}
          max={50}
          value={guests}
          onChange={(e) => setGuests(Math.max(1, Number(e.target.value)))}
          className="w-full text-sm outline-none text-gray-800 bg-transparent"
        />
      </div>

      {/* Room selector */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
          <FaBed className="inline mr-1 text-gray-400 text-[10px]" />
          {checkIn && checkOut ? "Choose a room type" : "Available rooms"}
        </p>

        {checkIn && checkOut ? (
          /* ── Live availability (dates selected) ── */
          isChecking ? (
            <div className="bg-gray-50 rounded-xl p-4 text-center text-sm text-gray-400">
              Checking availability…
            </div>
          ) : rooms.length === 0 ? (
            <div className="bg-gray-50 rounded-xl p-4 text-center text-sm text-gray-400">
              No room types available for these dates.
            </div>
          ) : (
            <div className="space-y-2">
              {rooms.map((room) => {
                const isSelected = selectedRoomId === room.id;
                const isUnavailable = room.available < 1;
                return (
                  <button
                    key={room.id}
                    type="button"
                    disabled={isUnavailable}
                    onClick={() => setSelectedRoomId(room.id)}
                    className={`w-full text-left p-3 rounded-xl border transition ${
                      isUnavailable
                        ? "border-gray-100 bg-gray-50/50 opacity-50 cursor-not-allowed"
                        : isSelected
                        ? "border-black bg-gray-50"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900">{room.name}</p>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500 mt-0.5">
                          <span>Sleeps {room.maxGuests}</span>
                          {room.bedType && <span className="capitalize">{room.bedType}</span>}
                          {room.roomSize && <span>{room.roomSize}</span>}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-sm text-gray-900">
                          {showUsd && toUsd(room.pricePerNight)
                            ? toUsd(room.pricePerNight)
                            : formatPrice(room.pricePerNight)}
                        </p>
                        <p className="text-[10px] text-gray-400">/ night</p>
                      </div>
                    </div>
                    <p className={`text-[11px] mt-1.5 ${isUnavailable ? "text-red-500" : "text-gray-500"}`}>
                      {isUnavailable
                        ? "No rooms left for these dates"
                        : `${room.available} room${room.available === 1 ? "" : "s"} available`}
                    </p>
                  </button>
                );
              })}
            </div>
          )
        ) : (
          /* ── Static preview (no dates yet) ── */
          (hotel.roomTypes ?? []).length > 0 ? (
            <div className="space-y-2">
              {(hotel.roomTypes ?? []).map((room) => (
                <div
                  key={room.id}
                  className="w-full text-left p-3 rounded-xl border border-gray-100 bg-gray-50/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900">{room.name}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500 mt-0.5">
                        <span>Sleeps {room.maxGuests}</span>
                        {room.bedType && <span className="capitalize">{room.bedType}</span>}
                        {room.roomSize && <span>{room.roomSize}</span>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-sm text-gray-900">
                        {showUsd && toUsd(room.pricePerNight)
                          ? toUsd(room.pricePerNight)
                          : formatPrice(room.pricePerNight)}
                      </p>
                      <p className="text-[10px] text-gray-400">/ night</p>
                    </div>
                  </div>
                </div>
              ))}
              <p className="text-xs text-gray-400 text-center mt-2">
                Select dates above to check availability and book
              </p>
            </div>
          ) : null
        )}
      </div>

      {/* Quantity */}
      {selectedRoom && (
        <div className="border border-gray-200 rounded-xl p-3 mb-4">
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
            How many {selectedRoom.name} rooms?
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="w-8 h-8 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-40"
            >
              −
            </button>
            <span className="flex-1 text-center font-semibold text-gray-900">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(selectedRoom.available, q + 1))}
              disabled={quantity >= selectedRoom.available}
              className="w-8 h-8 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-40"
            >
              +
            </button>
          </div>
          {guests > selectedRoom.maxGuests * quantity && (
            <p className="text-xs text-amber-600 mt-2">
              Each {selectedRoom.name} fits {selectedRoom.maxGuests}. Book more rooms to fit {guests} guests.
            </p>
          )}
        </div>
      )}

      {/* Special requests */}
      {canReserve && (
        <div className="mb-3">
          <button
            type="button"
            onClick={() => setShowRequests(!showRequests)}
            className="text-xs text-gray-500 underline hover:text-black transition"
          >
            {showRequests ? "Hide special requests" : "Add a special request (optional)"}
          </button>
          {showRequests && (
            <textarea
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              placeholder="Any requests for the hotel (e.g. high floor, non-smoking)…"
              maxLength={500}
              rows={3}
              className="mt-2 w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-black resize-none"
            />
          )}
        </div>
      )}

      {/* Reserve button */}
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
            : !selectedRoom
            ? "Select a room type"
            : "Reserve & Pay"
          : "Log in to reserve"}
      </button>

      {/* Price breakdown */}
      {selectedRoom && nights > 0 && (
        <div className="mt-5 space-y-2 text-sm border-t border-gray-100 pt-5">
          <div className="flex justify-between text-gray-500 text-xs">
            <span>Room</span>
            <span className="font-medium text-gray-700">
              {quantity} × {selectedRoom.name}
            </span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>
              {showUsd && toUsd(selectedRoom.pricePerNight)
                ? toUsd(selectedRoom.pricePerNight)
                : formatPrice(selectedRoom.pricePerNight)}{" "}
              × {quantity} × {nights} {nights === 1 ? "night" : "nights"}
            </span>
            <span>
              {showUsd && toUsd(totalPrice) ? toUsd(totalPrice) : formatPrice(totalPrice)}
            </span>
          </div>
          <div className="flex justify-between font-semibold text-gray-900 border-t border-gray-100 pt-2">
            <span>Total</span>
            <div className="text-right">
              <span>
                {showUsd && toUsd(totalPrice) ? toUsd(totalPrice) : formatPrice(totalPrice)}
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
