import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { Toaster as HotToaster } from "react-hot-toast";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ScrollToTop from "@/components/ScrollToTop";
import PageTitleUpdater from "@/components/PageTitleUpdater";
import { NotificationProvider } from "@/context/NotificationContext";

const queryClient = new QueryClient();

export interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders = ({ children }: AppProvidersProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <HotToaster position="top-right" />
        <SonnerToaster position="top-right" />
        <BrowserRouter>
          <NotificationProvider>
            <ScrollToTop />
            <PageTitleUpdater />
            {children}
          </NotificationProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default AppProviders;

