import { json, errorJson } from "@/lib/http";

export const dynamic = "force-dynamic";

const UA = "FitMeals/1.0 (https://github.com/fitmeals; geocode-proxy)";

type NominatimReverse = {
  display_name?: string;
  address?: Record<string, string>;
};

/** Proxy Nominatim reverse geocode with structured address details. */
export async function GET(req: Request) {
  try {
    const urlObj = new URL(req.url);
    const lat = Number.parseFloat(urlObj.searchParams.get("lat") ?? "");
    const lng = Number.parseFloat(urlObj.searchParams.get("lng") ?? "");
    if (Number.isNaN(lat) || Number.isNaN(lng)) return errorJson("Invalid coordinates", 400);

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
    if (!res.ok) return errorJson("Reverse geocode failed", 502);
    const data = (await res.json()) as NominatimReverse;
    const a = data.address ?? {};
    const city = a.city || a.town || a.village || a.municipality || a.county || "";
    const state = a.state || "";
    const postcode = a.postcode || "";
    const road = [a.house_number, a.road].filter(Boolean).join(" ").trim();
    const neighbourhood = a.neighbourhood || a.suburb || "";
    const line1 = road || neighbourhood || data.display_name?.split(",").slice(0, 2).join(",").trim() || "";

    return json({
      label: data.display_name ?? "",
      line1,
      city,
      state,
      postcode,
      lat,
      lng,
    });
  } catch {
    return errorJson("Reverse geocode error", 500);
  }
}
