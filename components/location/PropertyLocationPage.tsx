// components/location/PropertyLocationPage.tsx
// Server component — fetches city-filtered properties and renders the location landing page.
import Link from "next/link";
import PropertyCard from "@/components/cards/PropertyCard";
import { Property } from "@/types";
import { CityDef } from "@/lib/cities";

const API = process.env.NEXT_PUBLIC_API_URL || "https://asavio-server.onrender.com/api";

async function fetchCityProperties(cityName: string): Promise<Property[]> {
  try {
    const res = await fetch(
      `${API}/properties?city=${encodeURIComponent(cityName)}&limit=12&sort=featured`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json.data?.properties ?? [];
  } catch {
    return [];
  }
}

export default async function PropertyLocationPage({ city }: { city: CityDef }) {
  const properties = await fetchCityProperties(city.name);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-white border-b border-gray-100">
        <div className="container py-10">
          <Link
            href="/properties"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black transition-colors mb-5"
          >
            ← All properties
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Shortlets in {city.name}
          </h1>
          <p className="text-gray-500 text-base">
            {properties.length > 0
              ? `${properties.length}${properties.length === 12 ? "+" : ""} verified luxury shortlet${properties.length !== 1 ? "s" : ""} available`
              : "Listings coming soon"}
            {" · "}{city.name}, {city.state}
          </p>
        </div>
      </div>

      <div className="container py-10">
        {properties.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {properties.map((p, i) => (
                <PropertyCard key={p.id} property={p} index={i} />
              ))}
            </div>

            <div className="text-center">
              <Link
                href={`/properties?city=${encodeURIComponent(city.name)}`}
                className="inline-flex items-center gap-2 bg-black text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors"
              >
                See all {city.name} listings with filters →
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-400 text-base mb-4">
              No listings in {city.name} yet — check back soon.
            </p>
            <Link
              href="/properties"
              className="inline-flex items-center gap-2 bg-black text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors"
            >
              Browse all properties
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
