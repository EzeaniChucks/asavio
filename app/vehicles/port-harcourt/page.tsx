import type { Metadata } from "next";
import VehicleLocationPage from "@/components/location/VehicleLocationPage";
import { getCityBySlug } from "@/lib/cities";

const city = getCityBySlug("port-harcourt")!;

export const metadata: Metadata = {
  title: "Premium Car Rentals in Port Harcourt",
  description:
    "Rent premium and luxury cars in Port Harcourt — sedans, SUVs, and chauffeur-driven vehicles across GRA, Trans Amadi and beyond.",
  alternates: { canonical: "/vehicles/port-harcourt" },
  openGraph: {
    title: "Premium Car Rentals in Port Harcourt | Asavio",
    description:
      "Browse luxury and premium vehicles for rent across Port Harcourt. Sedans, SUVs, and chauffeur-driven options available.",
    url: "/vehicles/port-harcourt",
  },
};

export default function PortHarcourtVehiclesPage() {
  return <VehicleLocationPage city={city} />;
}
