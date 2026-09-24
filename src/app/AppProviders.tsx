import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import ScrollToTop from "@/components/ScrollToTop";
import PageTitleUpdater from "@/components/PageTitleUpdater";

const queryClient = new QueryClient();

export interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders = ({ children }: AppProvidersProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster position="top-right" />
        <BrowserRouter>
          <ScrollToTop />
          <PageTitleUpdater />
          {children}
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default AppProviders;
