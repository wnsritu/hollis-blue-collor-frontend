import { loadGoogleMaps } from "@/utils/googleLoader";
import { useEffect, useState } from "react";

const GoogleMapsProvider = ({ children }: { children: React.ReactNode }) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadGoogleMaps().finally(() => setReady(true));
  }, []);

  if (!ready) {
    return null;
  }

  return <>{children}</>;
};

export default GoogleMapsProvider;