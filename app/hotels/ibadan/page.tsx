import type { Metadata } from "next";
import HotelLocationPage from "@/components/location/HotelLocationPage";
import { getCityBySlug } from "@/lib/cities";

const city = getCityBySlug("ibadan")!;

export const metadata: Metadata = {
  title: "Hotels in Ibadan",
  description:
    "Find verified hotels in Ibadan — Bodija, Ring Road, Iwo Road and the University area. Book rooms at business and leisure hotels.",
  alternates: { canonical: "/hotels/ibadan" },
  openGraph: {
    title: "Hotels in Ibadan | Asavio",
    description:
      "Browse verified hotels across Ibadan. Business, leisure and boutique stays.",
    url: "/hotels/ibadan",
  },
};

export default function IbadanHotelsPage() {
  return <HotelLocationPage city={city} />;
}
