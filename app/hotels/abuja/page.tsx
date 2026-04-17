import type { Metadata } from "next";
import HotelLocationPage from "@/components/location/HotelLocationPage";
import { getCityBySlug } from "@/lib/cities";

const city = getCityBySlug("abuja")!;

export const metadata: Metadata = {
  title: "Hotels in Abuja",
  description:
    "Find verified hotels in Abuja — Maitama, Asokoro, Wuse, Garki and the Central Business District. Book rooms at luxury and business hotels.",
  alternates: { canonical: "/hotels/abuja" },
  openGraph: {
    title: "Hotels in Abuja | Asavio",
    description:
      "Browse verified hotels across Abuja. Business travel, diplomatic stays, and luxury retreats.",
    url: "/hotels/abuja",
  },
};

export default function AbujaHotelsPage() {
  return <HotelLocationPage city={city} />;
}
