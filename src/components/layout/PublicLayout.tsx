import { useEffect, useState, type ReactNode } from "react";
import SiteFooter from "@/components/SiteFooter";
import Header from "@/components/Header";
import { cn } from "@/lib/utils";

export function PublicLayout({ children }: { children: ReactNode }) {
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
      <main className={cn("flex-1 transition-all duration-300", isAtTop ? "mt-0" : "mt-5")}>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}

export default PublicLayout;
