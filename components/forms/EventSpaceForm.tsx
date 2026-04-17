"use client";

// components/forms/EventSpaceForm.tsx
// Inline form for creating or editing a single event space within an event center.

import { useState } from "react";
import ImageUpload from "./ImageUpload";

const PRICING_MODES = [
  { value: "hourly",  label: "Hourly" },
  { value: "daily",   label: "Daily" },
  { value: "package", label: "Package" },
  { value: "hybrid",  label: "Hybrid (hourly + daily)" },
];

export interface EventSpaceFormData {
  name: string;
  description: string;
  capacity: number;
  pricingMode: "hourly" | "daily" | "package" | "hybrid";
  hourlyRate: number;
  minHours: number;
  dailyRate: number;
  packageName: string;
  packageRate: number;
  packageHoursIncluded: number;
  packageDescription: string;
  setupMinutes: number;
  teardownMinutes: number;
  images: File[];
}

interface EventSpaceFormProps {
  initialData?: Partial<EventSpaceFormData>;
  onSubmit: (data: EventSpaceFormData) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  isLoading?: boolean;
  maxPhotos?: number;
}

export default function EventSpaceForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Save event space",
  isLoading = false,
  maxPhotos = 10,
}: EventSpaceFormProps) {
  const [form, setForm] = useState<EventSpaceFormData>({
    name: initialData?.name ?? "",
    description: initialData?.description ?? "",
    capacity: initialData?.capacity ?? 0,
    pricingMode: initialData?.pricingMode ?? "hourly",
    hourlyRate: initialData?.hourlyRate ?? 0,
    minHours: initialData?.minHours ?? 4,
    dailyRate: initialData?.dailyRate ?? 0,
    packageName: initialData?.packageName ?? "",
    packageRate: initialData?.packageRate ?? 0,
    packageHoursIncluded: initialData?.packageHoursIncluded ?? 0,
    packageDescription: initialData?.packageDescription ?? "",
    setupMinutes: initialData?.setupMinutes ?? 60,
    teardownMinutes: initialData?.teardownMinutes ?? 60,
    images: [],
  });

  const set = <K extends keyof EventSpaceFormData>(field: K, value: EventSpaceFormData[K]) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(form);
  };

  const showHourly = form.pricingMode === "hourly" || form.pricingMode === "hybrid";
  const showDaily  = form.pricingMode === "daily"  || form.pricingMode === "hybrid";
  const showPackage = form.pricingMode === "package";

  const fieldClass = "w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* -- Basic ----------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Space name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Main Hall, Garden Terrace"
            maxLength={100}
            required
            className={fieldClass}
          />
        </div>
        <div>
          <label className={labelClass}>Capacity (guests)</label>
          <input
            type="number"
            min={1}
            max={10000}
            value={form.capacity || ""}
            onChange={(e) => set("capacity", Number(e.target.value))}
            placeholder="e.g. 500"
            required
            className={fieldClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Description (optional)</label>
        <textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={3}
          placeholder="What makes this space special..."
          className={`${fieldClass} resize-none`}
        />
      </div>

      {/* -- Pricing mode ---------------------------------- */}
      <div>
        <label className={labelClass}>Pricing mode</label>
        <select
          value={form.pricingMode}
          onChange={(e) => set("pricingMode", e.target.value as EventSpaceFormData["pricingMode"])}
          className={fieldClass}
        >
          {PRICING_MODES.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>

      {/* -- Pricing fields (conditional) ------------------ */}
      {showHourly && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Hourly rate (\u20a6/hour)</label>
            <input
              type="number"
              min={1}
              value={form.hourlyRate || ""}
              onChange={(e) => set("hourlyRate", Number(e.target.value))}
              required
              className={fieldClass}
            />
          </div>
          <div>
            <label className={labelClass}>Minimum hours</label>
            <input
              type="number"
              min={1}
              max={24}
              value={form.minHours}
              onChange={(e) => set("minHours", Number(e.target.value))}
              className={fieldClass}
            />
            <p className="text-xs text-gray-400 mt-1">Minimum booking duration in hours.</p>
          </div>
        </div>
      )}

      {showDaily && (
        <div>
          <label className={labelClass}>Daily rate (\u20a6/day)</label>
          <input
            type="number"
            min={1}
            value={form.dailyRate || ""}
            onChange={(e) => set("dailyRate", Number(e.target.value))}
            required
            className={fieldClass}
          />
        </div>
      )}

      {showPackage && (
        <div className="space-y-4 p-4 border border-gray-100 rounded-xl bg-gray-50/50">
          <p className="text-sm font-medium text-gray-700">Package pricing</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Package name</label>
              <input
                type="text"
                value={form.packageName}
                onChange={(e) => set("packageName", e.target.value)}
                placeholder="e.g. Full-Day Wedding Package"
                required
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>Package rate (\u20a6)</label>
              <input
                type="number"
                min={1}
                value={form.packageRate || ""}
                onChange={(e) => set("packageRate", Number(e.target.value))}
                required
                className={fieldClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Hours included</label>
            <input
              type="number"
              min={1}
              max={48}
              value={form.packageHoursIncluded || ""}
              onChange={(e) => set("packageHoursIncluded", Number(e.target.value))}
              required
              className={fieldClass}
            />
          </div>
          <div>
            <label className={labelClass}>Package description (optional)</label>
            <textarea
              value={form.packageDescription}
              onChange={(e) => set("packageDescription", e.target.value)}
              rows={2}
              placeholder="What's included in this package..."
              className={`${fieldClass} resize-none`}
            />
          </div>
        </div>
      )}

      {/* -- Setup / teardown buffers ---------------------- */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">Setup & teardown buffers</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Setup time (minutes)</label>
            <input
              type="number"
              min={0}
              max={480}
              value={form.setupMinutes}
              onChange={(e) => set("setupMinutes", Number(e.target.value))}
              className={fieldClass}
            />
            <p className="text-xs text-gray-400 mt-1">Blocked before the event for preparation.</p>
          </div>
          <div>
            <label className={labelClass}>Teardown time (minutes)</label>
            <input
              type="number"
              min={0}
              max={480}
              value={form.teardownMinutes}
              onChange={(e) => set("teardownMinutes", Number(e.target.value))}
              className={fieldClass}
            />
            <p className="text-xs text-gray-400 mt-1">Blocked after the event for cleanup.</p>
          </div>
        </div>
      </div>

      {/* -- Photos ---------------------------------------- */}
      <div>
        <label className={labelClass}>Space photos</label>
        <ImageUpload
          onFilesChange={(files) => set("images", files)}
          maxFiles={maxPhotos}
        />
      </div>

      {/* -- Actions --------------------------------------- */}
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
          {isLoading ? "Saving\u2026" : submitLabel}
        </button>
      </div>
    </form>
  );
}
