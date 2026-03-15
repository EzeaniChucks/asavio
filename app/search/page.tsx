"use client";

// app/search/page.tsx
import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaArrowLeft, FaMapMarkerAlt, FaUsers, FaCalendarAlt } from "react-icons/fa";
import PropertyCard from "@/components/cards/PropertyCard";
import { Suspense } from "react";
import PropertySkeleton from "@/components/ui/PropertySkeleton";
import { api } from "@/lib/api";
import { Property } from "@/types";

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function SearchContent() {
  const searchParams = useSearchParams();

  const location = searchParams.get("location") || "";
  const guests = searchParams.get("guests") || "";
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchResults = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (location) params.set("city", location);
      if (guests) params.set("maxGuests", guests);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const res = await api.get(`/properties?${params.toString()}`);
      setProperties(res.data.data.properties);
    } catch {
      setProperties([]);
    } finally {
      setIsLoading(false);
    }
  }, [location, guests, startDate, endDate]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="container py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-black transition-colors mb-4 text-sm"
          >
            <FaArrowLeft />
            Back to home
          </Link>

          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            {location ? `Properties in "${location}"` : "All available properties"}
          </h1>

          {/* Search summary pills */}
          <div className="flex flex-wrap gap-3">
            {location && (
              <div className="flex items-center gap-2 bg-gray-100 text-gray-700 text-sm px-3 py-1.5 rounded-full">
                <FaMapMarkerAlt className="text-gray-400 text-xs" />
                {location}
              </div>
            )}
            {(startDate || endDate) && (
              <div className="flex items-center gap-2 bg-gray-100 text-gray-700 text-sm px-3 py-1.5 rounded-full">
                <FaCalendarAlt className="text-gray-400 text-xs" />
                {formatDate(startDate)} — {formatDate(endDate)}
              </div>
            )}
            {guests && (
              <div className="flex items-center gap-2 bg-gray-100 text-gray-700 text-sm px-3 py-1.5 rounded-full">
                <FaUsers className="text-gray-400 text-xs" />
                {guests} {Number(guests) === 1 ? "guest" : "guests"}
              </div>
            )}
          </div>

          <p className="text-gray-500 mt-3 text-sm">
            {isLoading
              ? "Searching…"
              : `${properties.length} ${properties.length === 1 ? "property" : "properties"} found`}
          </p>
        </div>
      </div>

      {/* Results */}
      <div className="container py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <PropertySkeleton key={i} />
            ))}
          </div>
        ) : properties.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24"
          >
            <p className="text-5xl mb-4">🏠</p>
            <h2 className="text-2xl font-semibold mb-2">No results found</h2>
            <p className="text-gray-500 mb-6">
              We couldn&apos;t find properties matching your search.
              <br />
              Try a different location or adjust your dates.
            </p>
            <Link href="/properties" className="btn-primary">
              Browse all properties
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {properties.map((property, i) => (
              <PropertyCard key={property.id} property={property} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
