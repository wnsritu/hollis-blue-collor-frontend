import React from "react";
import { Check } from "lucide-react";
import { Avatar } from "@/components/shared/primitives";
import { cn } from "@/lib/utils";

interface ProviderAvatarWithStoryRingProps {
  avatarUrl?: string;
  initials: string;
  percentage: number;
  isComplete: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
}

export const ProviderAvatarWithStoryRing: React.FC<ProviderAvatarWithStoryRingProps> = ({
  avatarUrl,
  initials,
  percentage,
  isComplete,
  size = "md",
  className,
  onClick,
}) => {
  // Size metrics
  const dimensions = {
    sm: { container: "size-9", ringSize: 36, strokeWidth: 2.2, avatarSize: "size-7" },
    md: { container: "size-10", ringSize: 40, strokeWidth: 2.5, avatarSize: "size-8" },
    lg: { container: "size-12", ringSize: 48, strokeWidth: 3, avatarSize: "size-10" },
  }[size];

  const ringRadius = (dimensions.ringSize - dimensions.strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * ringRadius;
  // If incomplete, stroke dashoffset moves with percentage (minimum 10% visible stroke for visual feedback)
  const effectivePct = isComplete ? 100 : Math.max(8, Math.min(percentage, 100));
  const strokeDashoffset = circumference - (effectivePct / 100) * circumference;

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative flex items-center justify-center shrink-0 cursor-pointer select-none group",
        dimensions.container,
        className
      )}
      title={
        isComplete
          ? "Profile 100% Complete"
          : `Profile ${percentage}% Complete - Click to view missing steps`
      }
    >
      {/* SVG Circular Story Ring */}
      <svg
        className="absolute inset-0 size-full -rotate-90 pointer-events-none transition-all duration-700 ease-out"
        viewBox={`0 0 ${dimensions.ringSize} ${dimensions.ringSize}`}
      >
        <defs>
          {/* Incomplete Red / Crimson Gradient */}
          <linearGradient id="storyRingRedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="50%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#e11d48" />
          </linearGradient>

          {/* Complete Emerald Green Gradient */}
          <linearGradient id="storyRingGreenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#059669" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
        </defs>

        {/* Background track ring */}
        <circle
          cx={dimensions.ringSize / 2}
          cy={dimensions.ringSize / 2}
          r={ringRadius}
          fill="none"
          stroke={isComplete ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)"}
          strokeWidth={dimensions.strokeWidth}
        />

        {/* Dynamic moving progress ring */}
        <circle
          cx={dimensions.ringSize / 2}
          cy={dimensions.ringSize / 2}
          r={ringRadius}
          fill="none"
          stroke={isComplete ? "url(#storyRingGreenGradient)" : "url(#storyRingRedGradient)"}
          strokeWidth={dimensions.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={cn(
            "transition-all duration-700 ease-out",
            !isComplete && percentage > 0 && "filter drop-shadow-[0_0_2px_rgba(239,68,68,0.5)]"
          )}
        />
      </svg>

      {/* Inner Avatar with padding gap like Instagram Story */}
      <div className="relative flex items-center justify-center p-[2.5px] rounded-full bg-background transition-transform group-hover:scale-95 duration-200">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Profile Avatar"
            className={cn(dimensions.avatarSize, "rounded-full object-cover")}
          />
        ) : (
          <div className={cn(dimensions.avatarSize, "flex items-center justify-center")}>
            <Avatar initials={initials} size={size === "lg" ? "md" : "sm"} />
          </div>
        )}
      </div>

      {/* Status Badge Tag on Bottom Right */}
      {isComplete ? (
        <span
          className="absolute -bottom-0.5 -right-0.5 grid place-items-center size-3.5 rounded-full bg-emerald-500 text-white ring-2 ring-background shadow-xs animate-in zoom-in-75 duration-300"
          title="Profile Complete"
        >
          <Check size={9} strokeWidth={3} />
        </span>
      ) : (
        <span
          className="absolute -bottom-0.5 -right-0.5 grid place-items-center size-3.5 rounded-full bg-red-500 text-white text-[8px] font-extrabold ring-2 ring-background shadow-xs animate-pulse"
          title={`${percentage}% complete`}
        >
          !
        </span>
      )}
    </div>
  );
};

export default ProviderAvatarWithStoryRing;
