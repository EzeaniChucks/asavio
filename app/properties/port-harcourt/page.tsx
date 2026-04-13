import type { Metadata } from "next";
import PropertyLocationPage from "@/components/location/PropertyLocationPage";
import { getCityBySlug } from "@/lib/cities";

const city = getCityBySlug("port-harcourt")!;

export const metadata: Metadata = {
  title: "Luxury Shortlets in Port Harcourt",
  description:
    "Book verified luxury shortlet apartments in Port Harcourt — GRA, Trans Amadi, Old GRA and beyond. Curated listings with instant availability.",
  alternates: { canonical: "/properties/port-harcourt" },
  openGraph: {
    title: "Luxury Shortlets in Port Harcourt | Asavio",
    description:
      "Browse premium shortlet apartments across Port Harcourt. Verified listings in GRA, Trans Amadi and more.",
    url: "/properties/port-harcourt",
  },
};

export default function PortHarcourtPropertiesPage() {
  return <PropertyLocationPage city={city} />;
}
