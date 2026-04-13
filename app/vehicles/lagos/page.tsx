import type { Metadata } from "next";
import VehicleLocationPage from "@/components/location/VehicleLocationPage";
import { getCityBySlug } from "@/lib/cities";

const city = getCityBySlug("lagos")!;

export const metadata: Metadata = {
  title: "Premium Car Rentals in Lagos",
  description:
    "Rent premium and luxury cars in Lagos — sedans, SUVs, and chauffeur-driven vehicles across Victoria Island, Lekki, Ikoyi and beyond.",
  alternates: { canonical: "/vehicles/lagos" },
  openGraph: {
    title: "Premium Car Rentals in Lagos | Asavio",
    description:
      "Browse luxury and premium vehicles for rent across Lagos. Sedans, SUVs, and chauffeur-driven options available.",
    url: "/vehicles/lagos",
  },
};

export default function LagosVehiclesPage() {
  return <VehicleLocationPage city={city} />;
}
