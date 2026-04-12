"use client";

// app/dashboard/host/vehicles/new/page.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft, FaUpload, FaTimes } from "react-icons/fa";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

const VEHICLE_TYPES = ["sedan", "suv", "sports", "luxury", "van", "pickup", "convertible", "electric"];

const COMMON_FEATURES = [
  "GPS", "Bluetooth", "Heated Seats", "Backup Camera", "Sunroof",
  "Apple CarPlay", "Android Auto", "Cruise Control", "Leather Seats",
  "Wireless Charging", "WiFi", "USB Charging",
];

export default function NewVehiclePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [form, setForm] = useState({
    make: "",
    model: "",
    year: new Date().getFullYear(),
    vehicleType: "",
    pricePerDay: "",
    priceWithDriverPerDay: "",
    description: "",
    seats: 5,
    driverAvailable: false,
    location: "",
    checkInInstructions: "",
    cautionFee: "",
    cancellationPolicy: "flexible",
    travelZone: "Lagos",
    allowInterstate: false,
    interstateSurchargePerDay: "",
  });
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthenticated || (user?.role !== "host" && user?.role !== "admin")) {
    return null;
  }

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const toggleFeature = (f: string) =>
    setSelectedFeatures((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (images.length + files.length > 8) {
      toast.error("Maximum 8 images");
      return;
    }
    setImages((prev) => [...prev, ...files]);
    setPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
  };

  const removeImage = (i: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.make || !form.model || !form.pricePerDay || !form.description) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (form.driverAvailable && !form.priceWithDriverPerDay) {
      toast.error("Please enter the price per day with driver");
      return;
    }

    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("make", form.make);
      fd.append("model", form.model);
      fd.append("year", String(form.year));
      fd.append("vehicleType", form.vehicleType);
      fd.append("pricePerDay", form.pricePerDay);
      fd.append("description", form.description);
      fd.append("seats", String(form.seats));
      fd.append("location", form.location);
      fd.append("withDriver", String(form.driverAvailable));
      if (form.driverAvailable && form.priceWithDriverPerDay) {
        fd.append("priceWithDriverPerDay", form.priceWithDriverPerDay);
      }
      if (form.checkInInstructions.trim()) fd.append("checkInInstructions", form.checkInInstructions.trim());
      if (form.cautionFee && Number(form.cautionFee) > 0) fd.append("cautionFee", form.cautionFee);
      fd.append("cancellationPolicy", form.cancellationPolicy ?? "flexible");
      fd.append("travelZone", form.travelZone || "Lagos");
      fd.append("allowInterstate", String(form.allowInterstate));
      if (form.allowInterstate && form.interstateSurchargePerDay && Number(form.interstateSurchargePerDay) > 0) {
        fd.append("interstateSurchargePerDay", form.interstateSurchargePerDay);
      }
      selectedFeatures.forEach((f) => fd.append("features[]", f));
      images.forEach((img) => fd.append("images", img));

      await api.post("/vehicles", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Vehicle listed!");
      router.push(user?.role === "admin" ? "/dashboard/admin/vehicles" : "/dashboard/host");
    } catch {
      // interceptor handles error toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8 max-w-2xl">
        <Link
          href={user?.role === "admin" ? "/dashboard/admin/vehicles" : "/dashboard/host"}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black mb-6 transition-colors"
        >
          <FaArrowLeft /> Back
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">List a vehicle</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Make + Model */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <h2 className="font-semibold text-gray-900">Vehicle details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Make *</label>
                <input
                  value={form.make}
                  onChange={(e) => set("make", e.target.value)}
                  placeholder="e.g. Toyota"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Model *</label>
                <input
                  value={form.model}
                  onChange={(e) => set("model", e.target.value)}
                  placeholder="e.g. Camry"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <input
                  type="number"
                  value={form.year}
                  onChange={(e) => set("year", e.target.value)}
                  min={1990}
                  max={new Date().getFullYear() + 1}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Seats</label>
                <input
                  type="number"
                  value={form.seats}
                  onChange={(e) => set("seats", e.target.value)}
                  min={1} max={20}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>

            {/* Commission note */}
            <div className="flex gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3.5 text-sm text-blue-800">
              <span className="text-blue-400 mt-0.5 text-base shrink-0">ℹ️</span>
              <p>
                Asavio charges a small platform commission on every booking. This covers advertising, marketing, and the operational costs that keep our service running — so you get more guests without lifting a finger.
              </p>
            </div>

            {/* Pricing tiers */}
            <div className="border border-gray-100 rounded-xl p-4 space-y-4 bg-gray-50">
              <p className="text-sm font-medium text-gray-700">Pricing</p>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Self-drive price / day (₦) *</label>
                <input
                  type="number"
                  value={form.pricePerDay}
                  onChange={(e) => set("pricePerDay", e.target.value)}
                  placeholder="0"
                  min={1}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    checked={form.driverAvailable}
                    onChange={(e) => {
                      set("driverAvailable", e.target.checked);
                      if (!e.target.checked) set("priceWithDriverPerDay", "");
                    }}
                    className="w-4 h-4 accent-black"
                  />
                  <span className="text-sm text-gray-700 font-medium">Also offer with-driver option</span>
                </label>

                {form.driverAvailable && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">With-driver price / day (₦) *</label>
                    <input
                      type="number"
                      value={form.priceWithDriverPerDay}
                      onChange={(e) => set("priceWithDriverPerDay", e.target.value)}
                      placeholder="0"
                      min={1}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white"
                    />
                    <p className="text-xs text-gray-400 mt-1">Guests will see both options and can choose at checkout.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle type</label>
                <select
                  value={form.vehicleType}
                  onChange={(e) => set("vehicleType", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white capitalize"
                  required
                >
                  <option value="" disabled>Select vehicle type</option>
                  {VEHICLE_TYPES.map((t) => (
                    <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  value={form.location}
                  onChange={(e) => set("location", e.target.value)}
                  placeholder="e.g. Victoria Island, Lagos"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>

          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Description *</h2>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Describe the vehicle — condition, experience, unique features…"
              rows={4}
              maxLength={1000}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{form.description.length}/1000</p>
          </div>

          {/* Features */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Features</h2>
            <div className="flex flex-wrap gap-2">
              {COMMON_FEATURES.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => toggleFeature(f)}
                  className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                    selectedFeatures.includes(f)
                      ? "bg-black text-white border-black"
                      : "border-gray-200 text-gray-700 hover:border-gray-400"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Images */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Photos</h2>
            <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl py-6 cursor-pointer hover:border-gray-400 transition-colors text-gray-500 text-sm">
              <FaUpload className="text-gray-400" />
              Click to upload photos (max 8)
              <input type="file" multiple accept="image/*" className="hidden" onChange={handleImages} />
            </label>
            {previews.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-3">
                {previews.map((src, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center"
                    >
                      <FaTimes className="text-white text-xs" />
                    </button>
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 bg-black text-white text-xs px-1.5 py-0.5 rounded-full">
                        Cover
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Caution fee */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-1">Caution fee (optional)</h2>
            <p className="text-xs text-gray-400 mb-3">Refundable deposit collected by you on pickup. Displayed to guests before booking — not processed by Asavio.</p>
            <input
              type="number"
              value={form.cautionFee}
              min={0}
              placeholder="e.g. 50000"
              onChange={(e) => set("cautionFee", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {/* Check-in / pickup instructions */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-1">Pickup instructions</h2>
            <p className="text-xs text-gray-400 mb-3">Only shared with the guest 24 hours before pickup. Include location details, access codes, and anything they need to know.</p>
            <textarea
              value={form.checkInInstructions}
              onChange={(e) => set("checkInInstructions", e.target.value)}
              placeholder="e.g. Meet at 14 Admiralty Way, Lekki. Call on arrival. Keys under the front-left wheel arch."
              rows={4}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
            />
          </div>

          {/* Travel zone */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <div>
              <h2 className="font-semibold text-gray-900">Travel zone</h2>
              <p className="text-xs text-gray-400 mt-0.5">Define where guests may take this vehicle. Guests see this before booking.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Base zone <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.travelZone}
                onChange={(e) => set("travelZone", e.target.value)}
                placeholder="e.g. Lagos, Abuja, Port Harcourt"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
              <p className="text-xs text-gray-400 mt-1">Guests booking within this zone pay your base daily rate.</p>
            </div>
            <div className="flex items-center justify-between py-3 border border-gray-200 rounded-xl px-4">
              <div>
                <p className="text-sm font-medium text-gray-800">Allow interstate travel</p>
                <p className="text-xs text-gray-400 mt-0.5">Guests can declare they're traveling outside the base zone</p>
              </div>
              <button
                type="button"
                onClick={() => set("allowInterstate", !form.allowInterstate)}
                className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${form.allowInterstate ? "bg-black" : "bg-gray-200"}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${form.allowInterstate ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
            {form.allowInterstate && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Interstate surcharge per day (optional)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">₦</span>
                  <input
                    type="number"
                    value={form.interstateSurchargePerDay}
                    onChange={(e) => set("interstateSurchargePerDay", e.target.value)}
                    placeholder="e.g. 15000"
                    min={0}
                    className="w-full border border-gray-200 rounded-xl pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Added on top of the base daily rate when a guest selects interstate travel.</p>
              </div>
            )}
          </div>

          {/* Cancellation policy */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-1">Cancellation policy</h2>
            <p className="text-xs text-gray-400 mb-3">Shown to guests on your listing and during checkout. All policies include a free 24-hour cancellation window for bookings made 7+ days in advance.</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { value: "flexible",  label: "Flexible",  summary: "Full refund up to 24 h before pickup." },
                { value: "moderate",  label: "Moderate",  summary: "Full refund up to 5 days before pickup." },
                { value: "firm",      label: "Firm",      summary: "Full refund 14+ days · 50% refund 7–14 days · No refund <7 days." },
                { value: "strict",    label: "Strict",    summary: "Full refund 30+ days · 50% refund 14–30 days · No refund <14 days." },
              ].map((opt) => (
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
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-black text-white font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? "Publishing…" : "Publish vehicle"}
          </button>
        </form>
      </div>
    </div>
  );
}
