/**
 * Booking wizard & checkout style constants.
 * Verbatim extraction of Tailwind utility classes.
 */

export const WIZARD_CONTAINER = "min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8";
export const WIZARD_MAX_WIDTH = "max-w-4xl mx-auto";
export const WIZARD_HEADER = "text-center mb-8";
export const WIZARD_TITLE = "text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl";
export const WIZARD_SUBTITLE = "mt-2 text-base text-muted-foreground";

export const STEP_INDICATOR_WRAPPER = "relative flex justify-between items-center mb-8 px-2 sm:px-6";
export const STEP_CIRCLE_BASE = "w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm transition-all";
export const STEP_CIRCLE_ACTIVE = "bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-md";
export const STEP_CIRCLE_COMPLETED = "bg-emerald-500 text-white";
export const STEP_CIRCLE_INACTIVE = "bg-muted text-muted-foreground";

export const CARD_SELECTION_BASE = "relative border rounded-2xl p-5 cursor-pointer transition-all duration-200";
export const CARD_SELECTION_ACTIVE = "border-primary bg-primary/5 shadow-md ring-2 ring-primary/20";
export const CARD_SELECTION_INACTIVE = "border-border hover:border-muted-foreground/30 hover:shadow-sm";

export const OPTION_GRID_2 = "grid grid-cols-1 sm:grid-cols-2 gap-4";
export const OPTION_GRID_3 = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4";
export const OPTION_GRID_4 = "grid grid-cols-2 sm:grid-cols-4 gap-3";

export const SUMMARY_ROW = "flex items-center justify-between py-2 border-b border-border/50 text-sm";
export const SUMMARY_LABEL = "text-muted-foreground";
export const SUMMARY_VALUE = "font-medium text-foreground";
export const SUMMARY_TOTAL_ROW = "flex items-center justify-between pt-4 text-base font-bold text-foreground";

export const ACTION_BAR = "mt-8 pt-4 border-t border-border flex items-center justify-between gap-4";
