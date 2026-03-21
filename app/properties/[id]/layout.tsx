import type { Metadata } from "next";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.asavio.com/api";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const res = await fetch(`${API_URL}/properties/${id}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error("not found");
    const { data } = await res.json();
    const p = data.property;

    const title = `${p.title} in ${p.location?.city ?? "Nigeria"}`;
    const description = `Book ${p.title} — ${p.bedrooms} bed${p.bedrooms !== 1 ? "s" : ""}, ${p.bathrooms} bath${p.bathrooms !== 1 ? "s" : ""}, up to ${p.maxGuests} guests. ₦${Number(p.pricePerNight).toLocaleString("en-NG")}/night in ${p.location?.city ?? "Nigeria"}. ${p.description?.slice(0, 100) ?? ""}`.trim();

    const image = p.images?.[0]?.url;

    return {
      title,
      description,
      openGraph: {
        title: `${title} | Asavio`,
        description,
        images: image ? [{ url: image, width: 1200, height: 800, alt: p.title }] : [],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: `${title} | Asavio`,
        description,
        images: image ? [image] : [],
      },
      alternates: {
        canonical: `/properties/${id}`,
      },
    };
  } catch {
    return {
      title: "Luxury Shortlet",
      description: "Book a premium shortlet on Asavio.",
    };
  }
}

async function getProperty(id: string) {
  try {
    const res = await fetch(`${API_URL}/properties/${id}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const { data } = await res.json();
    return data.property;
  } catch {
    return null;
  }
}

export default async function PropertyDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = await getProperty(id);

  const jsonLd = p
    ? {
        "@context": "https://schema.org",
        "@type": "LodgingBusiness",
        name: p.title,
        description: p.description,
        image: p.images?.map((img: { url: string }) => img.url) ?? [],
        url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://asavio.com"}/properties/${id}`,
        address: {
          "@type": "PostalAddress",
          addressLocality: p.location?.city ?? "",
          addressRegion: p.location?.state ?? "",
          addressCountry: p.location?.country ?? "Nigeria",
        },
        priceRange: `₦${Number(p.pricePerNight).toLocaleString("en-NG")}/night`,
        numberOfRooms: p.bedrooms,
        amenityFeature: (p.amenities ?? []).map((a: string) => ({
          "@type": "LocationFeatureSpecification",
          name: a,
          value: true,
        })),
        aggregateRating:
          p.totalReviews > 0
            ? {
                "@type": "AggregateRating",
                ratingValue: Number(p.averageRating).toFixed(1),
                reviewCount: p.totalReviews,
                bestRating: 5,
                worstRating: 1,
              }
            : undefined,
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
