/**
 * Geocoding via OpenStreetMap Nominatim (India-focused).
 * Use for location search: e.g. "Jaipur", "Malviya Nagar Jaipur".
 */

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
  placeId: number;
}

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const COUNTRY_INDIA = "in";

export async function searchLocation(query: string): Promise<GeocodeResult[]> {
  if (!query.trim()) return [];
  const params = new URLSearchParams({
    q: query.trim(),
    format: "json",
    limit: "8",
    countrycodes: COUNTRY_INDIA,
  });
  const res = await fetch(`${NOMINATIM_URL}?${params}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as Array<{
    lat: string;
    lon: string;
    display_name: string;
    place_id: number;
  }>;
  return data.map((item) => ({
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
    displayName: item.display_name,
    placeId: item.place_id,
  }));
}

const NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse";

/** Reverse geocode: get display name for a lat/lng (e.g. after "Use my location"). */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: "json",
  });
  const res = await fetch(`${NOMINATIM_REVERSE_URL}?${params}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return "";
  const data = (await res.json()) as { display_name?: string };
  return data.display_name ?? "";
}
