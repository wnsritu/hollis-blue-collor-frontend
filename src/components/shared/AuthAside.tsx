import { CheckCircle2, Star } from "lucide-react";

const bullets = [
  "Verified, licensed and insured professionals",
  "Itemized proposals — labor, materials and fees",
  "Secure platform payments with full receipts",
  "Reviews tied to completed, paid jobs",
];

export function AuthAside() {
  return (
    <div className="relative hidden overflow-hidden bg-[#011C40] p-12 text-white lg:flex lg:flex-col lg:justify-center">
      <div className="absolute inset-0 grid-dots opacity-20" aria-hidden />
      <div className="relative max-w-md">
        <p className="text-xs font-bold uppercase tracking-[0.16em] opacity-75 text-white/80">
          The Hollis Marketplace
        </p>
        <h2 className="mt-4 font-display text-3xl font-extrabold leading-tight text-white sm:text-4xl">
          Find the right professional. Get the job done.
        </h2>

        <ul className="mt-8 space-y-4">
          {bullets.map((b) => (
            <li key={b} className="flex items-center gap-3 text-sm font-medium text-white/90">
              <CheckCircle2 size={18} className="shrink-0 text-white" />
              {b}
            </li>
          ))}
        </ul>

        <div className="mt-10 rounded-2xl border border-white/15 bg-white/10 p-6 backdrop-blur">
          <div className="flex gap-1 text-[#BF1523]">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={16} className="fill-[#BF1523] text-[#BF1523]" />
            ))}
          </div>
          <p className="mt-3 text-sm leading-relaxed opacity-90 text-white/90 font-medium">
            “Posted a job at 7am with a leaking water heater. Four itemized bids by 9am, installed the same afternoon.”
          </p>
          <p className="mt-3 text-xs font-semibold text-white/70">Sarah W. — Austin, TX</p>
        </div>
      </div>
    </div>
  );
}

export default AuthAside;
