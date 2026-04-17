"use client";

// app/events/[id]/page.tsx
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FaStar,
  FaMapMarkerAlt,
  FaArrowLeft,
  FaShare,
  FaHeart,
  FaRegHeart,
  FaExpand,
  FaUsers,
  FaConciergeBell,
  FaComments,
} from "react-icons/fa";
import { MdMeetingRoom } from "react-icons/md";
import { api } from "@/lib/api";
import { EventCenter, EventSpace, Review } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice } from "@/lib/formatPrice";
import { useCurrency } from "@/context/CurrencyContext";
import EventBookingWidget from "@/components/booking/EventBookingWidget";
import ReviewList from "@/components/reviews/ReviewList";
import ReviewForm from "@/components/reviews/ReviewForm";
import GalleryLightbox from "@/components/ui/GalleryLightbox";
import HostTierBadge from "@/components/ui/HostTierBadge";

function pricingLabel(space: EventSpace): string {
  switch (space.pricingMode) {
    case "hourly":
      return `${formatPrice(space.hourlyRate ?? 0)} / hr`;
    case "daily":
      return `${formatPrice(space.dailyRate ?? 0)} / day`;
    case "package":
      return `${formatPrice(space.packageRate ?? 0)} (${space.packageName ?? "Package"})`;
    case "hybrid":
      return `From ${formatPrice(space.hourlyRate ?? space.dailyRate ?? 0)}`;
    default:
      return "";
  }
}

