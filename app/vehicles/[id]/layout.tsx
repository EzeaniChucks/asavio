import type { Metadata } from "next";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.asavio.com/api";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const res = await fetch(`${API_URL}/vehicles/${id}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error("not found");
    const { data } = await res.json();
    const v = data.vehicle;

    const title = `${v.year} ${v.make} ${v.model}${v.location ? ` in ${v.location}` : ""}`;
    const driverNote = v.priceWithDriverPerDay ? " — self-drive or with driver" : "";
    const description = `Rent a ${v.year} ${v.make} ${v.model}${driverNote}. ₦${Number(v.pricePerDay).toLocaleString("en-NG")}/day${v.location ? ` in ${v.location}` : " in Nigeria"}. ${v.description?.slice(0, 100) ?? ""}`.trim();

    const image = v.images?.[0]?.url;

    return {
      title,
      description,
      openGraph: {
        title: `${title} | Asavio`,
        description,
        images: image ? [{ url: image, width: 1200, height: 800, alt: title }] : [],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: `${title} | Asavio`,
        description,
        images: image ? [image] : [],
      },
      alternates: {
        canonical: `/vehicles/${id}`,
      },
    };
  } catch {
    return {
      title: "Luxury Vehicle Rental",
      description: "Rent a premium vehicle on Asavio.",
    };
  }
}

export default function VehicleDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
