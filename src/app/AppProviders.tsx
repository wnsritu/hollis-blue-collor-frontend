import { useEffect, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { Toaster as HotToaster, ToastBar, toast } from "react-hot-toast";
import { X } from "lucide-react";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ScrollToTop from "@/components/ScrollToTop";
import PageTitleUpdater from "@/components/PageTitleUpdater";
import { NotificationProvider } from "@/context/NotificationContext";
import { authApi } from "@/services/auth";
import { tokenStorage } from "@/utils/tokenStorage";

const SessionHeartbeat = () => {
  useEffect(() => {
    const checkSession = async () => {
      const token = tokenStorage.getAccessToken();
      if (!token) return;
      if (
        window.location.pathname.startsWith("/login") ||
        window.location.pathname.startsWith("/register")
      ) {
        return;
      }
      try {
        await authApi.me();
      } catch {
        // Interceptor automatically clears token and redirects on 401/ACCOUNT_SUSPENDED
      }
    };

    const interval = setInterval(checkSession, 15000);
    window.addEventListener("focus", checkSession);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", checkSession);
    };
  }, []);

  return null;
};

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
            top: 24,
            right: 24,
            zIndex: 99999,
          }}
          toastOptions={{
            duration: 4500,
            style: {
              borderRadius: "14px",
              padding: "12px 14px",
              background: "#ffffff",
              color: "#0f172a",
              border: "1px solid #e2e8f0",
              boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)",
              fontSize: "13.5px",
              fontFamily: "var(--font-sans, sans-serif)",
              maxWidth: "420px",
              lineHeight: "1.45",
            },
            success: {
              style: {
                background: "#ffffff",
                border: "1px solid #bbf7d0",
                borderLeft: "4px solid #16a34a",
                color: "#0f172a",
              },
              iconTheme: {
                primary: "#16a34a",
                secondary: "#f0fdf4",
              },
            },
            error: {
              style: {
                background: "#ffffff",
                border: "1px solid #fecdd3",
                borderLeft: "4px solid #e11d48",
                color: "#0f172a",
              },
              iconTheme: {
                primary: "#e11d48",
                secondary: "#fff1f2",
              },
            },
            loading: {
              style: {
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderLeft: "4px solid #3b82f6",
                color: "#0f172a",
              },
            },
          }}
        >
          {(t) => (
            <ToastBar toast={t}>
              {({ icon, message }) => (
                <div className="flex items-center gap-3 w-full">
                  <div className="shrink-0">{icon}</div>
                  <div className="flex-1 text-sm font-medium text-slate-800 leading-snug break-words">
                    {message}
                  </div>
                  {t.type !== "loading" && (
                    <button
                      type="button"
                      onClick={() => toast.dismiss(t.id)}
                      className="shrink-0 -mr-1 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none"
                      aria-label="Close notification"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </ToastBar>
          )}
        </HotToaster>
        <SonnerToaster position="top-right" />
        <BrowserRouter>
          <SessionHeartbeat />
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

