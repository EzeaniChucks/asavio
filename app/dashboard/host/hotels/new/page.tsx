"use client";

// app/dashboard/host/hotels/new/page.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";
import HotelForm, { HotelFormData } from "@/components/forms/HotelForm";
import KycGate from "@/components/guards/KycGate";
import { api } from "@/lib/api";
import { SubscriptionTier } from "@/types";
import toast from "react-hot-toast";

const PHOTO_LIMITS: Record<SubscriptionTier, number> = { starter: 10, pro: 15, elite: 20 };

export default function NewHotelPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>("starter");

  useEffect(() => {
    api
      .get("/subscriptions/me")
      .then((res) => setSubscriptionTier(res.data.data.currentTier ?? "starter"))
      .catch(() => {});
  }, []);

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

      const res = await api.post("/hotels", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const hotelId = res.data.data.hotel.id;
      toast.success("Hotel created! Now add room types.");
      router.push(`/dashboard/host/hotels/${hotelId}/rooms`);
    } catch {
      // interceptor handles
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8 max-w-3xl">
        <Link
          href="/dashboard/host/hotels"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-black text-sm mb-6 transition-colors"
        >
          <FaArrowLeft /> My hotels
        </Link>

        <KycGate listingNoun="hotel">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Create a new hotel</h1>
            <p className="text-gray-500 mb-8">
              Add hotel-level details first. You&apos;ll add room types on the next step.
            </p>

            <HotelForm
              onSubmit={handleSubmit}
              submitLabel="Create hotel"
              isLoading={isLoading}
              maxPhotos={PHOTO_LIMITS[subscriptionTier]}
            />
          </div>
        </KycGate>
      </div>
    </div>
  );
}
