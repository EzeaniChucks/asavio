"use client";

// app/properties/page.tsx
import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaSearch,
  FaFilter,
  FaTimes,
  FaSlidersH,
  FaChevronDown,
} from "react-icons/fa";
import { Suspense } from "react";
import PropertyCard from "@/components/cards/PropertyCard";
import PropertySkeleton from "@/components/ui/PropertySkeleton";
import { api } from "@/lib/api";
import { Property, PropertyFilters } from "@/types";

const PROPERTY_TYPES = [
  "All",
  "Apartment",
  "Villa",
  "Beach House",
  "Penthouse",
  "Studio",
  "Cabin",
  "Entire Home",
  "Townhouse",
];

const SORT_OPTIONS = [
  { label: "Newest first", value: "newest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Highest rated", value: "rating" },
];

function buildQuery(filters: PropertyFilters & { sort?: string }) {
  const params = new URLSearchParams();
  if (filters.city) params.set("city", filters.city);
  if (filters.propertyType && filters.propertyType !== "All")
    params.set("propertyType", filters.propertyType);
  if (filters.minPrice) params.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice) params.set("maxPrice", String(filters.maxPrice));
  if (filters.bedrooms) params.set("bedrooms", String(filters.bedrooms));
  if (filters.maxGuests) params.set("maxGuests", String(filters.maxGuests));
  if (filters.sort) params.set("sort", filters.sort);
  return params.toString();
}

function PropertiesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Initialise filters from URL params
  const [filters, setFilters] = useState<PropertyFilters & { sort?: string }>({
    city: searchParams.get("city") || "",
    propertyType: searchParams.get("propertyType") || "All",
    minPrice: searchParams.get("minPrice")
      ? Number(searchParams.get("minPrice"))
      : undefined,
    maxPrice: searchParams.get("maxPrice")
      ? Number(searchParams.get("maxPrice"))
      : undefined,
    bedrooms: searchParams.get("bedrooms")
      ? Number(searchParams.get("bedrooms"))
      : undefined,
    sort: searchParams.get("sort") || "newest",
  });

  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cityInput, setCityInput] = useState(filters.city || "");

  const fetchProperties = useCallback(async (f: typeof filters) => {
    setIsLoading(true);
    try {
      const qs = buildQuery(f);
      const res = await api.get(`/properties${qs ? `?${qs}` : ""}`);
      setProperties(res.data.data.properties);
    } catch {
      setProperties([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sync URL and fetch when filters change
  useEffect(() => {
    const qs = buildQuery(filters);
    router.replace(`/properties${qs ? `?${qs}` : ""}`, { scroll: false });
    fetchProperties(filters);
  }, [filters, fetchProperties, router]);

  const applyType = (type: string) =>
    setFilters((f) => ({ ...f, propertyType: type }));

  const applySort = (sort: string) =>
    setFilters((f) => ({ ...f, sort }));

  const applyCity = () =>
    setFilters((f) => ({ ...f, city: cityInput.trim() }));

  const clearFilters = () => {
    setFilters({ propertyType: "All", sort: "newest" });
    setCityInput("");
  };

  const activeFilterCount = [
    filters.city,
    filters.propertyType !== "All" ? filters.propertyType : null,
    filters.minPrice,
    filters.maxPrice,
    filters.bedrooms,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-white border-b border-gray-100">
        <div className="container py-6">
          <h1 className="text-2xl font-bold text-gray-900">All Properties</h1>
          <p className="text-gray-500 mt-1">
            {isLoading
              ? "Finding listings…"
              : `${properties.length} ${properties.length === 1 ? "listing" : "listings"} available`}
          </p>
        </div>
      </div>

      {/* Sticky filter bar */}
      <div className="sticky top-16 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="container py-3 flex gap-3 items-center overflow-x-auto scrollbar-none">
          {/* City search */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-2 min-w-[180px]">
            <FaSearch className="text-gray-400 text-xs flex-shrink-0" />
            <input
              type="text"
              placeholder="City or location"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyCity()}
              className="bg-transparent text-sm outline-none w-full"
            />
            {cityInput && (
              <button onClick={() => { setCityInput(""); setFilters(f => ({ ...f, city: "" })); }}>
                <FaTimes className="text-gray-400 text-xs" />
              </button>
            )}
          </div>

          {/* Type pills */}
          <div className="flex gap-2 flex-shrink-0">
            {PROPERTY_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => applyType(type)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  filters.propertyType === type
                    ? "bg-black text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2 flex-shrink-0">
            {/* Sort */}
            <div className="relative">
              <select
                value={filters.sort}
                onChange={(e) => applySort(e.target.value)}
                className="appearance-none bg-gray-100 text-sm font-medium text-gray-700 pl-3 pr-8 py-2 rounded-full cursor-pointer outline-none hover:bg-gray-200 transition-colors"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <FaChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
            </div>

            {/* Advanced filter button */}
            <button
              onClick={() => setDrawerOpen(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                activeFilterCount > 0
                  ? "border-black bg-black text-white"
                  : "border-gray-300 text-gray-700 hover:border-black"
              }`}
            >
              <FaSlidersH />
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-white text-black w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <PropertySkeleton key={i} />
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-5xl mb-4">🔍</p>
            <h2 className="text-2xl font-semibold mb-2">No properties found</h2>
            <p className="text-gray-500 mb-6">Try adjusting your filters</p>
            <button onClick={clearFilters} className="btn-primary">
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {properties.map((property, i) => (
              <PropertyCard key={property.id} property={property} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* Advanced filter drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setDrawerOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed right-0 top-0 h-full w-full max-w-sm bg-white z-50 shadow-2xl flex flex-col"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                <h2 className="font-semibold text-lg">Filters</h2>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="text-gray-500 hover:text-black"
                >
                  <FaTimes size={18} />
                </button>
              </div>

              {/* Drawer body */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
                {/* Price range */}
                <div>
                  <h3 className="font-semibold mb-4">Price per night</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Min ($)</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={filters.minPrice || ""}
                        onChange={(e) =>
                          setFilters((f) => ({
                            ...f,
                            minPrice: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          }))
                        }
                        className="input text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Max ($)</label>
                      <input
                        type="number"
                        placeholder="Any"
                        value={filters.maxPrice || ""}
                        onChange={(e) =>
                          setFilters((f) => ({
                            ...f,
                            maxPrice: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          }))
                        }
                        className="input text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Bedrooms */}
                <div>
                  <h3 className="font-semibold mb-4">Bedrooms</h3>
                  <div className="flex gap-2 flex-wrap">
                    {[undefined, 1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={String(n)}
                        onClick={() => setFilters((f) => ({ ...f, bedrooms: n }))}
                        className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                          filters.bedrooms === n
                            ? "bg-black text-white border-black"
                            : "border-gray-300 text-gray-600 hover:border-black"
                        }`}
                      >
                        {n === undefined ? "Any" : n === 5 ? "5+" : String(n)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Guests */}
                <div>
                  <h3 className="font-semibold mb-4">Guests</h3>
                  <div className="flex gap-2 flex-wrap">
                    {[undefined, 1, 2, 4, 6, 8].map((n) => (
                      <button
                        key={String(n)}
                        onClick={() =>
                          setFilters((f) => ({ ...f, maxGuests: n }))
                        }
                        className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                          filters.maxGuests === n
                            ? "bg-black text-white border-black"
                            : "border-gray-300 text-gray-600 hover:border-black"
                        }`}
                      >
                        {n === undefined ? "Any" : `${n}+`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Drawer footer */}
              <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
                <button
                  onClick={clearFilters}
                  className="flex-1 btn-secondary py-3 text-sm"
                >
                  Clear all
                </button>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="flex-1 btn-primary py-3 text-sm"
                >
                  Show results
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PropertiesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <PropertiesContent />
    </Suspense>
  );
}
