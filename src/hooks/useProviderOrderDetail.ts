import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  getBookinById,
  updateBookingStatus,
} from "@/services/providerOrder.service";
import { addPhotoInBookingApi } from "@/services/provider";
import {
  updateCustomPricingAPI,
  updateBulkPricingAPI,
} from "@/services/pricing";
import { getRatingByBookingId } from "@/services/order.service";

export const statusSteps = [
  "Pending Acceptance",
  "Accepted",
  "In Process",
  "Finished",
  "Delivered",
];

export const getDisplayStatusIndex = (apiStatus?: string | null) => {
  const statusMap: Record<string, number> = {
    pending: 0,
    accepted: 1,
    in_process: 2,
    finished: 3,
    delivered: 4,
  };

  return statusMap[apiStatus || ""] ?? 0;
};

export const stepToApiStatus: Record<string, string> = {
  "Pending Acceptance": "pending",
  Accepted: "accepted",
  "In Process": "in_process",
  Finished: "finished",
  Delivered: "delivered",
};

export function formatSlot(start: any, end: any) {
  if (!start || !end) return "-";
  const getHour = (time: any) => parseInt(String(time).split(":")[0]);
  let startHour = getHour(start);
  let endHour = getHour(end);
  const ampm = endHour >= 12 ? "PM" : "AM";
  startHour = startHour % 12 || 12;
  endHour = endHour % 12 || 12;
  return `${startHour}-${endHour} ${ampm}`;
}

export function useProviderOrderDetail(orderIdProp?: string) {
  const { id: paramId } = useParams();
  const id = orderIdProp || paramId;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [orderData, setOrderData] = useState<any>(null);
  const [imageFiles, setImageFiles] = useState<Record<string, File[]>>({});
  const [imagePreview, setImagePreview] = useState<Record<string, string[]>>({});

  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [actualWeight, setActualWeight] = useState<number>(0);
  const [savingWeight, setSavingWeight] = useState(false);
  const [customPrice, setCustomPrice] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [providerRating, setProviderRating] = useState<any>(null);

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

      if (id) {
        const refreshed = await getBookinById(id);
        if (refreshed?.success) {
          setOrder(refreshed.data);
          setOrderData(refreshed.data);
        }
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

  const openPriceModal = (item: any) => {
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

      if (id) {
        const refreshed = await getBookinById(id);
        if (refreshed?.success) {
          setOrder(refreshed.data);
          setOrderData(refreshed.data);
        }
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

  const getUILabel = (label: string) => {
    switch (label) {
      case "accepted":
        return "Received";
      case "finished":
        return "Delivered";
      default:
        return label;
    }
  };

  const fetchDataRating = async (bookingId: string | number) => {
    try {
      const response: any = await getRatingByBookingId(bookingId);
      if (response?.data?.success) {
        setProviderRating(response?.data);
      }
    } catch {
      // Silently fail if not authorized
    }
  };

  useEffect(() => {
    if (!id) return;
    const fetchOrder = async () => {
      try {
        const res = await getBookinById(id);
        if (res.success) {
          setOrder(res.data);
          setOrderData(res.data);
          setStatus(res.data.status);
          if (res.data?.review) {
            setProviderRating({ data: res.data.review });
          }
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

      if (!response || response.success === false) {
        throw new Error(response?.message || "Update failed");
      }

      try {
        if (id) {
          const refreshedOrder = await getBookinById(id);
          if (refreshedOrder?.success) {
            setOrder(refreshedOrder.data);
            setOrderData(refreshedOrder.data);
            setStatus(refreshedOrder.data.status);
          }
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

  const handleImageSelect = async (event: any, stageStatus: string) => {
    const files = Array.from(event.target.files || []) as File[];
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

    setImageFiles((prev) => ({
      ...prev,
      [stageStatus]: [...(prev[stageStatus] || []), ...validFiles],
    }));

    setImagePreview((prev) => ({
      ...prev,
      [stageStatus]: [...(prev[stageStatus] || []), ...previewUrls],
    }));

    const formData = new FormData();
    validFiles.forEach((file) => {
      formData.append("photo", file);
    });

    formData.append("status", stageStatus);
    formData.append("booking_id", orderData.id);

    const uploadPromise = async () => {
      const res: any = await addPhotoInBookingApi(formData);

      if (!res) throw new Error("Upload failed");
      if (res?.error) throw new Error(res.error);

      if (id) {
        const refreshed = await getBookinById(id);
        if (refreshed?.success) {
          setOrder(refreshed.data);
          setOrderData(refreshed.data);
          setStatus(refreshed.data.status);
        }
      }

      return res;
    };

    await toast.promise(uploadPromise(), {
      loading: "Uploading images...",
      success: "Images uploaded",
      error: (err) => err?.message || "Upload failed",
    });
  };

  const handleRemoveImage = (stageStatus: string, index: number) => {
    setImageFiles((prev) => ({
      ...prev,
      [stageStatus]: prev[stageStatus]?.filter((_, i) => i !== index),
    }));

    setImagePreview((prev) => {
      if (prev[stageStatus]?.[index]) {
        URL.revokeObjectURL(prev[stageStatus][index]);
      }
      return {
        ...prev,
        [stageStatus]: prev[stageStatus]?.filter((_, i) => i !== index),
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

      if (id) {
        const refreshedOrder = await getBookinById(id);
        if (refreshedOrder?.success) {
          setOrder(refreshedOrder.data);
          setOrderData(refreshedOrder.data);
          setStatus(refreshedOrder.data.status);
        }
      }

      return res;
    };

    await toast.promise(savePromise(), {
      loading: "Updating weight...",
      success: "Weight updated successfully",
      error: (err) => err.message || "Something went wrong",
    });
  };

  const currentIdx = getDisplayStatusIndex(status);
  const customerAddress =
    order?.customer?.addresses?.[0]?.address_line ||
    order?.pickup_address ||
    "Address not provided";
  const timeSlot = order?.time_slot?.slot || order?.time_slot_id || "-";

  return {
    id,
    order,
    orderData,
    loading,
    status,
    imageFiles,
    imagePreview,
    selectedItem,
    actualWeight,
    setActualWeight,
    savingWeight,
    setSavingWeight,
    customPrice,
    setCustomPrice,
    isModalOpen,
    setIsModalOpen,
    providerRating,
    customDuration,
    setCustomDuration,
    isDurationModalOpen,
    setIsDurationModalOpen,
    openDurationModal,
    handleSaveDuration,
    canUploadReceived,
    canUploadDelivered,
    stageConfig,
    canUpdatePrice,
    openPriceModal,
    handleSaveCustomPrice,
    getUILabel,
    updateStatus,
    handleImageSelect,
    handleRemoveImage,
    handleSaveWeight,
    currentIdx,
    customerAddress,
    timeSlot,
  };
}
