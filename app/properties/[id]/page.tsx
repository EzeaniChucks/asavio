"use client";

// app/properties/[id]/page.tsx
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FaStar,
  FaUsers,
  FaBed,
  FaBath,
  FaMapMarkerAlt,
  FaArrowLeft,
  FaCheckCircle,
  FaShare,
  FaHeart,
  FaRegHeart,
  FaExpand,
} from "react-icons/fa";
import { api } from "@/lib/api";
import { Property, Review } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import BookingWidget from "@/components/booking/BookingWidget";
import ReviewList from "@/components/reviews/ReviewList";
import ReviewForm from "@/components/reviews/ReviewForm";
import GalleryLightbox from "@/components/ui/GalleryLightbox";
import HostTierBadge from "@/components/ui/HostTierBadge";
import { FaComments } from "react-icons/fa";

const AMENITY_ICONS: Record<string, string> = {
  wifi: "📶",
  pool: "🏊",
  gym: "🏋️",
  parking: "🅿️",
  kitchen: "🍳",
  ac: "❄️",
  heating: "🔥",
  tv: "📺",
  washer: "🫧",
  dryer: "♨️",
  workspace: "💼",
  pets: "🐾",
  balcony: "🌿",
  bbq: "🥩",
  fireplace: "🔥",
};

