"use client";

// components/home/FeaturedProperties.tsx
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FaArrowRight, FaStar, FaClock, FaFire } from "react-icons/fa";
import PropertyCard from "@/components/cards/PropertyCard";
import PropertySkeleton from "@/components/ui/PropertySkeleton";
import { api } from "@/lib/api";
import { Property } from "@/types";

type TabKey = "topPicks" | "newlyListed" | "popular";

interface Sections {
  topPicks: Property[];
  newlyListed: Property[];
  popular: Property[];
}

const TABS: { key: TabKey; label: string; icon: React.ReactNode; sortParam: string; blurb: string }[] = [
  {
    key: "topPicks",
    label: "Top Picks",
    icon: <FaStar className="text-yellow-400 text-xs" />,
    sortParam: "featured",
    blurb: "Verified hosts with outstanding reviews",
  },
  {
    key: "newlyListed",
    label: "New Arrivals",
    icon: <FaClock className="text-blue-400 text-xs" />,
    sortParam: "newest",
    blurb: "Fresh listings just added",
  },
  {
    key: "popular",
    label: "Most Popular",
    icon: <FaFire className="text-orange-400 text-xs" />,
    sortParam: "popular",
    blurb: "Booked most often by guests like you",
  },
];

export default function FeaturedProperties() {
  const [sections, setSections] = useState<Sections | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("topPicks");

  useEffect(() => {
    api
      .get("/properties/sections")
      .then((res) => setSections(res.data.data))
      .catch(() => setSections({ topPicks: [], newlyListed: [], popular: [] }))
      .finally(() => setIsLoading(false));
  }, []);

  const activeTabConfig = TABS.find((t) => t.key === activeTab)!;
  const properties = sections?.[activeTab] ?? [];

  return (
    <section className="py-20 bg-white">
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8"
        >
          <div>
            <p className="text-accent font-medium uppercase tracking-widest text-sm mb-2">
              Discover
            </p>
            <h2 className="heading-2">Find Your Perfect Stay</h2>
          </div>
          <Link
            href={`/properties?sort=${activeTabConfig.sortParam}`}
            className="flex items-center gap-2 text-black font-semibold hover:gap-3 transition-all group shrink-0"
          >
            View all
            <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex items-center gap-2 mb-8 overflow-x-auto pb-1 scrollbar-hide"
        >
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
          <p className="text-xs text-gray-400 ml-2 whitespace-nowrap hidden sm:block">
            — {activeTabConfig.blurb}
          </p>
        </motion.div>

        {/* Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => <PropertySkeleton key={i} />)
              : properties.length > 0
              ? properties.map((property, i) => (
                  <PropertyCard key={property.id} property={property} index={i} />
                ))
              : (
                  <div className="col-span-3 text-center py-16 text-gray-400">
                    <p className="text-xl mb-2">No properties listed yet.</p>
                    <Link href="/register?role=host" className="text-black underline font-medium">
                      Be the first to list yours
                    </Link>
                  </div>
                )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
