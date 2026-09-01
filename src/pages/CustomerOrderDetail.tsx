import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { loadStripe } from "@stripe/stripe-js";
import { confirmPayment, createCheckoutSessionApi, createPaymentIntent } from "@/api/stripe.api";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
import {
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  Upload,
  Star,
  ShoppingBag,
  Truck,
  CreditCard,
  X,
  Eye,
  ShieldCheck,
  User,
  Quote,
} from "lucide-react";
import { saveOrderBookingState } from "@/utils/bookingState";
import { getDisputeDetail, getOrderDetails, getRatingByBookingId } from "@/services/order.service";
import { addPhotoInBookingApi } from "@/api/provider.api";
import toast from "react-hot-toast";
import { updateCustomPricingStatusAPI } from "@/api/pricing.api";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import StripeBookingModal from "@/components/paymentModal/StripeBookingModal";


const statusSteps = ["Received", "Accepted", "In Process", "Finished", "Delivered"];

const mockDisputeData = {
  status: "Under Review" as string,
  images: [
    "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=200&h=150&fit=crop",
    "https://images.unsplash.com/photo-1567113463300-102a7eb3cb26?w=200&h=150&fit=crop",
    "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=200&h=150&fit=crop",
  ],
  providerResponse:
    "We followed standard washing procedures. The stains appear to be pre-existing. We are willing to re-wash the affected items at no charge.",
  timeline: [
    {
      date: "Mar 15, 2026 — 2:30 PM",
      event: "Dispute submitted by customer",
      icon: "submit",
    },
    {
      date: "Mar 15, 2026 — 3:00 PM",
      event: "Support agent assigned",
      icon: "agent",
    },
    {
      date: "Mar 15, 2026 — 4:15 PM",
      event: "Provider notified and responded",
      icon: "provider",
    },
    {
      date: "Mar 16, 2026 — 10:00 AM",
      event: "Evidence under review",
      icon: "review",
    },
  ],
  supportActivity: [
    {
      agent: "Agent Sarah",
      action: "Reviewed customer evidence",
      date: "Mar 16, 2026",
    },
    {
      agent: "Agent Sarah",
      action: "Requested additional photos from provider",
      date: "Mar 16, 2026",
    },
  ],
};

const issueTypes = [
  "Damaged Items",
  "Late Delivery",
  "Missing Items",
  "Wrong Service",
  "Other",
];


const disputeStatusColors: Record<string, string> = {
  "Under Review": "bg-amber-500/10 text-amber-600",
  Resolved: "bg-secondary/10 text-secondary",
  "Refund Issued": "bg-primary/10 text-primary",
  "Payment Released": "bg-secondary/10 text-secondary",
};

// Status mapping for API status to display status
const getDisplayStatus = (apiStatus) => {
  const statusMap = {
    pending: "Received",
    accepted: "Accepted",
    in_process: "In Process",
    finished: "Finished",
    delivering: "Delivering",
    delivered: "Delivered",
    completed: "Finished",
  };
  return statusMap[apiStatus] || apiStatus || "Received";
};

// Get status color
const getStatusColor = (status) => {
  const colorMap = {
    Received: "bg-primary/10 text-primary",
    "In Process": "bg-primary/10 text-primary",
    Finished: "bg-secondary/10 text-secondary",
    Delivered: "bg-secondary/10 text-secondary",
  };
  return colorMap[status] || "bg-accent text-foreground";
};

// Get active index for timeline
const getActiveIndex = (status) => {
  const steps = ["Received", "Accepted", "In Process", "Finished", "Delivered"];
  const displayStatus = getDisplayStatus(status);
  const index = steps.indexOf(displayStatus);
  return index >= 0 ? index : 0;
};

