import type { Metadata } from "next";
import PropertyLocationPage from "@/components/location/PropertyLocationPage";
import { getCityBySlug } from "@/lib/cities";

const city = getCityBySlug("abuja")!;

export const metadata: Metadata = {
  title: "Luxury Shortlets in Abuja",
  description:
    "Book verified luxury shortlet apartments in Abuja — Maitama, Asokoro, Wuse, Jabi and beyond. Curated listings with instant availability.",
  alternates: { canonical: "/properties/abuja" },
  openGraph: {
    title: "Luxury Shortlets in Abuja | Asavio",
    description:
      "Browse premium shortlet apartments across Abuja. Verified listings in Maitama, Asokoro, Wuse and more.",
    url: "/properties/abuja",
  },
};

export default function AbujaPropertiesPage() {
  return <PropertyLocationPage city={city} />;
}
