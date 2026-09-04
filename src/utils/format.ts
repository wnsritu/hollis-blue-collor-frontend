export const formatDate = (dateStr: string) => {
  if (!dateStr) return "";

  const date = new Date(dateStr);

  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yyyy = date.getFullYear();

  return `${mm}-${dd}-${yyyy}`;
};

export const sanitizePhoneInput = (value: string): string => {
  if (!value) return "";
  const hasLeadingPlus = value.startsWith("+");
  const digits = value.replace(/\D/g, "");
  return hasLeadingPlus ? `+${digits}` : digits;
};

export const formatPhone = (phone: string) => {
  if (!phone) return "";

  const cleaned = phone.replace(/\D/g, "");

  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
  }

  if (cleaned.length > 10) {
    const country = cleaned.slice(0, cleaned.length - 10);
    const main = cleaned.slice(-10);

    return `+${country} ${main.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3")}`;
  }

  return phone;
};

export const formatTimeSlot = (startTime: string, endTime: string) => {
  const formatTime = (time: string) => {
    if (!time) return "";
    const [hour, min] = time.split(":");
    let h = parseInt(hour);
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${min} ${ampm}`;
  };
  return `${formatTime(startTime)} – ${formatTime(endTime)}`;
};

export const formatStatus = (status: string) => {
  if (!status) return "";
  return status
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const SERVICE_CATEGORIES = ["Laundry", "House Cleaning", "Car Wash"];
export const ALL_SERVICE_CATEGORIES = ["All", ...SERVICE_CATEGORIES];