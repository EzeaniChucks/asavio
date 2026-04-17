"use client";

// app/dashboard/host/event-centers/[id]/spaces/page.tsx
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaArrowLeft,
  FaPlus,
  FaTrash,
  FaEdit,
  FaCalendarAlt,
  FaUsers,
  FaTimes,
} from "react-icons/fa";
import EventSpaceForm, { EventSpaceFormData } from "@/components/forms/EventSpaceForm";
import { api } from "@/lib/api";
import { EventCenter, EventSpace } from "@/types";
import { formatPrice } from "@/lib/formatPrice";
import { useCurrency } from "@/context/CurrencyContext";
import toast from "react-hot-toast";

const PRICING_MODE_LABEL: Record<string, string> = {
  hourly: "Hourly",
  daily: "Daily",
  package: "Package",
  hybrid: "Hybrid",
};

function displayRate(space: EventSpace, showUsd: boolean, toUsd: (v: number) => string | null) {
  const fmt = (val: number) =>
    showUsd && toUsd(val) ? toUsd(val)! : formatPrice(val);

  switch (space.pricingMode) {
    case "hourly":
      return space.hourlyRate ? `${fmt(space.hourlyRate)} / hr` : null;
    case "daily":
      return space.dailyRate ? `${fmt(space.dailyRate)} / day` : null;
    case "package":
      return space.packageRate ? `${fmt(space.packageRate)} / package` : null;
    case "hybrid": {
      const parts: string[] = [];
      if (space.hourlyRate) parts.push(`${fmt(space.hourlyRate)} / hr`);
      if (space.dailyRate) parts.push(`${fmt(space.dailyRate)} / day`);
      return parts.length > 0 ? parts.join(" · ") : null;
    }
    default:
      return null;
  }
}

