import { Link } from "react-router-dom";
import { ArrowRight, ClipboardList, CreditCard, FileText, Star, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/shared/primitives";

const customerSteps = [
  { icon: ClipboardList, title: "Choose a service", body: "Select from hundreds of offered services from top rated local pros." },
  { icon: Users, title: "Pick a professional", body: "Compare pricing, ratings, licenses, and verified customer reviews." },
  { icon: FileText, title: "Book a slot", body: "Pick a date & time directly from the professional's open calendar." },
  { icon: CreditCard, title: "Pay through the platform", body: "One secure checkout with receipt and full transaction history." },
  { icon: Star, title: "Review the work", body: "Leave feedback on completed, verified jobs." },
];

export function HowItWorks() {
  return (
    <div className="w-full">
      <section className="border-b border-border bg-surface py-16">
        <div className="container-page max-w-3xl text-center">
          <h1 className="text-4xl font-extrabold sm:text-5xl text-foreground">How Hollis works</h1>
          <p className="mt-4 text-muted-foreground sm:text-lg leading-relaxed">
            A marketplace built so homeowners know the price before work starts and professionals know
            exactly what they'll be paid.
          </p>
        </div>
      </section>

      <section className="container-page py-16">
        <SectionHeading eyebrow="For customers" title="Five steps to a finished job" />
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          {customerSteps.map((s, i) => (
            <div key={s.title} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
                <s.icon size={18} />
              </span>
              <p className="mt-3 text-xs font-bold text-primary">0{i + 1}</p>
              <h3 className="font-display text-base font-bold text-foreground">{s.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page py-16 text-center">
        <h2 className="font-display text-2xl font-bold sm:text-3xl text-foreground">Ready to get started?</h2>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/search">
              Find a Professional <ArrowRight size={16} />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/register?role=provider">Join as a Professional</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

export default HowItWorks;
