import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowRightCircle,
  CheckCircle,
  Info,
  Quote,
  RefreshCw,
  Star,
  Upload,
  X,
} from "lucide-react";
import {
  getBookinById,
  updateBookingStatus,
} from "@/services/providerOrder.service";
import { addPhotoInBookingApi } from "@/api/provider.api";
import toast from "react-hot-toast";
import {
  updateCustomPricingAPI,
  saveBulkPricingAPI,
  updateBulkPricingAPI,
} from "@/api/pricing.api";
import { Card, CardContent } from "@/components/ui/card";
import { getRatingByBookingId } from "@/services/order.service";

const statusSteps = [
  "Pending Acceptance",
  "Accepted",
  "In Process",
  "Finished",
  "Delivered",
];

// Status mapping for API status to display status
const getDisplayStatusIndex = (apiStatus) => {
  const statusMap = {
    pending: 0,
    accepted: 1,
    in_process: 2,
    finished: 3,
    delivered: 4,
  };

  return statusMap[apiStatus] ?? 0;
};

const ProviderOrderDetail = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [orderData, setOrderData] = useState(null);
  const [imageFiles, setImageFiles] = useState<Record<string, File[]>>({});
  const [imagePreview, setImagePreview] = useState<Record<string, string[]>>(
    {},
  );

  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [actualWeight, setActualWeight] = useState<number>(0);
  const [savingWeight, setSavingWeight] = useState(false);
  const [customPrice, setCustomPrice] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [providerRating, setProviderRating] = useState(null);

  const [customDuration, setCustomDuration] = useState("");
  const [isDurationModalOpen, setIsDurationModalOpen] = useState(false);

  const openDurationModal = () => {
    setCustomDuration(orderData?.estimated_duration ? String(orderData.estimated_duration) : "");
    setIsDurationModalOpen(true);
  };

  const handleSaveDuration = async () => {
    if (!customDuration || Number(customDuration) <= 0) {
      toast.error("Please enter a valid duration in hours");
      return;
    }

    const payload = {
      booking_id: orderData.id,
      status: orderData.status,
      estimated_duration: Number(customDuration),
    };

    const savePromise = async () => {
      const res: any = await updateBookingStatus(payload);

      if (!res || res.status === false) throw new Error(res?.message || "Failed");

      // refresh order
      const refreshed = await getBookinById(id);
      if (refreshed?.success) {
        setOrder(refreshed.data);
        setOrderData(refreshed.data);
      }

      return res;
    };

    await toast.promise(savePromise(), {
      loading: "Updating estimated duration...",
      success: "Estimated duration updated successfully",
      error: "Failed to update estimated duration",
    });

    setIsDurationModalOpen(false);
  };

  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const canUploadReceived = [
    "pending",
    "accepted",
    "price_updated",
    "waiting_confirmation",
    "confirmed",
    "in_process",
  ].includes(order?.status);

  const canUploadDelivered = [
    "in_process",
    "finished",
    "delivered",
  ].includes(order?.status);

  const stageConfig = [
    {
      key: "provider_acceptance_img",
      label: "accepted",
      enable: canUploadReceived,
    },
    {
      key: "provider_delivery_img",
      label: "finished",
      enable: canUploadDelivered,
    },
  ];
  const disabledStatuses = ["accepted", "in_process", "finished", "delivered", "rejected", "cancelled"];
  const canUpdatePrice = !disabledStatuses.includes(order?.status);
  
  const openPriceModal = (item) => {
    setSelectedItem(item);
    setCustomPrice(item.price || "");
    setIsModalOpen(true);
  };

  const handleSaveCustomPrice = async () => {
    if (!customPrice) {
      toast.error("Please enter price");
      return;
    }

    const payload = {
      booking_id: orderData.id,
      custom_item_name: selectedItem.custom_item_name,
      services: [
        {
          service_id: selectedItem.service_id,
          price: Number(customPrice),
        },
      ],
    };

    const savePromise = async () => {
      const res: any = await updateCustomPricingAPI(payload);

      if (!res || res.error) throw new Error("Failed");

      // refresh
      const refreshed = await getBookinById(id);
      if (refreshed?.success) {
        setOrder(refreshed.data);
        setOrderData(refreshed.data);
      }

      return res;
    };

    await toast.promise(savePromise(), {
      loading: "Updating price...",
      success: "Price updated ",
      error: "Failed to update ",
    });

    setIsModalOpen(false);
  };

  const getUILabel = (label) => {
    switch (label) {
      case "accepted":
        return "Received";
      case "finished":
        return "Delivered";
      default:
        return label;
    }
  };
  
  const stepToApiStatus = {
    "Pending Acceptance": "pending",
    Accepted: "accepted",
    "In Process": "in_process",
    Finished: "finished",
    Delivered: "delivered",
  };

  const fetchDataRating = async (id) => {
    try {
      setLoading(true);
      const response: any = await getRatingByBookingId(id);
      if (response?.data?.success) {
        // console.log(response?.data);
        
        setProviderRating(response?.data);
        // toast.success(response?.data?.message || "Rating fetched");
      }
      // console.log(providerRating);
      
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await getBookinById(id);
        if (res.success) {
          setOrder(res.data);
          setOrderData(res.data);
          setStatus(res.data.status);
        }
      } catch (err) {
        console.error("Error fetching order", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
    fetchDataRating(id);
  }, [id]);

  const updateStatus = async (newStatus: string) => {
    if (!orderData?.id) return;

    const req = {
      booking_id: orderData.id,
      status: newStatus,
    };

    const updatePromise = async () => {
      const response: any = await updateBookingStatus(req);

      console.log("UPDATE RESPONSE:", response); // 👈 debug

      if (!response || response.success === false) {
        throw new Error(response?.message || "Update failed");
      }

      // safe refresh
      try {
        const refreshedOrder = await getBookinById(id);
        if (refreshedOrder?.success) {
          setOrder(refreshedOrder.data);
          setOrderData(refreshedOrder.data);
          setStatus(refreshedOrder.data.status);
        }
      } catch (e) {
        console.warn("Refresh failed", e);
      }

      return response;
    };

    try {
      await toast.promise(updatePromise(), {
        loading: `Updating booking status...`,
        success: () => `Booking status updated to ${newStatus}`,
        error: "Failed to update booking status",
      });
    } catch (err) {
      console.error(err);
    }
  };

  function formatSlot(start, end) {
    const getHour = (time) => parseInt(time.split(":")[0]);
    let startHour = getHour(start);
    let endHour = getHour(end);
    const ampm = endHour >= 12 ? "PM" : "AM";
    startHour = startHour % 12 || 12;
    endHour = endHour % 12 || 12;
    return `${startHour}-${endHour} ${ampm}`;
  }

  const handleImageSelect = async (event: any, status: string) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;

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

    // ✅ Save per stage
    setImageFiles((prev) => ({
      ...prev,
      [status]: [...(prev[status] || []), ...validFiles],
    }));

    setImagePreview((prev) => ({
      ...prev,
      [status]: [...(prev[status] || []), ...previewUrls],
    }));

    // ✅ Upload
    const formData = new FormData();
    validFiles.forEach((file) => {
      formData.append("photo", file);
    });

    formData.append("status", status);
    formData.append("booking_id", orderData.id);

    const uploadPromise = async () => {
      const res: any = await addPhotoInBookingApi(formData);

      if (!res) throw new Error("Upload failed");
      if (res?.error) throw new Error(res.error);

      const refreshed = await getBookinById(id);

      if (refreshed?.success) {
        setOrder(refreshed.data);
        setOrderData(refreshed.data);
        setStatus(refreshed.data.status);
      }

      return res;
    };

    await toast.promise(uploadPromise(), {
      loading: "Uploading images...",
      success: "Images uploaded",
      error: (err) => err?.message || "Upload failed",
    });
  };

  const handleRemoveImage = (status: string, index: number) => {
    setImageFiles((prev) => ({
      ...prev,
      [status]: prev[status]?.filter((_, i) => i !== index),
    }));

    setImagePreview((prev) => {
      URL.revokeObjectURL(prev[status][index]);
      return {
        ...prev,
        [status]: prev[status]?.filter((_, i) => i !== index),
      };
    });
  };

  const handleSaveWeight = async () => {
    const savePromise = async () => {
      const res = await updateBulkPricingAPI({
        booking_id: orderData.id,
        weight: actualWeight,
      });

      if (!res?.data?.status) {
        throw new Error(res?.data?.message || "Failed to update weight");
      }

      // refresh order after success
      const refreshedOrder = await getBookinById(id);

      if (refreshedOrder?.success) {
        setOrder(refreshedOrder.data);
        setOrderData(refreshedOrder.data);
        setStatus(refreshedOrder.data.status);
      }

      return res;
    };

    await toast.promise(savePromise(), {
      loading: "Updating weight...",
      success: "Weight updated successfully",
      error: (err) => err.message || "Something went wrong",
    });
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!order) return <div className="p-6">Order not found</div>;

  const currentIdx = getDisplayStatusIndex(status);
  const customerAddress =
    order.customer?.addresses?.[0]?.address_line ||
    order.pickup_address ||
    "Address not provided";
  const timeSlot = order.time_slot?.slot || order.time_slot_id || "-";

  return (
    <div className="container-grid py-8">
      <h1 className="font-heading text-2xl font-bold text-foreground">
        {t("orderDetails")}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {`ORD-${String(order.id).padStart(3, "0")}`}
      </p>

      {/* Customer Info */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-3 font-heading text-base font-semibold text-foreground">
            {t("customerInfo")}
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("name")}</span>
              <span className="font-medium">
                {order.customer?.first_name} {order.customer?.last_name}
              </span>
            </div>

            {/* Conditional details */}
            {!["finished", "delivered", "cancelled", "rejected"].includes(orderData?.status) ? (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("phone")}</span>
                  <span className="font-medium">
                    {order.customer?.phone || "Not provided"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("email")}</span>
                  <span className="font-medium">
                    {order.customer?.email || "Not provided"}
                  </span>
                </div>
                {orderData?.pickup_address && orderData?.payment_status == "paid" && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("address")}</span>
                    <span className="font-medium text-right">{orderData.pickup_address}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-md border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800">
                {orderData.status === "finished" || orderData.status === "delivered"
                  ? "Other customer details are hidden as the order is completed."
                  : "Other customer details are hidden as the order has been cancelled/rejected."}
              </div>
            )}
          </div>
        </div>

        {/* Service Info */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-3 font-heading text-base font-semibold text-foreground">
            {t("serviceInfo")}
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("serviceType")}</span>
              <span className="font-medium">
                {orderData?.service_types?.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("serviceDate")}</span>
              <span className="font-medium">
                {order.booking_date
                  ? new Date(order.booking_date).toLocaleDateString()
                  : "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("timeSlot")}</span>
              <span className="font-medium">
                {formatSlot(
                  orderData?.time_slots?.start_time,
                  orderData?.time_slots?.end_time,
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order Type</span>
              <span className="font-medium capitalize">
                {order.order_type?.replace("_", " ") || "-"}
              </span>
            </div>
            {/* ✅ BULK ONLY DATA */}
            {/* {order.order_type === "bulk" && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Weight</span>
                  <span className="font-medium">
                    {order.bulk_order?.weight || 0} lb
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price / lb</span>
                  <span className="font-medium">
                    $
                    {parseFloat(order.bulk_order?.price_per_lb || 0).toFixed(2)}
                  </span>
                </div>
              </>
            )} */}
            {orderData?.service_category === "House Cleaning" && (
              <div className="flex justify-between items-center py-0.5">
                <span className="text-muted-foreground">Estimated Duration</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">
                    {orderData.estimated_duration ? `${parseFloat(orderData.estimated_duration).toFixed(1)} hours` : "Not set"}
                  </span>
                  {orderData.status === "pending" && (
                    <button
                      onClick={openDurationModal}
                      className="text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-0.5 rounded-full transition"
                    >
                      Update Duration
                    </button>
                  )}
                </div>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Status</span>
              <span
                className={`font-medium capitalize ${
                  order.payment_status === "paid"
                    ? "text-green-600"
                    : "text-yellow-600"
                }`}
              >
                {order.payment_status || "pending"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("total")}</span>
              <span className="font-bold text-foreground">
                ${parseFloat(order.total_amount).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Images */}
      <div className="mt-6 rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 font-heading text-base font-semibold text-foreground">
          Customer Uploaded Images
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* BEFORE IMAGE */}
          <div className="bg-muted/40 rounded-lg p-4 text-center border">
            <p className="text-xs text-muted-foreground mb-2">
              Before (Request Image)
            </p>

            {(() => {
              const beforeImg = orderData?.provider_acceptance_img || orderData?.customer_request_img;
              if (!beforeImg) {
                return (
                  <div className="h-40 flex items-center justify-center text-xs text-muted-foreground">
                    No image provided
                  </div>
                );
              }

              let images = [];
              try {
                images = typeof beforeImg === "string" ? JSON.parse(beforeImg) : beforeImg;
              } catch {
                images = [beforeImg];
              }

              if (!Array.isArray(images)) {
                images = [images];
              }

              images = images.filter(Boolean);

              return images.length > 0 ? (
                <div className="space-y-2">
                  {images.map((img: string, i: number) => (
                    <img
                      key={i}
                      src={`${BASE_URL}${img}`}
                      className="w-full h-auto max-h-48 rounded-md mx-auto object-cover"
                    />
                  ))}
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-xs text-muted-foreground">
                  No image provided
                </div>
              );
            })()}
          </div>

          {/* AFTER IMAGE */}
          <div className="bg-muted/40 rounded-lg p-4 text-center border">
            <p className="text-xs text-muted-foreground mb-2">
              After (Completion Image)
            </p>

            {(() => {
              const compImg = orderData?.provider_delivery_img || orderData?.customer_completion_img;
              if (!compImg) {
                return (
                  <div className="h-40 flex items-center justify-center text-xs text-muted-foreground">
                    No image provided
                  </div>
                );
              }

              let images = [];
              try {
                images = typeof compImg === "string" ? JSON.parse(compImg) : compImg;
              } catch {
                images = [compImg];
              }

              if (!Array.isArray(images)) {
                images = [images];
              }

              // Filter out empty strings or nulls
              images = images.filter(Boolean);

              return images.length > 0 ? (
                <div className="space-y-2">
                  {images.map((img: string, i: number) => (
                    <img
                      key={i}
                      src={`${BASE_URL}${img}`}
                      className="w-full h-auto max-h-48 rounded-md mx-auto object-cover"
                    />
                  ))}
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-xs text-muted-foreground">
                  No image provided
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {order?.order_type === "bulk" && (
        <div className="mt-6 rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 font-heading text-base font-semibold text-foreground">
            Bulk Order — Wash & Fold
          </h2>

          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="bg-muted rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Estimated Weight</p>
              <p className="font-semibold">
                {order.bulk_order?.weight || 0} lbs
              </p>
            </div>

            <div className="bg-muted rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Price per lb</p>
              <p className="font-semibold">
                ${parseFloat(order.bulk_order?.price_per_lb || 0).toFixed(2)}
              </p>
            </div>

            <div className="bg-muted rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Estimated Total</p>
              <p className="font-semibold">
                $
                {(
                  (order.bulk_order?.weight || 0) *
                  (order.bulk_order?.price_per_lb || 0)
                ).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Actual Weight Input */}
          <div className="border rounded-lg p-4">
            <p className="text-sm font-medium mb-2">Enter Actual Weight</p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setActualWeight((prev) => Math.max(0, prev - 1))}
                className="px-3 py-1 border rounded-md transition
                   hover:bg-gray-100 active:scale-95
                     disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                disabled={!canUpdatePrice}
              >
                -
              </button>

              <input
                type="number"
                value={actualWeight}
                onChange={(e) => setActualWeight(Number(e.target.value))}
                className="w-20 text-center border rounded-md py-1
                transition
               disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                disabled={!canUpdatePrice}
              />

              <button
                disabled={!canUpdatePrice}
                onClick={() => setActualWeight((prev) => prev + 1)}
                className="px-3 py-1 border rounded-md transition
                 hover:bg-gray-100 active:scale-95
                 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              >
                +
              </button>

              <span className="text-sm text-muted-foreground">lbs</span>
            </div>

            <button
              onClick={handleSaveWeight}
              disabled={!canUpdatePrice}
              className="mt-4 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm transition
            bg-blue-600 text-white hover:bg-blue-700
             disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-400"
            >
              <CheckCircle size={16} className="shrink-0" />
              <span>Confirm Final Weight & Price</span>
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-blue-600 bg-blue-50 p-3 rounded-md">
            <Info size={16} className="mt-[2px] shrink-0" />
            <p>
              Final weight and price will be communicated to the customer for
              confirmation before processing.
            </p>
          </div>
        </div>
      )}

      {/* Items */}
      {order.order_type !== "bulk" && (
        <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-card">
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
              {order.items && order.items.length > 0 ? (
                order.items.map((item, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="px-5 py-3">
                      {item.item?.name || item.custom_item_name}
                    </td>
                    <td className="px-5 py-3">
                      {item.service?.name || `Service ${item.service_id}`}
                    </td>
                    <td className="px-5 py-3 text-right">{item.quantity}</td>
                    <td className="px-5 py-3 text-right space-y-1">
                      <div>${parseFloat(item.price).toFixed(2)}</div>

                      {item.is_custom && (
                        <button
                          onClick={() => openPriceModal(item)}
                          disabled={!canUpdatePrice}
                          className={`
                            mt-1 inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full transition

                            ${
                              canUpdatePrice
                                ? "text-blue-600 bg-blue-50 hover:bg-blue-100"
                                : "text-gray-400 bg-gray-100 cursor-not-allowed opacity-60"
                            }
                          `}
                        >
                          Update Price
                        </button>
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
      )}

      {/* Notes */}
      {/* <div className="mt-6 rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 font-heading text-base font-semibold text-foreground">
          {t("notes")}
        </h2>

        <div className="space-y-4">
       
          <div>
            <p className="text-xs text-muted-foreground mb-1">Customer Notes</p>
            <div className="bg-muted rounded-md px-3 py-2 text-sm text-foreground">
              {order.notes || "No notes provided"}
            </div>
          </div>

       
          {order.order_type === "bulk" && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Bulk Instructions
              </p>
              <div className="bg-muted rounded-md px-3 py-2 text-sm text-foreground">
                {order.bulk_instructions || "No instructions"}
              </div>
            </div>
          )}
        </div>
      </div> */}

      {/* Status update buttons */}
      <div className="mt-6 rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 font-heading text-base font-semibold text-foreground">
          {t("updateStatus")}
        </h2>

        {(order?.status === "cancelled" || order?.status === "rejected") ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <p className="text-lg font-semibold text-red-600">
              Booking {order?.status === "cancelled" ? "Cancelled" : "Rejected"}
            </p>
            <p className="text-sm text-gray-500">
              This booking is no longer active.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {statusSteps.map((step, i) => {
              const isCompleted = i < currentIdx;
              const isActive = i === currentIdx;

              // 🔹 Disable logic
              let disabled = false;
              let tooltipMessage = "";

              // Disable all buttons if delivered
              if (order?.status === "delivered") {
                disabled = true;
                tooltipMessage = "Booking already delivered";
              } 
              // Accept step always enabled if payment done
              else if (step === "Accepted") {
                if (order?.payment_status !== "paid") {
                  disabled = false;
                  tooltipMessage = "Payment required";
                }
              } 
              // Other steps disabled if payment not done or already completed
              else if (order?.payment_status !== "paid") {
                disabled = true;
                tooltipMessage = "Payment required";
              } else if (isCompleted) {
                disabled = true;
                tooltipMessage = "Step already completed";
              }

              return (
                <div key={step} className="relative group">
                  <button
                    onClick={() => {
                      if (disabled) return; // prevent multiple triggers
                      updateStatus(stepToApiStatus[step]);
                    }}
                    disabled={disabled}
                    className={`px-4 py-1.5 text-xs rounded-md border transition-all
                      ${isActive
                        ? "bg-[#3B82F6] text-white border-[#3B82F6]"
                        : isCompleted
                          ? "bg-[#9DBCFD] text-white border-[#9DBCFD] cursor-not-allowed"
                          : "bg-[#F1F3F4] text-[#5F6368] border-[#E0E0E0] hover:bg-[#E8EAED]"
                      }
                    `}
                  >
                    {step}
                  </button>

                  {/* Tooltip for disabled buttons */}
                  {disabled && tooltipMessage && (
                    <div className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 w-max rounded-md bg-black text-white text-xs px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">
                      {tooltipMessage}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Photo uploads */}
      <div className="grid gap-4 sm:grid-cols-2 mt-6">
        {stageConfig.map((stage) => {
          const image = orderData?.[stage.key]; // backend images (string or stringified array)
          const preview = imagePreview?.[stage.label]; // local previews

          // Parse backend images safely
          let backendImages: string[] = [];
          if (image) {
            if (Array.isArray(image)) {
              backendImages = image;
            } else {
              try {
                const parsed = JSON.parse(image);
                backendImages = Array.isArray(parsed) ? parsed : [image];
              } catch {
                backendImages = [image];
              }
            }
          }

          const hasBackendImages = backendImages.length > 0;
          const hasPreview = Array.isArray(preview) && preview.length > 0;

          const alreadyUploaded = hasBackendImages;
          const isDisabled = !stage.enable || alreadyUploaded;

          // Decide which images to show: backend first
          const imagesToShow = hasBackendImages ? backendImages.map((img) => `${BASE_URL}${img}`) : hasPreview ? preview : [];

          return (
            <div
              key={stage.key}
              className="rounded-lg border-2 border-dashed border-border p-5 text-center relative group flex flex-col justify-between min-h-[160px] bg-card hover:bg-accent/5 transition-colors"
            >
              {/* File Input covering the entire box when not uploaded yet */}
              {!alreadyUploaded && (
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  disabled={isDisabled}
                  className={`absolute inset-0 opacity-0 z-10 ${
                    isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'
                  }`}
                  onChange={(e) => handleImageSelect(e, stage.label)}
                />
              )}

              <div className="z-0 space-y-3 w-full flex flex-col items-center">
                <p className="text-sm font-semibold text-foreground">
                  {getUILabel(stage.label)} (optional)
                </p>

                {imagesToShow.length > 0 ? (
                  <div className="flex flex-wrap gap-2 justify-center z-20 relative">
                    {imagesToShow.map((src, i) => (
                      <div key={i} className="relative group/img">
                        <img
                          src={src}
                          className="h-16 w-16 object-cover rounded-md border shadow-sm"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.png';
                          }}
                        />
                        {/* Remove button only for previews */}
                        {hasPreview && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveImage(stage.label, i);
                            }}
                            className="
                              absolute -top-2 -right-2 z-30
                              bg-red-500 hover:bg-red-600
                              text-white
                              rounded-full
                              w-5 h-5
                              flex items-center justify-center
                              shadow-md
                              transition
                            "
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Upload className="mx-auto text-muted-foreground h-6 w-6" />
                    <p className="text-xs text-muted-foreground">Click to upload photos</p>
                  </div>
                )}

                {alreadyUploaded && (
                  <p className="text-xs text-green-600 font-medium">Uploaded successfully</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          {/* Modal Card */}
          <div className="w-full max-w-sm rounded-xl bg-white shadow-xl p-6 animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  Update Price
                </h3>
                <p className="text-xs text-muted-foreground">
                  Set price for custom item
                </p>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            {/* Item Name */}
            <div className="mb-3 text-sm font-medium text-gray-700 bg-gray-50 px-3 py-2 rounded-md">
              {selectedItem?.custom_item_name}
            </div>

            {/* Input */}
            <div className="relative mb-5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                $
              </span>
              <input
                type="number"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                placeholder="Enter price"
                className="w-full pl-7 pr-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-3 py-1.5 text-sm rounded-md border text-gray-600 hover:bg-gray-100 transition"
              >
                Cancel
              </button>

              <button
                onClick={handleSaveCustomPrice}
                className="px-4 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm"
              >
                Save Price
              </button>
            </div>
          </div>
        </div>
      )}

      {isDurationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          {/* Modal Card */}
          <div className="w-full max-w-sm rounded-xl bg-white shadow-xl p-6 animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  Update Estimated Duration
                </h3>
                <p className="text-xs text-muted-foreground">
                  Set estimated duration (in hours)
                </p>
              </div>

              <button
                onClick={() => setIsDurationModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            {/* Input */}
            <div className="relative mb-5 flex items-center gap-2">
              <input
                type="number"
                step="0.5"
                value={customDuration}
                onChange={(e) => setCustomDuration(e.target.value)}
                placeholder="e.g. 2.5"
                className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <span className="text-sm font-medium text-gray-500">hours</span>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsDurationModalOpen(false)}
                className="px-3 py-1.5 text-sm rounded-md border text-gray-600 hover:bg-gray-100 transition"
              >
                Cancel
              </button>

              <button
                onClick={handleSaveDuration}
                className="px-4 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm"
              >
                Save Duration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Rating */}
      {providerRating?.data ? (
        <section className="mt-8">
          <div className="mt-18 grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
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
    </div>
  );
};

export default ProviderOrderDetail;
