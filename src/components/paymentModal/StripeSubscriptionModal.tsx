// import React, { useState, useEffect } from "react";
// import { loadStripe } from "@stripe/stripe-js";
// import {
//   Elements,
//   PaymentElement,
//   useStripe,
//   useElements,
// } from "@stripe/react-stripe-js";
// import { X, CreditCard, Lock } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { createPaymentSubscription } from "@/api/stripe.api";
// import toast from "react-hot-toast";

// const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || "");

// // Main Modal Component
// export default function StripeSubscriptionModal({
//   isOpen,
//   onClose,
//   plan,
//   onSuccess,
// }) {
//   const [clientSecret, setClientSecret] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   // Step 1: Create payment intent when modal opens
//   useEffect(() => {
//     if (isOpen && plan) {
//       createSubscriptionPayment();
//     }
//   }, [isOpen, plan]);

//   const createSubscriptionPayment = async () => {
//     setLoading(true);
//     setError("");

//     try {
//       const req = {
//         plan_id: plan?.id,
//         use_coins: plan?.discount > 0, // ✅ Flag to use coins
//         coins_used: plan?.coins_used || 0,
//         discount_amount: plan?.discount || 0,
//         final_amount: plan?.price || plan?.original_price,
//       };
      
//       const response = await createPaymentSubscription(req);
//       const result = response?.data;

//       if (result?.success) {
//         setClientSecret(result?.data?.clientSecret);
//       } else {
//         setError(result?.message || "Failed to initialize payment");
//       }
//     } catch (err) {
//       console.error("Error creating payment:", err);
//       setError("Network error. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent className="sm:max-w-md">
//         <DialogHeader>
//           <DialogTitle className="flex items-center gap-2">
//             <CreditCard className="w-5 h-5 text-primary" />
//             Complete Payment
//           </DialogTitle>
//         </DialogHeader>

//         {loading && (
//           <div className="flex flex-col items-center justify-center py-8">
//             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
//             <p className="mt-4 text-sm text-muted-foreground">
//               Initializing payment...
//             </p>
//           </div>
//         )}

//         {error && (
//           <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 mb-4">
//             ❌ {error}
//           </div>
//         )}

//         {clientSecret && !loading && (
//           <Elements stripe={stripePromise} options={{ clientSecret }}>
//             <PaymentForm
//               plan={plan}
//               onSuccess={onSuccess}
//               onClose={onClose}
//             />
//           </Elements>
//         )}
//       </DialogContent>
//     </Dialog>
//   );
// }

// // Payment Form Component
// function PaymentForm({ plan, onSuccess, onClose }) {
//   const stripe = useStripe();
//   const elements = useElements();
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [errorMessage, setErrorMessage] = useState("");

//   const handleSubmit = async (event) => {
//     event.preventDefault();

//     if (!stripe || !elements) {
//       toast.error("Stripe not loaded. Please refresh the page.");
//       return;
//     }

//     setIsProcessing(true);
//     setErrorMessage("");

//     try {
//       // ✅ Step 2: Confirm payment with Stripe (Webhook will handle database update)
//       const { error, paymentIntent } = await stripe.confirmPayment({
//         elements,
//         confirmParams: {
//           payment_method_data: {
//             billing_details: {
//               name: localStorage.getItem("userName") || "Provider",
//               email: localStorage.getItem("userEmail") || "provider@example.com",
//             },
//           },
//         },
//         redirect: "if_required",
//       });

//       if (error) {
//         setErrorMessage(error.message);
//         toast.error(error.message);
//         setIsProcessing(false);
//         return;
//       }

//       if (paymentIntent.status === "succeeded") {
//         // ✅ NO confirm API call needed! Webhook will auto-update database
        
//         // ✅ Show success message
//         toast.success("Payment successful! Your subscription is being activated...");
        
//         // ✅ Wait 2 seconds for webhook to process
//         setTimeout(() => {
//           onSuccess?.(paymentIntent);
//           onClose();
//         }, 2000);
//       }
//     } catch (err) {
//       console.error("Payment error:", err);
//       setErrorMessage("An unexpected error occurred");
//       toast.error("Payment failed. Please try again.");
//     } finally {
//       setIsProcessing(false);
//     }
//   };

//   const finalPrice = parseFloat(plan?.price || 0);
//   const discount = parseFloat(plan?.discount || 0);
//   const originalPrice = parseFloat(plan?.original_price || finalPrice);

//   return (
//     <form onSubmit={handleSubmit} className="space-y-4">
//       <div className="bg-gray-50 rounded-lg p-4 mb-4">
//         <h4 className="font-semibold text-sm mb-2">Order Summary</h4>
        
