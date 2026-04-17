"use client";

// components/forms/RoomTypeForm.tsx
// Inline form for creating or editing a single room type within a hotel.

import { useState } from "react";
import ImageUpload from "./ImageUpload";

const BED_TYPES = ["king", "queen", "double", "twin", "bunk", "sofa-bed"];

const ROOM_AMENITIES = [
  "AC",
  "TV",
  "WiFi",
  "Minibar",
  "Safe",
  "Balcony",
  "Coffee Maker",
  "Hair Dryer",
  "Iron",
  "Bathtub",
  "Shower",
  "Desk",
  "Wardrobe",
  "Kitchenette",
  "Ocean View",
  "City View",
  "Soundproof",
  "Blackout Curtains",
];

export interface RoomTypeFormData {
  name: string;
  description: string;
  pricePerNight: number;
  maxGuests: number;
  totalUnits: number;
  bedType: string;
  roomSize: string;
  roomAmenities: string[];
  cautionFee: string;
  images: File[];
}

interface RoomTypeFormProps {
  initialData?: Partial<RoomTypeFormData>;
  onSubmit: (data: RoomTypeFormData) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  isLoading?: boolean;
  maxPhotos?: number;
}

export default function RoomTypeForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Save room type",
  isLoading = false,
  maxPhotos = 10,
}: RoomTypeFormProps) {
  const [form, setForm] = useState<RoomTypeFormData>({
    name: initialData?.name ?? "",
    description: initialData?.description ?? "",
    pricePerNight: initialData?.pricePerNight ?? 0,
    maxGuests: initialData?.maxGuests ?? 2,
    totalUnits: initialData?.totalUnits ?? 1,
    bedType: initialData?.bedType ?? "",
    roomSize: initialData?.roomSize ?? "",
    roomAmenities: Array.isArray(initialData?.roomAmenities) ? (initialData!.roomAmenities as string[]) : [],
    cautionFee: initialData?.cautionFee ?? "",
    images: [],
  });

  const set = <K extends keyof RoomTypeFormData>(field: K, value: RoomTypeFormData[K]) =>
    setForm((f) => ({ ...f, [field]: value }));

  const toggleAmenity = (a: string) => {
    const has = form.roomAmenities.includes(a);
    set("roomAmenities", has ? form.roomAmenities.filter((x) => x !== a) : [...form.roomAmenities, a]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(form);
  };

  const fieldClass = "w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Room type name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Deluxe King, Standard Twin"
            maxLength={100}
            required
            className={fieldClass}
          />
        </div>
        <div>
          <label className={labelClass}>Bed type</label>
          <select
            value={form.bedType}
            onChange={(e) => set("bedType", e.target.value)}
            className={fieldClass}
          >
            <option value="">—</option>
            {BED_TYPES.map((b) => (
              <option key={b} value={b}>{b.charAt(0).toUpperCase() + b.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Description (optional)</label>
        <textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={3}
          placeholder="What makes this room type special…"
          className={`${fieldClass} resize-none`}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className={labelClass}>Price / night (₦)</label>
          <input
            type="number"
            min={1}
            value={form.pricePerNight || ""}
            onChange={(e) => set("pricePerNight", Number(e.target.value))}
            required
            className={fieldClass}
          />
        </div>
        <div>
          <label className={labelClass}>Max guests</label>
          <input
            type="number"
            min={1}
            max={20}
            value={form.maxGuests}
            onChange={(e) => set("maxGuests", Number(e.target.value))}
            required
            className={fieldClass}
          />
        </div>
        <div>
          <label className={labelClass}>Total units</label>
          <input
            type="number"
            min={1}
            max={500}
            value={form.totalUnits}
            onChange={(e) => set("totalUnits", Number(e.target.value))}
            required
            className={fieldClass}
          />
          <p className="text-xs text-gray-400 mt-1">How many rooms of this type you have.</p>
        </div>
        <div>
          <label className={labelClass}>Room size</label>
          <input
            type="text"
            value={form.roomSize}
            onChange={(e) => set("roomSize", e.target.value)}
            placeholder="e.g. 35 sqm"
            className={fieldClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Room amenities</label>
        <div className="flex flex-wrap gap-2">
          {ROOM_AMENITIES.map((a) => {
            const active = form.roomAmenities.includes(a);
            return (
              <button
                key={a}
                type="button"
                onClick={() => toggleAmenity(a)}
                className={`px-3.5 py-2 rounded-full border text-sm transition ${
                  active
                    ? "bg-black text-white border-black"
                    : "border-gray-200 text-gray-700 hover:border-gray-400"
                }`}
              >
                {a}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className={labelClass}>Caution fee (₦) — optional</label>
        <input
          type="number"
          min={0}
          value={form.cautionFee}
          onChange={(e) => set("cautionFee", e.target.value)}
          placeholder="e.g. 20000"
          className={fieldClass}
        />
        <p className="text-xs text-gray-400 mt-1">
          Refundable deposit collected on arrival. Displayed to guests — not processed by Asavio.
        </p>
      </div>

      <div>
        <label className={labelClass}>Room photos</label>
        <ImageUpload
          onFilesChange={(files) => set("images", files)}
          maxFiles={maxPhotos}
        />
      </div>

      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-700 font-medium hover:border-gray-400 transition"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 py-3 bg-black text-white font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-50 transition"
        >
          {isLoading ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
