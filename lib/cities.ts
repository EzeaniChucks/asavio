// lib/cities.ts
// Canonical Nigerian city list used by property forms and location pages.

export interface CityDef {
  name: string;    // Display name and DB-stored value
  slug: string;    // URL slug for location pages
  state: string;   // Auto-populated state when city is selected
}

/** Master list — ordering matters (most active cities first). */
export const NIGERIAN_CITIES: CityDef[] = [
  { name: "Lagos",         slug: "lagos",         state: "Lagos"          },
  { name: "Abuja",         slug: "abuja",         state: "FCT"            },
  { name: "Port Harcourt", slug: "port-harcourt", state: "Rivers"         },
  { name: "Ibadan",        slug: "ibadan",        state: "Oyo"            },
  { name: "Enugu",         slug: "enugu",         state: "Enugu"          },
  { name: "Benin City",    slug: "benin-city",    state: "Edo"            },
  { name: "Calabar",       slug: "calabar",       state: "Cross River"    },
  { name: "Warri",         slug: "warri",         state: "Delta"          },
  { name: "Asaba",         slug: "asaba",         state: "Delta"          },
  { name: "Uyo",           slug: "uyo",           state: "Akwa Ibom"      },
  { name: "Owerri",        slug: "owerri",        state: "Imo"            },
  { name: "Abeokuta",      slug: "abeokuta",      state: "Ogun"           },
];

/** City names only — used in form dropdown. */
export const CITY_NAMES = NIGERIAN_CITIES.map((c) => c.name);

/** Cities with dedicated SEO location pages (expand as listing volume grows). */
export const LOCATION_PAGE_CITIES: CityDef[] = NIGERIAN_CITIES.filter((c) =>
  ["lagos", "abuja", "port-harcourt", "ibadan"].includes(c.slug)
);

/** Look up a CityDef by slug. */
export function getCityBySlug(slug: string): CityDef | undefined {
  return NIGERIAN_CITIES.find((c) => c.slug === slug);
}

/** Look up a CityDef by display name (case-insensitive). */
export function getCityByName(name: string): CityDef | undefined {
  return NIGERIAN_CITIES.find(
    (c) => c.name.toLowerCase() === name.toLowerCase()
  );
}
