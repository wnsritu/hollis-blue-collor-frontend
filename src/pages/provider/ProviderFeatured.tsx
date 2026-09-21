import React, { useEffect, useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader, StatusPill } from "@/components/shared/primitives";
import { usd } from "@/components/shared/cards";
import { useAuthSession } from "@/hooks/useAuth";
import StripeBookingModal from "@/components/payment/StripeBookingModal";
import {
  getActiveFeaturedPlans,
  getMyFeaturedListings,
  purchaseFeaturedListing,
  confirmFeaturedListing,
} from "@/services/featured/featured.service";
import type { FeaturedPlanItem, FeaturedListingItem } from "@/types/featured";

export function ProviderFeatured() {
  const { user } = useAuthSession();
  const [plans, setPlans] = useState<FeaturedPlanItem[]>([]);
  const [myListings, setMyListings] = useState<FeaturedListingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingPlan, setPendingPlan] = useState<FeaturedPlanItem | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansRes, listingsRes] = await Promise.all([
        getActiveFeaturedPlans(),
        getMyFeaturedListings().catch(() => ({ data: [] })),
      ]);

      if (plansRes?.data) {
        setPlans(plansRes.data);
      }
      if (listingsRes?.data) {
        setMyListings(listingsRes.data);
      }
    } catch (err: any) {
      console.error("Failed to load featured data:", err);
      toast.error(err?.message || "Failed to load featured plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Featured listings"
        subtitle="Appear above standard results in your category and ZIP codes."
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Active Plans 3-Column Grid or Empty State */}
          {plans.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center shadow-card">
              <Sparkles className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <h3 className="mt-4 font-display text-base font-bold text-foreground">
                No featured plans available
              </h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
                There are currently no active boost plans published. Please check back later or contact support.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {plans.map((p) => {
                const days = p.days ?? p.duration_days;
                const benefitsList = Array.isArray(p.benefits) ? p.benefits : [];

                return (
                  <div
                    key={p.id}
                    className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-card"
                  >
                    <span className="inline-flex w-max items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-600 border border-rose-100">
                      <Sparkles size={13} /> {days} days
                    </span>

                    <h3 className="mt-3 font-display text-lg font-bold text-foreground">
                      {p.name}
                    </h3>

                    <p className="mt-1 font-display text-3xl font-extrabold text-foreground">
                      {usd(p.price)}
                    </p>

                    <ul className="mt-4 flex-1 space-y-2 text-sm text-muted-foreground">
                      {benefitsList.map((b, idx) => (
                        <li key={idx}>· {b}</li>
                      ))}
                    </ul>

                    <Button
                      className="mt-5 w-full bg-[#b91c1c] text-white hover:bg-[#991b1b] font-semibold"
                      onClick={() => setPendingPlan(p)}
                    >
                      Feature my business
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {/* My Featured Listings Section */}
          <section className="mt-8 rounded-2xl border border-border bg-card shadow-card">
            <h2 className="px-6 pt-5 font-display text-lg font-bold">
              My featured listings
            </h2>
            <div className="mt-4 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Listing</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead className="text-right">Spend</TableHead>
                    <TableHead>Starts</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myListings.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-8 text-center text-sm text-muted-foreground"
                      >
                        You have no featured listings running yet. Pick a plan above to boost your business!
                      </TableCell>
                    </TableRow>
                  ) : (
                    myListings.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="font-medium text-foreground">
                          {l.target}
                        </TableCell>
                        <TableCell>{l.plan}</TableCell>
                        <TableCell className="text-right font-medium">
                          {usd(l.spend)}
                        </TableCell>
                        <TableCell>{l.starts}</TableCell>
                        <TableCell>{l.expires}</TableCell>
                        <TableCell>
                          <StatusPill status={l.status as any} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </section>
        </>
      )}

      {/* Reusable Customer Booking Payment Modal */}
      {pendingPlan && (
        <StripeBookingModal
          isOpen={Boolean(pendingPlan)}
          onClose={() => setPendingPlan(null)}
          paymentData={{
            modalTitle: "Purchase featured placement",
            summaryTitle: pendingPlan.name,
            summarySubtitle: `${pendingPlan.days ?? pendingPlan.duration_days} days of boosted placement.`,
            businessName: pendingPlan.name,
            subtotal: pendingPlan.price,
            grandTotal: pendingPlan.price,
            buttonText: `Pay ${usd(pendingPlan.price)}`,
            paymentMethodSubtitle: "Enter your card details below to complete your visibility boost.",
            secureFooterNote: "",
            details: {
              name: user?.full_name || (user as any)?.provider?.business_name || "",
              zip: (user as any)?.zip_code || "",
            },
            summaryItems: [
              { label: pendingPlan.name, value: usd(pendingPlan.price) },
              {
                label: "Placement Boost Duration",
                value: `${pendingPlan.days ?? pendingPlan.duration_days} Days`,
                isMuted: true,
              },
            ],
            createIntent: async () => {
              const res = await purchaseFeaturedListing({
                plan_id: pendingPlan.id,
                duration_days: pendingPlan.days ?? pendingPlan.duration_days,
                price: pendingPlan.price,
              });
              const clientSecret = res?.data?.clientSecret;
              const paymentIntentId = res?.data?.paymentIntentId;
              if (!clientSecret) {
                throw new Error(res?.data?.message || "Failed to initialize payment.");
              }
              return { clientSecret, paymentIntentId };
            },
            onConfirmPayment: async (paymentIntentId: string) => {
              return await confirmFeaturedListing(paymentIntentId);
            },
          }}
          onSuccess={() => {
            setPendingPlan(null);
            toast.success("Featured listing active! Your profile now ranks above standard results in search.");
            loadData();
          }}
        />
      )}
    </div>
  );
}

export default ProviderFeatured;
