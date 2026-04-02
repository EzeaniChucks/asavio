"use client";

// app/dashboard/host/properties/[id]/edit/page.tsx
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { FaArrowLeft, FaUpload, FaTimes } from "react-icons/fa";
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

  // Image management state
  const [markedForRemoval, setMarkedForRemoval] = useState<string[]>([]); // publicIds
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);

  useEffect(() => {
    api
      .get(`/properties/${id}`)
      .then((res) => setProperty(res.data.data.property))
      .catch(() => router.push("/dashboard/host"))
      .finally(() => setIsFetching(false));
  }, [id, router]);

  const toggleRemoval = (publicId: string) => {
    setMarkedForRemoval((prev) =>
      prev.includes(publicId) ? prev.filter((x) => x !== publicId) : [...prev, publicId]
    );
  };

  const handleNewImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const currentCount = (property?.images?.length ?? 0) - markedForRemoval.length + newFiles.length;
    if (currentCount + files.length > 10) {
      toast.error("Maximum 10 images total");
      return;
    }
    setNewFiles((prev) => [...prev, ...files]);
    setNewPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
    // Reset input so same file can be re-added if needed
    e.target.value = "";
  };

  const removeNewFile = (i: number) => {
    setNewFiles((prev) => prev.filter((_, idx) => idx !== i));
    setNewPreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (data: PropertyFormData) => {
    setIsLoading(true);
    try {
      const fd = new FormData();
      fd.append("title", data.title);
      fd.append("description", data.description);
      fd.append("propertyType", data.propertyType);
      fd.append("bedrooms", String(data.bedrooms));
      fd.append("bathrooms", String(data.bathrooms));
      fd.append("maxGuests", String(data.maxGuests));
      fd.append("pricePerNight", String(data.pricePerNight));
      if (data.purposePricing) fd.append("purposePricing", JSON.stringify(data.purposePricing));
      fd.append("amenities", JSON.stringify(data.amenities));
      fd.append("checkInInstructions", data.checkInInstructions?.trim() ?? "");
      fd.append("location", JSON.stringify(data.location));
      markedForRemoval.forEach((pid) => fd.append("removeImagePublicIds", pid));
      newFiles.forEach((file) => fd.append("images", file));

      await api.patch(`/properties/${id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Listing updated successfully!");
      router.push("/dashboard/host");
    } catch {
      // interceptor handles toast
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

  const existingImages = property.images ?? [];
  const remainingCount = existingImages.length - markedForRemoval.length + newFiles.length;

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

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-5">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Edit listing</h1>
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
              purposePricing: (property as any).purposePricing ?? null,
              amenities: property.amenities,
              location: property.location,
            }}
            onSubmit={handleSubmit}
            submitLabel="Save changes"
            isLoading={isLoading}
          />
        </div>

        {/* Image management — separate card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Photos</h2>
            <span className="text-xs text-gray-400">{remainingCount} / 10</span>
          </div>

          {/* Existing images */}
          {existingImages.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2">Current photos — click × to remove on next save</p>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {existingImages.map((img, i) => {
                  const removing = markedForRemoval.includes(img.publicId);
                  return (
                    <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
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

          {/* New image uploads */}
          {newPreviews.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2">New photos to upload</p>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
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

          {remainingCount < 10 && (
            <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl py-5 cursor-pointer hover:border-gray-400 transition-colors text-gray-500 text-sm">
              <FaUpload className="text-gray-400" />
              Add photos
              <input type="file" multiple accept="image/*" className="hidden" onChange={handleNewImages} />
            </label>
          )}

          {markedForRemoval.length > 0 && (
            <p className="text-xs text-amber-600 mt-3">
              {markedForRemoval.length} photo{markedForRemoval.length > 1 ? "s" : ""} will be removed when you save changes above.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
