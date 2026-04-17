import type { Metadata } from "next";
import EventLocationPage from "@/components/location/EventLocationPage";
import { getCityBySlug } from "@/lib/cities";

const city = getCityBySlug("lagos")!;

export const metadata: Metadata = {
  title: "Event Venues in Lagos",
  description:
    "Find verified event centers in Lagos — wedding halls, conference venues, party spaces in Victoria Island, Lekki, Ikeja and beyond.",
  alternates: { canonical: "/events/lagos" },
  openGraph: {
    title: "Event Venues in Lagos | Asavio",
    description: "Browse verified event venues across Lagos for weddings, corporate events, birthdays and more.",
    url: "/events/lagos",
  },
};

export default function LagosEventsPage() {
  return <EventLocationPage city={city} />;
}
