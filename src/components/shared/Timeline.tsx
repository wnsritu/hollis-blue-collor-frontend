import React from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TimelineProps } from "@/types/components.types";

export function Timeline({ steps, current, stepStates }: TimelineProps) {
  const idx = Math.max(steps.indexOf(current), 0);
  return (
    <ol className="space-y-0">
      {steps.map((s, i) => {
        const customState = stepStates?.[s];
        const isCrossed = customState === "crossed";
        const done = customState ? customState === "done" : i < idx;
        const active = customState ? customState === "active" : i === idx;

        return (
          <li key={s} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full border text-[11px] font-bold transition-colors",
                  isCrossed && "border-destructive bg-destructive text-white",
                  !isCrossed && done && "border-success bg-success text-white",
                  !isCrossed && active && "border-primary bg-primary text-primary-foreground",
                  !isCrossed && !done && !active && "border-border bg-muted text-muted-foreground"
                )}
              >
                {isCrossed ? (
                  <X size={13} strokeWidth={2.5} />
                ) : done ? (
                  <Check size={13} strokeWidth={2.5} />
                ) : (
                  i + 1
                )}
              </span>
              {i < steps.length - 1 && (
                <span
                  className={cn(
                    "w-px flex-1 min-h-[16px]",
                    i < idx ? "bg-success" : "bg-border"
                  )}
                />
              )}
            </div>
            <p
              className={cn(
                "pb-4 text-sm",
                isCrossed
                  ? "text-muted-foreground"
                  : active
                  ? "font-semibold text-foreground"
                  : done
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {s}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

export function Stepper({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-2">
      {steps.map((s, i) => (
        <li key={s} className="flex items-center gap-2">
          <span
            className={cn(
              "grid size-6 place-items-center rounded-full text-[11px] font-bold",
              i < current
                ? "bg-success text-white"
                : i === current
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            {i < current ? <Check size={13} /> : i + 1}
          </span>
          <span
            className={cn(
              "text-xs font-medium sm:text-sm",
              i === current ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {s}
          </span>
          {i < steps.length - 1 && (
            <span className="mx-1 hidden h-px w-6 bg-border sm:block" />
          )}
        </li>
      ))}
    </ol>
  );
}

export default Timeline;
