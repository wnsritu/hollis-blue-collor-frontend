import { Link } from "react-router-dom";
import { Logo } from "@/components/shared/primitives";

const columns = [
  {
    title: "For Customers",
    links: [
      { label: "Find a Professional", to: "/search" },
      { label: "How It Works", to: "/how-it-works" },
    ],
  },
  {
    title: "For Professionals",
    links: [
      { label: "Become a Professional", to: "/provider/pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", to: "/about" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms", to: "/#terms" },
      { label: "Privacy", to: "/#privacy" },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-surface">
      <div className="container-page py-14">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_repeat(4,minmax(0,1fr))]">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-3 text-sm text-muted-foreground">
              Connecting customers with trusted local professionals.
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              Serving homeowners and licensed professionals nationwide.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold">{col.title}</h3>
              <ul className="mt-3 space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      to={l.to}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Hollis, Inc. All rights reserved.
          </p>
          <p>Made for homeowners and service pros.</p>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;
