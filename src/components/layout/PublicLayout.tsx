import { useEffect, useState, type ReactNode } from "react";
import { Outlet } from "react-router-dom";
import SiteFooter from "@/components/SiteFooter";
import Header from "@/components/Header";
import { cn } from "@/lib/utils";

export function PublicLayout({ children }: { children?: ReactNode }) {
  const [isAtTop, setIsAtTop] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setIsAtTop(window.scrollY < 20);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 pt-4 sm:pt-6 transition-all duration-300">
        {children ?? <Outlet />}
      </main>
      <SiteFooter />
    </div>
  );
}

export default PublicLayout;
