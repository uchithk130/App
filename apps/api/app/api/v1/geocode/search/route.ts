import { json, errorJson } from "@/lib/http";

export const dynamic = "force-dynamic";

const UA = "FitMeals/1.0 (https://github.com/fitmeals; geocode-proxy)";

type NominatimHit = {
  lat: string;
  lon: string;
  display_name: string;
  address?: Record<string, string>;
};

/** Proxy Nominatim search (rate-limit friendly). */
export async function GET(req: Request) {
  try {
    const q = new URL(req.url).searchParams.get("q")?.trim();
    if (!q || q.length < 2) {
      return json({
        items: [] as {
          lat: number;
          lng: number;
          label: string;
          line1: string;
          city: string;
          state: string;
          postcode: string;
        }[],
      });
    }

    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=8&addressdetails=1&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
    if (!res.ok) return errorJson("Geocode failed", 502);
    const raw = (await res.json()) as NominatimHit[];
    const items = raw.map((r) => {
      const a = r.address ?? {};
      const city = a.city || a.town || a.village || a.municipality || a.county || "";
      const state = a.state || "";
      const postcode = a.postcode || "";
      const road = [a.house_number, a.road].filter(Boolean).join(" ").trim();
      const line1 = road || r.display_name.split(",").slice(0, 2).join(",").trim();
      return {
        lat: Number.parseFloat(r.lat),
        lng: Number.parseFloat(r.lon),
        label: r.display_name,
        line1: line1 || r.display_name,
        city: city || "—",
        state: state || "—",
        postcode: postcode || "—",
      };
    });
    return json({ items });
  } catch {
    return errorJson("Geocode error", 500);
  }
}
