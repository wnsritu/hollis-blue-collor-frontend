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
        <HotToaster
          position="top-right"
          containerStyle={{
            top: 20,
            right: 20,
          }}
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: "16px",
              padding: "14px 18px",
              boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.03)",
              fontSize: "13.5px",
              fontFamily: "var(--font-sans, sans-serif)",
              maxWidth: "420px",
              lineHeight: "1.45",
            },
            success: {
              style: {
                background: "#edfdf2",
                border: "1px solid #bbf7d0",
                color: "#15803d",
                fontWeight: "600",
              },
              iconTheme: {
                primary: "#16a34a",
                secondary: "#ffffff",
              },
            },
            error: {
              style: {
                background: "#fff1f2",
                border: "1px solid #fecdd3",
                color: "#9f1239",
                fontWeight: "600",
              },
              iconTheme: {
                primary: "#e11d48",
                secondary: "#ffffff",
              },
            },
            loading: {
              style: {
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                color: "#334155",
              },
            },
          }}
        />
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

