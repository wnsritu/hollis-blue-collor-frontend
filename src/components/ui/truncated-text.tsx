import * as React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface TruncatedTextProps extends React.HTMLAttributes<HTMLElement> {
  /** The element type to render (span, p, div, dd, h3, etc.) */
  as?: React.ElementType;
  /** Primary text or React node to display */
  text?: React.ReactNode;
  /** Children can be passed as an alternative to text prop */
  children?: React.ReactNode;
  /** Custom content to display inside the tooltip if different from text */
  tooltipContent?: React.ReactNode;
  /** Number of lines before truncation (1 = single line truncate, >1 = line-clamp-N) */
  lines?: number;
  /** Preferred tooltip placement */
  side?: "top" | "bottom" | "left" | "right";
  /** Tooltip alignment */
  align?: "start" | "center" | "end";
  /** If true, the tooltip will always show on hover even if text does not overflow */
  alwaysShow?: boolean;
  /** Additional styling for the tooltip popover box */
  tooltipClassName?: string;
  /** Hover delay in milliseconds before tooltip appears */
  delayDuration?: number;
}

/**
 * Reusable, optimized component that truncates text with an ellipsis (...)
 * and automatically displays a tooltip with the complete text on hover when truncated.
 */
export const TruncatedText = React.forwardRef<HTMLElement, TruncatedTextProps>(
  (
    {
      as: Component = "span",
      text,
      children,
      tooltipContent,
      lines = 1,
      side = "top",
      align = "center",
      alwaysShow = false,
      tooltipClassName,
      delayDuration = 150,
      className,
      ...props
    },
    ref
  ) => {
    const content = children ?? text;
    const internalRef = React.useRef<HTMLElement | null>(null);
    const [isTruncated, setIsTruncated] = React.useState(false);

    const setRefs = React.useCallback(
      (node: HTMLElement | null) => {
        internalRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLElement | null>).current = node;
        }
      },
      [ref]
    );

    const checkTruncation = React.useCallback(() => {
      if (alwaysShow) {
        setIsTruncated(true);
        return;
      }
      const el = internalRef.current;
      if (!el) return;
      // scrollWidth > clientWidth covers single-line truncation
      // scrollHeight > clientHeight covers multi-line line-clamp
      const hasOverflow =
        el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight;
      setIsTruncated(hasOverflow);
    }, [alwaysShow]);

    if (content === null || content === undefined || content === "") {
      return null;
    }

    const lineClass =
      lines === 1
        ? "truncate"
        : lines === 2
        ? "line-clamp-2"
        : lines === 3
        ? "line-clamp-3"
        : lines === 4
        ? "line-clamp-4"
        : lines > 1
        ? `line-clamp-${lines}`
        : "truncate";

    const tooltipBody = tooltipContent ?? content;

    return (
      <Tooltip delayDuration={delayDuration} open={isTruncated ? undefined : false}>
        <TooltipTrigger
          asChild
          onMouseEnter={checkTruncation}
          onFocus={checkTruncation}
          onTouchStart={checkTruncation}
        >
          <Component
            ref={setRefs}
            className={cn(
              lineClass,
              Component === "span" ? "inline-block max-w-full align-bottom" : "min-w-0",
              className
            )}
            {...props}
          >
            {content}
          </Component>
        </TooltipTrigger>
        {isTruncated && (
          <TooltipContent
            side={side}
            align={align}
            className={cn(
              "z-50 max-w-sm break-words bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-lg shadow-lg dark:bg-slate-800 dark:border dark:border-slate-700",
              tooltipClassName
            )}
          >
            {tooltipBody}
          </TooltipContent>
        )}
      </Tooltip>
    );
  }
);

TruncatedText.displayName = "TruncatedText";

export default TruncatedText;
