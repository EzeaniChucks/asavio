"use client";

// components/home/FeaturedProperties.tsx
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaArrowRight } from "react-icons/fa";
import PropertyCard from "@/components/cards/PropertyCard";
import PropertySkeleton from "@/components/ui/PropertySkeleton";
import { api } from "@/lib/api";
import { Property } from "@/types";

export default function FeaturedProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .get("/properties?limit=6")
      .then((res) => setProperties(res.data.data.properties))
      .catch(() => setProperties([]))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <section className="py-20 bg-white">
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
            <p className="text-accent font-medium uppercase tracking-widest text-sm mb-2">
              Handpicked for you
            </p>
            <h2 className="heading-2">Featured Properties</h2>
          </div>
          <Link
            href="/properties"
            className="flex items-center gap-2 text-black font-semibold hover:gap-3 transition-all group"
          >
            View all listings
            <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <PropertySkeleton key={i} />
              ))
            : properties.length > 0
            ? properties.map((property, i) => (
                <PropertyCard key={property.id} property={property} index={i} />
              ))
            : !isLoading && (
                <div className="col-span-3 text-center py-16 text-gray-400">
                  <p className="text-xl mb-2">No properties listed yet.</p>
                  <Link
                    href="/register?role=host"
                    className="text-black underline font-medium"
                  >
                    Be the first to list yours
                  </Link>
                </div>
              )}
        </div>
      </div>
    </section>
  );
}
