"use client";

// components/forms/HotelForm.tsx
// Mirrors PropertyForm / VehicleForm patterns — hotel-level info only.
// Room types are managed on a separate page after the hotel is created.

import { useState } from "react";
import ImageUpload from "./ImageUpload";
import { FaPlus, FaTimes, FaStar } from "react-icons/fa";
import { NIGERIAN_CITIES, getCityByName } from "@/lib/cities";

function toStringArray(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val as string[];
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

const HOTEL_TYPES = [
  "City Hotel",
  "Beach Resort",
  "Boutique Hotel",
  "Budget Hotel",
  "Business Hotel",
  "Luxury Hotel",
  "Guest House",
  "Hostel",
  "Serviced Apartment Hotel",
  "Lodge",
  "Spa & Wellness Resort",
];

const HOTEL_AMENITIES = [
  "WiFi",
  "Swimming Pool",
  "Gym",
  "Parking",
  "Restaurant",
  "Bar",
  "Room Service",
  "Front Desk 24/7",
  "Concierge",
  "Airport Shuttle",
  "Laundry",
  "Business Centre",
  "Spa",
  "Conference Rooms",
  "Pet Friendly",
  "Wheelchair Accessible",
  "Garden",
  "Terrace",
  "Elevator",
  "Safety Deposit Box",
];

const CANCELLATION_POLICY_OPTIONS = [
  { value: "flexible", label: "Flexible", summary: "Full refund up to 24 h before check-in." },
  { value: "moderate", label: "Moderate", summary: "Full refund up to 5 days before check-in." },
  { value: "firm",     label: "Firm",     summary: "Full refund 14+ days · 50% refund 7–14 days · No refund <7 days." },
  { value: "strict",   label: "Strict",   summary: "Full refund 30+ days · 50% refund 14–30 days · No refund <14 days." },
];

export interface HotelFormData {
  name: string;
  description: string;
  hotelType: string;
  starRating: number | "";
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  amenities: string[];
  nearbyPlaces: string[];
  checkInTime: string;
  checkOutTime: string;
  cancellationPolicy: string;
  checkInInstructions: string;
  images: File[];
}

interface HotelFormProps {
  initialData?: Partial<HotelFormData>;
  onSubmit: (data: HotelFormData) => Promise<void>;
  submitLabel?: string;
  isLoading?: boolean;
  maxPhotos?: number;
}

export default function HotelForm({
  initialData,
  onSubmit,
  submitLabel = "Save hotel",
  isLoading = false,
  maxPhotos = 20,
}: HotelFormProps) {
  const [form, setForm] = useState<HotelFormData>({
    name: initialData?.name ?? "",
    description: initialData?.description ?? "",
    hotelType: initialData?.hotelType ?? "",
    starRating: (initialData?.starRating as number | "" | undefined) ?? "",
    location: {
      address: initialData?.location?.address ?? "",
      city:    initialData?.location?.city ?? "",
      state:   initialData?.location?.state ?? "",
      country: initialData?.location?.country ?? "Nigeria",
      zipCode: initialData?.location?.zipCode ?? "",
    },
    amenities: toStringArray(initialData?.amenities),
    nearbyPlaces: toStringArray(initialData?.nearbyPlaces),
    checkInTime: initialData?.checkInTime ?? "14:00",
    checkOutTime: initialData?.checkOutTime ?? "11:00",
    cancellationPolicy: initialData?.cancellationPolicy ?? "flexible",
    checkInInstructions: initialData?.checkInInstructions ?? "",
    images: [],
  });

  const [newPlace, setNewPlace] = useState("");

  const set = <K extends keyof HotelFormData>(field: K, value: HotelFormData[K]) =>
    setForm((f) => ({ ...f, [field]: value }));

  const setLocation = (field: keyof HotelFormData["location"], value: string) =>
    setForm((f) => ({ ...f, location: { ...f.location, [field]: value } }));

  const toggleAmenity = (amenity: string) => {
    const has = form.amenities.includes(amenity);
    set("amenities", has ? form.amenities.filter((a) => a !== amenity) : [...form.amenities, amenity]);
  };

  const addPlace = () => {
    const v = newPlace.trim();
    if (!v) return;
    set("nearbyPlaces", [...form.nearbyPlaces, v]);
    setNewPlace("");
  };

  const removePlace = (i: number) => {
    set("nearbyPlaces", form.nearbyPlaces.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(form);
  };

  const fieldClass = "w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {/* ── Basic info ────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold mb-5 pb-2 border-b border-gray-100">
          Basic information
        </h2>
        <div className="space-y-5">
          <div>
            <label className={labelClass}>Hotel name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. The Lagos Grand"
              maxLength={200}
              required
              className={fieldClass}
            />
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Describe the hotel, its atmosphere, and what makes it special (min. 30 characters)…"
              rows={5}
              minLength={30}
              required
              className={`${fieldClass} resize-none`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Hotel type</label>
              <select
                value={form.hotelType}
                onChange={(e) => set("hotelType", e.target.value)}
                className={fieldClass}
                required
              >
                <option value="" disabled>Select hotel type</option>
                {HOTEL_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Star rating (optional)</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => set("starRating", form.starRating === n ? "" : n)}
                    className={`flex-1 py-3 border rounded-xl transition ${
                      typeof form.starRating === "number" && form.starRating >= n
                        ? "bg-amber-50 border-amber-300 text-amber-600"
                        : "border-gray-200 text-gray-300 hover:border-gray-400"
                    }`}
                    aria-label={`${n} star${n === 1 ? "" : "s"}`}
                  >
                    <FaStar className="mx-auto" />
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1.5">
                Admin will verify your star rating during listing review.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Location ───────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold mb-5 pb-2 border-b border-gray-100">Location</h2>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Street address</label>
            <input
              type="text"
              value={form.location.address}
              onChange={(e) => setLocation("address", e.target.value)}
              placeholder="e.g. 12 Adeola Odeku Street"
              required
              className={fieldClass}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>City</label>
              <select
                value={form.location.city}
                onChange={(e) => {
                  const city = e.target.value;
                  setLocation("city", city);
                  const def = getCityByName(city);
                  if (def) setLocation("state", def.state);
                }}
                className={fieldClass}
                required
              >
                <option value="" disabled>Select city</option>
                {NIGERIAN_CITIES.map((c) => (
                  <option key={c.slug} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>State</label>
              <input
                type="text"
                value={form.location.state}
                onChange={(e) => setLocation("state", e.target.value)}
                required
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>Country</label>
              <input
                type="text"
                value={form.location.country}
                onChange={(e) => setLocation("country", e.target.value)}
                required
                className={fieldClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Zip / postal code (optional)</label>
            <input
              type="text"
              value={form.location.zipCode}
              onChange={(e) => setLocation("zipCode", e.target.value)}
              className={fieldClass}
            />
          </div>
        </div>
      </section>

      {/* ── Amenities ─────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold mb-5 pb-2 border-b border-gray-100">Amenities</h2>
        <p className="text-xs text-gray-500 mb-3">Hotel-wide amenities (room amenities are set per room type).</p>
        <div className="flex flex-wrap gap-2">
          {HOTEL_AMENITIES.map((amenity) => {
            const active = form.amenities.includes(amenity);
            return (
              <button
                key={amenity}
                type="button"
                onClick={() => toggleAmenity(amenity)}
                className={`px-3.5 py-2 rounded-full border text-sm transition ${
                  active
                    ? "bg-black text-white border-black"
                    : "border-gray-200 text-gray-700 hover:border-gray-400"
                }`}
              >
                {amenity}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Nearby places ─────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold mb-5 pb-2 border-b border-gray-100">
          Nearby places (optional)
        </h2>
        <div className="space-y-2">
          {form.nearbyPlaces.map((place, i) => (
            <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2 text-sm">
              <span className="text-gray-700">{place}</span>
              <button type="button" onClick={() => removePlace(i)} className="text-gray-400 hover:text-red-500">
                <FaTimes />
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <input
              type="text"
              value={newPlace}
              onChange={(e) => setNewPlace(e.target.value)}
              placeholder="e.g. Lekki Mall — 5 min walk"
              className={fieldClass}
            />
            <button
              type="button"
              onClick={addPlace}
              className="px-4 py-3 border border-gray-200 rounded-xl hover:border-gray-400 transition text-gray-600"
            >
              <FaPlus />
            </button>
          </div>
        </div>
      </section>

      {/* ── Check-in / out ────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold mb-5 pb-2 border-b border-gray-100">Check-in & check-out</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Check-in time</label>
            <input
              type="time"
              value={form.checkInTime}
              onChange={(e) => set("checkInTime", e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label className={labelClass}>Check-out time</label>
            <input
              type="time"
              value={form.checkOutTime}
              onChange={(e) => set("checkOutTime", e.target.value)}
              className={fieldClass}
            />
          </div>
        </div>
        <div className="mt-5">
          <label className={labelClass}>Check-in instructions (optional)</label>
          <textarea
            value={form.checkInInstructions}
            onChange={(e) => set("checkInInstructions", e.target.value)}
            placeholder="Shared with the guest 24 h before check-in. e.g. Ask for Bola at the front desk."
            rows={3}
            className={`${fieldClass} resize-none`}
          />
        </div>
      </section>

      {/* ── Cancellation policy ───────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold mb-5 pb-2 border-b border-gray-100">
          Cancellation policy
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {CANCELLATION_POLICY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => set("cancellationPolicy", opt.value)}
              className={`text-left p-4 rounded-xl border transition ${
                form.cancellationPolicy === opt.value
                  ? "border-black bg-gray-50"
                  : "border-gray-200 hover:border-gray-400"
              }`}
            >
              <p className="font-semibold text-sm text-gray-900">{opt.label}</p>
              <p className="text-xs text-gray-500 mt-1">{opt.summary}</p>
            </button>
          ))}
        </div>
      </section>

      {/* ── Photos ────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold mb-5 pb-2 border-b border-gray-100">Hotel photos</h2>
        <p className="text-xs text-gray-500 mb-3">
          Lobby, exterior, common areas. Room-type photos are uploaded per room.
        </p>
        <ImageUpload
          onFilesChange={(files) => set("images", files)}
          maxFiles={maxPhotos}
        />
      </section>

      {/* ── Submit ────────────────────────────────────── */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 bg-black text-white font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {isLoading ? "Saving…" : submitLabel}
        </button>
        <p className="text-xs text-gray-400 text-center mt-3">
          After saving, you&apos;ll add room types (Deluxe King, Standard Twin, etc.) — each with its own price and inventory.
        </p>
      </div>
    </form>
  );
}
