"use client";

// app/dashboard/host/vehicles/[id]/edit/page.tsx
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { FaArrowLeft, FaUpload, FaTimes, FaVideo, FaTrash } from "react-icons/fa";
import { useAuth } from "@/hooks/useAuth";
import TierGate from "@/components/ui/TierGate";
import { api } from "@/lib/api";
import { Vehicle, SubscriptionTier } from "@/types";
import toast from "react-hot-toast";

const PHOTO_LIMITS: Record<SubscriptionTier, number> = {
  starter: 10,
  pro: 15,
  elite: 20,
};

const VEHICLE_TYPES = ["sedan", "suv", "sports", "luxury", "van", "pickup", "convertible", "electric"];

const COMMON_FEATURES = [
  "GPS", "Bluetooth", "Heated Seats", "Backup Camera", "Sunroof",
  "Apple CarPlay", "Android Auto", "Cruise Control", "Leather Seats",
  "Wireless Charging", "WiFi", "USB Charging",
];

export default function EditVehiclePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>("starter");
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoDeleting, setVideoDeleting] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    make: "",
    model: "",
    year: new Date().getFullYear(),
    vehicleType: "sedan",
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

  // Image management
  const [markedForRemoval, setMarkedForRemoval] = useState<string[]>([]); // publicIds
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);

  useEffect(() => {
    api
      .get(`/vehicles/${id}`)
      .then((res) => {
        const v: Vehicle = res.data.data.vehicle;
        setVehicle(v);
        setForm({
          make: v.make,
          model: v.model,
          year: v.year,
          vehicleType: v.vehicleType,
          pricePerDay: String(v.pricePerDay),
          priceWithDriverPerDay: v.priceWithDriverPerDay ? String(v.priceWithDriverPerDay) : "",
          description: v.description,
          seats: v.seats,
          driverAvailable: v.withDriver ?? false,
          location: v.location ?? "",
          checkInInstructions: (v as any).checkInInstructions ?? "",
          cautionFee: v.cautionFee != null ? String(v.cautionFee) : "",
          cancellationPolicy: v.cancellationPolicy ?? "flexible",
          travelZone: v.travelZone ?? "Lagos",
          allowInterstate: v.allowInterstate ?? false,
          interstateSurchargePerDay: v.interstateSurchargePerDay != null ? String(v.interstateSurchargePerDay) : "",
        });
        setSelectedFeatures(v.features ?? []);
      })
      .catch(() => router.push("/dashboard/host"))
      .finally(() => setIsFetching(false));

    api
      .get("/subscriptions/me")
      .then((res) => setSubscriptionTier(res.data.data.currentTier ?? "starter"))
      .catch(() => {});
  }, [id, router]);

  if (!isAuthenticated || (user?.role !== "host" && user?.role !== "admin")) return null;

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const toggleFeature = (f: string) =>
    setSelectedFeatures((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );

  const toggleRemoval = (publicId: string) => {
    setMarkedForRemoval((prev) =>
      prev.includes(publicId) ? prev.filter((x) => x !== publicId) : [...prev, publicId]
    );
  };

  const photoMax = PHOTO_LIMITS[subscriptionTier];

  const handleNewImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const existingCount = (vehicle?.images?.length ?? 0) - markedForRemoval.length + newFiles.length;
    if (existingCount + files.length > photoMax) {
      toast.error(`Maximum ${photoMax} images on your ${subscriptionTier} plan`);
      return;
    }
    setNewFiles((prev) => [...prev, ...files]);
    setNewPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
    e.target.value = "";
  };

  const removeNewFile = (i: number) => {
    setNewFiles((prev) => prev.filter((_, idx) => idx !== i));
    setNewPreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setVideoUploading(true);
    try {
      const fd = new FormData();
      fd.append("video", file);
      const res = await api.post(`/vehicles/${id}/feature-video`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setVehicle((prev) => prev ? { ...prev, featureVideoUrl: res.data.data.featureVideoUrl } : prev);
      toast.success("Feature video uploaded");
    } catch {
      // interceptor handles error toast
    } finally {
      setVideoUploading(false);
    }
  };

  const handleVideoDelete = async () => {
    if (!confirm("Remove the feature video?")) return;
    setVideoDeleting(true);
    try {
      await api.delete(`/vehicles/${id}/feature-video`);
      setVehicle((prev) => prev ? { ...prev, featureVideoUrl: null } : prev);
      toast.success("Feature video removed");
    } catch {
      // interceptor handles error toast
    } finally {
      setVideoDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.make || !form.model || !form.pricePerDay || !form.description) {
      toast.error("Please fill in all required fields");
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
      fd.append("checkInInstructions", form.checkInInstructions.trim());
      if (form.cautionFee && Number(form.cautionFee) > 0) fd.append("cautionFee", form.cautionFee);
      else fd.append("cautionFee", "");
      fd.append("cancellationPolicy", form.cancellationPolicy ?? "flexible");
      fd.append("travelZone", form.travelZone || "Lagos");
      fd.append("allowInterstate", String(form.allowInterstate));
      if (form.allowInterstate && form.interstateSurchargePerDay) {
        fd.append("interstateSurchargePerDay", form.interstateSurchargePerDay);
      } else {
        fd.append("interstateSurchargePerDay", "");
      }
      selectedFeatures.forEach((f) => fd.append("features[]", f));
      markedForRemoval.forEach((pid) => fd.append("removeImagePublicIds", pid));
      newFiles.forEach((file) => fd.append("images", file));

      await api.patch(`/vehicles/${id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Vehicle updated!");
      router.push(user?.role === "admin" ? "/dashboard/admin/vehicles" : "/dashboard/host");
    } catch {
      // interceptor handles error toast
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loader" />
      </div>
    );
  }

  if (!vehicle) return null;

  const existingImages = vehicle.images ?? [];
  const remainingCount = existingImages.length - markedForRemoval.length + newFiles.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8 max-w-2xl">
        <Link
          href={user?.role === "admin" ? "/dashboard/admin/vehicles" : "/dashboard/host"}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black mb-6 transition-colors"
        >
          <FaArrowLeft /> Back
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit vehicle</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Vehicle details */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <h2 className="font-semibold text-gray-900">Vehicle details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Make *</label>
                <input
                  value={form.make}
                  onChange={(e) => set("make", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Model *</label>
                <input
                  value={form.model}
                  onChange={(e) => set("model", e.target.value)}
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

            {/* Pricing */}
            <div className="border border-gray-100 rounded-xl p-4 space-y-4 bg-gray-50">
              <p className="text-sm font-medium text-gray-700">Pricing</p>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Self-drive price / day (₦) *</label>
                <input
                  type="number"
                  value={form.pricePerDay}
                  onChange={(e) => set("pricePerDay", e.target.value)}
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
                  <span className="text-sm text-gray-700 font-medium">Offer with-driver option</span>
                </label>

                {form.driverAvailable && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">With-driver price / day (₦) *</label>
                    <input
                      type="number"
                      value={form.priceWithDriverPerDay}
                      onChange={(e) => set("priceWithDriverPerDay", e.target.value)}
                      min={1}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white"
                    />
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
                >
                  {VEHICLE_TYPES.map((t) => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
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

          {/* Photos */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">Photos</h2>
              <span className="text-xs text-gray-400">{remainingCount} / {photoMax}</span>
            </div>

            {existingImages.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">Current photos — click × to remove</p>
                <div className="grid grid-cols-4 gap-2">
                  {existingImages.map((img, i) => {
                    const removing = markedForRemoval.includes(img.publicId);
                    return (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                        <Image
                          src={img.url}
                          alt=""
                          fill
                          className={`object-cover transition-opacity ${removing ? "opacity-30" : ""}`}
                        />
                        {i === 0 && !removing && (
                          <span className="absolute bottom-1 left-1 bg-black text-white text-xs px-1.5 py-0.5 rounded-full">
                            Cover
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => toggleRemoval(img.publicId)}
                          className={`absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center ${
                            removing ? "bg-red-500" : "bg-black/60"
                          }`}
                        >
                          <FaTimes className="text-white text-xs" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {newPreviews.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">New photos to upload</p>
                <div className="grid grid-cols-4 gap-2">
                  {newPreviews.map((src, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeNewFile(i)}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center"
                      >
                        <FaTimes className="text-white text-xs" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {remainingCount < photoMax && (
              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl py-5 cursor-pointer hover:border-gray-400 transition-colors text-gray-500 text-sm">
                <FaUpload className="text-gray-400" />
                Add photos
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleNewImages} />
              </label>
            )}

            {markedForRemoval.length > 0 && (
              <p className="text-xs text-amber-600 mt-3">
                {markedForRemoval.length} photo{markedForRemoval.length > 1 ? "s" : ""} will be removed on save.
              </p>
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

          {/* Pickup instructions */}
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
              <p className="text-xs text-gray-400 mt-0.5">Define where guests may take this vehicle. Guests booking outside the base zone pay an additional surcharge.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Base zone *</label>
              <input
                type="text"
                value={form.travelZone}
                onChange={(e) => set("travelZone", e.target.value)}
                placeholder="e.g. Lagos, Abuja, Port Harcourt"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-800">Allow interstate travel</p>
                <p className="text-xs text-gray-400">Guests can take this vehicle to other states</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  set("allowInterstate", !form.allowInterstate);
                  if (form.allowInterstate) set("interstateSurchargePerDay", "");
                }}
                className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${
                  form.allowInterstate ? "bg-black" : "bg-gray-200"
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                    form.allowInterstate ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            {form.allowInterstate && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interstate surcharge / day (₦) <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="number"
                  value={form.interstateSurchargePerDay}
                  onChange={(e) => set("interstateSurchargePerDay", e.target.value)}
                  min={0}
                  placeholder="e.g. 10000"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
                <p className="text-xs text-gray-400 mt-1">Added on top of the base daily rate for interstate trips.</p>
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
            {isSubmitting ? "Saving…" : "Save changes"}
          </button>
        </form>

        {/* Feature video */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mt-5">
          <h2 className="font-semibold text-gray-900 mb-1">Feature video</h2>
          <p className="text-xs text-gray-400 mb-4">A short highlight reel shown on your vehicle listing. Pro: up to 60s / 50MB · Elite: up to 90s / 100MB.</p>
          <TierGate
            currentTier={subscriptionTier}
            requiredTier="pro"
            lockedMessage="Feature video is available on the Pro plan and above."
          >
            {vehicle.featureVideoUrl ? (
              <div className="space-y-3">
                <video
                  src={vehicle.featureVideoUrl}
                  controls
                  className="w-full max-h-64 rounded-xl bg-black object-contain"
                  preload="metadata"
                />
                <button
                  type="button"
                  onClick={handleVideoDelete}
                  disabled={videoDeleting}
                  className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
                >
                  <FaTrash className="text-xs" />
                  {videoDeleting ? "Removing…" : "Remove video"}
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl py-6 cursor-pointer hover:border-gray-400 transition-colors text-gray-500 text-sm">
                <FaVideo className="text-gray-400" />
                {videoUploading ? "Uploading…" : "Upload feature video (MP4 / MOV)"}
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,video/x-m4v"
                  className="hidden"
                  disabled={videoUploading}
                  onChange={handleVideoUpload}
                />
              </label>
            )}
          </TierGate>
        </div>
      </div>
    </div>
  );
}
