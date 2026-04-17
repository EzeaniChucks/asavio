import type { Metadata } from "next";
import HotelLocationPage from "@/components/location/HotelLocationPage";
import { getCityBySlug } from "@/lib/cities";

const city = getCityBySlug("port-harcourt")!;

export const metadata: Metadata = {
  title: "Hotels in Port Harcourt",
  description:
    "Find verified hotels in Port Harcourt — GRA, Trans Amadi, Old GRA and Rumuola. Book rooms at oil-industry business hotels and luxury stays.",
  alternates: { canonical: "/hotels/port-harcourt" },
  openGraph: {
    title: "Hotels in Port Harcourt | Asavio",
    description:
      "Browse verified hotels across Port Harcourt. Business, luxury and boutique hotel options.",
    url: "/hotels/port-harcourt",
  },
};

export default function PortHarcourtHotelsPage() {
  return <HotelLocationPage city={city} />;
}
