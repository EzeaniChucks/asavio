"use client";

// app/hotels/page.tsx — public hotels list
import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { FaSearch, FaSlidersH, FaStar, FaTimes } from "react-icons/fa";
import { api } from "@/lib/api";
import { Hotel } from "@/types";
import HotelCard from "@/components/cards/HotelCard";
import PropertySkeleton from "@/components/ui/PropertySkeleton";

const SORT_OPTIONS = [
  { value: "newest",     label: "Newest first" },
  { value: "price_asc",  label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating",     label: "Top rated" },
];

function HotelsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [hotels, setHotels]       = useState<Hotel[]>([]);
  const [total, setTotal]         = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [hotelTypes, setHotelTypes]   = useState<string[]>([]);

  useEffect(() => {
    api.get("/hotels/types")
      .then((res) => setHotelTypes(res.data.data.types ?? []))
      .catch(() => {});
  }, []);

  const activeType  = searchParams.get("hotelType") ?? "";
  const activeSort  = searchParams.get("sort") ?? "newest";
  const activeCity  = searchParams.get("city") ?? "";
  const activeMin   = searchParams.get("minPrice") ?? "";
  const activeMax   = searchParams.get("maxPrice") ?? "";
  const activeStar  = searchParams.get("star") ?? "";
  const activeGuests = searchParams.get("guests") ?? "";

  const [draftMin, setDraftMin]     = useState(activeMin);
  const [draftMax, setDraftMax]     = useState(activeMax);
  const [draftStar, setDraftStar]   = useState(activeStar);
  const [draftGuests, setDraftGuests] = useState(activeGuests);

  const setParam = useCallback((key: string, value: string) => {
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set(key, value); else p.delete(key);
    router.replace(`/hotels?${p.toString()}`);
  }, [searchParams, router]);

  const applyDrawerFilters = () => {
    const p = new URLSearchParams(searchParams.toString());
    draftMin ? p.set("minPrice", draftMin) : p.delete("minPrice");
    draftMax ? p.set("maxPrice", draftMax) : p.delete("maxPrice");
    draftStar ? p.set("star", draftStar) : p.delete("star");
    draftGuests ? p.set("guests", draftGuests) : p.delete("guests");
    router.replace(`/hotels?${p.toString()}`);
    setShowFilters(false);
  };

  const clearDrawerFilters = () => {
    setDraftMin(""); setDraftMax(""); setDraftStar(""); setDraftGuests("");
    const p = new URLSearchParams(searchParams.toString());
    ["minPrice", "maxPrice", "star", "guests"].forEach((k) => p.delete(k));
    router.replace(`/hotels?${p.toString()}`);
    setShowFilters(false);
  };

  useEffect(() => {
    setIsLoading(true);
    const params: Record<string, string> = { sort: activeSort };
    if (activeType)   params.hotelType = activeType;
    if (activeCity)   params.city      = activeCity;
    if (activeMin)    params.minPrice  = activeMin;
    if (activeMax)    params.maxPrice  = activeMax;
    if (activeStar)   params.star      = activeStar;
    if (activeGuests) params.guests    = activeGuests;

    api.get("/hotels", { params })
      .then((res) => {
        setHotels(res.data.data.hotels ?? []);
        setTotal(res.data.data.total ?? 0);
      })
      .catch(() => setHotels([]))
      .finally(() => setIsLoading(false));
  }, [activeType, activeSort, activeCity, activeMin, activeMax, activeStar, activeGuests]);

  const hasFilters = !!(activeType || activeCity || activeMin || activeMax || activeStar || activeGuests);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Hotels</h1>
          <p className="text-gray-500 text-sm">
            {isLoading ? "Searching…" : `${total} ${total === 1 ? "hotel" : "hotels"} found`}
            {activeCity && <> in {activeCity}</>}
          </p>
        </div>

        {/* Filter bar */}
        <div className="bg-white rounded-2xl border border-gray-100 p-3 mb-6 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-sm" />
            <input
              type="text"
              placeholder="City (e.g. Lagos, Abuja)"
              defaultValue={activeCity}
              onBlur={(e) => setParam("city", e.target.value.trim())}
              onKeyDown={(e) => {
                if (e.key === "Enter") setParam("city", (e.target as HTMLInputElement).value.trim());
              }}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>

          <select
            value={activeType}
            onChange={(e) => setParam("hotelType", e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black/10"
          >
            <option value="">All types</option>
            {hotelTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <select
            value={activeSort}
            onChange={(e) => setParam("sort", e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black/10"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <button
            onClick={() => setShowFilters(true)}
            className={`inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm transition ${
              hasFilters
                ? "border-black text-black bg-gray-50"
                : "border-gray-200 text-gray-600 hover:border-gray-400"
            }`}
          >
            <FaSlidersH className="text-xs" />
            More filters
          </button>
        </div>

        {/* Hotel grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => <PropertySkeleton key={i} />)}
          </div>
        ) : hotels.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <p className="text-5xl mb-3">🏨</p>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hotels found</h3>
            <p className="text-sm text-gray-500">
              {hasFilters ? "Try removing some filters." : "Check back soon for new listings."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {hotels.map((hotel, index) => (
              <HotelCard key={hotel.id} hotel={hotel} index={index} />
            ))}
          </div>
        )}
      </div>

      {/* Filter drawer */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center px-0 md:px-4"
          onClick={() => setShowFilters(false)}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white w-full md:max-w-md rounded-t-3xl md:rounded-2xl p-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900">More filters</h2>
              <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-black">
                <FaTimes />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Minimum star rating</label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((n) => {
                    const active = String(n) === draftStar;
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setDraftStar(active ? "" : String(n))}
                        className={`flex-1 py-2 rounded-xl border transition ${
                          active
                            ? "bg-amber-50 border-amber-300 text-amber-600"
                            : "border-gray-200 text-gray-400 hover:border-gray-400"
                        }`}
                      >
                        <FaStar className="mx-auto" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Min price (₦)</label>
                  <input
                    type="number"
                    min={0}
                    value={draftMin}
                    onChange={(e) => setDraftMin(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Max price (₦)</label>
                  <input
                    type="number"
                    min={0}
                    value={draftMax}
                    onChange={(e) => setDraftMax(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Guests per room</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={draftGuests}
                  onChange={(e) => setDraftGuests(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={clearDrawerFilters}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium hover:border-gray-400 transition"
              >
                Clear
              </button>
              <button
                onClick={applyDrawerFilters}
                className="flex-1 py-2.5 bg-black text-white font-semibold rounded-xl hover:bg-gray-800 transition"
              >
                Apply
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

export default function HotelsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="loader" /></div>}>
      <HotelsContent />
    </Suspense>
  );
}
