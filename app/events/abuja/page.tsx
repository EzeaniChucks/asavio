import type { Metadata } from "next";
import EventLocationPage from "@/components/location/EventLocationPage";
import { getCityBySlug } from "@/lib/cities";

const city = getCityBySlug("abuja")!;

export const metadata: Metadata = {
  title: "Event Venues in Abuja",
  description:
    "Find verified event centers in Abuja — conference halls, wedding venues, corporate spaces in Maitama, Wuse, Garki and the CBD.",
  alternates: { canonical: "/events/abuja" },
  openGraph: {
    title: "Event Venues in Abuja | Asavio",
    description: "Browse verified event venues across Abuja for weddings, conferences, corporate events and more.",
    url: "/events/abuja",
  },
};

export default function AbujaEventsPage() {
  return <EventLocationPage city={city} />;
}
