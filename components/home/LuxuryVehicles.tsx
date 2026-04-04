"use client";

// components/home/LuxuryVehicles.tsx
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FaArrowRight, FaCar } from "react-icons/fa";
import { api } from "@/lib/api";
import { Vehicle } from "@/types";
import { formatPrice } from "@/lib/formatPrice";

const TYPE_LABELS: Record<string, string> = {
  sedan: "Sedan", suv: "SUV", sports: "Sports", luxury: "Luxury",
  van: "Van", pickup: "Pickup", convertible: "Convertible", electric: "Electric",
};

function labelFor(type: string) {
  return TYPE_LABELS[type.toLowerCase()] ?? (type.charAt(0).toUpperCase() + type.slice(1));
}

export default function LuxuryVehicles() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    api
      .get("/vehicles/type-representatives")
      .then((res) => setVehicles(res.data.data.vehicles ?? []))
      .catch(() => {});
  }, []);

  if (!vehicles.length) return null;

  return (
    <section className="py-20 bg-black text-white overflow-hidden">
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12"
        >
          <div>
            <p className="text-secondary font-medium uppercase tracking-widest text-sm mb-2">
              Arrive in style
            </p>
            <h2 className="heading-2 text-white">Luxury Vehicles</h2>
          </div>
          <Link
            href="/vehicles"
            className="flex items-center gap-2 text-secondary font-semibold hover:gap-3 transition-all group"
          >
            Browse fleet
            <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        {/* Cards — horizontal scroll on mobile, grid on desktop */}
        <div className="flex gap-6 overflow-x-auto pb-4 md:grid md:grid-cols-4 md:overflow-visible snap-x snap-mandatory md:snap-none">
          {vehicles.map((vehicle, i) => {
            const image = vehicle.images?.[0]?.url;
            const features = (vehicle.features ?? []).slice(0, 3);
            return (
              <motion.div
                key={vehicle.id}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                onClick={() =>
                  router.push(
                    `/vehicles?vehicleType=${encodeURIComponent(vehicle.vehicleType)}`
                  )
                }
                className="bg-gray-900 rounded-2xl min-w-[260px] md:min-w-0 flex-shrink-0 md:flex-shrink snap-start border border-white/10 hover:border-secondary/50 transition-colors group cursor-pointer overflow-hidden"
              >
                {/* Vehicle photo */}
                <div className="relative h-44 w-full bg-gray-800">
                  {image ? (
                    <Image
                      src={image}
                      alt={`${vehicle.make} ${vehicle.model}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 260px, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">🚗</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
                </div>

                <div className="p-6">
                  <p className="text-secondary text-xs font-semibold uppercase tracking-widest mb-1">
                    {labelFor(vehicle.vehicleType)}
                  </p>
                  <h3 className="text-white font-semibold text-lg mb-4 leading-tight">
                    {vehicle.make} {vehicle.model}
                  </h3>
                  {features.length > 0 && (
                    <ul className="space-y-1.5 mb-6">
                      {features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-gray-400 text-sm">
                          <span className="w-1 h-1 rounded-full bg-secondary flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-white font-bold text-xl">
                        {formatPrice(vehicle.pricePerDay)}
                      </span>
                      <span className="text-gray-500 text-sm"> / day</span>
                    </div>
                    <FaCar className="text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
