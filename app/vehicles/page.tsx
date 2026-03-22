"use client";

// app/vehicles/page.tsx
import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { FaSearch, FaSlidersH, FaTimes } from "react-icons/fa";
import { Suspense } from "react";
import { api } from "@/lib/api";
import { Vehicle } from "@/types";
import VehicleCard from "@/components/cards/VehicleCard";
import PropertySkeleton from "@/components/ui/PropertySkeleton";

const TYPE_LABELS: Record<string, string> = {
  sedan: "Sedan", suv: "SUV", sports: "Sports", luxury: "Luxury",
  van: "Van", pickup: "Pickup", convertible: "Convertible", electric: "Electric",
};

function labelFor(type: string): string {
  return TYPE_LABELS[type.toLowerCase()] ?? (type.charAt(0).toUpperCase() + type.slice(1));
}

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Top rated" },
];

function VehiclesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [vehicleTypes, setVehicleTypes] = useState<string[]>([]);

  // Load available vehicle types from DB once
  useEffect(() => {
    api.get("/vehicles/types").then((res) => {
      setVehicleTypes(res.data.data.types ?? []);
    }).catch(() => {});
  }, []);

  // Filter state — synced to URL
  const activeType = searchParams.get("vehicleType") ?? "";
  const activeSort = searchParams.get("sort") ?? "newest";
  const activeLocation = searchParams.get("location") ?? "";
  const activeMin = searchParams.get("minPrice") ?? "";
  const activeMax = searchParams.get("maxPrice") ?? "";
  const activeSeats = searchParams.get("seats") ?? "";
  const activeDriver = searchParams.get("withDriver") ?? "";

  // Draft filter state for drawer
  const [draftMin, setDraftMin] = useState(activeMin);
  const [draftMax, setDraftMax] = useState(activeMax);
  const [draftSeats, setDraftSeats] = useState(activeSeats);
  const [draftDriver, setDraftDriver] = useState(activeDriver);

  const setParam = useCallback(
    (key: string, value: string) => {
      const p = new URLSearchParams(searchParams.toString());
      if (value) p.set(key, value); else p.delete(key);
      router.replace(`/vehicles?${p.toString()}`);
    },
    [searchParams, router]
  );

  const applyDrawerFilters = () => {
    const p = new URLSearchParams(searchParams.toString());
    if (draftMin) p.set("minPrice", draftMin); else p.delete("minPrice");
    if (draftMax) p.set("maxPrice", draftMax); else p.delete("maxPrice");
    if (draftSeats) p.set("seats", draftSeats); else p.delete("seats");
    if (draftDriver) p.set("withDriver", draftDriver); else p.delete("withDriver");
    router.replace(`/vehicles?${p.toString()}`);
    setShowFilters(false);
  };

  const clearAll = () => {
    router.replace("/vehicles");
    setDraftMin(""); setDraftMax(""); setDraftSeats(""); setDraftDriver("");
  };

  const activeCount = [activeMin, activeMax, activeSeats, activeDriver].filter(Boolean).length;

  // Group by vehicleType when no specific type filter is active
  const sections = useMemo(() => {
    if (activeType) return null;
    const order: string[] = [];
    const map: Record<string, Vehicle[]> = {};
    for (const v of vehicles) {
      if (!map[v.vehicleType]) {
        map[v.vehicleType] = [];
        order.push(v.vehicleType);
      }
      map[v.vehicleType].push(v);
    }
    return order.map((type) => ({ type, items: map[type] }));
  }, [vehicles, activeType]);

  useEffect(() => {
    setIsLoading(true);
    const params = new URLSearchParams(searchParams.toString());
    api
      .get(`/vehicles?${params.toString()}`)
      .then((res) => {
        setVehicles(res.data.data.vehicles);
        setTotal(res.data.data.total);
      })
      .catch(() => setVehicles([]))
      .finally(() => setIsLoading(false));
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Vehicles for hire</h1>
          <p className="text-gray-500">{total} vehicle{total !== 1 ? "s" : ""} available</p>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {/* Location search */}
          <div className="relative flex-shrink-0">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
            <input
              type="text"
              placeholder="City or area"
              value={activeLocation}
              onChange={(e) => setParam("location", e.target.value)}
              className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-black w-44"
            />
          </div>

          {/* Type pills — dynamically populated from DB */}
          <div className="flex gap-1.5 overflow-x-auto flex-nowrap pb-0.5">
            <button
              onClick={() => setParam("vehicleType", "")}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                !activeType ? "bg-black text-white" : "bg-white border border-gray-200 text-gray-700 hover:border-gray-400"
              }`}
            >
              All
            </button>
            {vehicleTypes.map((t) => (
              <button
                key={t}
                onClick={() => setParam("vehicleType", activeType === t ? "" : t)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeType === t ? "bg-black text-white" : "bg-white border border-gray-200 text-gray-700 hover:border-gray-400"
                }`}
              >
                {labelFor(t)}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={activeSort}
            onChange={(e) => setParam("sort", e.target.value)}
            className="ml-auto text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-black"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* More filters */}
          <button
            onClick={() => setShowFilters(true)}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
              activeCount > 0
                ? "bg-black text-white border-black"
                : "bg-white border-gray-200 text-gray-700 hover:border-gray-400"
            }`}
          >
            <FaSlidersH className="text-xs" />
            Filters{activeCount > 0 ? ` (${activeCount})` : ""}
          </button>

          {(activeType || activeCount > 0 || activeLocation) && (
            <button onClick={clearAll} className="flex items-center gap-1 text-sm text-gray-500 hover:text-black">
              <FaTimes className="text-xs" /> Clear all
            </button>
          )}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => <PropertySkeleton key={i} />)}
          </div>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <p className="text-4xl mb-3">🚗</p>
            <h3 className="text-lg font-semibold mb-2">No vehicles found</h3>
            <p className="text-gray-400 mb-5">Try adjusting your filters</p>
            <button onClick={clearAll} className="btn-primary">Clear filters</button>
          </div>
        ) : sections ? (
          // Sectioned view — grouped by vehicle type
          <div className="space-y-12">
            {sections.map(({ type, items }) => (
              <div key={type}>
                <div className="flex items-baseline gap-3 mb-5">
                  <h2 className="text-xl font-bold text-gray-900">
                    {TYPE_LABELS[type] ?? (type.charAt(0).toUpperCase() + type.slice(1))}
                  </h2>
                  <span className="text-sm text-gray-400">{items.length} {items.length === 1 ? "vehicle" : "vehicles"}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {items.map((v, i) => <VehicleCard key={v.id} vehicle={v} index={i} />)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Flat view — specific type selected
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {vehicles.map((v, i) => <VehicleCard key={v.id} vehicle={v} index={i} />)}
          </div>
        )}
      </div>

      {/* Filter drawer */}
      {showFilters && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setShowFilters(false)} />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.25 }}
            className="w-80 bg-white h-full overflow-y-auto shadow-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-lg">Filters</h2>
              <button onClick={() => setShowFilters(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <FaTimes />
              </button>
            </div>

            <div className="space-y-6">
              {/* Price range */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Price per day</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Min ($)</label>
                    <input
                      type="number"
                      value={draftMin}
                      onChange={(e) => setDraftMin(e.target.value)}
                      placeholder="0"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Max ($)</label>
                    <input
                      type="number"
                      value={draftMax}
                      onChange={(e) => setDraftMax(e.target.value)}
                      placeholder="Any"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                </div>
              </div>

              {/* Seats */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Minimum seats</h3>
                <div className="flex gap-2 flex-wrap">
                  {[2, 4, 5, 7, 8].map((n) => (
                    <button
                      key={n}
                      onClick={() => setDraftSeats(draftSeats === String(n) ? "" : String(n))}
                      className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                        draftSeats === String(n) ? "bg-black text-white border-black" : "border-gray-200 text-gray-700 hover:border-gray-400"
                      }`}
                    >
                      {n}+
                    </button>
                  ))}
                </div>
              </div>

              {/* With driver */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Driver</h3>
                <div className="flex gap-2">
                  {[
                    { value: "", label: "Any" },
                    { value: "false", label: "Self-drive" },
                    { value: "true", label: "With driver" },
                  ].map((o) => (
                    <button
                      key={o.value}
                      onClick={() => setDraftDriver(o.value)}
                      className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        draftDriver === o.value ? "bg-black text-white border-black" : "border-gray-200 text-gray-700 hover:border-gray-400"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => { setDraftMin(""); setDraftMax(""); setDraftSeats(""); setDraftDriver(""); }}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={applyDrawerFilters}
                className="flex-1 py-3 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors"
              >
                Show results
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default function VehiclesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <VehiclesContent />
    </Suspense>
  );
}
