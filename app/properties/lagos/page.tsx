import type { Metadata } from "next";
import PropertyLocationPage from "@/components/location/PropertyLocationPage";
import { getCityBySlug } from "@/lib/cities";

const city = getCityBySlug("lagos")!;

export const metadata: Metadata = {
  title: "Luxury Shortlets in Lagos",
  description:
    "Book verified luxury shortlet apartments in Lagos — Victoria Island, Lekki, Ikoyi, Banana Island and beyond. Curated listings with instant availability.",
  alternates: { canonical: "/properties/lagos" },
  openGraph: {
    title: "Luxury Shortlets in Lagos | Asavio",
    description:
      "Browse premium shortlet apartments across Lagos. Verified listings in Victoria Island, Lekki, Ikoyi and more.",
    url: "/properties/lagos",
  },
};

export default function LagosPropertiesPage() {
  return <PropertyLocationPage city={city} />;
}
