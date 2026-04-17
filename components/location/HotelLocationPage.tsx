// components/location/HotelLocationPage.tsx
// Server component — fetches city-filtered hotels and renders the location landing page.
import Link from "next/link";
import HotelCard from "@/components/cards/HotelCard";
import { Hotel } from "@/types";
import { CityDef } from "@/lib/cities";

const API = process.env.NEXT_PUBLIC_API_URL || "https://asavio-server.onrender.com/api";

async function fetchCityHotels(cityName: string): Promise<Hotel[]> {
  try {
    const res = await fetch(
      `${API}/hotels?city=${encodeURIComponent(cityName)}&limit=12`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json.data?.hotels ?? [];
  } catch {
    return [];
  }
}

export default async function HotelLocationPage({ city }: { city: CityDef }) {
  const hotels = await fetchCityHotels(city.name);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-white border-b border-gray-100">
        <div className="container py-10">
          <Link
            href="/hotels"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black transition-colors mb-5"
          >
            ← All hotels
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Hotels in {city.name}
          </h1>
          <p className="text-gray-500 text-base">
            {hotels.length > 0
              ? `${hotels.length}${hotels.length === 12 ? "+" : ""} verified hotel${hotels.length !== 1 ? "s" : ""} available`
              : "Listings coming soon"}
            {" · "}{city.name}, {city.state}
          </p>
        </div>
      </div>

      <div className="container py-10">
        {hotels.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {hotels.map((h, i) => (
                <HotelCard key={h.id} hotel={h} index={i} />
              ))}
            </div>

            <div className="text-center">
              <Link
                href={`/hotels?city=${encodeURIComponent(city.name)}`}
                className="inline-flex items-center gap-2 bg-black text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors"
              >
                See all {city.name} hotels with filters →
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-400 text-base mb-4">
              No hotels in {city.name} yet — check back soon.
            </p>
            <Link
              href="/hotels"
              className="inline-flex items-center gap-2 bg-black text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors"
            >
              Browse all hotels
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
