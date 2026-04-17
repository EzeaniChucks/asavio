"use client";

// components/cards/HotelCard.tsx
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaStar, FaUsers, FaBed, FaCheckCircle, FaMapMarkerAlt } from "react-icons/fa";
import { Hotel } from "@/types";
import { formatPrice } from "@/lib/formatPrice";
import HostTierBadge from "@/components/ui/HostTierBadge";
import { useCurrency } from "@/context/CurrencyContext";

interface HotelCardProps {
  hotel: Hotel;
  index: number;
}

export default function HotelCard({ hotel, index }: HotelCardProps) {
  const primaryImg = hotel.images?.find((i) => i.isPrimary)?.url ?? hotel.images?.[0]?.url;

  // "From" price — cheapest room type
  const cheapestRoom = (hotel.roomTypes ?? [])
    .map((r) => Number(r.pricePerNight))
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => a - b)[0];

  const { showUsd, toUsd } = useCurrency();
  const usdEstimate = cheapestRoom ? toUsd(cheapestRoom) : null;

  const maxGuestsAcrossTypes = Math.max(
    0,
    ...(hotel.roomTypes ?? []).map((r) => Number(r.maxGuests) || 0)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.07, 0.4) }}
      viewport={{ once: true }}
    >
      <Link
        href={`/hotels/${hotel.id}`}
        className="group block bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-300"
      >
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          {primaryImg ? (
            <Image
              src={primaryImg}
              alt={hotel.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">🏨</div>
          )}

          {/* Type + star rating badges */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            <span className="bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-semibold px-2.5 py-1 rounded-full">
              {hotel.hotelType}
            </span>
            {typeof hotel.starRating === "number" && hotel.starRating > 0 && (
              <span className="flex items-center gap-0.5 bg-amber-500/95 text-white text-[10px] font-semibold px-2 py-1 rounded-full">
                {Array.from({ length: hotel.starRating }).map((_, i) => (
                  <FaStar key={i} className="text-[9px]" />
                ))}
                {hotel.verifiedStarRating && (
                  <FaCheckCircle className="text-white ml-0.5 text-[9px]" />
                )}
              </span>
            )}
          </div>

          {/* Rating overlay */}
          {hotel.totalReviews > 0 && (
            <span className="absolute top-3 right-3 flex items-center gap-1 bg-black/70 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
              <FaStar className="text-yellow-400 text-[10px]" />
              {Number(hotel.averageRating).toFixed(1)}
            </span>
          )}
        </div>

        {/* Body */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-1 mb-0.5 group-hover:text-black transition-colors">
            {hotel.name}
          </h3>
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <FaMapMarkerAlt className="text-[10px]" />
              {hotel.location.city}, {hotel.location.country}
            </p>
            {hotel.host?.hostTier && hotel.host.hostTier !== "new_host" && (
              <HostTierBadge tier={hotel.host.hostTier} />
            )}
          </div>
          {hotel.host && (
            <p className="text-xs text-gray-400 mb-1">
              Hosted by{" "}
              <span className="text-gray-500 font-medium">
                {hotel.host.firstName} {hotel.host.lastName}
              </span>
            </p>
          )}

          {/* Stats chips */}
          <div className="flex items-center gap-1.5 flex-wrap mb-4">
            <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-600 text-xs px-2 py-1 rounded-lg">
              <FaBed className="text-[10px]" />
              {hotel.roomTypes?.length ?? 0}{" "}
              {hotel.roomTypes?.length === 1 ? "room type" : "room types"}
            </span>
            {maxGuestsAcrossTypes > 0 && (
              <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-600 text-xs px-2 py-1 rounded-lg">
                <FaUsers className="text-[10px]" />
                Up to {maxGuestsAcrossTypes}
              </span>
            )}
          </div>

          {/* Price row */}
          <div className="flex items-baseline justify-between pt-3 border-t border-gray-100">
            <div>
              {cheapestRoom ? (
                <>
                  <span className="text-xs text-gray-400 mr-1">From</span>
                  <span className="font-bold text-gray-900 text-base">
                    {showUsd && usdEstimate ? usdEstimate : formatPrice(cheapestRoom)}
                  </span>
                  <span className="text-gray-400 text-xs ml-1">/ night</span>
                  {usdEstimate && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {showUsd ? formatPrice(cheapestRoom) : usdEstimate}
                    </p>
                  )}
                </>
              ) : (
                <span className="text-xs text-gray-400 italic">No rooms listed yet</span>
              )}
            </div>
            {hotel.totalReviews > 0 && (
              <span className="text-xs text-gray-400">
                {hotel.totalReviews} {hotel.totalReviews === 1 ? "review" : "reviews"}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
