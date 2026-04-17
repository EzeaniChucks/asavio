import type { Metadata } from "next";
import HotelLocationPage from "@/components/location/HotelLocationPage";
import { getCityBySlug } from "@/lib/cities";

const city = getCityBySlug("lagos")!;

export const metadata: Metadata = {
  title: "Hotels in Lagos",
  description:
    "Find verified hotels in Lagos — Victoria Island, Lekki, Ikoyi, Ikeja and beyond. Book rooms at luxury and boutique hotels with instant availability.",
  alternates: { canonical: "/hotels/lagos" },
  openGraph: {
    title: "Hotels in Lagos | Asavio",
    description:
      "Browse verified hotels across Lagos. City hotels, beach resorts, boutique stays and more.",
    url: "/hotels/lagos",
  },
};

export default function LagosHotelsPage() {
  return <HotelLocationPage city={city} />;
}
