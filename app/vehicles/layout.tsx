import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Luxury Car Rentals in Nigeria",
  description:
    "Rent premium and luxury vehicles in Lagos, Abuja, Port Harcourt and across Nigeria. Self-drive and with-driver options available.",
  keywords: [
    "luxury car rental Nigeria",
    "car rental Lagos",
    "car hire Abuja",
    "luxury vehicle rental Nigeria",
    "car rental with driver Nigeria",
    "premium car hire Lagos",
    "chauffeur Nigeria",
  ],
  openGraph: {
    title: "Luxury Car Rentals in Nigeria | Asavio",
    description:
      "Browse premium cars for rent across Nigeria. Self-drive or with a professional driver — book securely on Asavio.",
  },
  alternates: {
    canonical: "/vehicles",
  },
};

export default function VehiclesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
