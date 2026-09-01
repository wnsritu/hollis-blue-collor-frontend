import { loadGoogleMaps } from "@/utils/googleLoader";
import { useEffect, useState } from "react";

const GoogleMapsProvider = ({ children }: { children: React.ReactNode }) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadGoogleMaps()
      .then(() => setReady(true))
      .catch(console.error);
  }, []);

  if (!ready) {
    return <div>Loading Maps...</div>; // or skeleton
  }

  return <>{children}</>;
};

export default GoogleMapsProvider;