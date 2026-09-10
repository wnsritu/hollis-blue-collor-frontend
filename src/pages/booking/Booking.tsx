import { useTranslation } from "react-i18next";
import { CalendarIcon, Package } from "lucide-react";

const Booking = () => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4">
      <div className="text-center space-y-5">
        {/* Icon */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent text-primary">
          <Package size={24} />
        </div>

        {/* Badge */}
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <CalendarIcon size={12} /> Booking
          </span>
        </div>

        {/* Title */}
        <h2 className="text-lg font-semibold text-foreground">
          Booking Feature Coming Soon
        </h2>

        {/* Subtitle */}
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          You will soon be able to book laundry services easily with item
          selection, scheduling, and real-time pricing.
        </p>
      </div>
    </div>
  );
};

export default Booking;
