"use client";

// app/events/page.tsx — public event centers list
import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { FaSearch, FaSlidersH, FaTimes } from "react-icons/fa";
import { api } from "@/lib/api";
import { EventCenter } from "@/types";
import EventCenterCard from "@/components/cards/EventCenterCard";
import PropertySkeleton from "@/components/ui/PropertySkeleton";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "rating", label: "Top rated" },
];

const EVENT_TYPES = [
  "Wedding",
  "Corporate",
  "Birthday",
  "Conference",
  "Seminar",
  "Concert",
  "Exhibition",
  "Funeral",
  "Religious",
  "Party",
  "Other",
];

function EventCentersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [eventCenters, setEventCenters] = useState<EventCenter[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const activeSort = searchParams.get("sort") ?? "newest";
  const activeCity = searchParams.get("city") ?? "";
  const activeEventType = searchParams.get("eventType") ?? "";
  const activeMinCapacity = searchParams.get("minCapacity") ?? "";
  const activeMinPrice = searchParams.get("minPrice") ?? "";
  const activeMaxPrice = searchParams.get("maxPrice") ?? "";

  const [draftEventType, setDraftEventType] = useState(activeEventType);
  const [draftMinCapacity, setDraftMinCapacity] = useState(activeMinCapacity);
  const [draftMinPrice, setDraftMinPrice] = useState(activeMinPrice);
  const [draftMaxPrice, setDraftMaxPrice] = useState(activeMaxPrice);

  const setParam = useCallback(
    (key: string, value: string) => {
      const p = new URLSearchParams(searchParams.toString());
      if (value) p.set(key, value);
      else p.delete(key);
      router.replace(`/events?${p.toString()}`);
    },
    [searchParams, router]
  );

  const applyDrawerFilters = () => {
    const p = new URLSearchParams(searchParams.toString());
    draftEventType ? p.set("eventType", draftEventType) : p.delete("eventType");
    draftMinCapacity ? p.set("minCapacity", draftMinCapacity) : p.delete("minCapacity");
    draftMinPrice ? p.set("minPrice", draftMinPrice) : p.delete("minPrice");
    draftMaxPrice ? p.set("maxPrice", draftMaxPrice) : p.delete("maxPrice");
    router.replace(`/events?${p.toString()}`);
    setShowFilters(false);
  };

  const clearDrawerFilters = () => {
    setDraftEventType("");
    setDraftMinCapacity("");
    setDraftMinPrice("");
    setDraftMaxPrice("");
    const p = new URLSearchParams(searchParams.toString());
    ["eventType", "minCapacity", "minPrice", "maxPrice"].forEach((k) => p.delete(k));
    router.replace(`/events?${p.toString()}`);
    setShowFilters(false);
  };

  useEffect(() => {
    setIsLoading(true);
    const params: Record<string, string> = { sort: activeSort };
    if (activeCity) params.city = activeCity;
    if (activeEventType) params.eventType = activeEventType;
    if (activeMinCapacity) params.minCapacity = activeMinCapacity;
    if (activeMinPrice) params.minPrice = activeMinPrice;
    if (activeMaxPrice) params.maxPrice = activeMaxPrice;

    api
      .get("/event-centers", { params })
      .then((res) => {
        setEventCenters(res.data.data.eventCenters ?? []);
        setTotal(res.data.data.total ?? 0);
      })
      .catch(() => setEventCenters([]))
      .finally(() => setIsLoading(false));
  }, [activeSort, activeCity, activeEventType, activeMinCapacity, activeMinPrice, activeMaxPrice]);

  const hasFilters = !!(activeCity || activeEventType || activeMinCapacity || activeMinPrice || activeMaxPrice);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Event Centers</h1>
          <p className="text-gray-500 text-sm">
            {isLoading
              ? "Searching\u2026"
              : `${total} ${total === 1 ? "event center" : "event centers"} found`}
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
                if (e.key === "Enter")
                  setParam("city", (e.target as HTMLInputElement).value.trim());
              }}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>

          <select
            value={activeSort}
            onChange={(e) => setParam("sort", e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black/10"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
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

        {/* Event center grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <PropertySkeleton key={i} />
            ))}
          </div>
        ) : eventCenters.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <p className="text-5xl mb-3">{"\uD83C\uDFAA"}</p>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No event centers found</h3>
            <p className="text-sm text-gray-500">
              {hasFilters
                ? "Try removing some filters."
                : "Check back soon for new listings."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {eventCenters.map((ec, index) => (
              <EventCenterCard key={ec.id} eventCenter={ec} index={index} />
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
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-black"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  Event type
                </label>
                <select
                  value={draftEventType}
                  onChange={(e) => setDraftEventType(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white"
                >
                  <option value="">All types</option>
                  {EVENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  Minimum capacity
                </label>
                <input
                  type="number"
                  min={1}
                  value={draftMinCapacity}
                  onChange={(e) => setDraftMinCapacity(e.target.value)}
                  placeholder="e.g. 100"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                    Min price (&#x20A6;)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={draftMinPrice}
                    onChange={(e) => setDraftMinPrice(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                    Max price (&#x20A6;)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={draftMaxPrice}
                    onChange={(e) => setDraftMaxPrice(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
                  />
                </div>
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

export default function EventCentersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="loader" />
        </div>
      }
    >
      <EventCentersContent />
    </Suspense>
  );
}
