import { MetadataRoute } from "next";
import { LOCATION_PAGE_CITIES } from "@/lib/cities";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://asavio.app";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://asavio-server.onrender.com/api";

type PropertyEntry = { id: string; hostId: string; updatedAt: string };
type VehicleEntry  = { id: string; updatedAt: string };

async function getProperties(): Promise<PropertyEntry[]> {
  try {
    const res = await fetch(`${API_URL}/properties?limit=500`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data?.properties ?? []) as PropertyEntry[];
  } catch {
    return [];
  }
}

async function getVehicles(): Promise<VehicleEntry[]> {
  try {
    const res = await fetch(`${API_URL}/vehicles?limit=500`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data?.vehicles ?? []) as VehicleEntry[];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [properties, vehicles] = await Promise.all([
    getProperties(),
    getVehicles(),
  ]);

  const now = new Date();

  // Static pages
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL,                          lastModified: now, changeFrequency: "daily",   priority: 1.0 },
    { url: `${BASE_URL}/properties`,          lastModified: now, changeFrequency: "hourly",  priority: 0.9 },
    { url: `${BASE_URL}/vehicles`,            lastModified: now, changeFrequency: "hourly",  priority: 0.9 },
    { url: `${BASE_URL}/host-resources`,      lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE_URL}/about`,               lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/contact`,             lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/help`,                lastModified: now, changeFrequency: "weekly",  priority: 0.6 },
    { url: `${BASE_URL}/support`,             lastModified: now, changeFrequency: "weekly",  priority: 0.6 },
    { url: `${BASE_URL}/safety`,              lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/careers`,             lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/press`,               lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/register`,            lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/terms`,               lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/privacy`,             lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/cookies`,             lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];

  // Dynamic property pages
  const propertyRoutes: MetadataRoute.Sitemap = properties.map((p) => ({
    url: `${BASE_URL}/properties/${p.id}`,
    lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Dynamic vehicle pages
  const vehicleRoutes: MetadataRoute.Sitemap = vehicles.map((v) => ({
    url: `${BASE_URL}/vehicles/${v.id}`,
    lastModified: v.updatedAt ? new Date(v.updatedAt) : now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Host profile pages — derived from approved property listings (no separate endpoint needed)
  const hostIds = [...new Set(properties.map((p) => p.hostId).filter(Boolean))];
  const hostRoutes: MetadataRoute.Sitemap = hostIds.map((id) => ({
    url: `${BASE_URL}/hosts/${id}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // Location landing pages — one per city with a dedicated page, for both properties and vehicles
  const locationRoutes: MetadataRoute.Sitemap = LOCATION_PAGE_CITIES.flatMap((city) => [
    {
      url: `${BASE_URL}/properties/${city.slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/vehicles/${city.slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
  ]);

  return [...staticRoutes, ...locationRoutes, ...propertyRoutes, ...vehicleRoutes, ...hostRoutes];
}
