"use client";

// app/dashboard/host/event-centers/new/page.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";
import EventCenterForm, { EventCenterFormData } from "@/components/forms/EventCenterForm";
import KycGate from "@/components/guards/KycGate";
import { api } from "@/lib/api";
import { SubscriptionTier } from "@/types";
import toast from "react-hot-toast";

const PHOTO_LIMITS: Record<SubscriptionTier, number> = { starter: 10, pro: 15, elite: 20 };

export default function NewEventCenterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>("starter");

  useEffect(() => {
    api
      .get("/subscriptions/me")
      .then((res) => setSubscriptionTier(res.data.data.currentTier ?? "starter"))
      .catch(() => {});
  }, []);

  const handleSubmit = async (data: EventCenterFormData) => {
    setIsLoading(true);
    try {
      const fd = new FormData();
      fd.append("name", data.name);
      fd.append("description", data.description);
      fd.append("location", JSON.stringify(data.location));
      fd.append("amenities", JSON.stringify(data.amenities));
      fd.append("allowedEventTypes", JSON.stringify(data.allowedEventTypes));
      fd.append("blockedEventTypes", JSON.stringify(data.blockedEventTypes));
      fd.append("cancellationPolicy", data.cancellationPolicy);
      data.images.forEach((file) => fd.append("images", file));

      const res = await api.post("/event-centers", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const eventCenterId = res.data.data.eventCenter.id;
      toast.success("Event center created! Now add your spaces.");
      router.push(`/dashboard/host/event-centers/${eventCenterId}/spaces`);
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
          href="/dashboard/host/event-centers"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-black text-sm mb-6 transition-colors"
        >
          <FaArrowLeft /> My event centers
        </Link>

        <KycGate listingNoun="event center">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Create a new event center</h1>
            <p className="text-gray-500 mb-8">
              Add event center details first. You&apos;ll add spaces on the next step.
            </p>

            <EventCenterForm
              onSubmit={handleSubmit}
              submitLabel="Create event center"
              isLoading={isLoading}
              maxPhotos={PHOTO_LIMITS[subscriptionTier]}
            />
          </div>
        </KycGate>
      </div>
    </div>
  );
}
