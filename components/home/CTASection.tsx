// components/home/CTASection.tsx
"use client"
import Link from "next/link";
import { motion } from "framer-motion";
import { FaArrowRight, FaHome } from "react-icons/fa";

export default function CTASection() {
  return (
    <section className="py-20 bg-black relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full border border-white/5 translate-x-1/3 -translate-y-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full border border-white/5 -translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div className="container relative">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-secondary mb-8">
              <FaHome className="text-black text-2xl" />
            </div>

            <h2 className="heading-2 text-white mb-5">
              Have a Property to List?
            </h2>
            <p className="text-gray-400 text-xl leading-relaxed mb-10">
              Join our growing community of hosts and earn income from your
              property. We handle the marketing — you enjoy the returns.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register?role=host"
                className="inline-flex items-center justify-center gap-2 bg-secondary text-black font-semibold px-8 py-4 rounded-xl hover:bg-yellow-400 transition-colors group"
              >
                Become a Host
                <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/properties"
                className="inline-flex items-center justify-center gap-2 border border-white/20 text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/10 transition-colors"
              >
                Browse Listings
              </Link>
            </div>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-16 grid grid-cols-3 gap-6 border-t border-white/10 pt-10"
          >
            {[
              { value: "500+", label: "Listed properties" },
              { value: "12K+", label: "Happy guests" },
              { value: "4.9★", label: "Average rating" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-secondary font-bold text-3xl mb-1">{stat.value}</p>
                <p className="text-gray-500 text-sm">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
