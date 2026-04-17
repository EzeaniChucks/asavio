"use client";

// app/dashboard/host/hotels/[id]/rooms/page.tsx
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaArrowLeft,
  FaPlus,
  FaTrash,
  FaEdit,
  FaBed,
  FaUsers,
  FaTimes,
} from "react-icons/fa";
import RoomTypeForm, { RoomTypeFormData } from "@/components/forms/RoomTypeForm";
import { api } from "@/lib/api";
import { Hotel, RoomType } from "@/types";
import { formatPrice } from "@/lib/formatPrice";
import { useCurrency } from "@/context/CurrencyContext";
import toast from "react-hot-toast";

export default function ManageRoomsPage() {
  const router = useRouter();
  const { id: hotelId } = useParams<{ id: string }>();
  const { showUsd, toUsd } = useCurrency();

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomType | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchHotel = async () => {
    try {
      const res = await api.get(`/hotels/${hotelId}`);
      setHotel(res.data.data.hotel);
    } catch {
      router.push("/dashboard/host/hotels");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchHotel();
  }, [hotelId]);

  const handleCreate = async (data: RoomTypeFormData) => {
    setIsSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", data.name);
      if (data.description) fd.append("description", data.description);
      fd.append("pricePerNight", String(data.pricePerNight));
      fd.append("maxGuests", String(data.maxGuests));
      fd.append("totalUnits", String(data.totalUnits));
      if (data.bedType) fd.append("bedType", data.bedType);
      if (data.roomSize) fd.append("roomSize", data.roomSize);
      fd.append("roomAmenities", JSON.stringify(data.roomAmenities));
      if (data.cautionFee) fd.append("cautionFee", data.cautionFee);
      data.images.forEach((file) => fd.append("images", file));

      await api.post(`/hotels/${hotelId}/rooms`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Room type added");
      setShowForm(false);
      await fetchHotel();
    } catch {
      // interceptor handles
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (data: RoomTypeFormData) => {
    if (!editingRoom) return;
    setIsSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", data.name);
      if (data.description) fd.append("description", data.description);
      fd.append("pricePerNight", String(data.pricePerNight));
      fd.append("maxGuests", String(data.maxGuests));
      fd.append("totalUnits", String(data.totalUnits));
      if (data.bedType) fd.append("bedType", data.bedType);
      if (data.roomSize) fd.append("roomSize", data.roomSize);
      fd.append("roomAmenities", JSON.stringify(data.roomAmenities));
      if (data.cautionFee) fd.append("cautionFee", data.cautionFee);
      data.images.forEach((file) => fd.append("images", file));

      await api.patch(`/hotels/${hotelId}/rooms/${editingRoom.id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Room type updated");
      setEditingRoom(null);
      await fetchHotel();
    } catch {
      // interceptor handles
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (roomId: string) => {
    if (!confirm("Delete this room type? Existing bookings will remain but no new bookings can be made.")) return;
    setDeletingId(roomId);
    try {
      await api.delete(`/hotels/${hotelId}/rooms/${roomId}`);
      toast.success("Room type deleted");
      await fetchHotel();
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

  if (!hotel) return null;

  const rooms = hotel.roomTypes ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8 max-w-4xl">
        <Link
          href="/dashboard/host/hotels"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-black text-sm mb-6 transition-colors"
        >
          <FaArrowLeft /> My hotels
        </Link>

        <div className="flex items-start justify-between mb-6 gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Room types</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {hotel.name} · {rooms.length} {rooms.length === 1 ? "type" : "types"}
            </p>
          </div>
          {!showForm && !editingRoom && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-black text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-800 transition whitespace-nowrap"
            >
              <FaPlus className="text-xs" />
              Add room type
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
                <h2 className="font-semibold text-gray-900">New room type</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-black transition"
                >
                  <FaTimes />
                </button>
              </div>
              <RoomTypeForm
                onSubmit={handleCreate}
                onCancel={() => setShowForm(false)}
                submitLabel="Add room type"
                isLoading={isSaving}
              />
            </motion.div>
          )}

          {editingRoom && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-2xl border border-gray-100 p-6 mb-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Edit {editingRoom.name}</h2>
                <button
                  onClick={() => setEditingRoom(null)}
                  className="text-gray-400 hover:text-black transition"
                >
                  <FaTimes />
                </button>
              </div>
              <RoomTypeForm
                initialData={{
                  name: editingRoom.name,
                  description: editingRoom.description ?? "",
                  pricePerNight: Number(editingRoom.pricePerNight),
                  maxGuests: editingRoom.maxGuests,
                  totalUnits: editingRoom.totalUnits,
                  bedType: editingRoom.bedType ?? "",
                  roomSize: editingRoom.roomSize ?? "",
                  roomAmenities: editingRoom.roomAmenities ?? [],
                  cautionFee: editingRoom.cautionFee != null ? String(editingRoom.cautionFee) : "",
                }}
                onSubmit={handleUpdate}
                onCancel={() => setEditingRoom(null)}
                submitLabel="Save changes"
                isLoading={isSaving}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {rooms.length === 0 && !showForm ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <FaBed className="text-4xl text-gray-300 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">No room types yet</h3>
            <p className="text-gray-500 text-sm mb-6">
              Add at least one room type before your hotel can be approved for listing.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-black text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-800 transition"
            >
              <FaPlus className="text-xs" />
              Add room type
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {rooms.map((room) => {
              const primary = room.images?.find((img) => img.isPrimary)?.url ?? room.images?.[0]?.url;
              return (
                <div
                  key={room.id}
                  className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4 items-start"
                >
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                    {primary ? (
                      <img src={primary} alt={room.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">🛏️</div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-0.5">{room.name}</h3>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 mb-2">
                      <span className="flex items-center gap-1">
                        <FaUsers className="text-gray-400 text-[10px]" />
                        {room.maxGuests} guests
                      </span>
                      <span>{room.totalUnits} {room.totalUnits === 1 ? "unit" : "units"}</span>
                      {room.bedType && <span className="capitalize">{room.bedType}</span>}
                      {room.roomSize && <span>{room.roomSize}</span>}
                    </div>
                    <p className="font-semibold text-gray-900 text-sm">
                      {showUsd && toUsd(room.pricePerNight)
                        ? toUsd(room.pricePerNight)
                        : formatPrice(room.pricePerNight)}
                      <span className="font-normal text-gray-500 text-xs ml-1">/ night</span>
                    </p>
                  </div>

                  <div className="flex gap-1.5">
                    <button
                      onClick={() => { setEditingRoom(room); setShowForm(false); }}
                      className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition"
                      aria-label="Edit"
                    >
                      <FaEdit className="text-xs" />
                    </button>
                    <button
                      onClick={() => handleDelete(room.id)}
                      disabled={deletingId === room.id}
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