//         {/* Show discount if applied */}
//         {discount > 0 && (
//           <>
//             <div className="flex justify-between text-sm text-gray-500 line-through">
//               <span>Original Price</span>
//               <span>${originalPrice.toFixed(2)}</span>
//             </div>
//             <div className="flex justify-between text-sm text-green-600">
//               <span>Discount (Coins Used)</span>
//               <span>-${discount.toFixed(2)}</span>
//             </div>
//           </>
//         )}
        
//         <div className="flex justify-between text-sm font-bold mt-2 pt-2 border-t">
//           <span>{plan.name} - {plan.duration_days} Days</span>
//           <span className="text-primary">${finalPrice.toFixed(2)}</span>
//         </div>
//       </div>

//       <div className="border rounded-lg p-4 max-h-[320px] overflow-y-scroll">
//         <label className="block text-sm font-medium mb-2">Card Details</label>
//         <PaymentElement />
//       </div>

//       {errorMessage && (
//         <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
//           ❌ {errorMessage}
//         </div>
//       )}

//       <Button
//         type="submit"
//         disabled={!stripe || isProcessing}
//         className="w-full"
//       >
//         {isProcessing ? (
//           <>
//             <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
//             Processing...
//           </>
//         ) : (
//           `Pay $${finalPrice.toFixed(2)}`
//         )}
//       </Button>

//       <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
//         <Lock className="w-3 h-3" />
//         Secure payment powered by Stripe
//       </div>
//     </form>
//   );
// }









import React, { useState, useEffect, useRef } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { CreditCard, Lock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createPaymentSubscription, confirmPaymentSubscription } from "@/api/stripe.api";
import toast from "react-hot-toast";
import { getMyPlan } from "@/api/provider.api";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || "");

