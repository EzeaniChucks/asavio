"use client";

// components/home/LuxuryVehicles.tsx
import Link from "next/link";
import { motion } from "framer-motion";
import { FaArrowRight, FaCar } from "react-icons/fa";

const vehicleShowcase = [
  {
    type: "Sedan",
    example: "Mercedes S-Class",
    price: 250,
    emoji: "🚗",
    features: ["Chauffeur available", "GPS", "Wi-Fi"],
    bg: "bg-gray-900",
  },
  {
    type: "SUV",
    example: "Range Rover Vogue",
    price: 350,
    emoji: "🚙",
    features: ["7 seats", "Off-road capable", "Panoramic roof"],
    bg: "bg-zinc-800",
  },
  {
    type: "Sports",
    example: "Lamborghini Huracán",
    price: 900,
    emoji: "🏎️",
    features: ["V10 engine", "Track mode", "Carbon interior"],
    bg: "bg-neutral-900",
  },
  {
    type: "MPV / Van",
    example: "Mercedes V-Class",
    price: 300,
    emoji: "🚐",
    features: ["8 seats", "Airport transfers", "Executive spec"],
    bg: "bg-stone-800",
  },
];

export default function LuxuryVehicles() {
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
          {vehicleShowcase.map((vehicle, i) => (
            <motion.div
              key={vehicle.type}
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`${vehicle.bg} rounded-2xl p-6 min-w-[260px] md:min-w-0 flex-shrink-0 md:flex-shrink snap-start border border-white/10 hover:border-secondary/50 transition-colors group cursor-pointer`}
            >
              <div className="text-5xl mb-5">{vehicle.emoji}</div>
              <p className="text-secondary text-xs font-semibold uppercase tracking-widest mb-1">
                {vehicle.type}
              </p>
              <h3 className="text-white font-semibold text-lg mb-4 leading-tight">
                {vehicle.example}
              </h3>
              <ul className="space-y-1.5 mb-6">
                {vehicle.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-gray-400 text-sm">
                    <span className="w-1 h-1 rounded-full bg-secondary flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-white font-bold text-xl">${vehicle.price}</span>
                  <span className="text-gray-500 text-sm"> / day</span>
                </div>
                <FaCar className="text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
