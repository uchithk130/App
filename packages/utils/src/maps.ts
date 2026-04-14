export type MapsLinkInput = {
  lat?: number | null;
  lng?: number | null;
  address?: string | null;
};

/**
 * Google Maps deep link (no Maps API key). Prefer coordinates when present.
 */
export function buildGoogleMapsUrl(input: MapsLinkInput): string {
  if (input.lat != null && input.lng != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${input.lat},${input.lng}`;
  }
  const q = (input.address ?? "").trim();
  if (!q) return "https://www.google.com/maps";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}
