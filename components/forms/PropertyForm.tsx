"use client";

// components/forms/PropertyForm.tsx
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

const PROPERTY_TYPES = [
  "Entire Home",
  "Apartment",
  "Duplex",
  "Penthouse",
  "Villa",
  "Studio",
  "Townhouse",
  "Bungalow",
  "Loft",
  "Serviced Apartment",
  "Guest House",
  "Beach House",
  "Cabin",
  "Chalet",
];

const PURPOSE_OPTIONS = [
  "Regular stay",
  "Birthday party",
  "Get-together / Social gathering",
  "Night / House party",
  "Baby shower",
  "Anniversary",
  "Photoshoot / Content creation",
  "Corporate event / Meeting",
  "Movie night",
  "Bachelor / Bachelorette party",
  "Wedding reception",
  "Graduation celebration",
];

const AMENITY_OPTIONS = [
  "WiFi",
  "Pool",
  "Gym",
  "Parking",
  "Kitchen",
  "AC",
  "Heating",
  "TV",
  "Washer",
  "Dryer",
  "Workspace",
  "Pets allowed",
  "Balcony",
  "BBQ",
  "Fireplace",
];

export interface PropertyFormData {
  title: string;
  description: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  pricePerNight: number;
  purposePricing: Record<string, number> | null;
  cautionFee: string;
  nearbyPlaces: string[];
  amenities: string[];
  checkInInstructions: string;
  cancellationPolicy: string;
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  images: File[];
}

const CANCELLATION_POLICY_OPTIONS = [
  {
    value: "flexible",
    label: "Flexible",
    summary: "Full refund up to 24 h before check-in.",
  },
  {
    value: "moderate",
    label: "Moderate",
    summary: "Full refund up to 5 days before check-in.",
  },
  {
    value: "firm",
    label: "Firm",
    summary: "Full refund 14+ days · 50% refund 7–14 days · No refund <7 days.",
  },
  {
    value: "strict",
    label: "Strict",
    summary: "Full refund 30+ days · 50% refund 14–30 days · No refund <14 days.",
  },
];

interface PropertyFormProps {
  initialData?: Partial<PropertyFormData>;
  onSubmit: (data: PropertyFormData) => Promise<void>;
  submitLabel?: string;
  isLoading?: boolean;
  maxPhotos?: number;
}

