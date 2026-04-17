"use client";

// app/dashboard/host/event-centers/[id]/edit/page.tsx
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";
import EventCenterForm, { EventCenterFormData } from "@/components/forms/EventCenterForm";
import { api } from "@/lib/api";
import { EventCenter, SubscriptionTier } from "@/types";
import toast from "react-hot-toast";

const PHOTO_LIMITS: Record<SubscriptionTier, number> = { starter: 10, pro: 15, elite: 20 };

export default function EditEventCenterPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [eventCenter, setEventCenter] = useState<EventCenter | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>("starter");

  useEffect(() => {
    api
      .get(`/event-centers/${id}`)
      .then((res) => setEventCenter(res.data.data.eventCenter))
      .catch(() => router.push("/dashboard/host/event-centers"))
      .finally(() => setIsFetching(false));

    api
      .get("/subscriptions/me")
      .then((res) => setSubscriptionTier(res.data.data.currentTier ?? "starter"))
      .catch(() => {});
  }, [id, router]);

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

      await api.patch(`/event-centers/${id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Event center updated");
      router.push("/dashboard/host/event-centers");
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

  if (!eventCenter) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8 max-w-3xl">
        <Link
          href="/dashboard/host/event-centers"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-black text-sm mb-6 transition-colors"
        >
          <FaArrowLeft /> My event centers
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Edit event center</h1>
          <p className="text-gray-500 mb-8">Update event center details. Manage spaces separately.</p>

          <EventCenterForm
            initialData={{
              name: eventCenter.name,
              description: eventCenter.description,
              location: eventCenter.location,
              amenities: eventCenter.amenities,
              allowedEventTypes: eventCenter.allowedEventTypes,
              blockedEventTypes: eventCenter.blockedEventTypes,
              cancellationPolicy: eventCenter.cancellationPolicy,
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
