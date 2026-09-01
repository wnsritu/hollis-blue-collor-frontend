import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { bootstrapApi } from "@/hooks/useAuth";
import { env } from "@/config/env";
// import GoogleMapsProvider from "./components/ui/GoogleMapsProvider.tsx";

bootstrapApi({
  onUnauthorized: () => {
    // Pages can listen via authStore; soft redirect only if not already home
    if (window.location.pathname !== "/") {
      window.location.assign("/");
    }
  },
});

createRoot(document.getElementById("root")!).render(
  <GoogleOAuthProvider clientId={env.googleClientId || import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    {/* <GoogleMapsProvider> */}
      <App />
    {/* </GoogleMapsProvider> */}
  </GoogleOAuthProvider>,
);
