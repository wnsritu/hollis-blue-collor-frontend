import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import StarRating from "@/components/StarRating";
import { Button } from "@/components/ui/button";

interface ProviderCardProps {
  id: string;
  user_id?: string | number;
  name: string;
  rating: number;
  distance: string;
  startingPrice: number;
  services?: string[];
  showMessage?: boolean;
  description?: string;
  location?: string;
  image?: string;
  photo?: string;
  onAuthRequired?: () => void;
}

const ProviderCard = ({
  id,
  user_id,
  name,
  rating,
  distance,
  startingPrice,
  description,
  location,
  services,
  image,
  photo,
  showMessage = false,
  onAuthRequired,
}: ProviderCardProps) => {
  const displayImage = photo || image || "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face";

  let parsedServices: string[] = [];
  if (services) {
    if (Array.isArray(services)) {
      parsedServices = services;
    } else if (typeof services === "string") {
      try {
        const parsed = JSON.parse(services);
        if (Array.isArray(parsed)) {
          parsedServices = parsed;
        } else {
          parsedServices = [services];
        }
      } catch {
        parsedServices = [services];
      }
    } else {
      parsedServices = [];
    }
  }

  const isCleaningWizard = window.location.pathname.includes("/booking/cleaning");
  const isCarwashWizard = window.location.pathname.includes("/booking/carwash");
  const categoryId = isCleaningWizard ? "2" : (isCarwashWizard ? "3" : "1");
  const wizardParam = (isCleaningWizard || isCarwashWizard) ? "&wizard=true" : "";
  const profileUrl = `/provider/${id || user_id}?category=${categoryId}${wizardParam}`;

  const handleProfileClick = (e: React.MouseEvent) => {
    const token = localStorage.getItem("token");
    if (!token) {
      e.preventDefault();
      if (onAuthRequired) {
        onAuthRequired();
      }
    }
  };

  return (
    <div className="card-elevated rounded-xl border border-border bg-card p-5">
      <div className="flex items-start gap-4">
        <img
          src={displayImage}
          alt={name}
          className="h-16 w-16 rounded-xl object-cover"
        />
        <div className="flex-1 min-w-0">
          <Link to={profileUrl} onClick={handleProfileClick}>
            <h3 className="font-heading text-base font-semibold text-foreground truncate hover:text-primary transition-colors cursor-pointer">
              {name}
            </h3>
          </Link>
          <StarRating rating={rating} size={14} />
          {distance && distance !== "N/A" && (
            <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin size={14} />
              <span>{distance}</span>
            </div>
          )}
        </div>
      </div>

      {parsedServices.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {parsedServices.map((s) => (
            <span
              key={s}
              className="rounded-md bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground"
            >
              {s}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Starting from <span className="font-semibold text-foreground">${(startingPrice || 0).toFixed(2)}</span>
        </p>
        <div className="flex gap-2">
          {showMessage && (
            <Link to={`/messages`}>
              <Button
                variant="outline"
                size="sm"
                className="text-secondary border-secondary hover:bg-secondary/10"
              >
                Message
              </Button>
            </Link>
          )}
          <Link to={profileUrl} onClick={handleProfileClick}>
            <Button
              variant="ghost"
              size="sm"
              className="underline-offset-4 hover:underline"
            >
              View Profile
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProviderCard;
