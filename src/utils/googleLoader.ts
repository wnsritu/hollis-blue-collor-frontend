let googleMapsPromise: Promise<void> | null = null;

export const loadGoogleMaps = (): Promise<void> => {
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve) => {
    if (typeof window !== "undefined" && window.google?.maps?.places) {
      resolve();
      return;
    }

    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!key || key === "undefined" || key === "your_google_maps_api_key_here") {
      resolve();
      return;
    }

    const script = document.createElement("script");

    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&v=weekly`;
    script.async = true;
    script.defer = true;

    script.onload = () => resolve();
    script.onerror = () => resolve();

    document.head.appendChild(script);
  });

  return googleMapsPromise;
};