// Main Modal Component
export default function StripeSubscriptionModal({
  isOpen,
  onClose,
  plan,
  onSuccess,
}) {
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && plan) {
      createSubscriptionPayment();
    }
  }, [isOpen, plan]);

  const createSubscriptionPayment = async () => {
    setLoading(true);
    setError("");

    try {
      const req = {
        plan_id: plan?.id,
        use_coins: plan?.discount > 0,
        coins_used: plan?.coins_used || 0,
        discount_amount: plan?.discount || 0,
        final_amount: plan?.price || plan?.original_price,
      };
      
      const response = await createPaymentSubscription(req);
      const result = response?.data;

      if (result?.success) {
        setClientSecret(result?.data?.clientSecret);
      } else {
        setError(result?.message || "Failed to initialize payment");
      }
    } catch (err) {
      console.error("Error creating payment:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Complete Payment
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-sm text-muted-foreground">
              Initializing payment...
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 mb-4">
            ❌ {error}
          </div>
        )}

        {clientSecret && !loading && (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentForm
              plan={plan}
              onSuccess={onSuccess}
              onClose={onClose}
            />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ✅ Payment Form Component with Proper Verification
function PaymentForm({ plan, onSuccess, onClose }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [verificationMessage, setVerificationMessage] = useState("");
  const pollingIntervalRef = useRef(null);
  const maxPollingAttempts = 10; // 10 * 2 seconds = 20 seconds

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // ✅ Core function to check if subscription is active
  const checkSubscriptionActivation = async () => {
    try {
      const res = await getMyPlan();
      const data = res?.data;
      
      // ✅ Check if subscription exists and is active
      const subscription = data?.subscription || null;
      const isActive = subscription?.status === "active";
      const endDate = subscription?.end_date;
      const isNotExpired = endDate ? new Date(endDate) > new Date() : false;
      
      return {
        isActivated: isActive && isNotExpired,
        subscription: subscription,
      };
    } catch (err) {
      console.error("Error checking subscription:", err);
      return { isActivated: false, subscription: null };
    }
  };

  // ✅ Polling function to wait for webhook to complete
  const waitForActivation = async (paymentIntentId) => {
    setVerificationStatus("pending");
    setVerificationMessage("Processing your payment...");
    
    let attempts = 0;
    
    return new Promise((resolve, reject) => {
      pollingIntervalRef.current = setInterval(async () => {
        attempts++;
        setVerificationMessage(`Verifying subscription activation... (${attempts}/${maxPollingAttempts})`);
        
        try {
          const { isActivated, subscription } = await checkSubscriptionActivation();
          
          if (isActivated) {
            // ✅ Success! Webhook has updated the database
            clearInterval(pollingIntervalRef.current);
            setVerificationStatus("success");
            setVerificationMessage("Subscription activated successfully!");
            resolve(subscription);
          } else if (attempts >= maxPollingAttempts) {
            // ⏰ Timeout - webhook might be delayed
            clearInterval(pollingIntervalRef.current);
            setVerificationStatus("timeout");
            setVerificationMessage("Payment successful! Your subscription will activate shortly.");
            reject(new Error("Activation timeout"));
          }
        } catch (error) {
          console.error("Polling error:", error);
          if (attempts >= maxPollingAttempts) {
            clearInterval(pollingIntervalRef.current);
            setVerificationStatus("error");
            setVerificationMessage("Unable to verify activation. Please contact support.");
            reject(error);
          }
        }
      }, 2000); // Check every 2 seconds
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      toast.error("Stripe not loaded. Please refresh the page.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage("");

    try {
      // ✅ Step 1: Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          payment_method_data: {
            billing_details: {
              name: localStorage.getItem("userName") || "Provider",
              email: localStorage.getItem("userEmail") || "provider@example.com",
            },
          },
        },
        redirect: "if_required",
      });

      if (error) {
        setErrorMessage(error.message);
        toast.error(error.message);
        setIsProcessing(false);
        return;
      }

      if (paymentIntent.status === "succeeded") {
        // ✅ Step 2: Show processing message
        toast.loading("Payment successful! Activating your subscription...", {
          duration: 10000,
        });

        // ✅ Directly confirm the payment with backend (fallback for local development webhooks)
        try {
          await confirmPaymentSubscription({ payment_intent_id: paymentIntent.id });
        } catch (confirmErr) {
          console.error("Direct payment confirmation API call failed:", confirmErr);
        }

        // ✅ Step 3: Poll backend to confirm webhook/API processed
        try {
          const subscription = await waitForActivation(paymentIntent.id);
          
          // ✅ Step 4: Success! Webhook has updated the database
          toast.dismiss();
          toast.success("Subscription activated successfully!");
          
          // ✅ Step 5: Close modal and refresh parent component
          setTimeout(() => {
            onSuccess?.(subscription);
            onClose();
          }, 1500);
          
        } catch (pollingError) {
          // ⚠️ Webhook didn't update within timeout, but payment was successful
          toast.dismiss();
          
          if (verificationStatus === "timeout") {
            toast.success("Payment successful! Your subscription will activate shortly.");
          } else {
            toast.error("Payment successful but activation confirmation failed. Please contact support.");
          }
          
          // Still close modal
          setTimeout(() => {
            onSuccess?.(null);
            onClose();
          }, 2000);
        }
      }
    } catch (err) {
      console.error("Payment error:", err);
      setErrorMessage("An unexpected error occurred");
      toast.error("Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const finalPrice = parseFloat(plan?.price || 0);
  const discount = parseFloat(plan?.discount || 0);
  const originalPrice = parseFloat(plan?.original_price || finalPrice);

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {/* Order Summary */}
      <div className="bg-gray-50 rounded-lg p-4 mb-1">
        <h4 className="font-semibold text-sm mb-2">Order Summary</h4>
        
        {discount > 0 && (
          <>
            <div className="flex justify-between text-sm text-gray-500 line-through">
              <span>Original Price</span>
              <span>${originalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount (Coins Used)</span>
              <span>-${discount.toFixed(2)}</span>
            </div>
          </>
        )}
        
        <div className="flex justify-between text-sm font-bold mt-2 pt-2 border-t">
          <span>{plan.name} - {plan.duration_days} Days</span>
          <span className="text-primary">${finalPrice.toFixed(2)}</span>
        </div>
      </div>

      {/* Card Details */}
      <div className="border rounded-lg p-4 max-h-[320px] overflow-y-scroll">
      {/* <div className="border rounded-lg p-4"> */}
        <label className="block text-sm font-medium mb-2">Card Details</label>
        <PaymentElement />
      </div>

      {/* ✅ Verification Status UI */}
      {verificationStatus === "pending" && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-blue-700">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">{verificationMessage}</span>
          </div>
        </div>
      )}

      {verificationStatus === "success" && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">{verificationMessage}</span>
          </div>
        </div>
      )}

      {(verificationStatus === "timeout" || verificationStatus === "error") && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-yellow-700">
            <XCircle className="w-4 h-4" />
            <span className="text-sm font-medium">{verificationMessage}</span>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
          ❌ {errorMessage}
        </div>
      )}

      <Button
        type="submit"
        disabled={!stripe || isProcessing || verificationStatus === "pending"}
        className="w-full"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : verificationStatus === "pending" ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Verifying...
          </>
        ) : (
          `Pay $${finalPrice.toFixed(2)}`
        )}
      </Button>

      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Lock className="w-3 h-3" />
        Secure payment powered by Stripe
      </div>
    </form>
  );
}