function getAmenityIcon(amenity: string) {
  const key = amenity.toLowerCase().replace(/\s+/g, "");
  for (const [k, icon] of Object.entries(AMENITY_ICONS)) {
    if (key.includes(k)) return icon;
  }
  return "✓";
}

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);

  // Gallery / lightbox state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [activeThumb, setActiveThumb] = useState(0);

  useEffect(() => {
    api
      .get(`/properties/${id}`)
      .then((res) => setProperty(res.data.data.property))
      .catch(() => router.push("/properties"))
      .finally(() => setIsLoading(false));
  }, [id, router]);

  useEffect(() => {
    if (!id) return;
    api
      .get(`/reviews/property/${id}`)
      .then((res) => setReviews(res.data.data.reviews ?? res.data.data ?? []))
      .catch(() => {});
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loader" />
      </div>
    );
  }

  if (!property) return null;

  const images = property.images?.length
    ? property.images
    : [{ url: "/images/placeholder.jpg", publicId: "", id: "", isPrimary: true }];

  return (
    <div className="min-h-screen bg-white">
      <div className="container py-6">
        {/* Back nav */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 hover:text-black transition-colors mb-4 text-sm"
        >
          <FaArrowLeft />
          Back
        </button>

        {/* Title row */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
              {property.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <FaStar className="text-yellow-400" />
                <strong>{Number(property.averageRating).toFixed(1)}</strong>
                <span>({property.totalReviews} {property.totalReviews === 1 ? "review" : "reviews"})</span>
              </span>
              <span className="flex items-center gap-1">
                <FaMapMarkerAlt className="text-gray-400" />
                {property.location.city}, {property.location.country}
              </span>
              <span className="bg-gray-100 px-2 py-0.5 rounded-full capitalize">
                {property.propertyType}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <button className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-black px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
              <FaShare className="text-xs" /> Share
            </button>
            <button
              onClick={() => setSaved(!saved)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-black px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {saved ? <FaHeart className="text-red-500" /> : <FaRegHeart />}
              Save
            </button>
          </div>
        </div>

        {/* Image gallery */}
        <div className="grid grid-cols-4 grid-rows-2 gap-2 rounded-2xl overflow-hidden mb-4 h-[400px] md:h-[500px]">
          {/* Main image — spans both rows on mobile (full height), left half on desktop */}
          <div
            className="col-span-4 row-span-2 md:col-span-2 relative cursor-pointer group"
            onClick={() => setLightboxIndex(0)}
          >
            <Image
              src={images[activeThumb]?.url || images[0]?.url || "/images/placeholder.jpg"}
              alt={property.title}
              fill
              className="object-cover group-hover:opacity-95 transition-opacity"
              priority
            />
            <div className="absolute inset-0 flex items-end p-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="flex items-center gap-1.5 bg-black/60 text-white text-xs px-2.5 py-1.5 rounded-lg">
                <FaExpand className="text-xs" /> View all {images.length} photos
              </span>
            </div>
          </div>

          {/* Secondary images — hidden on mobile */}
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`relative hidden md:block ${images[i] ? "cursor-pointer group" : ""}`}
              onClick={() => images[i] && setLightboxIndex(i)}
            >
              {images[i] ? (
                <>
                  <Image
                    src={images[i].url}
                    alt={`${property.title} ${i + 1}`}
                    fill
                    className="object-cover group-hover:opacity-90 transition-opacity"
                  />
                  {i === 4 && images.length > 5 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-semibold">
                      +{images.length - 5} more
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full bg-gray-100 rounded-sm" />
              )}
            </div>
          ))}
        </div>

        {/* Mobile thumbnail strip */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6 md:hidden">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => { setActiveThumb(i); setLightboxIndex(i); }}
                className={`relative w-16 h-12 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                  activeThumb === i ? "border-black" : "border-transparent"
                }`}
              >
                <Image src={img.url} alt={`Thumb ${i + 1}`} fill className="object-cover" sizes="64px" />
              </button>
            ))}
          </div>
        )}

        {/* Main layout: info + booking sidebar */}
        <div className="grid lg:grid-cols-[1fr_380px] gap-12 items-start">
          {/* Left — property info */}
          <div>
            {/* Quick stats */}
            <div className="flex flex-wrap gap-6 pb-8 border-b border-gray-100 mb-8">
              <div className="flex items-center gap-2 text-gray-700">
                <FaUsers className="text-gray-400" />
                <span>{property.maxGuests} guests</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <FaBed className="text-gray-400" />
                <span>{property.bedrooms} {property.bedrooms === 1 ? "bedroom" : "bedrooms"}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <FaBath className="text-gray-400" />
                <span>{property.bathrooms} {property.bathrooms === 1 ? "bathroom" : "bathrooms"}</span>
              </div>
            </div>

            {/* Host card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between gap-4 pb-8 border-b border-gray-100 mb-8"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-black font-bold text-xl flex-shrink-0">
                  {property.host?.firstName?.[0]?.toUpperCase() ?? "H"}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900">
                      Hosted by {property.host?.firstName} {property.host?.lastName}
                    </p>
                    {property.host?.hostTier && (
                      <HostTierBadge tier={property.host.hostTier} size="sm" />
                    )}
                  </div>
                  {property.host?.isVerified && (
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                      <FaCheckCircle className="text-green-500 text-xs" />
                      Verified host
                    </p>
                  )}
                  {property.host?.responseRate != null && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {Math.round(Number(property.host.responseRate) * 100)}% response rate
                    </p>
                  )}
                </div>
              </div>
              {isAuthenticated && user && user.id !== property.hostId && (
                <button
                  onClick={async () => {
                    try {
                      const res = await api.post("/conversations", {
                        hostId: property.hostId,
                        propertyId: property.id,
                      });
                      const convId = res.data.data.conversation.id;
                      router.push(`/dashboard/messages?conv=${convId}`);
                    } catch {
                      // Error toast shown by api interceptor
                    }
                  }}
                  className="flex items-center gap-2 text-sm font-medium border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors flex-shrink-0"
                >
                  <FaComments className="text-gray-500" />
                  Message host
                </button>
              )}
            </motion.div>

            {/* Description */}
            <div className="pb-8 border-b border-gray-100 mb-8">
              <h2 className="text-xl font-semibold mb-3">About this place</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                {property.description}
              </p>
            </div>

            {/* Amenities */}
            {property.amenities?.length > 0 && (
              <div className="pb-8 border-b border-gray-100 mb-8">
                <h2 className="text-xl font-semibold mb-5">What this place offers</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {property.amenities.map((amenity) => (
                    <div key={amenity} className="flex items-center gap-3 text-gray-700">
                      <span className="text-xl">{getAmenityIcon(amenity)}</span>
                      <span className="capitalize">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Location */}
            <div className="pb-8 border-b border-gray-100 mb-8">
              <h2 className="text-xl font-semibold mb-3">Location</h2>
              <p className="text-gray-600 mb-1">{property.location.address}</p>
              <p className="text-gray-500 text-sm">
                {property.location.city}, {property.location.state}, {property.location.country}
              </p>
            </div>

            {/* Reviews */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-xl font-semibold">Reviews</h2>
                {reviews.length > 0 && (
                  <span className="flex items-center gap-1 text-gray-600 text-sm">
                    <FaStar className="text-yellow-400" />
                    {Number(property.averageRating).toFixed(1)} · {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                  </span>
                )}
              </div>

              <ReviewList
                reviews={reviews}
                onDelete={(rid) => setReviews((prev) => prev.filter((r) => r.id !== rid))}
              />

              {isAuthenticated && (
                <div className="mt-8">
                  <ReviewForm
                    propertyId={property.id}
                    onSuccess={() =>
                      api
                        .get(`/reviews/property/${property.id}`)
                        .then((res) => setReviews(res.data.data.reviews ?? res.data.data ?? []))
                        .catch(() => {})
                    }
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right — Booking widget */}
          <div className="lg:sticky lg:top-24 space-y-3">
            <BookingWidget property={property} />

            {isAuthenticated && user?.id === property.hostId && (
              <Link
                href={`/dashboard/host/properties/${property.id}/edit`}
                className="block w-full text-center py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:border-black transition-colors"
              >
                Edit this listing
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <GalleryLightbox
          images={images}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
