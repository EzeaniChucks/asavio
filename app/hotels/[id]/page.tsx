"use client";

// app/hotels/[id]/page.tsx
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FaStar,
  FaMapMarkerAlt,
  FaArrowLeft,
  FaCheckCircle,
  FaShare,
  FaHeart,
  FaRegHeart,
  FaExpand,
  FaBed,
  FaUsers,
  FaConciergeBell,
  FaComments,
} from "react-icons/fa";
import { api } from "@/lib/api";
import { Hotel, Review } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice } from "@/lib/formatPrice";
import { useCurrency } from "@/context/CurrencyContext";
import HotelBookingWidget from "@/components/booking/HotelBookingWidget";
import ReviewList from "@/components/reviews/ReviewList";
import ReviewForm from "@/components/reviews/ReviewForm";
import GalleryLightbox from "@/components/ui/GalleryLightbox";
import HostTierBadge from "@/components/ui/HostTierBadge";

export default function HotelDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { showUsd, toUsd } = useCurrency();

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [activeThumb, setActiveThumb] = useState(0);

  useEffect(() => {
    api
      .get(`/hotels/${id}`)
      .then((res) => setHotel(res.data.data.hotel))
      .catch(() => router.push("/hotels"))
      .finally(() => setIsLoading(false));
  }, [id, router]);

  // Load saved state
  useEffect(() => {
    if (!isAuthenticated || !id) return;
    api
      .get("/saved/ids")
      .then((res) => {
        const ids: string[] = res.data.data.hotelIds ?? [];
        setSaved(ids.includes(id));
      })
      .catch(() => {});
  }, [id, isAuthenticated]);

  // Load reviews
  useEffect(() => {
    if (!id) return;
    api
      .get(`/reviews/hotel/${id}`)
      .then((res) => setReviews(res.data.data.reviews ?? res.data.data ?? []))
      .catch(() => {});
  }, [id]);

  const handleShare = async () => {
    if (!hotel) return;
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: hotel.name, text: hotel.description, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {}
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loader" />
      </div>
    );
  }

  if (!hotel) return null;

  const galleryImages = hotel.images?.length
    ? hotel.images
    : [{ url: "/images/placeholder.jpg", publicId: "", id: "", isPrimary: true, altText: "" }];

  // JSON-LD: Hotel + AggregateRating + LodgingBusiness per room type
  const hotelSchema = {
    "@context": "https://schema.org",
    "@type": "Hotel",
    name: hotel.name,
    description: hotel.description,
    image: hotel.images?.map((img) => img.url) ?? [],
    address: {
      "@type": "PostalAddress",
      streetAddress: hotel.location.address,
      addressLocality: hotel.location.city,
      addressRegion: hotel.location.state,
      addressCountry: "NG",
    },
    ...(typeof hotel.starRating === "number" && hotel.starRating > 0 && {
      starRating: {
        "@type": "Rating",
        ratingValue: String(hotel.starRating),
      },
    }),
    ...(hotel.totalReviews > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: Number(hotel.averageRating).toFixed(1),
        reviewCount: String(hotel.totalReviews),
      },
    }),
    amenityFeature: (hotel.amenities ?? []).map((a) => ({
      "@type": "LocationFeatureSpecification",
      name: a,
      value: true,
    })),
    containsPlace: (hotel.roomTypes ?? []).map((r) => ({
      "@type": "HotelRoom",
      name: r.name,
      occupancy: { "@type": "QuantitativeValue", maxValue: r.maxGuests },
      ...(r.bedType && {
        bed: { "@type": "BedDetails", typeOfBed: r.bedType },
      }),
    })),
  };

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(hotelSchema) }}
      />

      <div className="container py-6">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 hover:text-black transition-colors mb-4 text-sm"
        >
          <FaArrowLeft />
          Back
        </button>

        {/* Title block */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{hotel.name}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mt-1">
              <span className="flex items-center gap-1">
                <FaMapMarkerAlt className="text-gray-400" />
                {hotel.location.address}, {hotel.location.city}, {hotel.location.country}
              </span>
              {typeof hotel.starRating === "number" && hotel.starRating > 0 && (
                <span className="flex items-center gap-0.5 text-amber-500">
                  {Array.from({ length: hotel.starRating }).map((_, i) => (
                    <FaStar key={i} className="text-[11px]" />
                  ))}
                  {hotel.verifiedStarRating && <FaCheckCircle className="ml-1 text-emerald-500 text-xs" />}
                </span>
              )}
              {hotel.totalReviews > 0 && (
                <span className="flex items-center gap-1">
                  <FaStar className="text-yellow-400" />
                  {Number(hotel.averageRating).toFixed(1)}
                  <span className="text-gray-400">({hotel.totalReviews})</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition"
            >
              <FaShare className="text-xs" /> Share
            </button>
            {isAuthenticated && (
              <button
                disabled={saveLoading}
                onClick={async () => {
                  setSaveLoading(true);
                  try {
                    const res = await api.post("/saved/toggle", { hotelId: id });
                    setSaved(res.data.data.saved);
                  } catch {}
                  setSaveLoading(false);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition disabled:opacity-50"
              >
                {saved ? <FaHeart className="text-red-500 text-xs" /> : <FaRegHeart className="text-xs" />}
                {saved ? "Saved" : "Save"}
              </button>
            )}
          </div>
        </div>

        {/* Gallery */}
        <div className="grid grid-cols-4 gap-2 rounded-2xl overflow-hidden mb-8 h-72 md:h-96">
          <button
            onClick={() => setLightboxIndex(activeThumb)}
            className="relative col-span-4 md:col-span-2 row-span-2 bg-gray-100 group"
          >
            {galleryImages[activeThumb]?.url ? (
              <Image
                src={galleryImages[activeThumb].url}
                alt={hotel.name}
                fill
                className="object-cover"
                priority
              />
            ) : null}
            <span className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full inline-flex items-center gap-1">
              <FaExpand /> View gallery
            </span>
          </button>
          {galleryImages.slice(1, 5).map((img, i) => (
            <button
              key={img.id || i}
              onClick={() => { setActiveThumb(i + 1); setLightboxIndex(i + 1); }}
              className="relative hidden md:block bg-gray-100"
            >
              {img.url ? <Image src={img.url} alt={hotel.name} fill className="object-cover" /> : null}
            </button>
          ))}
        </div>

        {/* Main content: left (info) + right (widget) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left */}
          <div className="lg:col-span-2 space-y-8">
            {/* Host */}
            {hotel.host && (
              <div className="flex items-center justify-between border-b border-gray-100 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold">
                    {hotel.host.firstName[0]}
                    {hotel.host.lastName[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">
                      Hosted by {hotel.host.firstName} {hotel.host.lastName}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500">{hotel.hotelType}</p>
                      {hotel.host.hostTier && hotel.host.hostTier !== "new_host" && (
                        <HostTierBadge tier={hotel.host.hostTier} />
                      )}
                    </div>
                  </div>
                </div>
                {isAuthenticated && user?.id !== hotel.hostId && (
                  <Link
                    href={`/messages/new?hotelId=${hotel.id}`}
                    className="inline-flex items-center gap-1.5 border border-gray-200 text-gray-700 text-xs px-3 py-2 rounded-lg hover:bg-gray-50"
                  >
                    <FaComments /> Message host
                  </Link>
                )}
              </div>
            )}

            {/* Description */}
            <section>
              <h2 className="font-semibold text-gray-900 mb-2">About this hotel</h2>
              <p className="text-gray-700 whitespace-pre-line">{hotel.description}</p>
            </section>

            {/* Amenities */}
            {hotel.amenities?.length > 0 && (
              <section>
                <h2 className="font-semibold text-gray-900 mb-3">Hotel amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {hotel.amenities.map((a) => (
                    <div
                      key={a}
                      className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2"
                    >
                      <FaConciergeBell className="text-gray-400 text-xs" />
                      {a}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Check-in/out */}
            <section className="flex flex-wrap gap-4 text-sm bg-gray-50 rounded-xl p-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Check-in</p>
                <p className="text-gray-800">{hotel.checkInTime}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Check-out</p>
                <p className="text-gray-800">{hotel.checkOutTime}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Cancellation</p>
                <p className="text-gray-800 capitalize">{hotel.cancellationPolicy}</p>
              </div>
            </section>

            {/* Room types */}
            {hotel.roomTypes?.length > 0 && (
              <section>
                <h2 className="font-semibold text-gray-900 mb-3">Room types</h2>
                <div className="space-y-3">
                  {hotel.roomTypes.map((room) => {
                    const roomImg = room.images?.find((i) => i.isPrimary)?.url ?? room.images?.[0]?.url;
                    return (
                      <div key={room.id} className="border border-gray-100 rounded-2xl overflow-hidden flex flex-col md:flex-row">
                        <div className="relative w-full md:w-48 h-40 md:h-auto bg-gray-100 flex-shrink-0">
                          {roomImg ? (
                            <Image src={roomImg} alt={room.name} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl">🛏️</div>
                          )}
                        </div>
                        <div className="flex-1 p-4">
                          <h3 className="font-semibold text-gray-900 mb-1">{room.name}</h3>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 mb-2">
                            <span className="flex items-center gap-1">
                              <FaUsers className="text-gray-400" /> Sleeps {room.maxGuests}
                            </span>
                            <span className="flex items-center gap-1">
                              <FaBed className="text-gray-400" /> {room.totalUnits}{" "}
                              {room.totalUnits === 1 ? "room" : "rooms"}
                            </span>
                            {room.bedType && <span className="capitalize">{room.bedType} bed</span>}
                            {room.roomSize && <span>{room.roomSize}</span>}
                          </div>
                          {room.description && (
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{room.description}</p>
                          )}
                          {room.roomAmenities?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {room.roomAmenities.slice(0, 5).map((a) => (
                                <span key={a} className="bg-gray-50 text-gray-600 text-[11px] px-2 py-0.5 rounded-full">
                                  {a}
                                </span>
                              ))}
                            </div>
                          )}
                          <p className="font-bold text-gray-900 text-sm">
                            {showUsd && toUsd(room.pricePerNight)
                              ? toUsd(room.pricePerNight)
                              : formatPrice(room.pricePerNight)}
                            <span className="text-gray-500 text-xs ml-1">/ night</span>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Nearby places */}
            {hotel.nearbyPlaces && hotel.nearbyPlaces.length > 0 && (
              <section>
                <h2 className="font-semibold text-gray-900 mb-2">What&apos;s nearby</h2>
                <div className="flex flex-wrap gap-2">
                  {hotel.nearbyPlaces.map((p, i) => (
                    <span key={i} className="bg-gray-50 text-gray-700 text-sm px-3 py-1.5 rounded-full">
                      {p}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Reviews */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-xl font-semibold">Reviews</h2>
                {reviews.length > 0 && (
                  <span className="flex items-center gap-1 text-gray-600 text-sm">
                    <FaStar className="text-yellow-400" />
                    {Number(hotel.averageRating).toFixed(1)} · {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                  </span>
                )}
              </div>

              <ReviewList
                reviews={reviews}
                onDelete={(rid) => setReviews((prev) => prev.filter((r) => r.id !== rid))}
              />

              <div className="mt-8">
                <ReviewForm
                  hotelId={hotel.id}
                  redirectTo={`/hotels/${hotel.id}`}
                  onSuccess={() =>
                    api
                      .get(`/reviews/hotel/${hotel.id}`)
                      .then((res) => setReviews(res.data.data.reviews ?? res.data.data ?? []))
                      .catch(() => {})
                  }
                />
              </div>
            </section>
          </div>

          {/* Right — sticky booking widget */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              <HotelBookingWidget hotel={hotel} />
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <GalleryLightbox
          images={galleryImages.map((img) => ({ url: img.url }))}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
