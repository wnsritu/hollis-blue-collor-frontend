import "@/i18n";
import { AppProviders } from "./AppProviders";
import { AppRoutes } from "@/routes";

export const App = () => {
  return (
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  );
};

export default App;
