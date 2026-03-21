import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://asavio.com";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.asavio.com/api";

// Fetch all approved/available property and vehicle IDs for dynamic routes
async function getPropertyIds(): Promise<string[]> {
  try {
    const res = await fetch(`${API_URL}/properties?limit=500`, {
      next: { revalidate: 3600 }, // re-fetch at most once per hour
    });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data?.properties ?? []).map((p: { id: string }) => p.id);
  } catch {
    return [];
  }
}

async function getVehicleIds(): Promise<string[]> {
  try {
    const res = await fetch(`${API_URL}/vehicles?limit=500`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data?.vehicles ?? []).map((v: { id: string }) => v.id);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [propertyIds, vehicleIds] = await Promise.all([
    getPropertyIds(),
    getVehicleIds(),
  ]);

  const now = new Date();

  // Static pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/properties`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/vehicles`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/register`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  // Dynamic property pages
  const propertyRoutes: MetadataRoute.Sitemap = propertyIds.map((id) => ({
    url: `${BASE_URL}/properties/${id}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Dynamic vehicle pages
  const vehicleRoutes: MetadataRoute.Sitemap = vehicleIds.map((id) => ({
    url: `${BASE_URL}/vehicles/${id}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...propertyRoutes, ...vehicleRoutes];
}
