/**
 * Common reusable Tailwind CSS class names.
 * Kept 100% identical to project conventions.
 */

export const CARD_BASE = "rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm";
export const CARD_HEADER = "flex flex-col space-y-1.5 p-6";
export const CARD_TITLE = "text-2xl font-semibold leading-none tracking-tight";
export const CARD_DESCRIPTION = "text-sm text-muted-foreground";
export const CARD_CONTENT = "p-6 pt-0";
export const CARD_FOOTER = "flex items-center p-6 pt-0";

export const INPUT_BASE = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

export const BADGE_BASE = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
export const BADGE_PRIMARY = "border-transparent bg-primary text-primary-foreground hover:bg-primary/80";
export const BADGE_SECONDARY = "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80";
export const BADGE_OUTLINE = "text-foreground";
export const BADGE_SUCCESS = "border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400";
export const BADGE_WARNING = "border-transparent bg-amber-500/15 text-amber-600 dark:text-amber-400";
export const BADGE_DANGER = "border-transparent bg-destructive/15 text-destructive";

export const BUTTON_PRIMARY = "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";
export const BUTTON_OUTLINE = "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";
export const BUTTON_GHOST = "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";
