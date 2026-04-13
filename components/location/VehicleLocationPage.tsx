// components/location/VehicleLocationPage.tsx
// Server component — fetches city-filtered vehicles and renders the location landing page.
import Link from "next/link";
import VehicleCard from "@/components/cards/VehicleCard";
import { Vehicle } from "@/types";
import { CityDef } from "@/lib/cities";

const API = process.env.NEXT_PUBLIC_API_URL || "https://asavio-server.onrender.com/api";

async function fetchCityVehicles(cityName: string): Promise<Vehicle[]> {
  try {
    const res = await fetch(
      `${API}/vehicles?location=${encodeURIComponent(cityName)}&limit=12`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json.data?.vehicles ?? [];
  } catch {
    return [];
  }
}

export default async function VehicleLocationPage({ city }: { city: CityDef }) {
  const vehicles = await fetchCityVehicles(city.name);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-white border-b border-gray-100">
        <div className="container py-10">
          <Link
            href="/vehicles"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black transition-colors mb-5"
          >
            ← All vehicles
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Car Rentals in {city.name}
          </h1>
          <p className="text-gray-500 text-base">
            {vehicles.length > 0
              ? `${vehicles.length}${vehicles.length === 12 ? "+" : ""} premium vehicle${vehicles.length !== 1 ? "s" : ""} available`
              : "Vehicles coming soon"}
            {" · "}{city.name}, {city.state}
          </p>
        </div>
      </div>

      <div className="container py-10">
        {vehicles.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {vehicles.map((v, i) => (
                <VehicleCard key={v.id} vehicle={v} index={i} />
              ))}
            </div>

            <div className="text-center">
              <Link
                href={`/vehicles?location=${encodeURIComponent(city.name)}`}
                className="inline-flex items-center gap-2 bg-black text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors"
              >
                See all {city.name} vehicles with filters →
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-400 text-base mb-4">
              No vehicles in {city.name} yet — check back soon.
            </p>
            <Link
              href="/vehicles"
              className="inline-flex items-center gap-2 bg-black text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors"
            >
              Browse all vehicles
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