export default function PropertyForm({
  initialData,
  onSubmit,
  submitLabel = "Save property",
  isLoading = false,
  maxPhotos = 10,
}: PropertyFormProps) {
  const [form, setForm] = useState<PropertyFormData>({
    title: initialData?.title ?? "",
    description: initialData?.description ?? "",
    propertyType: initialData?.propertyType ?? "",
    bedrooms: initialData?.bedrooms ?? 1,
    bathrooms: initialData?.bathrooms ?? 1,
    maxGuests: initialData?.maxGuests ?? 2,
    pricePerNight: initialData?.pricePerNight ?? 0,
    purposePricing: (initialData as any)?.purposePricing ?? null,
    cautionFee: (initialData as any)?.cautionFee != null ? String((initialData as any).cautionFee) : "",
    nearbyPlaces: toStringArray((initialData as any)?.nearbyPlaces),
    amenities: toStringArray(initialData?.amenities),
    checkInInstructions: (initialData as any)?.checkInInstructions ?? "",
    cancellationPolicy: (initialData as any)?.cancellationPolicy ?? "flexible",
    location: {
      address: initialData?.location?.address ?? "",
      city: initialData?.location?.city ?? "",
      state: initialData?.location?.state ?? "",
      country: initialData?.location?.country ?? "",
      zipCode: initialData?.location?.zipCode ?? "",
    },
    images: [],
  });

  const [purposePricingEnabled, setPurposePricingEnabled] = useState(
    !!(initialData as any)?.purposePricing
  );
  const [newPurpose, setNewPurpose] = useState(PURPOSE_OPTIONS[0]);
  const [newPurposePrice, setNewPurposePrice] = useState("");
  const [newPlace, setNewPlace] = useState("");

  const set = (field: keyof PropertyFormData, value: unknown) =>
    setForm((f) => ({ ...f, [field]: value }));

  const setLocation = (field: keyof PropertyFormData["location"], value: string) =>
    setForm((f) => ({ ...f, location: { ...f.location, [field]: value } }));

  const addPurposePrice = () => {
    const price = parseFloat(newPurposePrice);
    if (!newPurpose || isNaN(price) || price <= 0) return;
    set("purposePricing", { ...(form.purposePricing ?? {}), [newPurpose]: price });
    setNewPurposePrice("");
  };

  const removePurposePrice = (purpose: string) => {
    if (!form.purposePricing) return;
    const updated = { ...form.purposePricing };
    delete updated[purpose];
    set("purposePricing", Object.keys(updated).length > 0 ? updated : null);
  };

  const toggleAmenity = (amenity: string) => {
    const has = form.amenities.includes(amenity);
    set("amenities", has ? form.amenities.filter((a) => a !== amenity) : [...form.amenities, amenity]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(form);
  };

  const fieldClass = "w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {/* ── Basic info ─────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold mb-5 pb-2 border-b border-gray-100">
          Basic information
        </h2>
        <div className="space-y-5">
          <div>
            <label className={labelClass}>Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Luxury penthouse with skyline views"
              maxLength={100}
              required
              className={fieldClass}
            />
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Describe your property in detail (min. 50 characters)…"
              rows={5}
              minLength={50}
              required
              className={`${fieldClass} resize-none`}
            />
          </div>

          <div>
            <label className={labelClass}>Property type</label>
            <select
              value={form.propertyType}
              onChange={(e) => set("propertyType", e.target.value)}
              className={fieldClass}
              required
            >
              <option value="" disabled>Select property type</option>
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* ── Capacity & pricing ─────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold mb-5 pb-2 border-b border-gray-100">
          Capacity &amp; pricing
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(
            [
              { key: "bedrooms", label: "Bedrooms", min: 0 },
              { key: "bathrooms", label: "Bathrooms", min: 0 },
              { key: "maxGuests", label: "Max guests", min: 1 },
              { key: "pricePerNight", label: "Price / night (₦)", min: 1 },
            ] as const
          ).map(({ key, label, min }) => (
            <div key={key}>
              <label className={labelClass}>{label}</label>
              <input
                type="number"
                value={form[key]}
                min={min}
                onChange={(e) => set(key, Number(e.target.value))}
                required
                className={fieldClass}
              />
            </div>
          ))}
        </div>

        <div className="mt-4">
          <label className={labelClass}>Caution fee (₦) — optional</label>
          <input
            type="number"
            value={form.cautionFee}
            min={0}
            placeholder="e.g. 50000"
            onChange={(e) => set("cautionFee", e.target.value)}
            className={fieldClass}
          />
          <p className="text-xs text-gray-400 mt-1">
            Refundable deposit collected by you on arrival. Displayed to guests before booking — not processed by Asavio.
          </p>
        </div>
      </section>

      {/* ── Location ───────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold mb-5 pb-2 border-b border-gray-100">
          Location
        </h2>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Street address</label>
            <input
              type="text"
              value={form.location.address}
              onChange={(e) => setLocation("address", e.target.value)}
              placeholder="123 Luxury Lane"
              required
              className={fieldClass}
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className={labelClass}>City</label>
              <select
                value={form.location.city}
                onChange={(e) => {
                  const city = e.target.value;
                  setLocation("city", city);
                  const def = getCityByName(city);
                  if (def && !form.location.state) setLocation("state", def.state);
                }}
                required
                className={fieldClass}
              >
                <option value="" disabled>Select city</option>
                {NIGERIAN_CITIES.map((c) => (
                  <option key={c.slug} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>State / Province</label>
              <input
                type="text"
                value={form.location.state}
                onChange={(e) => setLocation("state", e.target.value)}
                placeholder="e.g. Lagos"
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>Zip / Postal code</label>
              <input
                type="text"
                value={form.location.zipCode}
                onChange={(e) => setLocation("zipCode", e.target.value)}
                placeholder="100001"
                className={fieldClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Country</label>
            <input
              type="text"
              value={form.location.country}
              onChange={(e) => setLocation("country", e.target.value)}
              placeholder="Nigeria"
              required
              className={fieldClass}
            />
          </div>
        </div>
      </section>

      {/* ── Commission note ────────────────────────────── */}
      <div className="flex gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3.5 text-sm text-blue-800">
        <span className="text-blue-400 mt-0.5 text-base shrink-0">ℹ️</span>
        <p>
          Asavio charges a small platform commission on every booking. This covers advertising, marketing, and the operational costs that keep our service running — so you get more guests without lifting a finger.
        </p>
      </div>

      {/* ── Purpose-based pricing ──────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold mb-2 pb-2 border-b border-gray-100">
          Purpose-based pricing
        </h2>
        <p className="text-sm text-gray-400 mb-4">
          Optionally charge different rates depending on what guests are booking for (parties, events, etc.).
          Leave this off to use a single price for all bookings.
        </p>

        <label className="flex items-center gap-3 cursor-pointer mb-5">
          <div
            onClick={() => {
              const next = !purposePricingEnabled;
              setPurposePricingEnabled(next);
              if (!next) set("purposePricing", null);
            }}
            className={`w-11 h-6 rounded-full transition-colors relative ${
              purposePricingEnabled ? "bg-black" : "bg-gray-200"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                purposePricingEnabled ? "translate-x-5" : ""
              }`}
            />
          </div>
          <span className="text-sm font-medium text-gray-700">Enable purpose-based pricing</span>
        </label>

        {purposePricingEnabled && (
          <div className="space-y-4">
            {/* Existing purpose prices */}
            {form.purposePricing && Object.entries(form.purposePricing).length > 0 && (
              <div className="space-y-2">
                {Object.entries(form.purposePricing).map(([purpose, price]) => (
                  <div key={purpose} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                    <span className="text-sm text-gray-800 font-medium">{purpose}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-900">₦{Number(price).toLocaleString()}<span className="font-normal text-gray-400">/night</span></span>
                      <button
                        type="button"
                        onClick={() => removePurposePrice(purpose)}
                        className="w-6 h-6 rounded-full bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-100 transition"
                      >
                        <FaTimes className="text-xs" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add new purpose price */}
            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              <select
                value={newPurpose}
                onChange={(e) => setNewPurpose(e.target.value)}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white"
              >
                {PURPOSE_OPTIONS.filter((p) => !form.purposePricing || !(p in form.purposePricing)).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
                <option value="__custom">Custom purpose…</option>
              </select>
              <input
                type="number"
                min={1}
                value={newPurposePrice}
                onChange={(e) => setNewPurposePrice(e.target.value)}
                placeholder="Price/night (₦)"
                className="w-40 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
              <button
                type="button"
                onClick={addPurposePrice}
                disabled={!newPurposePrice || parseFloat(newPurposePrice) <= 0}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800 disabled:opacity-40 transition"
              >
                <FaPlus className="text-xs" /> Add
              </button>
            </div>

            <p className="text-xs text-gray-400">
              Purposes not listed here default to the base price of ₦{Number(form.pricePerNight).toLocaleString()}/night.
            </p>
          </div>
        )}
      </section>

      {/* ── Nearby places ─────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold mb-1 pb-2 border-b border-gray-100">
          Nearby places <span className="text-sm font-normal text-gray-400">(optional)</span>
        </h2>
        <p className="text-sm text-gray-400 mb-4">Help guests understand what&apos;s around. E.g. &ldquo;Lekki Phase 1 — 5 min&rdquo;</p>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newPlace}
            onChange={(e) => setNewPlace(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const trimmed = newPlace.trim();
                if (trimmed && !form.nearbyPlaces.includes(trimmed)) {
                  set("nearbyPlaces", [...form.nearbyPlaces, trimmed]);
                  setNewPlace("");
                }
              }
            }}
            placeholder="e.g. Victoria Island — 10 min drive"
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
          <button
            type="button"
            onClick={() => {
              const trimmed = newPlace.trim();
              if (trimmed && !form.nearbyPlaces.includes(trimmed)) {
                set("nearbyPlaces", [...form.nearbyPlaces, trimmed]);
                setNewPlace("");
              }
            }}
            disabled={!newPlace.trim()}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800 disabled:opacity-40 transition"
          >
            <FaPlus className="text-xs" /> Add
          </button>
        </div>
        {form.nearbyPlaces.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {form.nearbyPlaces.map((place) => (
              <span key={place} className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs px-3 py-1.5 rounded-full">
                {place}
                <button
                  type="button"
                  onClick={() => set("nearbyPlaces", form.nearbyPlaces.filter((p) => p !== place))}
                  className="hover:text-red-500 transition-colors"
                >
                  <FaTimes className="text-xs" />
                </button>
              </span>
            ))}
          </div>
        )}
      </section>

      {/* ── Amenities ──────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold mb-5 pb-2 border-b border-gray-100">
          Amenities
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {AMENITY_OPTIONS.map((a) => {
            const active = form.amenities.includes(a);
            return (
              <button
                key={a}
                type="button"
                onClick={() => toggleAmenity(a)}
                className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left ${
                  active
                    ? "border-black bg-black text-white"
                    : "border-gray-200 text-gray-600 hover:border-gray-400"
                }`}
              >
                {a}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Photos ─────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold mb-2 pb-2 border-b border-gray-100">
          Photos
        </h2>
        <p className="text-sm text-gray-400 mb-5">
          Add at least one photo. The first image will be the cover. Your plan allows up to <strong>{maxPhotos} photos</strong>.
        </p>
        <ImageUpload
          maxFiles={maxPhotos}
          onFilesChange={(files) => set("images", files)}
        />
        {maxPhotos < 20 && (
          <p className="text-xs text-gray-400 mt-3">
            Want to add more photos?{" "}
            <a
              href="/dashboard/host/subscription"
              target="_blank"
              rel="noopener noreferrer"
              className="text-black underline hover:text-gray-600 transition-colors"
            >
              Upgrade your plan ↗
            </a>{" "}
            to upload up to {maxPhotos === 10 ? "15 (Pro) or 20 (Elite)" : "20 (Elite)"} photos.
          </p>
        )}
      </section>

      {/* ── Check-in instructions ───────────────────────── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Check-in instructions</h2>
          <p className="text-sm text-gray-400 mt-0.5">Only shared with the guest 24 hours before check-in. Include door codes, parking details, WiFi password, or anything else they need on arrival.</p>
        </div>
        <textarea
          value={form.checkInInstructions}
          onChange={(e) => set("checkInInstructions", e.target.value)}
          placeholder="e.g. Apartment 4B, 2nd floor. Door code: 1234. Parking in bay 7. WiFi: AsavioGuest / password123."
          rows={5}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
        />
      </section>

      {/* ── Cancellation policy ────────────────────────── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Cancellation policy</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Determines how much guests receive back if they cancel. Shown on your listing and during checkout.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {CANCELLATION_POLICY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => set("cancellationPolicy", opt.value)}
              className={`text-left p-4 rounded-xl border-2 transition-colors ${
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
        <p className="text-xs text-gray-400">
          All policies include a free 24-hour cancellation window for bookings made 7+ days before check-in.
        </p>
      </section>

      {/* ── Submit ─────────────────────────────────────── */}
      <div className="flex justify-end pt-4 border-t border-gray-100">
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary px-10 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