const CustomerOrderDetail = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const [hasDispute] = useState(true);

  const [orderData, setOrderData] = useState(null);
  const [disputeData, setDisputeData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imgError, setImgError] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [providerRating, setProviderRating] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response: any = await getOrderDetails(id);
        // debugger
        if (response.data.success) {
          setOrderData(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchDataRating = async (id) => {
    try {
      setLoading(true);
      // debugger
      const response: any = await getRatingByBookingId(id);
      if (response?.data?.success) {
        setProviderRating(response?.data);
        // toast.success(response?.data?.message || "Rating fetched");
      }
    } catch (error) {
      console.error("Error fetching rating:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDisputeData = async () => {
    try {
      setLoading(true);
      // debugger
      const response: any = await getDisputeDetail({ "booking_id": id });
      if (response?.data?.success) {
        setDisputeData(response.data.data);
      }
    } catch (error) {
      // console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderData?.status === "delivered" && id) {
      fetchDisputeData();
      fetchDataRating(id);
    }
  }, [orderData, id]);

  // Show loading state
  if (loading) {
    return (
      <div className="container-grid py-8">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">
              Loading order details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If no order data
  if (!orderData) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] px-4">
        <div className="text-center space-y-5">
          {/* Icon */}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent text-primary">
            <Truck size={24} />
          </div>

          {/* Title */}
          <h2 className="text-lg font-semibold text-foreground">
            Order Tracking Coming Soon
          </h2>

          {/* Subtitle */}
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            We're building your dashboard experience. Soon you'll be able to
            track orders, earnings, and performance all in one place.
          </p>
        </div>
      </div>
    );
  }

  const displayStatus = getDisplayStatus(orderData.status);
  const activeIndex = getActiveIndex(orderData.status);
  const orderAmount = parseFloat(orderData.total_amount) || 0;

  // Add these helper functions at the top of your component
  const canChat = (status, payment_status) => {
    return (payment_status === "paid" && [
      "accepted",
      "in_process",
      "finished",
      "delivered",
    ].includes(status));
  };

  const canReview = (status) => {
    return ["delivered", "completed"].includes(status);
  };

  const canRaiseDispute = (status) => {
    // Dispute can only be raised after order is completed/delivered/finished
    return ["delivered", "completed"].includes(status);
  };

  const handleImageSelect = async (event: any) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    // ❌ Max 5 images
    if (imageFiles.length + files.length > 5) {
      toast.error("Max 5 images allowed");
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];

    let validFiles: File[] = [];
    let previewUrls: string[] = [];

    files.forEach((file: File) => {
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name} not allowed`);
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} > 5MB`);
        return;
      }

      validFiles.push(file);
      previewUrls.push(URL.createObjectURL(file));
    });

    // ✅ Save
    setImageFiles((prev) => [...prev, ...validFiles]);
    setImagePreviews((prev) => [...prev, ...previewUrls]);

    // ✅ Upload all files
    const formData = new FormData();
    validFiles.forEach((file) => {
      formData.append("photo", file); // 👈 backend array support
    });

    formData.append("status", "delivered");
    formData.append("booking_id", orderData.id);

    const uploadPromise = async () => {
      const res = await addPhotoInBookingApi(formData);
      // console.log(res);
      // debugger
      if (!res) throw new Error("Upload failed");
      return res;
    };

    await toast.promise(uploadPromise(), {
      loading: "Uploading images...",
      success: "Images uploaded",
      error: "Upload failed",
    });
  };

  const handleRemoveImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));

    setImagePreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };
  const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

  const handlePriceAction = async (type: "accept" | "reject") => {
    try {
      const statusMap = {
        accept: "accepted",
        reject: "rejected",
      };

      const payload = {
        booking_id: orderData.id,
        status: statusMap[type],
      };

      const promise = async () => {
        const res: any = await updateCustomPricingStatusAPI(payload);

        console.log("PRICE UPDATE RES:", res);

        // ✅ Flexible success check
        const isSuccess =
          res?.data?.success === true ||
          res?.success === true ||
          res?.data?.status === true;

        if (!isSuccess) {
          throw new Error("Failed to update the price. Please try again.");
        }

        return res;
      };

      await toast.promise(promise(), {
        loading: "Processing...",
        success: () =>
          type === "accept"
            ? "Price accepted successfully"
            : "Price rejected successfully",
        error: (err) =>
          err?.message || "Something went wrong. Please try again.",
      });

      // 🔄 Refresh order
      const refreshed = await getOrderDetails(orderData.id);

      if (refreshed?.data?.success) {
        setOrderData(refreshed.data.data);
      }
    } catch (err) {
      console.error("FINAL ERROR:", err);
    }
  };

  const hasCustomItems = orderData?.items?.some((item) => item.is_custom);
  const showPriceApproval =
    hasCustomItems && orderData?.status === "price_updated";


  const handlePayNow = () => {
    if (!orderData) {
      toast.error("Booking data not found");
      return;
    }

    if (orderData.payment_status === "paid") {
      toast.error("Booking is already paid");
      return;
    }

    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = (paymentData) => {
    toast.success("Payment successful! Your booking is confirmed.");

    // console.log(paymentData);
    // debugger
    // Optional: Refresh page or redirect
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleModalClose = () => {
    setIsPaymentModalOpen(false);
  };

  const isDisputePresent =
    orderData?.dispute_status && orderData?.dispute_status !== "none";

  const isDisabled = !canRaiseDispute(orderData?.status) || isDisputePresent;
  console.log(isDisabled);
  console.log(`${BASE_URL}${orderData.customer_completion_img}`)

  return (
    <div className="container-grid py-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            {t("orderDetails")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {orderData.order_id ||
              `ORD-${orderData.id.toString().padStart(3, "0")}`}
          </p>
        </div>
        <Badge className={`w-fit border-0 ${getStatusColor(displayStatus)}`}>
          {displayStatus}
        </Badge>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Provider info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Provider Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Link
                  to={`/provider/${orderData.provider?.id || orderData.provider_id || orderData.provider?.user_id}?from=orders&orderId=${orderData.id}&category=${orderData.category_id || (orderData.service_category === "House Cleaning" ? 2 : orderData.service_category === "Car Wash" ? 3 : 1)}`}
                  onClick={() => saveOrderBookingState(orderData)}
                >
                  <img
                    src={
                      orderData?.provider?.profile_photo
                        ? `${BASE_URL}${orderData?.provider?.profile_photo}`
                        : "/default-profile.png"
                    }
                    alt={orderData.provider?.business_name || "Provider"}
                    className="h-14 w-14 rounded-xl object-cover hover:opacity-90 transition-opacity"
                  />
                </Link>
                <div>
                  <Link
                    to={`/provider/${orderData.provider?.id || orderData.provider_id || orderData.provider?.user_id}?from=orders&orderId=${orderData.id}&category=${orderData.category_id || (orderData.service_category === "House Cleaning" ? 2 : orderData.service_category === "Car Wash" ? 3 : 1)}`}
                    onClick={() => saveOrderBookingState(orderData)}
                  >
                    <h3 className="font-heading text-base font-semibold text-foreground hover:text-primary transition-colors cursor-pointer hover:underline">
                      {orderData.provider?.business_name || "Provider Name"}
                    </h3>
                  </Link>
                  {!["finished", "delivered", "cancelled", "rejected"].includes(
                    orderData?.status?.toLowerCase()
                  ) && orderData?.payment_status === "paid" && (
                      <p className="text-sm text-muted-foreground">
                        {orderData?.provider?.service_location_address ||
                          "Address not available"}
                      </p>
                    )}
                  <p className="text-sm text-muted-foreground">
                    ⭐ {orderData?.provider?.rating || "No rating"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Customer Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 text-sm sm:grid-cols-1">
                <div>
                  <span className="text-muted-foreground">Name:</span>{" "}
                  <span className="font-medium text-foreground">
                    {orderData.customer?.first_name}{" "}
                    {orderData.customer?.last_name}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Address:</span>{" "}
                  {orderData?.payment_status === "paid" ? (
                    <span className="font-medium text-foreground">
                      {orderData?.pickup_address || "Address not provided"}
                    </span>
                  ) : (
                    <span className="font-medium text-foreground text-sm text-gray-500">
                      Address will be visible once payment is completed.
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          {orderData.order_type !== "bulk" && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Order Items</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-accent/50">
                        <th className="px-5 py-3 text-left font-semibold">
                          {t("item")}
                        </th>
                        <th className="px-5 py-3 text-left font-semibold">
                          {t("service")}
                        </th>
                        <th className="px-5 py-3 text-right font-semibold">
                          {t("quantity")}
                        </th>
                        <th className="px-5 py-3 text-right font-semibold">
                          {t("price")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderData.items && orderData.items.length > 0 ? (
                        orderData.items.map((item, i) => (
                          <tr
                            key={i}
                            className="border-b border-border last:border-0"
                          >
                            <td className="px-5 py-3">
                              {item.item?.name || item.custom_item_name}
                            </td>
                            <td className="px-5 py-3">
                              {item.service?.name ||
                                `Service ${item.service_id}`}
                            </td>
                            <td className="px-5 py-3 text-right">
                              {item.quantity}
                            </td>
                            <td className="px-5 py-3 text-right">
                              {item.is_custom ? (
                                <span className="font-semibold ">
                                  ${Number(item.price || 0).toFixed(2)}
                                </span>
                              ) : (
                                <span>
                                  ${Number(item.price || 0).toFixed(2)}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-5 py-3 text-center text-muted-foreground"
                          >
                            No items found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {orderData.order_type === "bulk" &&
            orderData.status === "price_updated" && (
              <Card className="border-2 border-primary/20 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShoppingBag size={18} className="text-primary" />
                    Bulk Order Price Approval
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Display only */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/40 rounded-lg px-4 py-3 text-center">
                      <p className="text-xs text-muted-foreground">Weight</p>
                      <p className="font-bold">
                        {orderData.bulk_order?.weight || 0} lbs
                      </p>
                    </div>

                    <div className="bg-muted/40 rounded-lg px-4 py-3 text-center">
                      <p className="text-xs text-muted-foreground">
                        Price / lb
                      </p>
                      <p className="font-bold">
                        $
                        {Number(
                          orderData.bulk_order?.price_per_lb || 0,
                        ).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="flex justify-between bg-muted/30 px-4 py-3 rounded-lg">
                    <span className="text-sm text-muted-foreground">
                      Total Amount
                    </span>
                    <span className="text-lg font-bold text-foreground">
                      $
                      {(
                        Number(orderData.bulk_order?.weight || 0) *
                        Number(orderData.bulk_order?.price_per_lb || 0)
                      ).toFixed(2)}
                    </span>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handlePriceAction("accept")}
                      disabled={loading}
                    >
                      <CheckCircle size={16} className="mr-2" />
                      Accept
                    </Button>

                    <Button
                      variant="outline"
                      className="flex-1 border-red-500 text-red-600 hover:bg-red-50"
                      onClick={() => handlePriceAction("reject")}
                      disabled={loading}
                    >
                      <X size={16} className="mr-2" />
                      Reject
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    Please approve or reject bulk pricing before processing.
                  </p>
                </CardContent>
              </Card>
            )}
          {showPriceApproval && (
            <Card className="border-2 border-primary/20 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard size={18} className="text-primary" />
                  Custom Pricing Approval
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Total */}
                <div className="flex justify-between items-center bg-muted/40 rounded-lg px-4 py-3">
                  <span className="text-sm text-muted-foreground">
                    Total Amount
                  </span>
                  <span className="text-lg font-bold text-foreground">
                    ${orderAmount.toFixed(2)}
                  </span>
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  {/* ACCEPT */}
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-sm"
                    onClick={() => handlePriceAction("accept")}
                  >
                    <CheckCircle size={16} className="mr-2" />
                    Accept Price
                  </Button>

                  {/* REJECT */}
                  <Button
                    variant="outline"
                    className="flex-1 border-red-500 text-red-600 hover:bg-red-50"
                    onClick={() => handlePriceAction("reject")}
                  >
                    <X size={16} className="mr-2" />
                    Reject
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Please review the updated pricing before proceeding.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("orderStatus")}</CardTitle>
            </CardHeader>
            <CardContent>
              {(orderData?.status === "cancelled" || orderData?.status === "rejected") ? (
                <div className="flex flex-col items-center justify-center h-40 gap-2">
                  <p className="text-lg font-semibold text-red-600">
                    Booking {orderData?.status === "cancelled" ? "Cancelled" : "Rejected"}
                  </p>
                  <p className="text-sm text-gray-500">
                    This booking is no longer active.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between">
                    {statusSteps.map((status, i) => (
                      <div key={status} className="flex flex-1 items-center">
                        <div className="flex flex-col items-center">
                          <div
                            title={orderData?.payment_status !== 'paid' ? "Please complete the payment first!" : undefined}
                            className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold ${i <= activeIndex
                              ? "border-secondary bg-secondary text-secondary-foreground"
                              : "border-border bg-card text-muted-foreground"
                              }`}
                          >
                            {i + 1}
                          </div>
                          <span
                            className={`mt-2 text-xs font-medium text-center ${i <= activeIndex
                              ? "text-foreground"
                              : "text-muted-foreground"
                              }`}
                          >
                            {status}
                          </span>
                          {i === activeIndex && orderData.booking_date && (
                            <span className="mt-1 text-xs text-muted-foreground">
                              {new Date(
                                orderData.booking_date,
                              ).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        {i < statusSteps.length - 1 && (
                          <div
                            className={`mx-2 h-0.5 flex-1 rounded ${i < activeIndex ? "bg-secondary" : "bg-border"
                              }`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="mt-3">Note: Please make the payment first, then your booking will be confirmed.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {orderData?.status === "delivered" && (
            <div className="mt-6">
              <h1>Delivered Item</h1>

              <div className="rounded-lg border-2 border-dashed border-border p-4 text-center relative">
                {/* 🔥 File Input */}
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  disabled={orderData?.status !== "delivered"}
                  className="absolute inset-0 opacity-0 cursor-pointer z-0"
                  onChange={handleImageSelect}
                />

                {/* 🔥 Images UI */}
                {imagePreviews.length > 0 ? (
                  // new uploaded images
                  <div className="flex flex-wrap gap-3 justify-center">
                    {imagePreviews.map((src, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={src}
                          className="h-24 w-24 object-cover rounded-md border"
                          alt={`Preview ${index + 1}`}
                        />

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage(index);
                          }}
                          className="absolute -top-2 -right-2 z-20 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : orderData?.customer_completion_img &&
                  !imgError ? (
                  // existing image from server
                  <img
                    src={
                      Array.isArray(orderData.customer_completion_img)
                        ? `${BASE_URL}${orderData.customer_completion_img[0]}`
                        : `${BASE_URL}${orderData.customer_completion_img.replace(/[\[\]"]+/g, "")}`
                    }
                    className="h-24 w-24 object-cover rounded-md border mx-auto"
                    onError={() => setImgError(true)}
                    alt="Customer Completion"
                  />
                ) : (
                  // fallback UI when no image
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Upload size={24} />
                    <p className="mt-2 text-xs">No image provided</p>
                  </div>
                )}

                <p className="mt-2 text-sm font-medium text-foreground">
                  Upload Photo
                </p>
              </div>
            </div>
          )}

          {/* Booking Rating */}
          {providerRating?.data ? (
            <section className="mt-5">
              <div className="mt-12 grid gap-6 sm:grid-cols-1 lg:grid-cols-1">
                <Card className="border border-primary/40 bg-white rounded-xl shadow-sm hover:shadow-md transition">
                  <CardContent className="p-5">
                    <div className="relative group">
                      {/* Quote Icon (hidden by default, show on hover) */}
                      <Quote
                        size={24}
                        className="absolute left-5 top-0 text-primary/20 opacity-0 group-hover:opacity-100 transition"
                      />

                      {/* Comment */}
                      <p className="text-sm leading-relaxed text-muted-foreground pl-6">
                        {providerRating?.data.comment || "No comment provided"}
                      </p>
                    </div>

                    {/* Bottom Section */}
                    <div className="mt-5 flex items-center gap-3">
                      {/* Avatar */}
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {providerRating?.data.customer?.first_name?.charAt(0)}
                        {providerRating?.data.customer?.last_name?.charAt(0)}
                      </div>

                      {/* Name + Rating */}
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {providerRating?.data.customer?.first_name}{" "}
                          {providerRating?.data.customer?.last_name}
                        </p>

                        <div className="flex gap-0.5 mt-0.5">
                          {Array.from({ length: providerRating?.data.rating }).map((_, i) => (
                            <Star
                              key={i}
                              size={12}
                              className="fill-blue-500 text-blue-500"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>
          ) : null}

          {hasDispute && disputeData && (
            <>
              {/* Dispute Status */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle size={16} className="text-destructive" />
                      Dispute Details
                    </CardTitle>
                    <Badge
                      className={`border-0 ${disputeStatusColors[disputeData.dispute.status]}`}
                    >
                      {disputeData.dispute.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Issue Type
                    </p>
                    <p className="text-sm text-foreground">
                      {disputeData.dispute.issue_type === "other"
                        ? "Other"
                        : disputeData.dispute.issue_type
                          .replace("_", " ")
                          .replace(/\b\w/g, (c) => c.toUpperCase())}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Description
                    </p>
                    <p className="text-sm text-foreground">
                      {disputeData.dispute.customer_description}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Admin Decision
                    </p>
                    <p className="text-sm text-foreground">
                      {disputeData.dispute.admin_decision.toUpperCase().charAt(0) + disputeData.dispute.admin_decision.slice(1)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Uploaded Evidence */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Uploaded Evidence</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {disputeData.evidences.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setPreviewImage(img.image_url.replace(/"/g, ""))}
                        className="group relative aspect-square rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-colors"
                      >
                        <img
                          src={`${BASE_URL}${img.image_url.replace(/"/g, "")}`}
                          alt={`Evidence ${i + 1}`}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
                          <Eye
                            size={20}
                            className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Dispute Timeline */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Dispute Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {disputeData.timeline.map((entry, i) => (
                      <div key={entry.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-muted-foreground">
                            {entry.event_type === "dispute_created" && (
                              <AlertTriangle size={14} />
                            )}
                            {entry.event_type === "agent_assigned" && <ShieldCheck size={14} />}
                            {/* Add other icons if needed */}
                          </div>
                          {i < disputeData.timeline.length - 1 && (
                            <div className="mt-1 h-full w-px bg-border" />
                          )}
                        </div>
                        <div className="pb-4">
                          <p className="text-sm font-medium text-foreground">
                            {entry.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(entry.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Payment Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Payment Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Booking Date</span>
                  <span className="text-foreground">
                    {orderData.booking_date
                      ? new Date(orderData.booking_date).toLocaleDateString()
                      : "-"}
                  </span>
                </div>

                {/* ✅ BULK ONLY */}
                {orderData.order_type === "bulk" && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Weight</span>
                      <span className="font-medium">
                        {orderData.bulk_order?.weight || 0} lb
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price / lb</span>
                      <span className="font-medium">
                        $
                        {parseFloat(
                          orderData.bulk_order?.price_per_lb || 0,
                        ).toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Type</span>
                  <span className="text-foreground capitalize">
                    {orderData.order_type?.replace("_", " ") || "-"}
                  </span>
                </div>
                {orderData?.service_category === "House Cleaning" && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estimated Duration</span>
                    <span className="text-foreground font-medium">
                      {orderData.estimated_duration ? `${parseFloat(orderData.estimated_duration).toFixed(1)} hours` : "Not set"}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Status</span>
                  <Badge
                    className={`border-0 ${orderData.payment_status === "paid" ||
                      orderData.payment_status === "completed"
                      ? "bg-secondary/10 text-secondary"
                      : "bg-yellow-100 text-yellow-700"
                      }`}
                  >
                    {orderData.payment_status === "paid" ||
                      orderData.payment_status === "completed"
                      ? "Paid"
                      : orderData.payment_status || "Pending"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-semibold text-foreground">
                    ${orderAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="space-y-3 pt-6">
              {/* Chat Button */}
              <Link
                to={
                  canChat(orderData?.status, orderData?.payment_status)
                    ? `/messages?order=${orderData.id}&provider=${orderData.provider?.id}&customer=${orderData.customer?.id}`
                    : "#"
                }
                className="block"
              >
                <Button
                  variant="outline"
                  className={`w-full ${canChat(orderData?.status, orderData?.payment_status)
                    ? "text-secondary border-secondary hover:bg-secondary/10"
                    : "text-muted-foreground border-muted cursor-not-allowed opacity-50"
                    }`}
                  disabled={!canChat(orderData?.status, orderData?.payment_status)}
                >
                  <MessageSquare size={16} className="mr-2" />{" "}
                  {t("chatWithProvider")}
                </Button>
              </Link>

              {/* Review Button */}
              {canReview(orderData?.status) ? (
                <Link to={`/rating/${orderData.id}`} className="block">
                  <Button variant="outline" disabled={providerRating?.data} className="w-full">
                    <Star size={16} className="mr-2" /> {t("leaveReview")}
                  </Button>
                </Link>
              ) : (
                <Button
                  variant="outline"
                  className="w-full text-muted-foreground border-muted cursor-not-allowed opacity-50"
                  disabled
                >
                  <Star size={16} className="" /> {t("leaveReview")}
                  <small className="">
                    (Available after delivery)
                  </small>
                </Button>
              )}

              <Link className="block" to={isDisabled ? "#" : `/report-issue/${orderData.id}`}
                onClick={(e) => {
                  if (isDisabled) e.preventDefault(); // prevent navigation
                }}>
                <Button
                  variant="outline"
                  className={`w-full text-destructive border-destructive/30 hover:bg-destructive/10 ${!canRaiseDispute(orderData?.status)
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                    }`}
                  disabled={isDisabled}
                // disabled={!canRaiseDispute(orderData?.status)}                  
                >
                  <AlertTriangle size={16} className="mr-2" /> Raise Dispute
                </Button>
              </Link>

              {orderData.payment_status !== "paid" && (
                <Button
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium shadow-md transition-all"
                  onClick={handlePayNow}
                  disabled={
                    !(
                      orderData?.payment_status === "pending" &&
                      orderData?.status === "accepted" &&
                      !["cancelled", "rejected", "finished", "delivered"].includes(orderData?.status)
                    )
                  }
                >
                  <CreditCard size={16} className="mr-2" />
                  Pay Now
                </Button>
              )}

              {/* Payment Modal */}
              {isPaymentModalOpen && (
                <StripeBookingModal
                  isOpen={isPaymentModalOpen}
                  onClose={handleModalClose}
                  bookingData={orderData}
                  onSuccess={handlePaymentSuccess}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CustomerOrderDetail;
