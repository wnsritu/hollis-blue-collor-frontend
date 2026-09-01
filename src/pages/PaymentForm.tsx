// // components/PaymentButton.jsx
// import React, { useState } from "react";
// import { loadStripe } from "@stripe/stripe-js";
// import {
//   Elements,
//   PaymentElement,
//   useStripe,
//   useElements,
// } from "@stripe/react-stripe-js";
// import { createPaymentIntent } from "@/api/stripe.api";

// // type PaymentFormProps = {
// //   bookingId?: any;
// //   amount: number;
// //   onSuccess: () => void; // 👈 ye add karo
// // };

// const stripePromise = loadStripe(
//   process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
// );

// // Main Component
// export default function PaymentButton({ bookingId, amount }) {
//   const [showForm, setShowForm] = useState(false);
//   const [clientSecret, setClientSecret] = useState("");
//   const [loading, setLoading] = useState(false);

//   // Step 1: Called when user clicks "Pay Now" button
//   const handlePayNow = async () => {
//     setLoading(true);

//     try {
//       let body = {
//         // booking_id: orderData.id  // Send booking ID only
//         booking_id: 97, // Send booking ID only
//       };

//       const response = await createPaymentIntent(body);

//       const result: any = await response.data;

//       if (result.success) {
//         setClientSecret(result.data.clientSecret);
//         setShowForm(true); // Step 2: Show card form
//       } else {
//         console.log(result.message);
//         alert("Payment initialization failed: " + result.message);
//       }
//     } catch (error) {
//       console.log("Error:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div>
//       {/* Step 1: Initial Pay Now Button */}
//       {!showForm && (
//         <button
//           onClick={handlePayNow}
//           disabled={loading}
//           className="bg-blue-600 text-white px-6 py-3 rounded-lg"
//         >
//           {loading ? "Loading..." : `Pay Now ₹${amount}`}
//         </button>
//       )}

//       {/* Step 2 & 3 & 4: Card Form (appears after API call) */}
//       {showForm && clientSecret && (
//         <div className="border rounded-lg p-4 mt-4">
//           <Elements stripe={stripePromise} options={{ clientSecret }}>
//             <PaymentForm
//               amount={Number(amount)}
//               onSuccess={() => {
//                 setShowForm(false);
//                 // toast.success("Payment successful!");
//               }}
//             />
//           </Elements>
//         </div>
//       )}
//     </div>
//   );
// }

// // // Card Form Component (Steps 3 & 4)
// function PaymentForm({ amount, onSuccess }) {
//   const stripe = useStripe();
//   const elements = useElements();
//   const [processing, setProcessing] = useState(false);

//   // Step 3 & 4: Handle form submission and payment
//   const handleSubmit = async (event) => {
//     event.preventDefault();

//     if (!stripe || !elements) return;

//     setProcessing(true);

//     // This confirms the payment with Stripe
//     const { error, paymentIntent } = await stripe.confirmPayment({
//       elements,
//       confirmParams: {
//         payment_method_data: {
//           billing_details: {
//             name: "Customer Name",
//             email: "customer@example.com",
//           },
//         },
//       },
//       redirect: "if_required",
//     });
// debugger
//     if (error) {
//       alert("Payment failed: " + error.message);
//       setProcessing(false);
//     } else if (paymentIntent.status === "succeeded") {
//       // try {
//       //   return
//       //   let body = {
//       //      payment_intent_id: paymentIntent.id
//       //   }
//       //   const confirmResponse = await confirmPayment(body);

//       //   const confirmResult = await confirmResponse.data;
//       //   if (confirmResult.success) {
//       //     toast.success('Payment successful! Booking confirmed.');
//       //   } else {
//       //     console.error('Database update failed:', confirmResult.message);
//       //     toast.error('Payment taken but booking update pending. Contact support.');
//       //   }
//       // } catch (dbError) {
//       //   console.error('Error updating database:', dbError);
//       //   toast.error('Payment successful but booking status pending sync');
//       // }
//       // onSuccess();
//       setProcessing(false);
//     }
//   };

//   return (
//     <form onSubmit={handleSubmit}>
//       <div className="mb-4">
//         <label className="block text-gray-700 mb-2">Card Details</label>
//         <PaymentElement />
//       </div>

//       <button
//         type="submit"
//         disabled={!stripe || processing}
//         className="w-full bg-green-600 text-white px-6 py-3 rounded-lg"
//       >
//         {processing ? "Processing..." : `Confirm Payment ₹${amount}`}
//       </button>
//     </form>
//   );
// }
