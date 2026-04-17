"use client";

// components/home/FeaturedEventCenters.tsx
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaArrowRight, FaStar, FaMapMarkerAlt, FaUsers } from "react-icons/fa";
import { api } from "@/lib/api";
import { EventCenter } from "@/types";
import { formatPrice } from "@/lib/formatPrice";
import { useCurrency } from "@/context/CurrencyContext";

function getCheapestPrice(ec: EventCenter): number | null {
  const prices = (ec.spaces ?? []).flatMap((s) =>
    [s.hourlyRate, s.dailyRate, s.packageRate]
      .filter((p): p is number => p != null && Number.isFinite(Number(p)) && Number(p) > 0)
      .map(Number)
  );
  return prices.length ? Math.min(...prices) : null;
}

export default function FeaturedEventCenters() {
  const [ecs, setEcs] = useState<EventCenter[]>([]);
  const { showUsd, toUsd } = useCurrency();

  useEffect(() => {
    api
      .get("/event-centers?limit=4&sort=rating")
      .then((res) => setEcs(res.data.data.eventCenters ?? []))
      .catch(() => {});
  }, []);

  if (!ecs.length) return null;

  return (
    <section className="py-20 bg-white">
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
              Celebrate in style
            </p>
            <h2 className="heading-2 text-gray-900">Event Venues</h2>
          </div>
          <Link
            href="/events"
            className="inline-flex items-center gap-2 font-semibold text-gray-900 hover:gap-3 transition-all group"
          >
            Browse venues
            <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {ecs.map((ec, i) => {
            const image = ec.images?.find((img) => img.isPrimary)?.url ?? ec.images?.[0]?.url;
            const cheapest = getCheapestPrice(ec);
            const maxCap = Math.max(0, ...(ec.spaces ?? []).map((s) => s.capacity || 0));

            return (
              <motion.div
                key={ec.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Link
                  href={`/events/${ec.id}`}
                  className="group block bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all"
                >
                  <div className="relative h-44 bg-gray-100">
                    {image ? (
                      <Image
                        src={image}
                        alt={ec.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, 25vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">🎪</div>
                    )}
                    {ec.totalReviews > 0 && (
                      <span className="absolute top-3 right-3 flex items-center gap-1 bg-black/70 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                        <FaStar className="text-yellow-400 text-[10px]" />
                        {Number(ec.averageRating).toFixed(1)}
                      </span>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-1 mb-0.5">
                      {ec.name}
                    </h3>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mb-2">
                      <FaMapMarkerAlt className="text-[10px]" />
                      {ec.location.city}, {ec.location.country}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                      {ec.spaces?.length > 0 && (
                        <span>{ec.spaces.length} {ec.spaces.length === 1 ? "space" : "spaces"}</span>
                      )}
                      {maxCap > 0 && (
                        <span className="flex items-center gap-0.5">
                          <FaUsers className="text-[10px]" /> Up to {maxCap}
                        </span>
                      )}
                    </div>
                    {cheapest ? (
                      <p className="font-bold text-gray-900 text-sm">
                        From {showUsd && toUsd(cheapest) ? toUsd(cheapest) : formatPrice(cheapest)}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400 italic">Spaces coming soon</p>
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
