"use client";

// components/forms/PropertyForm.tsx
import { useState } from "react";
import ImageUpload from "./ImageUpload";
import { FaPlus, FaTimes } from "react-icons/fa";

const PROPERTY_TYPES = [
  "Apartment",
  "Villa",
  "Beach House",
  "Penthouse",
  "Studio",
  "Cabin",
  "Entire Home",
  "Townhouse",
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
  amenities: string[];
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  images: File[];
}

interface PropertyFormProps {
  initialData?: Partial<PropertyFormData>;
  onSubmit: (data: PropertyFormData) => Promise<void>;
  submitLabel?: string;
  isLoading?: boolean;
}

export default function PropertyForm({
  initialData,
  onSubmit,
  submitLabel = "Save property",
  isLoading = false,
}: PropertyFormProps) {
  const [form, setForm] = useState<PropertyFormData>({
    title: initialData?.title ?? "",
    description: initialData?.description ?? "",
    propertyType: initialData?.propertyType ?? PROPERTY_TYPES[0],
    bedrooms: initialData?.bedrooms ?? 1,
    bathrooms: initialData?.bathrooms ?? 1,
    maxGuests: initialData?.maxGuests ?? 2,
    pricePerNight: initialData?.pricePerNight ?? 0,
    purposePricing: (initialData as any)?.purposePricing ?? null,
    amenities: initialData?.amenities ?? [],
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
            >
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
              { key: "pricePerNight", label: "Price / night ($)", min: 1 },
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
              <input
                type="text"
                value={form.location.city}
                onChange={(e) => setLocation("city", e.target.value)}
                placeholder="Lagos"
                required
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>State / Province</label>
              <input
                type="text"
                value={form.location.state}
                onChange={(e) => setLocation("state", e.target.value)}
                placeholder="Lagos State"
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
          Add at least one photo. The first image will be the cover.
        </p>
        <ImageUpload
          maxFiles={10}
          onFilesChange={(files) => set("images", files)}
        />
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