export default function ManageSpacesPage() {
  const router = useRouter();
  const { id: eventCenterId } = useParams<{ id: string }>();
  const { showUsd, toUsd } = useCurrency();

  const [eventCenter, setEventCenter] = useState<EventCenter | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingSpace, setEditingSpace] = useState<EventSpace | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchEventCenter = async () => {
    try {
      const res = await api.get(`/event-centers/${eventCenterId}`);
      setEventCenter(res.data.data.eventCenter);
    } catch {
      router.push("/dashboard/host/event-centers");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchEventCenter();
  }, [eventCenterId]);

  const handleCreate = async (data: EventSpaceFormData) => {
    setIsSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", data.name);
      if (data.description) fd.append("description", data.description);
      fd.append("capacity", String(data.capacity));
      fd.append("pricingMode", data.pricingMode);
      fd.append("hourlyRate", String(data.hourlyRate));
      fd.append("minHours", String(data.minHours));
      fd.append("dailyRate", String(data.dailyRate));
      fd.append("packageName", data.packageName);
      fd.append("packageRate", String(data.packageRate));
      fd.append("packageHoursIncluded", String(data.packageHoursIncluded));
      fd.append("packageDescription", data.packageDescription);
      fd.append("setupMinutes", String(data.setupMinutes));
      fd.append("teardownMinutes", String(data.teardownMinutes));
      data.images.forEach((file) => fd.append("images", file));

      await api.post(`/event-centers/${eventCenterId}/spaces`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Space added");
      setShowForm(false);
      await fetchEventCenter();
    } catch {
      // interceptor handles
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (data: EventSpaceFormData) => {
    if (!editingSpace) return;
    setIsSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", data.name);
      if (data.description) fd.append("description", data.description);
      fd.append("capacity", String(data.capacity));
      fd.append("pricingMode", data.pricingMode);
      fd.append("hourlyRate", String(data.hourlyRate));
      fd.append("minHours", String(data.minHours));
      fd.append("dailyRate", String(data.dailyRate));
      fd.append("packageName", data.packageName);
      fd.append("packageRate", String(data.packageRate));
      fd.append("packageHoursIncluded", String(data.packageHoursIncluded));
      fd.append("packageDescription", data.packageDescription);
      fd.append("setupMinutes", String(data.setupMinutes));
      fd.append("teardownMinutes", String(data.teardownMinutes));
      data.images.forEach((file) => fd.append("images", file));

      await api.patch(`/event-centers/${eventCenterId}/spaces/${editingSpace.id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Space updated");
      setEditingSpace(null);
      await fetchEventCenter();
    } catch {
      // interceptor handles
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (spaceId: string) => {
    if (!confirm("Delete this space? Existing bookings will remain but no new bookings can be made.")) return;
    setDeletingId(spaceId);
    try {
      await api.delete(`/event-centers/${eventCenterId}/spaces/${spaceId}`);
      toast.success("Space deleted");
      await fetchEventCenter();
    } catch {
      // interceptor handles
    } finally {
      setDeletingId(null);
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!eventCenter) return null;

  const spaces = eventCenter.spaces ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8 max-w-4xl">
        <Link
          href="/dashboard/host/event-centers"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-black text-sm mb-6 transition-colors"
        >
          <FaArrowLeft /> My event centers
        </Link>

        <div className="flex items-start justify-between mb-6 gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Event spaces</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {eventCenter.name} · {spaces.length} {spaces.length === 1 ? "space" : "spaces"}
            </p>
          </div>
          {!showForm && !editingSpace && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-black text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-800 transition whitespace-nowrap"
            >
              <FaPlus className="text-xs" />
              Add space
            </button>
          )}
        </div>

        {/* Inline create form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-2xl border border-gray-100 p-6 mb-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">New space</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-black transition"
                >
                  <FaTimes />
                </button>
              </div>
              <EventSpaceForm
                onSubmit={handleCreate}
                onCancel={() => setShowForm(false)}
                submitLabel="Add space"
                isLoading={isSaving}
              />
            </motion.div>
          )}

          {editingSpace && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-2xl border border-gray-100 p-6 mb-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Edit {editingSpace.name}</h2>
                <button
                  onClick={() => setEditingSpace(null)}
                  className="text-gray-400 hover:text-black transition"
                >
                  <FaTimes />
                </button>
              </div>
              <EventSpaceForm
                initialData={{
                  name: editingSpace.name,
                  description: editingSpace.description ?? "",
                  capacity: editingSpace.capacity,
                  pricingMode: editingSpace.pricingMode,
                  hourlyRate: Number(editingSpace.hourlyRate ?? 0),
                  minHours: editingSpace.minHours,
                  dailyRate: Number(editingSpace.dailyRate ?? 0),
                  packageName: editingSpace.packageName ?? "",
                  packageRate: Number(editingSpace.packageRate ?? 0),
                  packageHoursIncluded: Number(editingSpace.packageHoursIncluded ?? 0),
                  packageDescription: editingSpace.packageDescription ?? "",
                  setupMinutes: editingSpace.setupMinutes,
                  teardownMinutes: editingSpace.teardownMinutes,
                }}
                onSubmit={handleUpdate}
                onCancel={() => setEditingSpace(null)}
                submitLabel="Save changes"
                isLoading={isSaving}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {spaces.length === 0 && !showForm ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <FaCalendarAlt className="text-4xl text-gray-300 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">No spaces yet</h3>
            <p className="text-gray-500 text-sm mb-6">
              No spaces yet — add at least one space before your event center can be approved.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-black text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-800 transition"
            >
              <FaPlus className="text-xs" />
              Add space
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {spaces.map((space) => {
              const primary = space.images?.find((img) => img.isPrimary)?.url ?? space.images?.[0]?.url;
              const rate = displayRate(space, showUsd, toUsd);
              return (
                <div
                  key={space.id}
                  className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4 items-start"
                >
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                    {primary ? (
                      <img src={primary} alt={space.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">{"\uD83C\uDFAA"}</div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-semibold text-gray-900">{space.name}</h3>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {PRICING_MODE_LABEL[space.pricingMode] ?? space.pricingMode}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 mb-2">
                      <span className="flex items-center gap-1">
                        <FaUsers className="text-gray-400 text-[10px]" />
                        {space.capacity} attendees
                      </span>
                    </div>
                    {rate && (
                      <p className="font-semibold text-gray-900 text-sm">{rate}</p>
                    )}
                  </div>

                  <div className="flex gap-1.5">
                    <button
                      onClick={() => { setEditingSpace(space); setShowForm(false); }}
                      className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition"
                      aria-label="Edit"
                    >
                      <FaEdit className="text-xs" />
                    </button>
                    <button
                      onClick={() => handleDelete(space.id)}
                      disabled={deletingId === space.id}
                      className="w-8 h-8 rounded-lg border border-red-100 flex items-center justify-center text-red-500 hover:bg-red-50 disabled:opacity-40 transition"
                      aria-label="Delete"
                    >
                      <FaTrash className="text-xs" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
