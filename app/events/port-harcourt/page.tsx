import type { Metadata } from "next";
import EventLocationPage from "@/components/location/EventLocationPage";
import { getCityBySlug } from "@/lib/cities";

const city = getCityBySlug("port-harcourt")!;

export const metadata: Metadata = {
  title: "Event Venues in Port Harcourt",
  description:
    "Find verified event centers in Port Harcourt — wedding halls, conference venues, and party spaces in GRA, Trans Amadi and beyond.",
  alternates: { canonical: "/events/port-harcourt" },
  openGraph: {
    title: "Event Venues in Port Harcourt | Asavio",
    description: "Browse verified event venues across Port Harcourt.",
    url: "/events/port-harcourt",
  },
};

export default function PortHarcourtEventsPage() {
  return <EventLocationPage city={city} />;
}