export default function EventCenterDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { showUsd, toUsd } = useCurrency();

  const [eventCenter, setEventCenter] = useState<EventCenter | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [activeThumb, setActiveThumb] = useState(0);

  useEffect(() => {
    api
      .get(`/event-centers/${id}`)
      .then((res) => setEventCenter(res.data.data.eventCenter))
      .catch(() => router.push("/events"))
      .finally(() => setIsLoading(false));
  }, [id, router]);

  // Load saved state
  useEffect(() => {
    if (!isAuthenticated || !id) return;
    api
      .get("/saved/ids")
      .then((res) => {
        const ids: string[] = res.data.data.eventCenterIds ?? [];
        setSaved(ids.includes(id));
      })
      .catch(() => {});
  }, [id, isAuthenticated]);

  // Load reviews
  useEffect(() => {
    if (!id) return;
    api
      .get(`/reviews/event-center/${id}`)
      .then((res) => setReviews(res.data.data.reviews ?? res.data.data ?? []))
      .catch(() => {});
  }, [id]);

  const handleShare = async () => {
    if (!eventCenter) return;
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({
          title: eventCenter.name,
          text: eventCenter.description,
          url,
        });
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

  if (!eventCenter) return null;

  const ec = eventCenter;
  const galleryImages = ec.images?.length
    ? ec.images
    : [
        {
          url: "/images/placeholder.jpg",
          publicId: "",
          id: "",
          isPrimary: true,
          altText: "",
        },
      ];

  // JSON-LD: EventVenue schema
  const venueSchema = {
    "@context": "https://schema.org",
    "@type": "EventVenue",
    name: ec.name,
    description: ec.description,
    image: ec.images?.map((img) => img.url) ?? [],
    address: {
      "@type": "PostalAddress",
      streetAddress: ec.location.address,
      addressLocality: ec.location.city,
      addressRegion: ec.location.state,
      addressCountry: "NG",
    },
    ...(ec.totalReviews > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: Number(ec.averageRating).toFixed(1),
        reviewCount: String(ec.totalReviews),
      },
    }),
    amenityFeature: (ec.amenities ?? []).map((a) => ({
      "@type": "LocationFeatureSpecification",
      name: a,
      value: true,
    })),
  };

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(venueSchema) }}
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
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {ec.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mt-1">
              <span className="flex items-center gap-1">
                <FaMapMarkerAlt className="text-gray-400" />
                {ec.location.address}, {ec.location.city}, {ec.location.country}
              </span>
              {ec.totalReviews > 0 && (
                <span className="flex items-center gap-1">
                  <FaStar className="text-yellow-400" />
                  {Number(ec.averageRating).toFixed(1)}
                  <span className="text-gray-400">({ec.totalReviews})</span>
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
                    const res = await api.post("/saved/toggle", {
                      eventCenterId: id,
                    });
                    setSaved(res.data.data.saved);
                  } catch {}
                  setSaveLoading(false);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition disabled:opacity-50"
              >
                {saved ? (
                  <FaHeart className="text-red-500 text-xs" />
                ) : (
                  <FaRegHeart className="text-xs" />
                )}
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
                alt={ec.name}
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
              onClick={() => {
                setActiveThumb(i + 1);
                setLightboxIndex(i + 1);
              }}
              className="relative hidden md:block bg-gray-100"
            >
              {img.url ? (
                <Image
                  src={img.url}
                  alt={ec.name}
                  fill
                  className="object-cover"
                />
              ) : null}
            </button>
          ))}
        </div>

        {/* Main content: left (info) + right (widget) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left */}
          <div className="lg:col-span-2 space-y-8">
            {/* Host */}
            {ec.host && (
              <div className="flex items-center justify-between border-b border-gray-100 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold">
                    {ec.host.firstName[0]}
                    {ec.host.lastName[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">
                      Hosted by {ec.host.firstName} {ec.host.lastName}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500">Event Center</p>
                      {ec.host.hostTier && ec.host.hostTier !== "new_host" && (
                        <HostTierBadge tier={ec.host.hostTier} />
                      )}
                    </div>
                  </div>
                </div>
                {isAuthenticated && user?.id !== ec.hostId && (
                  <Link
                    href={`/messages/new?eventCenterId=${ec.id}`}
                    className="inline-flex items-center gap-1.5 border border-gray-200 text-gray-700 text-xs px-3 py-2 rounded-lg hover:bg-gray-50"
                  >
                    <FaComments /> Message host
                  </Link>
                )}
              </div>
            )}

            {/* Description */}
            <section>
              <h2 className="font-semibold text-gray-900 mb-2">
                About this event center
              </h2>
              <p className="text-gray-700 whitespace-pre-line">
                {ec.description}
              </p>
            </section>

            {/* Allowed event types */}
            {ec.allowedEventTypes?.length > 0 && (
              <section>
                <h2 className="font-semibold text-gray-900 mb-3">
                  Allowed event types
                </h2>
                <div className="flex flex-wrap gap-2">
                  {ec.allowedEventTypes.map((type) => (
                    <span
                      key={type}
                      className="bg-gray-100 text-gray-700 text-sm px-3 py-1.5 rounded-full"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Amenities */}
            {ec.amenities?.length > 0 && (
              <section>
                <h2 className="font-semibold text-gray-900 mb-3">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {ec.amenities.map((a) => (
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

            {/* Cancellation policy */}
            <section className="flex flex-wrap gap-4 text-sm bg-gray-50 rounded-xl p-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">
                  Cancellation
                </p>
                <p className="text-gray-800 capitalize">
                  {ec.cancellationPolicy}
                </p>
              </div>
            </section>

            {/* Spaces */}
            {ec.spaces?.length > 0 && (
              <section>
                <h2 className="font-semibold text-gray-900 mb-3">Spaces</h2>
                <div className="space-y-3">
                  {ec.spaces.map((space) => {
                    const spaceImg =
                      space.images?.find((i) => i.isPrimary)?.url ??
                      space.images?.[0]?.url;
                    return (
                      <div
                        key={space.id}
                        className="border border-gray-100 rounded-2xl overflow-hidden flex flex-col md:flex-row"
                      >
                        <div className="relative w-full md:w-48 h-40 md:h-auto bg-gray-100 flex-shrink-0">
                          {spaceImg ? (
                            <Image
                              src={spaceImg}
                              alt={space.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl">
                              {"\uD83C\uDFAA"}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 p-4">
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {space.name}
                          </h3>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 mb-2">
                            <span className="flex items-center gap-1">
                              <FaUsers className="text-gray-400" /> Capacity:{" "}
                              {space.capacity}
                            </span>
                            <span className="flex items-center gap-1">
                              <MdMeetingRoom className="text-gray-400" />{" "}
                              <span className="capitalize">
                                {space.pricingMode}
                              </span>
                            </span>
                          </div>
                          {space.description && (
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                              {space.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2 text-xs mb-2">
                            {space.hourlyRate != null &&
                              Number(space.hourlyRate) > 0 && (
                                <span className="bg-gray-50 text-gray-600 px-2 py-0.5 rounded-full">
                                  {showUsd && toUsd(space.hourlyRate)
                                    ? toUsd(space.hourlyRate)
                                    : formatPrice(space.hourlyRate)}
                                  /hr
                                </span>
                              )}
                            {space.dailyRate != null &&
                              Number(space.dailyRate) > 0 && (
                                <span className="bg-gray-50 text-gray-600 px-2 py-0.5 rounded-full">
                                  {showUsd && toUsd(space.dailyRate)
                                    ? toUsd(space.dailyRate)
                                    : formatPrice(space.dailyRate)}
                                  /day
                                </span>
                              )}
                            {space.packageRate != null &&
                              Number(space.packageRate) > 0 && (
                                <span className="bg-gray-50 text-gray-600 px-2 py-0.5 rounded-full">
                                  {showUsd && toUsd(space.packageRate)
                                    ? toUsd(space.packageRate)
                                    : formatPrice(space.packageRate)}{" "}
                                  ({space.packageName ?? "Package"})
                                </span>
                              )}
                          </div>
                          <p className="font-bold text-gray-900 text-sm">
                            {pricingLabel(space)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Nearby places */}
            {ec.nearbyPlaces && ec.nearbyPlaces.length > 0 && (
              <section>
                <h2 className="font-semibold text-gray-900 mb-2">
                  What&apos;s nearby
                </h2>
                <div className="flex flex-wrap gap-2">
                  {ec.nearbyPlaces.map((p, i) => (
                    <span
                      key={i}
                      className="bg-gray-50 text-gray-700 text-sm px-3 py-1.5 rounded-full"
                    >
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
                    {Number(ec.averageRating).toFixed(1)} · {reviews.length}{" "}
                    {reviews.length === 1 ? "review" : "reviews"}
                  </span>
                )}
              </div>

              <ReviewList
                reviews={reviews}
                onDelete={(rid) =>
                  setReviews((prev) => prev.filter((r) => r.id !== rid))
                }
              />

              <div className="mt-8">
                <ReviewForm
                  eventCenterId={ec.id}
                  redirectTo={`/events/${ec.id}`}
                  onSuccess={() =>
                    api
                      .get(`/reviews/event-center/${ec.id}`)
                      .then((res) =>
                        setReviews(
                          res.data.data.reviews ?? res.data.data ?? []
                        )
                      )
                      .catch(() => {})
                  }
                />
              </div>
            </section>
          </div>

          {/* Right -- sticky booking widget */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              <EventBookingWidget eventCenter={ec} />
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
