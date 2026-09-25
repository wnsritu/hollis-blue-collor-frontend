/**
 * Centralized Provider Profile Completion Utility for Hollis Blue Collar Frontend.
 * Reusable and optimized across all provider portals and components.
 */

export type CompletionStepId =
  | "business_info"
  | "bank_details"
  | "faqs"
  | "services_pricing"
  | "availability";

export interface ProfileCompletionStep {
  id: CompletionStepId;
  title: string;
  shortTitle: string;
  description: string;
  completed: boolean;
  route: string;
  tabKey?: "info" | "bank" | "faqs";
  actionLabel: string;
  iconName: string;
}

export interface ProfileCompletionStatus {
  isComplete: boolean;
  percentage: number; // 0 to 100
  completedCount: number;
  totalCount: number;
  steps: ProfileCompletionStep[];
  firstIncompleteStep?: ProfileCompletionStep;
}

/**
 * Calculates provider profile completion progress across the 5 mandatory sections:
 * 1. Business Info (Profile Tab 1)
 * 2. Bank Account Details (Profile Tab 2)
 * 3. FAQs (Profile Tab 3)
 * 4. Services & Pricing (/provider/pricing)
 * 5. Availability (/provider/availability)
 */
export function computeProfileCompletion(
  provider: any,
  user?: any,
  extraAvailability?: any
): ProfileCompletionStatus {
  const p = provider || {};
  const u = user || p.user || {};

  // 1. Business Info Check:
  const hasBusinessName = Boolean(p.business_name && String(p.business_name).trim().length > 0);
  const hasAbout = Boolean(p.service_description && String(p.service_description).trim().length >= 10);
  const hasLocation = Boolean(
    (p.service_location_address && String(p.service_location_address).trim().length > 0) ||
    (p.city && String(p.city).trim().length > 0)
  );
  const hasLicense = Boolean(p.license_number && String(p.license_number).trim().length > 0);
  const hasInsurance = Boolean(p.insurance_policy && String(p.insurance_policy).trim().length > 0);
  const hasContact = Boolean(
    (u.full_name && String(u.full_name).trim().length > 0) ||
    (p.user?.full_name && String(p.user.full_name).trim().length > 0)
  );

  const businessInfoCompleted = Boolean(
    hasBusinessName && hasAbout && hasLocation && hasLicense && hasInsurance && hasContact
  );

  // 2. Bank Details Check:
  const bankObj = p.bank || {};
  const hasBankName = Boolean(
    (p.bank_name && String(p.bank_name).trim().length > 0) ||
    (bankObj.bank_name && String(bankObj.bank_name).trim().length > 0)
  );
  const hasBankHolder = Boolean(
    (p.bank_account_holder && String(p.bank_account_holder).trim().length > 0) ||
    (bankObj.bank_account_holder && String(bankObj.bank_account_holder).trim().length > 0)
  );
  const hasBankNumber = Boolean(
    (p.bank_account_number && String(p.bank_account_number).trim().length > 0) ||
    (bankObj.bank_account_number && String(bankObj.bank_account_number).trim().length > 0) ||
    (bankObj.account_last4 && String(bankObj.account_last4).trim().length > 0)
  );
  const hasBankRouting = Boolean(
    (p.bank_routing_number && String(p.bank_routing_number).trim().length > 0) ||
    (bankObj.bank_routing_number && String(bankObj.bank_routing_number).trim().length > 0) ||
    hasBankNumber // In case routing number is masked/hidden on read
  );

  const bankDetailsCompleted = Boolean(
    hasBankName && hasBankHolder && hasBankNumber && hasBankRouting
  );

  // 3. FAQs Check:
  let parsedFaqs: any[] = [];
  if (Array.isArray(p.faqs)) {
    parsedFaqs = p.faqs;
  } else if (typeof p.faqs === "string") {
    try {
      parsedFaqs = JSON.parse(p.faqs);
    } catch (_) {}
  }
  const faqsCompleted = Boolean(
    Array.isArray(parsedFaqs) &&
    parsedFaqs.length > 0 &&
    parsedFaqs.some(
      (f: any) =>
        f &&
        ((f.question && String(f.question).trim().length > 0) ||
          (f.q && String(f.q).trim().length > 0)) &&
        ((f.answer && String(f.answer).trim().length > 0) ||
          (f.a && String(f.a).trim().length > 0))
    )
  );

  // 4. Services & Pricing Check:
  let parsedPricing: Record<string, any> = {};
  if (p.service_pricing && typeof p.service_pricing === "object") {
    parsedPricing = p.service_pricing;
  } else if (typeof p.service_pricing === "string") {
    try {
      parsedPricing = JSON.parse(p.service_pricing);
    } catch (_) {}
  }
  const hasValidPrice = Object.values(parsedPricing).some((val) => {
    const num = Number(typeof val === "object" ? val?.price || val?.amount : val);
    return !isNaN(num) && num > 0;
  });
  const servicesPricingCompleted = Boolean(
    hasValidPrice || (p.starting_price && Number(p.starting_price) > 0)
  );

  // 5. Availability Check:
  const availList =
    Array.isArray(extraAvailability) && extraAvailability.length > 0
      ? extraAvailability
      : Array.isArray(p.availabilities) && p.availabilities.length > 0
      ? p.availabilities
      : Array.isArray(p.provider_availabilities) && p.provider_availabilities.length > 0
      ? p.provider_availabilities
      : [];

  let hasActiveSchedule = availList.length > 0;
  if (!hasActiveSchedule && extraAvailability && typeof extraAvailability === "object") {
    // In case schedule is a day map { Monday: [1, 2], ... }
    const scheduleValues = Object.values(extraAvailability);
    hasActiveSchedule = scheduleValues.some(
      (v) => Array.isArray(v) && v.length > 0
    );
  }
  const availabilityCompleted = Boolean(hasActiveSchedule);

  // If backend provided pre-computed profile_completion, use its flags as fallback/enhancement
  const backendCompletion = p.profile_completion;

  const steps: ProfileCompletionStep[] = [
    {
      id: "business_info",
      title: "Business Info",
      shortTitle: "Business Info",
      description: "Business name, service description, address, license & insurance",
      completed: backendCompletion?.steps?.find((s: any) => s.id === "business_info")?.completed ?? businessInfoCompleted,
      route: "/provider/profile?tab=info",
      tabKey: "info",
      actionLabel: "Complete Info",
      iconName: "Building2",
    },
    {
      id: "bank_details",
      title: "Bank Account Details",
      shortTitle: "Bank Details",
      description: "Direct deposit bank account & routing information",
      completed: backendCompletion?.steps?.find((s: any) => s.id === "bank_details")?.completed ?? bankDetailsCompleted,
      route: "/provider/profile?tab=bank",
      tabKey: "bank",
      actionLabel: "Add Bank",
      iconName: "CreditCard",
    },
    {
      id: "faqs",
      title: "Frequently Asked Questions",
      shortTitle: "FAQs",
      description: "Helpful answers to common client questions",
      completed: backendCompletion?.steps?.find((s: any) => s.id === "faqs")?.completed ?? faqsCompleted,
      route: "/provider/profile?tab=faqs",
      tabKey: "faqs",
      actionLabel: "Add FAQs",
      iconName: "HelpCircle",
    },
    {
      id: "services_pricing",
      title: "Services & Pricing",
      shortTitle: "Pricing",
      description: "Set rates for your offered services and packages",
      completed: backendCompletion?.steps?.find((s: any) => s.id === "services_pricing")?.completed ?? servicesPricingCompleted,
      route: "/provider/pricing",
      actionLabel: "Set Pricing",
      iconName: "Tags",
    },
    {
      id: "availability",
      title: "Availability Schedule",
      shortTitle: "Availability",
      description: "Select your working days and bookable hours",
      completed: backendCompletion?.steps?.find((s: any) => s.id === "availability")?.completed ?? availabilityCompleted,
      route: "/provider/availability",
      actionLabel: "Set Hours",
      iconName: "CalendarDays",
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const percentage = Math.round((completedCount / steps.length) * 100);
  const isComplete = completedCount === steps.length;
  const firstIncompleteStep = steps.find((s) => !s.completed);

  return {
    isComplete,
    percentage,
    completedCount,
    totalCount: steps.length,
    steps,
    firstIncompleteStep,
  };
}
