"use client";

// components/cards/EventCenterCard.tsx
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaStar, FaUsers, FaMapMarkerAlt } from "react-icons/fa";
import { MdMeetingRoom } from "react-icons/md";
import { EventCenter } from "@/types";
import { formatPrice } from "@/lib/formatPrice";
import HostTierBadge from "@/components/ui/HostTierBadge";
import { useCurrency } from "@/context/CurrencyContext";

interface EventCenterCardProps {
  eventCenter: EventCenter;
  index: number;
}

export default function EventCenterCard({ eventCenter, index }: EventCenterCardProps) {
  const primaryImg = eventCenter.images?.find((i) => i.isPrimary)?.url ?? eventCenter.images?.[0]?.url;

  // Cheapest price across all spaces — check hourlyRate, dailyRate, packageRate
  const allRates = (eventCenter.spaces ?? []).flatMap((s) =>
    [s.hourlyRate, s.dailyRate, s.packageRate]
      .filter((r): r is number => r != null && Number.isFinite(Number(r)) && Number(r) > 0)
      .map(Number)
  );
  const cheapestPrice = allRates.length > 0 ? Math.min(...allRates) : null;

  const { showUsd, toUsd } = useCurrency();
  const usdEstimate = cheapestPrice ? toUsd(cheapestPrice) : null;

  const maxCapacity = Math.max(
    0,
    ...(eventCenter.spaces ?? []).map((s) => Number(s.capacity) || 0)
  );

  const displayedTypes = (eventCenter.allowedEventTypes ?? []).slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.07, 0.4) }}
      viewport={{ once: true }}
    >
      <Link
        href={`/events/${eventCenter.id}`}
        className="group block bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-300"
      >
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          {primaryImg ? (
            <Image
              src={primaryImg}
              alt={eventCenter.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">
              {"\uD83C\uDFAA"}
            </div>
          )}

          {/* Event type chips */}
          {displayedTypes.length > 0 && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5">
              {displayedTypes.map((type) => (
                <span
                  key={type}
                  className="bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-semibold px-2.5 py-1 rounded-full"
                >
                  {type}
                </span>
              ))}
            </div>
          )}

          {/* Rating overlay */}
          {eventCenter.totalReviews > 0 && (
            <span className="absolute top-3 right-3 flex items-center gap-1 bg-black/70 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
              <FaStar className="text-yellow-400 text-[10px]" />
              {Number(eventCenter.averageRating).toFixed(1)}
            </span>
          )}
        </div>

        {/* Body */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-1 mb-0.5 group-hover:text-black transition-colors">
            {eventCenter.name}
          </h3>
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <FaMapMarkerAlt className="text-[10px]" />
              {eventCenter.location.city}, {eventCenter.location.country}
            </p>
            {eventCenter.host?.hostTier && eventCenter.host.hostTier !== "new_host" && (
              <HostTierBadge tier={eventCenter.host.hostTier} />
            )}
          </div>
          {eventCenter.host && (
            <p className="text-xs text-gray-400 mb-1">
              Hosted by{" "}
              <span className="text-gray-500 font-medium">
                {eventCenter.host.firstName} {eventCenter.host.lastName}
              </span>
            </p>
          )}

          {/* Stats chips */}
          <div className="flex items-center gap-1.5 flex-wrap mb-4">
            <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-600 text-xs px-2 py-1 rounded-lg">
              <MdMeetingRoom className="text-[10px]" />
              {eventCenter.spaces?.length ?? 0}{" "}
              {(eventCenter.spaces?.length ?? 0) === 1 ? "space" : "spaces"}
            </span>
            {maxCapacity > 0 && (
              <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-600 text-xs px-2 py-1 rounded-lg">
                <FaUsers className="text-[10px]" />
                Up to {maxCapacity} attendees
              </span>
            )}
          </div>

          {/* Price row */}
          <div className="flex items-baseline justify-between pt-3 border-t border-gray-100">
            <div>
              {cheapestPrice ? (
                <>
                  <span className="text-xs text-gray-400 mr-1">From</span>
                  <span className="font-bold text-gray-900 text-base">
                    {showUsd && usdEstimate ? usdEstimate : formatPrice(cheapestPrice)}
                  </span>
                  {usdEstimate && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {showUsd ? formatPrice(cheapestPrice) : usdEstimate}
                    </p>
                  )}
                </>
              ) : (
                <span className="text-xs text-gray-400 italic">No spaces listed yet</span>
              )}
            </div>
            {eventCenter.totalReviews > 0 && (
              <span className="text-xs text-gray-400">
                {eventCenter.totalReviews} {eventCenter.totalReviews === 1 ? "review" : "reviews"}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
