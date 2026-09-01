import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { GoogleOAuthProvider } from "@react-oauth/google";
// import GoogleMapsProvider from "./components/ui/GoogleMapsProvider.tsx";

createRoot(document.getElementById("root")!).render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    {/* <GoogleMapsProvider> */}
      <App />
    {/* </GoogleMapsProvider> */}
  </GoogleOAuthProvider>,
);
