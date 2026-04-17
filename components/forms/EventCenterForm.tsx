"use client";

// components/forms/EventCenterForm.tsx
// Form for creating or editing an event center listing.

import { useState } from "react";
import ImageUpload from "./ImageUpload";
import { FaPlus, FaTimes } from "react-icons/fa";
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

const EVENT_CENTER_AMENITIES = [
  "AV System",
  "Stage",
  "Parking",
  "Catering Kitchen",
  "AC",
  "Generators",
  "Dance Floor",
  "DJ Booth",
  "Projector",
  "WiFi",
  "Sound System",
  "Lighting",
  "Tables & Chairs",
  "Outdoor Area",
  "Green Room",
  "Security",
];

const COMMON_EVENT_TYPES = [
  "Wedding",
  "Corporate",
  "Birthday",
  "Graduation",
  "Baby shower",
  "Funeral",
  "Photoshoot",
  "Conference",
  "Exhibition",
  "Concert",
  "Religious",
  "Political",
  "Nightclub",
];

const CANCELLATION_POLICY_OPTIONS = [
  { value: "flexible", label: "Flexible", summary: "Full refund up to 24 h before the event." },
  { value: "moderate", label: "Moderate", summary: "Full refund up to 5 days before the event." },
  { value: "firm",     label: "Firm",     summary: "Full refund 14+ days \u00b7 50% refund 7\u201314 days \u00b7 No refund <7 days." },
  { value: "strict",   label: "Strict",   summary: "Full refund 30+ days \u00b7 50% refund 14\u201330 days \u00b7 No refund <14 days." },
];

export interface EventCenterFormData {
  name: string;
  description: string;
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  amenities: string[];
  allowedEventTypes: string[];
  blockedEventTypes: string[];
  cancellationPolicy: string;
  images: File[];
}

interface EventCenterFormProps {
  initialData?: Partial<EventCenterFormData>;
  onSubmit: (data: EventCenterFormData) => Promise<void>;
  submitLabel?: string;
  isLoading?: boolean;
  maxPhotos?: number;
}

