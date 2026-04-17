// components/location/EventLocationPage.tsx
import Link from "next/link";
import EventCenterCard from "@/components/cards/EventCenterCard";
import { EventCenter } from "@/types";
import { CityDef } from "@/lib/cities";

const API = process.env.NEXT_PUBLIC_API_URL || "https://asavio-server.onrender.com/api";

async function fetchCityEventCenters(cityName: string): Promise<EventCenter[]> {
  try {
    const res = await fetch(
      `${API}/event-centers?city=${encodeURIComponent(cityName)}&limit=12`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json.data?.eventCenters ?? [];
  } catch {
    return [];
  }
}

export default async function EventLocationPage({ city }: { city: CityDef }) {
  const ecs = await fetchCityEventCenters(city.name);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="container py-10">
          <Link
            href="/events"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black transition-colors mb-5"
          >
            ← All event venues
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Event Venues in {city.name}
          </h1>
          <p className="text-gray-500 text-base">
            {ecs.length > 0
              ? `${ecs.length}${ecs.length === 12 ? "+" : ""} verified venue${ecs.length !== 1 ? "s" : ""} available`
              : "Listings coming soon"}
            {" · "}{city.name}, {city.state}
          </p>
        </div>
      </div>

      <div className="container py-10">
        {ecs.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {ecs.map((ec, i) => (
                <EventCenterCard key={ec.id} eventCenter={ec} index={i} />
              ))}
            </div>
            <div className="text-center">
              <Link
                href={`/events?city=${encodeURIComponent(city.name)}`}
                className="inline-flex items-center gap-2 bg-black text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors"
              >
                See all {city.name} venues with filters →
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-400 text-base mb-4">
              No event venues in {city.name} yet — check back soon.
            </p>
            <Link
              href="/events"
              className="inline-flex items-center gap-2 bg-black text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors"
            >
              Browse all venues
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
