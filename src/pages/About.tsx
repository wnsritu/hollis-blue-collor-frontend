import { Logo, SectionHeading } from "@/components/shared/primitives";

const stats = [
  { k: "1,148", v: "Active professionals" },
  { k: "6,015", v: "Homeowners served" },
  { k: "48", v: "States covered" },
  { k: "4.8★", v: "Average provider rating" },
];

export function About() {
  return (
    <div className="w-full">
      {/* Founder Message Section — Full Width at Top of Page */}
      <section className="border-b border-border bg-surface py-12 sm:py-16">
        <div className="container-page w-full">
          <div className="w-full rounded-3xl border border-border bg-card p-8 sm:p-12 shadow-card flex flex-col md:flex-row items-center justify-between gap-8 sm:gap-12">
            <div className="space-y-4 flex-1">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft px-3.5 py-1 text-xs font-bold text-primary">
                Founder Message
              </span>
              <h1 className="font-display text-3xl font-extrabold sm:text-4xl text-foreground leading-tight">
                Built to bring trust and clarity back to home services.
              </h1>
              <p className="text-base sm:text-lg leading-relaxed text-muted-foreground">
                "Hollis was founded on a simple commitment: homeowners deserve complete price clarity before work starts, and quality professionals deserve a direct, fair marketplace to grow their business."
              </p>
              <div className="pt-2">
                <p className="font-extrabold text-foreground text-base">Marcus Vance</p>
                <p className="text-sm text-muted-foreground font-medium">Founder &amp; CEO, Hollis</p>
              </div>
            </div>
            {/* Very Big Logo positioned on the right side */}
            <div className="shrink-0 flex items-center justify-center p-10 sm:p-12 bg-muted/40 rounded-3xl border border-border/80 w-full md:w-80 lg:w-[420px]">
              <Logo imgClassName="h-44 sm:h-56 md:h-64 max-h-none w-auto object-contain" />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-surface py-14">
        <div className="container-page max-w-3xl">
          <h2 className="text-3xl font-extrabold sm:text-4xl text-foreground">We're fixing how America hires contractors</h2>
          <p className="mt-4 text-muted-foreground sm:text-lg leading-relaxed">
            Homeowners waste weeks chasing quotes. Good contractors waste money on lead-generation
            platforms that sell the same lead five times. Hollis replaces both with one marketplace:
            flat subscriptions for pros, itemized proposals for customers, and a single transparent
            commission on completed work.
          </p>
        </div>
      </section>

      <section className="container-page py-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.v} className="rounded-2xl border border-border bg-card p-6 text-center shadow-card">
              <p className="font-display text-3xl font-extrabold text-primary">{s.k}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.v}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page pb-20">
        <SectionHeading eyebrow="Principles" title="What we hold ourselves to" />
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              t: "Reviews that mean something",
              b: "Only customers who paid for a completed job through the platform can leave a review.",
            },
            {
              t: "Verified & Background Checked Pros",
              b: "Every service professional undergoes thorough license, insurance, and background checks before taking jobs.",
            },
            {
              t: "Clear, Upfront Pricing Guarantee",
              b: "Homeowners receive detailed, itemized quotes before work begins, ensuring zero hidden fees or surprises.",
            },
          ].map((c) => (
            <div key={c.t} className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <h3 className="font-display text-base font-bold">{c.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.b}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default About;
