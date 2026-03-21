// app/page.tsx
import type { Metadata } from "next";
import Hero from "@/components/home/Hero";
import FeaturedProperties from "@/components/home/FeaturedProperties";
import Categories from "@/components/home/Categories";
import LuxuryVehicles from "@/components/home/LuxuryVehicles";
import ExperienceSection from "@/components/home/ExperienceSection";
import CTASection from "@/components/home/CTASection";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://asavio.com";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Asavio",
  url: BASE_URL,
  logo: `${BASE_URL}/logo.png`,
  description:
    "Nigeria's premier platform for luxury shortlet apartments and premium car rentals.",
  address: {
    "@type": "PostalAddress",
    addressCountry: "NG",
    addressRegion: "Lagos",
  },
  sameAs: [
    "https://instagram.com/asavio",
    "https://twitter.com/asavio",
  ],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  url: BASE_URL,
  name: "Asavio",
  description: "Book luxury shortlets and premium car rentals in Nigeria.",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${BASE_URL}/properties?search={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <div>
        <Hero />
        <div className="overflow-hidden">
          <Categories />
          <FeaturedProperties />
          <LuxuryVehicles />
          <ExperienceSection />
          <CTASection />
        </div>
      </div>
    </>
  );
}