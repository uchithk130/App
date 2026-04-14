const KEY = "fitmeals_delivery_location";

export type StoredDeliveryLocation = {
  id?: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  lat: number;
  lng: number;
};

export function readStoredLocation(): StoredDeliveryLocation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as StoredDeliveryLocation;
    if (!p?.line1 || typeof p.lat !== "number" || typeof p.lng !== "number") return null;
    return p;
  } catch {
    return null;
  }
}

export function writeStoredLocation(loc: StoredDeliveryLocation) {
  try {
    localStorage.setItem(KEY, JSON.stringify(loc));
  } catch {
    /* ignore */
  }
}

export function clearStoredLocation() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
