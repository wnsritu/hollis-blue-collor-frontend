export interface StoredLocation {
  lat: number | null;
  lng: number | null;
  city: string;
  timestamp: number;
}

const STORAGE_KEY = "hollis_user_location";

/**
 * Gets saved user location from localStorage
 */
export const getStoredLocation = (): StoredLocation | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && (typeof parsed.lat === "number" || parsed.city)) return parsed;
  } catch (e) {}
  return null;
};

/**
 * Stores user location (lat/lng and/or city name) to localStorage
 */
export const setStoredLocation = (data: {
  lat?: number | null;
  lng?: number | null;
  city?: string;
}): StoredLocation => {
  const existing = getStoredLocation() || { lat: null, lng: null, city: "", timestamp: Date.now() };
  const updated: StoredLocation = {
    lat: data.lat !== undefined ? data.lat : existing.lat,
    lng: data.lng !== undefined ? data.lng : existing.lng,
    city: data.city !== undefined ? data.city : existing.city,
    timestamp: Date.now(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {}
  return updated;
};

/**
 * Detects browser geolocation, saves to localStorage, and returns coordinates
 */
export const detectAndStoreUserLocation = (): Promise<StoredLocation | null> => {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) {
      resolve(getStoredLocation());
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const stored = setStoredLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        resolve(stored);
      },
      () => {
        resolve(getStoredLocation());
      },
      { timeout: 5000, maximumAge: 600000 }
    );
  });
};

export default {
  getStoredLocation,
  setStoredLocation,
  detectAndStoreUserLocation,
};
