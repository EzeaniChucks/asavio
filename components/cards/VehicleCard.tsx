"use client";

// components/cards/VehicleCard.tsx
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaStar, FaUsers } from "react-icons/fa";
import { Vehicle } from "@/types";
import { formatPrice } from "@/lib/formatPrice";

interface VehicleCardProps {
  vehicle: Vehicle;
  index?: number;
}

const TYPE_LABELS: Record<string, string> = {
  sedan: "Sedan",
  suv: "SUV",
  sports: "Sports",
  luxury: "Luxury",
  van: "Van",
  pickup: "Pickup",
  convertible: "Convertible",
  electric: "Electric",
};

export default function VehicleCard({ vehicle, index = 0 }: VehicleCardProps) {
  const image = vehicle.images?.[0]?.url;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.07, 0.4) }}
      viewport={{ once: true }}
    >
      <Link
        href={`/vehicles/${vehicle.id}`}
        className="group block bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-300"
      >
        {/* Image */}
        <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
          {image ? (
            <Image
              src={image}
              alt={`${vehicle.make} ${vehicle.model}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">🚗</div>
          )}

          {/* Type + driver badges */}
          <div className="absolute top-3 left-3 flex gap-1.5">
            <span className="bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-semibold px-2.5 py-1 rounded-full">
              {TYPE_LABELS[vehicle.vehicleType] ?? vehicle.vehicleType}
            </span>
            {vehicle.priceWithDriverPerDay && (
              <span className="bg-black/75 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                Driver available
              </span>
            )}
          </div>

          {/* Rating overlay */}
          {vehicle.totalReviews > 0 && (
            <span className="absolute top-3 right-3 flex items-center gap-1 bg-black/70 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
              <FaStar className="text-yellow-400 text-[10px]" />
              {Number(vehicle.averageRating).toFixed(1)}
            </span>
          )}
        </div>

        {/* Body */}
        <div className="p-4">
          {/* Title + location */}
          <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-1 mb-0.5 group-hover:text-black transition-colors">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h3>
          {vehicle.location && (
            <p className="text-xs text-gray-400 mb-0.5">{vehicle.location}</p>
          )}
          {vehicle.host && (
            <p className="text-xs text-gray-400 mb-3">
              Listed by <span className="text-gray-500 font-medium">{vehicle.host.firstName} {vehicle.host.lastName}</span>
            </p>
          )}

          {/* Stats chips */}
          <div className="flex items-center gap-1.5 flex-wrap mb-4">
            <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-600 text-xs px-2 py-1 rounded-lg">
              <FaUsers className="text-[10px]" />
              {vehicle.seats} seats
            </span>
            {vehicle.features.slice(0, 2).map((f) => (
              <span key={f} className="bg-gray-50 text-gray-600 text-xs px-2 py-1 rounded-lg truncate max-w-[80px]">
                {f}
              </span>
            ))}
          </div>

          {/* Price row */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div>
              {vehicle.priceWithDriverPerDay ? (
                <div className="space-y-0.5">
                  <div>
                    <span className="font-bold text-gray-900 text-base">{formatPrice(vehicle.pricePerDay)}</span>
                    <span className="text-gray-400 text-xs ml-1">self-drive</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700 text-sm">{formatPrice(vehicle.priceWithDriverPerDay!)}</span>
                    <span className="text-gray-400 text-xs ml-1">with driver</span>
                  </div>
                </div>
              ) : (
                <div>
                  <span className="font-bold text-gray-900 text-base">{formatPrice(vehicle.pricePerDay)}</span>
                  <span className="text-gray-400 text-xs ml-1">/ day</span>
                </div>
              )}
            </div>
            {vehicle.totalReviews > 0 && (
              <span className="text-xs text-gray-400">
                {vehicle.totalReviews} {vehicle.totalReviews === 1 ? "review" : "reviews"}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
