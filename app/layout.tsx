// app/layout.tsx
import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://asavio.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Asavio — Luxury Shortlets & Car Rentals in Nigeria",
    template: "%s | Asavio",
  },
  description:
    "Asavio is Nigeria's premier platform for luxury shortlet apartments and premium car rentals. Book verified, curated properties and vehicles in Lagos, Abuja, Port Harcourt and beyond.",
  keywords: [
    "luxury shortlet Nigeria",
    "luxury apartments Lagos",
    "shortlet Lagos",
    "shortlet Abuja",
    "luxury car rental Nigeria",
    "shortlet apartment Nigeria",
    "luxury accommodation Nigeria",
    "premium shortlet",
    "Airbnb Nigeria",
    "vacation rental Nigeria",
    "shortlet Port Harcourt",
  ],
  authors: [{ name: "Asavio", url: BASE_URL }],
  creator: "Asavio",
  publisher: "Asavio",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: BASE_URL,
    siteName: "Asavio",
    title: "Asavio — Luxury Shortlets & Car Rentals in Nigeria",
    description:
      "Nigeria's premier platform for luxury shortlet apartments and premium car rentals. Book in Lagos, Abuja, Port Harcourt and beyond.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Asavio — Luxury Shortlets & Car Rentals in Nigeria",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Asavio — Luxury Shortlets & Car Rentals in Nigeria",
    description:
      "Nigeria's premier platform for luxury shortlet apartments and premium car rentals.",
    images: ["/og-image.jpg"],
    creator: "@asavio",
    site: "@asavio",
  },
  alternates: {
    canonical: BASE_URL,
  },
  verification: {
    // Add Google Search Console verification token here when available
    // google: "your-verification-token",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-NG" className={`${inter.variable} ${playfair.variable}`}>
      <body className={inter.className}>
        <Providers>
          <Navbar />
          <main className="min-h-screen pt-16 md:pt-20">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
