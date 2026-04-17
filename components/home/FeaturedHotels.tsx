"use client";

// components/home/FeaturedHotels.tsx
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaArrowRight, FaStar, FaCheckCircle, FaMapMarkerAlt } from "react-icons/fa";
import { api } from "@/lib/api";
import { Hotel } from "@/types";
import { formatPrice } from "@/lib/formatPrice";
import { useCurrency } from "@/context/CurrencyContext";

export default function FeaturedHotels() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const { showUsd, toUsd } = useCurrency();

  useEffect(() => {
    api
      .get("/hotels/type-representatives")
      .then((res) => setHotels(res.data.data.hotels ?? []))
      .catch(() => {});
  }, []);

  if (!hotels.length) return null;

  return (
    <section className="py-20 bg-gray-50">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10"
        >
          <div>
            <p className="text-secondary font-medium uppercase tracking-widest text-sm mb-2">
              Stay in style
            </p>
            <h2 className="heading-2 text-gray-900">Featured Hotels</h2>
          </div>
          <Link
            href="/hotels"
            className="inline-flex items-center gap-2 font-semibold text-gray-900 hover:gap-3 transition-all group"
          >
            Browse hotels
            <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        {/* Cards — horizontal scroll on mobile, grid on desktop */}
        <div className="flex gap-6 overflow-x-auto pb-4 md:grid md:grid-cols-4 md:overflow-visible snap-x snap-mandatory md:snap-none">
          {hotels.map((hotel, i) => {
            const image = hotel.images?.find((img) => img.isPrimary)?.url ?? hotel.images?.[0]?.url;
            const cheapest = (hotel.roomTypes ?? [])
              .map((r) => Number(r.pricePerNight))
              .filter((n) => Number.isFinite(n) && n > 0)
              .sort((a, b) => a - b)[0];

            return (
              <motion.div
                key={hotel.id}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-white rounded-2xl min-w-[260px] md:min-w-0 flex-shrink-0 md:flex-shrink snap-start border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all group overflow-hidden"
              >
                <Link href={`/hotels/${hotel.id}`} className="block">
                  <div className="relative h-44 w-full bg-gray-100">
                    {image ? (
                      <Image
                        src={image}
                        alt={hotel.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 260px, 25vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">🏨</div>
                    )}
                    {typeof hotel.starRating === "number" && hotel.starRating > 0 && (
                      <span className="absolute top-3 left-3 flex items-center gap-0.5 bg-amber-500/95 text-white text-[10px] font-semibold px-2 py-1 rounded-full">
                        {Array.from({ length: hotel.starRating }).map((_, n) => (
                          <FaStar key={n} className="text-[9px]" />
                        ))}
                        {hotel.verifiedStarRating && (
                          <FaCheckCircle className="text-white ml-0.5 text-[9px]" />
                        )}
                      </span>
                    )}
                  </div>

                  <div className="p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">
                      {hotel.hotelType}
                    </p>
                    <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-1 mb-1">
                      {hotel.name}
                    </h3>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mb-3">
                      <FaMapMarkerAlt className="text-[10px]" />
                      {hotel.location.city}, {hotel.location.country}
                    </p>
                    {cheapest ? (
                      <div>
                        <p className="text-gray-400 text-[10px] uppercase tracking-wide">From</p>
                        <p className="font-bold text-gray-900 text-base">
                          {showUsd && toUsd(cheapest) ? toUsd(cheapest) : formatPrice(cheapest)}
                          <span className="text-gray-400 font-normal text-xs ml-1">/ night</span>
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">Rooms coming soon</p>
                    )}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
