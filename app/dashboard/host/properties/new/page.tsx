"use client";

// app/dashboard/host/properties/new/page.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";
import PropertyForm, { PropertyFormData } from "@/components/forms/PropertyForm";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

export default function NewPropertyPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: PropertyFormData) => {
    setIsLoading(true);
    try {
      const formData = new FormData();

      // Append text fields
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("propertyType", data.propertyType);
      formData.append("bedrooms", String(data.bedrooms));
      formData.append("bathrooms", String(data.bathrooms));
      formData.append("maxGuests", String(data.maxGuests));
      formData.append("pricePerNight", String(data.pricePerNight));
      formData.append("amenities", JSON.stringify(data.amenities));
      formData.append("location", JSON.stringify(data.location));

      // Append images
      data.images.forEach((file) => formData.append("images", file));

      await api.post("/properties", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Listing created successfully!");
      router.push("/dashboard/host");
    } catch {
      toast.error("Failed to create listing. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

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
            Create a new listing
          </h1>
          <p className="text-gray-500 mb-8">
            Fill in your property details to get started.
          </p>

          <PropertyForm
            onSubmit={handleSubmit}
            submitLabel="Create listing"
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
