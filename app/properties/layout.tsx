import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Luxury Shortlet Apartments in Nigeria",
  description:
    "Browse and book verified luxury shortlet apartments in Lagos, Abuja, Port Harcourt and across Nigeria. Filter by location, price, bedrooms and more.",
  keywords: [
    "luxury shortlet Lagos",
    "shortlet apartment Lagos",
    "luxury apartment Abuja",
    "shortlet Nigeria",
    "luxury accommodation Nigeria",
    "shortlet Port Harcourt",
    "furnished apartment Nigeria",
    "premium shortlet",
  ],
  openGraph: {
    title: "Luxury Shortlet Apartments in Nigeria | Asavio",
    description:
      "Browse verified luxury shortlets in Lagos, Abuja, Port Harcourt and beyond. Curated, premium, and bookable online.",
  },
  alternates: {
    canonical: "/properties",
  },
};

export default function PropertiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
