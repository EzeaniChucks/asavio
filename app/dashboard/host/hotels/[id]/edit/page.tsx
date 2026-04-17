"use client";

// app/dashboard/host/hotels/[id]/edit/page.tsx
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";
import HotelForm, { HotelFormData } from "@/components/forms/HotelForm";
import { api } from "@/lib/api";
import { Hotel, SubscriptionTier } from "@/types";
import toast from "react-hot-toast";

const PHOTO_LIMITS: Record<SubscriptionTier, number> = { starter: 10, pro: 15, elite: 20 };

export default function EditHotelPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>("starter");

  useEffect(() => {
    api
      .get(`/hotels/${id}`)
      .then((res) => setHotel(res.data.data.hotel))
      .catch(() => router.push("/dashboard/host/hotels"))
      .finally(() => setIsFetching(false));

    api
      .get("/subscriptions/me")
      .then((res) => setSubscriptionTier(res.data.data.currentTier ?? "starter"))
      .catch(() => {});
  }, [id, router]);

  const handleSubmit = async (data: HotelFormData) => {
    setIsLoading(true);
    try {
      const fd = new FormData();
      fd.append("name", data.name);
      fd.append("description", data.description);
      fd.append("hotelType", data.hotelType);
      if (data.starRating !== "") fd.append("starRating", String(data.starRating));
      fd.append("location", JSON.stringify(data.location));
      fd.append("amenities", JSON.stringify(data.amenities));
      fd.append("nearbyPlaces", JSON.stringify(data.nearbyPlaces));
      fd.append("checkInTime", data.checkInTime);
      fd.append("checkOutTime", data.checkOutTime);
      fd.append("cancellationPolicy", data.cancellationPolicy);
      if (data.checkInInstructions?.trim()) fd.append("checkInInstructions", data.checkInInstructions.trim());
      data.images.forEach((file) => fd.append("images", file));

      await api.patch(`/hotels/${id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Hotel updated");
      router.push("/dashboard/host/hotels");
    } catch {
      // interceptor handles
    } finally {
      setIsLoading(false);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8 max-w-3xl">
        <Link
          href="/dashboard/host/hotels"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-black text-sm mb-6 transition-colors"
        >
          <FaArrowLeft /> My hotels
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Edit hotel</h1>
          <p className="text-gray-500 mb-8">Update hotel-level details. Manage rooms separately.</p>

          <HotelForm
            initialData={{
              name: hotel.name,
              description: hotel.description,
              hotelType: hotel.hotelType,
              starRating: hotel.starRating ?? "",
              location: hotel.location,
              amenities: hotel.amenities,
              nearbyPlaces: hotel.nearbyPlaces ?? [],
              checkInTime: hotel.checkInTime,
              checkOutTime: hotel.checkOutTime,
              cancellationPolicy: hotel.cancellationPolicy,
              checkInInstructions: hotel.checkInInstructions ?? "",
            }}
            onSubmit={handleSubmit}
            submitLabel="Save changes"
            isLoading={isLoading}
            maxPhotos={PHOTO_LIMITS[subscriptionTier]}
          />
        </div>
      </div>
    </div>
  );
}
