import type { Metadata } from "next";
import EventLocationPage from "@/components/location/EventLocationPage";
import { getCityBySlug } from "@/lib/cities";

const city = getCityBySlug("ibadan")!;

export const metadata: Metadata = {
  title: "Event Venues in Ibadan",
  description:
    "Find verified event centers in Ibadan — wedding halls, conference rooms, and celebration spaces in Bodija, Ring Road and beyond.",
  alternates: { canonical: "/events/ibadan" },
  openGraph: {
    title: "Event Venues in Ibadan | Asavio",
    description: "Browse verified event venues across Ibadan.",
    url: "/events/ibadan",
  },
};

export default function IbadanEventsPage() {
  return <EventLocationPage city={city} />;
}
