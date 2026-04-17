"use client";

// app/search/page.tsx — unified search across properties, vehicles, hotels, and event centers
import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaArrowLeft, FaMapMarkerAlt, FaUsers, FaCalendarAlt } from "react-icons/fa";
import PropertyCard from "@/components/cards/PropertyCard";
import VehicleCard from "@/components/cards/VehicleCard";
import HotelCard from "@/components/cards/HotelCard";
import EventCenterCard from "@/components/cards/EventCenterCard";
import { Suspense } from "react";
import PropertySkeleton from "@/components/ui/PropertySkeleton";
import { api } from "@/lib/api";
import { Property, Vehicle, Hotel, EventCenter } from "@/types";

type Category = "properties" | "vehicles" | "hotels" | "events";

const CATEGORY_CONFIG: Record<Category, { label: string; plural: string; emoji: string; browseHref: string }> = {
  properties: { label: "Shortlets",     plural: "properties",    emoji: "🏠", browseHref: "/properties" },
  vehicles:   { label: "Vehicles",      plural: "vehicles",      emoji: "🚗", browseHref: "/vehicles" },
  hotels:     { label: "Hotels",        plural: "hotels",        emoji: "🏨", browseHref: "/hotels" },
  events:     { label: "Event Venues",  plural: "event venues",  emoji: "🎪", browseHref: "/events" },
};

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
  const category = (searchParams.get("category") as Category) || "properties";

  const cfg = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.properties;

  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchResults = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();

      if (category === "properties") {
        if (location) params.set("city", location);
        if (guests) params.set("maxGuests", guests);
        const res = await api.get(`/properties?${params.toString()}`);
        setResults(res.data.data.properties ?? []);
      } else if (category === "vehicles") {
        if (location) params.set("location", location);
        if (guests) params.set("seats", guests);
        const res = await api.get(`/vehicles?${params.toString()}`);
        setResults(res.data.data.vehicles ?? []);
      } else if (category === "hotels") {
        if (location) params.set("city", location);
        if (guests) params.set("guests", guests);
        const res = await api.get(`/hotels?${params.toString()}`);
        setResults(res.data.data.hotels ?? []);
      } else {
        // events
        if (location) params.set("city", location);
        if (guests) params.set("minCapacity", guests);
        const res = await api.get(`/event-centers?${params.toString()}`);
        setResults(res.data.data.eventCenters ?? []);
      }
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [location, guests, category]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const renderCard = (item: any, index: number) => {
    switch (category) {
      case "properties": return <PropertyCard key={item.id} property={item as Property} index={index} />;
      case "vehicles":   return <VehicleCard   key={item.id} vehicle={item as Vehicle}   index={index} />;
      case "hotels":     return <HotelCard     key={item.id} hotel={item as Hotel}       index={index} />;
      case "events":     return <EventCenterCard key={item.id} eventCenter={item as EventCenter} index={index} />;
    }
  };

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
            {location
              ? `${cfg.label} in "${location}"`
              : `All available ${cfg.plural}`}
          </h1>

          {/* Category tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-4 w-fit">
            {(Object.entries(CATEGORY_CONFIG) as [Category, typeof cfg][]).map(([key, c]) => (
              <Link
                key={key}
                href={`/search?${new URLSearchParams({
                  ...(location ? { location } : {}),
                  ...(guests ? { guests } : {}),
                  ...(startDate ? { startDate } : {}),
                  ...(endDate ? { endDate } : {}),
                  category: key,
                }).toString()}`}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  category === key
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <span className="mr-1">{c.emoji}</span>
                {c.label}
              </Link>
            ))}
          </div>

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
              : `${results.length} ${results.length === 1 ? cfg.plural.replace(/s$/, "") : cfg.plural} found`}
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
        ) : results.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24"
          >
            <p className="text-5xl mb-4">{cfg.emoji}</p>
            <h2 className="text-2xl font-semibold mb-2">No results found</h2>
            <p className="text-gray-500 mb-6">
              We couldn&apos;t find {cfg.plural} matching your search.
              <br />
              Try a different location or adjust your filters.
            </p>
            <Link href={cfg.browseHref} className="btn-primary">
              Browse all {cfg.plural}
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {results.map((item, i) => renderCard(item, i))}
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
