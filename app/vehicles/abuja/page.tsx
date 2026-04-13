import type { Metadata } from "next";
import VehicleLocationPage from "@/components/location/VehicleLocationPage";
import { getCityBySlug } from "@/lib/cities";

const city = getCityBySlug("abuja")!;

export const metadata: Metadata = {
  title: "Premium Car Rentals in Abuja",
  description:
    "Rent premium and luxury cars in Abuja — sedans, SUVs, and chauffeur-driven vehicles across Maitama, Asokoro, Wuse and beyond.",
  alternates: { canonical: "/vehicles/abuja" },
  openGraph: {
    title: "Premium Car Rentals in Abuja | Asavio",
    description:
      "Browse luxury and premium vehicles for rent across Abuja. Sedans, SUVs, and chauffeur-driven options available.",
    url: "/vehicles/abuja",
  },
};

export default function AbujaVehiclesPage() {
  return <VehicleLocationPage city={city} />;
}
