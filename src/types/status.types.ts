export type StatusTone =
  | "neutral"
  | "brand"
  | "success"
  | "warning"
  | "danger"
  | "purple"
  | "indigo"
  | "teal"
  | "cyan"
  | "accent";

export interface StatusPillProps {
  status: string;
  tone?: StatusTone;
  className?: string;
  showDot?: boolean;
}