export default function EventCenterForm({
  initialData,
  onSubmit,
  submitLabel = "Save event center",
  isLoading = false,
  maxPhotos = 20,
}: EventCenterFormProps) {
  const [form, setForm] = useState<EventCenterFormData>({
    name: initialData?.name ?? "",
    description: initialData?.description ?? "",
    location: {
      address: initialData?.location?.address ?? "",
      city:    initialData?.location?.city ?? "",
      state:   initialData?.location?.state ?? "",
      country: initialData?.location?.country ?? "Nigeria",
      zipCode: initialData?.location?.zipCode ?? "",
    },
    amenities: toStringArray(initialData?.amenities),
    allowedEventTypes: toStringArray(initialData?.allowedEventTypes),
    blockedEventTypes: toStringArray(initialData?.blockedEventTypes),
    cancellationPolicy: initialData?.cancellationPolicy ?? "flexible",
    images: [],
  });

  const [newAllowedType, setNewAllowedType] = useState("");
  const [newBlockedType, setNewBlockedType] = useState("");

  const set = <K extends keyof EventCenterFormData>(field: K, value: EventCenterFormData[K]) =>
    setForm((f) => ({ ...f, [field]: value }));

  const setLocation = (field: keyof EventCenterFormData["location"], value: string) =>
    setForm((f) => ({ ...f, location: { ...f.location, [field]: value } }));

  const toggleAmenity = (amenity: string) => {
    const has = form.amenities.includes(amenity);
    set("amenities", has ? form.amenities.filter((a) => a !== amenity) : [...form.amenities, amenity]);
  };

  const addAllowedType = (value?: string) => {
    const v = (value ?? newAllowedType).trim();
    if (!v || form.allowedEventTypes.includes(v)) return;
    set("allowedEventTypes", [...form.allowedEventTypes, v]);
    setNewAllowedType("");
  };

  const removeAllowedType = (i: number) => {
    set("allowedEventTypes", form.allowedEventTypes.filter((_, idx) => idx !== i));
  };

  const addBlockedType = (value?: string) => {
    const v = (value ?? newBlockedType).trim();
    if (!v || form.blockedEventTypes.includes(v)) return;
    set("blockedEventTypes", [...form.blockedEventTypes, v]);
    setNewBlockedType("");
  };

  const removeBlockedType = (i: number) => {
    set("blockedEventTypes", form.blockedEventTypes.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(form);
  };

  const fieldClass = "w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {/* -- Basic info ------------------------------------ */}
      <section>
        <h2 className="text-lg font-semibold mb-5 pb-2 border-b border-gray-100">
          Basic information
        </h2>
        <div className="space-y-5">
          <div>
            <label className={labelClass}>Event center name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. The Grand Pavilion"
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
              placeholder="Describe the event center, its atmosphere, and what makes it special (min. 30 characters)..."
              rows={5}
              minLength={30}
              required
              className={`${fieldClass} resize-none`}
            />
          </div>
        </div>
      </section>

      {/* -- Location -------------------------------------- */}
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

      {/* -- Amenities ------------------------------------- */}
      <section>
        <h2 className="text-lg font-semibold mb-5 pb-2 border-b border-gray-100">Amenities</h2>
        <p className="text-xs text-gray-500 mb-3">Venue-wide amenities and facilities.</p>
        <div className="flex flex-wrap gap-2">
          {EVENT_CENTER_AMENITIES.map((amenity) => {
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

      {/* -- Event type restrictions ------------------------ */}
      <section>
        <h2 className="text-lg font-semibold mb-5 pb-2 border-b border-gray-100">
          Event type restrictions
        </h2>

        {/* Allowed event types */}
        <div className="mb-6">
          <label className={labelClass}>Allowed event types (optional)</label>
          <p className="text-xs text-gray-500 mb-3">
            Leave empty to allow all event types. Adding types restricts bookings to only these.
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {form.allowedEventTypes.map((t, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 bg-green-50 text-green-800 border border-green-200 rounded-full px-3 py-1.5 text-sm"
              >
                {t}
                <button type="button" onClick={() => removeAllowedType(i)} className="text-green-400 hover:text-red-500">
                  <FaTimes className="text-xs" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={newAllowedType}
                onChange={(e) => setNewAllowedType(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAllowedType(); } }}
                placeholder="Type or pick from common types below"
                className={fieldClass}
              />
            </div>
            <button
              type="button"
              onClick={() => addAllowedType()}
              className="px-4 py-3 border border-gray-200 rounded-xl hover:border-gray-400 transition text-gray-600"
            >
              <FaPlus />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {COMMON_EVENT_TYPES.filter((t) => !form.allowedEventTypes.includes(t)).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => addAllowedType(t)}
                className="px-2.5 py-1 rounded-full border border-dashed border-gray-300 text-xs text-gray-500 hover:border-gray-400 hover:text-gray-700 transition"
              >
                + {t}
              </button>
            ))}
          </div>
        </div>

        {/* Blocked event types */}
        <div>
          <label className={labelClass}>Blocked event types (optional)</label>
          <p className="text-xs text-gray-500 mb-3">
            Explicitly block certain event types from booking this venue.
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {form.blockedEventTypes.map((t, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 bg-red-50 text-red-800 border border-red-200 rounded-full px-3 py-1.5 text-sm"
              >
                {t}
                <button type="button" onClick={() => removeBlockedType(i)} className="text-red-400 hover:text-red-600">
                  <FaTimes className="text-xs" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={newBlockedType}
                onChange={(e) => setNewBlockedType(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addBlockedType(); } }}
                placeholder="Type or pick from common types below"
                className={fieldClass}
              />
            </div>
            <button
              type="button"
              onClick={() => addBlockedType()}
              className="px-4 py-3 border border-gray-200 rounded-xl hover:border-gray-400 transition text-gray-600"
            >
              <FaPlus />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {COMMON_EVENT_TYPES.filter((t) => !form.blockedEventTypes.includes(t)).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => addBlockedType(t)}
                className="px-2.5 py-1 rounded-full border border-dashed border-gray-300 text-xs text-gray-500 hover:border-gray-400 hover:text-gray-700 transition"
              >
                + {t}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* -- Cancellation policy ---------------------------- */}
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

      {/* -- Photos ---------------------------------------- */}
      <section>
        <h2 className="text-lg font-semibold mb-5 pb-2 border-b border-gray-100">Event center photos</h2>
        <p className="text-xs text-gray-500 mb-3">
          Exterior, lobby, common areas. Individual space photos are uploaded per event space.
        </p>
        <ImageUpload
          onFilesChange={(files) => set("images", files)}
          maxFiles={maxPhotos}
        />
      </section>

      {/* -- Submit ---------------------------------------- */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 bg-black text-white font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {isLoading ? "Saving\u2026" : submitLabel}
        </button>
        <p className="text-xs text-gray-400 text-center mt-3">
          After saving, you&apos;ll add event spaces (Main Hall, Garden Terrace, etc.) &mdash; each with its own pricing and capacity.
        </p>
      </div>
    </form>
  );
}
