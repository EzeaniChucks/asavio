"use client";

// app/dashboard/host/properties/[id]/edit/page.tsx
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";
import PropertyForm, { PropertyFormData } from "@/components/forms/PropertyForm";
import { api } from "@/lib/api";
import { Property } from "@/types";
import toast from "react-hot-toast";

export default function EditPropertyPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    api
      .get(`/properties/${id}`)
      .then((res) => setProperty(res.data.data.property))
      .catch(() => router.push("/dashboard/host"))
      .finally(() => setIsFetching(false));
  }, [id, router]);

  const handleSubmit = async (data: PropertyFormData) => {
    setIsLoading(true);
    try {
      const payload: Record<string, unknown> = {
        title: data.title,
        description: data.description,
        propertyType: data.propertyType,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        maxGuests: data.maxGuests,
        pricePerNight: data.pricePerNight,
        purposePricing: data.purposePricing ?? null,
        amenities: data.amenities,
        location: data.location,
      };

      await api.patch(`/properties/${id}`, payload);
      toast.success("Listing updated successfully!");
      router.push("/dashboard/host");
    } catch {
      toast.error("Failed to update listing. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loader" />
      </div>
    );
  }

  if (!property) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8 max-w-3xl">
        <Link
          href="/dashboard/host"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-black text-sm mb-6 transition-colors"
        >
          <FaArrowLeft />
          Back to dashboard
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Edit listing
          </h1>
          <p className="text-gray-500 mb-8 truncate">{property.title}</p>

          <PropertyForm
            initialData={{
              title: property.title,
              description: property.description,
              propertyType: property.propertyType,
              bedrooms: property.bedrooms,
              bathrooms: property.bathrooms,
              maxGuests: property.maxGuests,
              pricePerNight: property.pricePerNight,
              amenities: property.amenities,
              location: property.location,
            }}
            onSubmit={handleSubmit}
            submitLabel="Save changes"
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
