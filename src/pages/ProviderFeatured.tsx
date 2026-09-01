import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Star, Check, Zap, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAllPlans } from "@/api/admin.api";
import { getMyPlan, getWalletCoins } from "@/api/provider.api";
import toast from "react-hot-toast";
import StripeSubscriptionModal from "@/components/paymentModal/StripeSubscriptionModal";

const benefits = [
  "Appears higher in customer search results",
  "Better visibility within 10 miles",
  "Featured badge on your profile",
  "Priority in provider listings",
];

const ProviderFeatured = () => {
  const SHOW_FEATURED_UI = true; // ✅ Set to true when ready for production

  const [plans, setPlans] = useState([]);
  const [coins, setCoins] = useState(0);
  // ✅ STATES
  const [myPlan, setMyPlan] = useState(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentPlan, setPaymentPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const getPlans = async () => {
    try {
      const res = await getAllPlans();
      const data = res.data.data;
      setPlans(data);
      // if (data && data?.length > 0) {
      //   const middleIndex = Math.floor(data.length / 2);
      //   setSelectedPlan(data[middleIndex]);
      // }
      if (data && data?.length > 0) {

  // ✅ if active subscription exists
  if (myPlan?.plan_id) {

    const activePlan = data.find(
      (p) => p.id === myPlan.plan_id,
    );

    if (activePlan) {
      setSelectedPlan(activePlan);
      return;
    }
  }

  // default middle plan
  const middleIndex = Math.floor(data.length / 2);

  setSelectedPlan(data[middleIndex]);
}
    } catch (err) {
      console.error(err);
      toast.error("Failed to load plans");
    }
  };

  const getCoins = async () => {
    try {
      const res = await getWalletCoins();
      const data = res?.data;
      setCoins(data?.available_balance || 0);
    } catch (err) {
      console.error(err);
      setCoins(0);
    }
  };

  const getMySubscription = async () => {
  try {
    const res = await getMyPlan();

    const data = res?.data;

    // ✅ active subscription status
    setHasActiveSubscription(
      data?.hasActiveSubscription || false,
    );

    // ✅ full subscription object
    setMyPlan(data?.subscription || null);

  } catch (err) {
    console.error(err);
  }
};

  useEffect(() => {
  getCoins();
  getMySubscription();
}, []);

useEffect(() => {
  getPlans();
}, [myPlan]);

  // ✅ Calculate discount based on coins (max 50%)
  const calculateDiscount = (planPrice, availableCoins) => {
    // Convert coins to dollars (assuming 1 coin = $0.10 or adjust as needed)
    const coinValueInDollar = availableCoins * 0.1;
    const maxDiscount = planPrice * 0.5; // 50% max discount
    const discount = Math.min(coinValueInDollar, maxDiscount);
    const finalPrice = Math.max(0, planPrice - discount);

    return {
      discount: discount,
      finalPrice: finalPrice,
      coinsUsed: discount,
      originalPrice: planPrice,
    };
  };

  const handlePaymentSuccess = async (paymentData) => {
    try {
      toast.success("Payment successful! Your subscription is active now.");

      // Refresh coins balance
      await getCoins();

      // Optional: Refresh plans or provider data
      window.location.reload();
    } catch (err) {
      console.error(err);
      toast.error(
        "Payment succeeded but subscription activation delayed. It will activate shortly.",
      );
    }
  };

  // Update handleCoinsPayment function
  const handleCoinsPayment = () => {
    if (!selectedPlan) {
      toast.error("Please select a plan first");
      return;
    }

    if (!coins || coins <= 0) {
      toast.error("Insufficient coins. Please use card payment.");
      return;
    }

    const planPrice = Number(selectedPlan.price);
    const discountInfo = calculateDiscount(planPrice, coins);

    if (discountInfo.discount <= 0) {
      toast.error("Insufficient coins for discount. Please use card payment.");
      return;
    }
// debugger
    // ✅ Pass ALL discount details to modal
    setPaymentPlan({
      id: selectedPlan.id,
      name: selectedPlan.name,
      duration_days: selectedPlan.duration_days,
      original_price: discountInfo.originalPrice,
      price: discountInfo.finalPrice, // Final price after discount
      discount: discountInfo.discount, // Discount amount
      coins_used: discountInfo.coinsUsed, // Coins used for discount
      use_coins: true,
    });

    toast.success(
      `Discount applied! You save $${discountInfo.discount.toFixed(2)}`,
    );
    setIsModalOpen(true);
  };

  // Update handleStripePayment (no discount)
  const handleStripePayment = () => {
    if (!selectedPlan) {
      toast.error("Please select a plan first");
      return;
    }

    const planPrice = Number(selectedPlan.price);
// debugger
    setPaymentPlan({
      id: selectedPlan.id,
      name: selectedPlan.name,
      duration_days: selectedPlan.duration_days,
      original_price: planPrice,
      price: planPrice,
      discount: 0,
      coins_used: 0,
      use_coins: false,
    });

    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setPaymentPlan(null);
  };

  // If not ready, show coming soon UI
  if (!SHOW_FEATURED_UI) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] px-4">
        <div className="text-center space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent text-primary">
            <Star size={24} />
          </div>
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Zap size={12} /> Premium Feature
            </span>
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            Featured Provider Coming Soon
          </h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Boost your visibility and reach more customers with our upcoming
            featured listing feature.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-grid py-8">
      <div className="text-center mb-8">
        <Badge className="border-0 bg-primary/10 text-primary mb-3">
          <Zap size={12} className="mr-1" /> Premium Feature
        </Badge>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Upgrade to Featured Provider
        </h1>
        <p className="mt-2 text-muted-foreground max-w-md mx-auto">
          Get more visibility and attract more customers in your area.
        </p>

        {/* Show coins balance */}
        {coins > 0 && (
          <div className="mt-4 inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full">
            <Coins size={16} />
            <span className="text-sm font-medium">
              Available Coins: {coins} (${(coins * 0.1).toFixed(2)} value)
            </span>
          </div>
        )}
        {hasActiveSubscription && myPlan && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 max-w-md mx-auto">
            <h3 className="font-semibold text-blue-700">
              Active Subscription
            </h3>

            <p className="text-sm text-blue-600 mt-1">
              {myPlan.plan_name} Plan
            </p>

            <p className="text-sm text-blue-600 mt-1">
              Last Date {myPlan.end_date}
            </p>

            <p className="text-xs text-blue-500 mt-1">
              Expires in {myPlan.days_remaining} days
            </p>
          </div>
        )}
      </div>

      {/* Plans Grid */}
      <div className="grid gap-4 sm:grid-cols-3 max-w-3xl mx-auto mb-8">
        {plans?.map((plan) => {
          const discountInfo = calculateDiscount(Number(plan.price), coins);
          const hasDiscount = discountInfo.discount > 0;

          return (
            <button
              key={plan?.id}
              disabled={hasActiveSubscription}
              title={
                hasActiveSubscription
                  ? "You already have an active subscription"
                  : ""
              }
              // onClick={() => setSelectedPlan(plan)}
              onClick={() => {
                if (!hasActiveSubscription) {
                  setSelectedPlan(plan);
                }
              }}
              className={`relative rounded-xl border-2 p-6 text-center transition-all card-elevated 
                ${
                  selectedPlan?.id === plan?.id
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/30"
                }
                ${
                  hasActiveSubscription
                    ? "opacity-70 cursor-not-allowed"
                    : ""
                }`}
            >
              {plan?.id === 2 && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
                  Most Popular
                </span>
              )}
              <h3 className="font-heading text-lg font-bold text-primary">
                {plan?.name}
              </h3>
              <h3 className="font-heading text-lg font-bold text-foreground">
                {plan?.duration_days} Days
              </h3>

              {/* Price with discount */}
              <div className="mt-2">
                {hasDiscount && selectedPlan?.id === plan?.id && (
                  <span className="text-sm text-gray-400 line-through block">
                    ${plan?.price}
                  </span>
                )}
                <p className="text-3xl font-bold text-primary">
                  $
                  {hasDiscount && selectedPlan?.id === plan?.id
                    ? discountInfo.finalPrice.toFixed(2)
                    : plan?.price}
                </p>
                {hasDiscount && selectedPlan?.id === plan?.id && (
                  <p className="text-xs text-green-600 mt-1">
                    Save ${discountInfo.discount.toFixed(2)} with coins
                  </p>
                )}
              </div>

              {selectedPlan?.id === plan?.id && (
                <Check className="mx-auto mt-3 text-primary" size={20} />
              )}
            </button>
          );
        })}
      </div>

      <Card className="max-w-3xl mx-auto">
        <CardContent className="pt-6">
          <h3 className="font-heading text-base font-semibold text-foreground mb-4">
            What you get
          </h3>
          <div className="space-y-3">
            {benefits.map((b, idx) => (
              <div key={idx} className="flex items-center gap-3 text-sm">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary/10 text-secondary shrink-0">
                  <Check size={14} />
                </div>
                <span className="text-foreground">{b}</span>
              </div>
            ))}
          </div>

          {/* Pay with Card Button */}
          <Button
            className="w-full mt-6"
            onClick={handleStripePayment}
            // disabled={!selectedPlan}
            // disabled={myPlan}
            disabled={!selectedPlan || hasActiveSubscription}
            title={
              hasActiveSubscription
                ? "You already have an active subscription"
                : ""
            }
          >
            <Star size={16} className="mr-2" />
            Pay with Card — ${selectedPlan?.price || 0}
          </Button>

          {/* Pay with Coins Button */}
          <Button
            className="w-full mt-3"
            variant="outline"
            // disabled={!selectedPlan || coins <= 0}
            disabled={
              !selectedPlan ||
              coins <= 0 ||
              hasActiveSubscription
            }

            title={
              hasActiveSubscription
                ? "You already have an active subscription"
                : ""
            }
            onClick={handleCoinsPayment}
          >
            <Coins size={16} className="mr-2" />
            Pay with Coins
            {selectedPlan && coins > 0 && (
              <span className="ml-2 text-green-600">
                (Save up to ${(Number(selectedPlan.price) * 0.5).toFixed(2)})
              </span>
            )}
          </Button>

          <p className="mt-3 text-xs text-muted-foreground text-center">
            {coins > 0
              ? "Coins give you 50% discount max on any plan. Card payment available."
              : "Add coins to get up to 50% discount on plans."}
          </p>
        </CardContent>
      </Card>

      {/* Payment Modal */}
      {paymentPlan && (
        <StripeSubscriptionModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          plan={paymentPlan}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default ProviderFeatured;
