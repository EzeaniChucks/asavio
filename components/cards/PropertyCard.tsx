"use client";

// components/cards/PropertyCard.tsx
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaStar, FaUsers, FaBed, FaBath } from "react-icons/fa";
import { Property } from "@/types";
import { formatPrice } from "@/lib/formatPrice";
import HostTierBadge from "@/components/ui/HostTierBadge";

interface PropertyCardProps {
  property: Property;
  index: number;
}

export default function PropertyCard({ property, index }: PropertyCardProps) {
  const image = property.images?.[0]?.url;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.07, 0.4) }}
      viewport={{ once: true }}
    >
      <Link
        href={`/properties/${property.id}`}
        className="group block bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-300"
      >
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          {image ? (
            <Image
              src={image}
              alt={property.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">🏠</div>
          )}

          {/* Type badge */}
          <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-semibold px-2.5 py-1 rounded-full capitalize">
            {property.propertyType}
          </span>

          {/* Rating overlay */}
          {property.totalReviews > 0 && (
            <span className="absolute top-3 right-3 flex items-center gap-1 bg-black/70 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
              <FaStar className="text-yellow-400 text-[10px]" />
              {Number(property.averageRating).toFixed(1)}
            </span>
          )}
        </div>

        {/* Body */}
        <div className="p-4">
          {/* Title + location */}
          <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-1 mb-0.5 group-hover:text-black transition-colors">
            {property.title}
          </h3>
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-xs text-gray-400">
              {property.location.city}, {property.location.country}
            </p>
            {property.host?.hostTier && property.host.hostTier !== "new_host" && (
              <HostTierBadge tier={property.host.hostTier} />
            )}
          </div>
          {property.host && (
            <p className="text-xs text-gray-400 mb-1">
              Hosted by <span className="text-gray-500 font-medium">{property.host.firstName} {property.host.lastName}</span>
            </p>
          )}

          {/* Stats chips */}
          <div className="flex items-center gap-1.5 flex-wrap mb-4">
            <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-600 text-xs px-2 py-1 rounded-lg">
              <FaUsers className="text-[10px]" />
              {property.maxGuests}
            </span>
            <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-600 text-xs px-2 py-1 rounded-lg">
              <FaBed className="text-[10px]" />
              {property.bedrooms} {property.bedrooms === 1 ? "bed" : "beds"}
            </span>
            <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-600 text-xs px-2 py-1 rounded-lg">
              <FaBath className="text-[10px]" />
              {property.bathrooms} {property.bathrooms === 1 ? "bath" : "baths"}
            </span>
          </div>

          {/* Price row */}
          <div className="flex items-baseline justify-between pt-3 border-t border-gray-100">
            <div>
              <span className="font-bold text-gray-900 text-base">{formatPrice(property.pricePerNight)}</span>
              <span className="text-gray-400 text-xs ml-1">/ night</span>
            </div>
            {property.totalReviews > 0 && (
              <span className="text-xs text-gray-400">
                {property.totalReviews} {property.totalReviews === 1 ? "review" : "reviews"}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
