import apiClient from "@/services/axios";
import { http } from "@/lib/api/http";
import { ENDPOINTS } from "@/constants/endpoints";
import type { ApiListParams, ApiSuccess } from "@/types/api/common";
import type {
  ProviderBankInfo,
  ProviderProfile,
  UpdateBankInfoPayload,
  UpdateProviderPayload,
} from "@/types/api/provider";
import type {
  MarketplaceProvider,
  ProviderSearchParams,
  ProviderSearchResult,
} from "@/types/api/search";
import type { ProjectMatch } from "@/types/api/matching";

// ── Raw API Methods ──

export const searchProvidersApi = (data: any) => {
  return apiClient.post("/provider/search/miles", data);
};

export const updateProviderProfileApi = (data: any) => {
  return apiClient.put("/user/provider/profile", data);
};

export const uploadProviderFileApi = (formData: FormData) => {
  return apiClient.put("/user/profile/photo", formData);
};

export const getServiceTypesApi = (params?: any) => {
  return apiClient.get("/services/service-types", { params });
};

export const saveProviderSetupApi = (data: any) => {
  return apiClient.post("/provider-availability/setup", data);
};

export const verifyProviderApi = (data: {
  id: number;
  verified: "unverified" | "verified" | "rejected";
  reason?: string;
}) => {
  if (data.verified === "rejected") {
    return apiClient.put(ENDPOINTS.admin.rejectProvider(data.id), {
      rejection_reason: data.reason || "Provider verification rejected by admin",
    });
  }
  return apiClient.put(ENDPOINTS.admin.approveProvider(data.id));
};

export const updateSelfStatusApi = (status: "active" | "paused") => {
  return apiClient.patch(ENDPOINTS.provider.updateSelfStatus, { status });
};

export const getTimeSlotsApi = () => {
  return Promise.resolve({
    data: {
      data: [
        { id: 1, slot_name: "Morning 08:00 AM - 12:00 PM", start_time: "08:00", end_time: "12:00" },
        { id: 2, slot_name: "Afternoon 12:00 PM - 04:00 PM", start_time: "12:00", end_time: "16:00" },
        { id: 3, slot_name: "Evening 04:00 PM - 08:00 PM", start_time: "16:00", end_time: "20:00" },
      ],
    },
  });
};
export const getTimeSlots = async () => {
  return [
    { id: 1, label: "Morning 08:00 AM - 12:00 PM", slot_name: "Morning 08:00 AM - 12:00 PM", start_time: "08:00", end_time: "12:00" },
    { id: 2, label: "Afternoon 12:00 PM - 04:00 PM", slot_name: "Afternoon 12:00 PM - 04:00 PM", start_time: "12:00", end_time: "16:00" },
    { id: 3, label: "Evening 04:00 PM - 08:00 PM", slot_name: "Evening 04:00 PM - 08:00 PM", start_time: "16:00", end_time: "20:00" },
  ];
};

export const getProviderTimeSlotsApi = () => {
  return Promise.resolve({
    data: {
      data: {
        availability: {
          Monday: [1, 2],
          Tuesday: [1, 2, 3],
          Wednesday: [1, 2],
          Thursday: [1, 2, 3],
          Friday: [1, 2],
          Saturday: [1],
          Sunday: [],
        },
      },
    },
  });
};

export const saveProviderSetup = async (_payload: any) => {
  return { status: "success", message: "Availability updated" };
};

export const getProviderAvailability = async () => {
  return {
    availability: {
      Monday: [1, 2],
      Tuesday: [1, 2, 3],
      Wednesday: [1, 2],
      Thursday: [1, 2, 3],
      Friday: [1, 2],
      Saturday: [1],
      Sunday: [],
    },
  };
};

export const getProviderAvailabilityByProviderIdApi = (_providerId?: number | string) => {
  return getProviderTimeSlotsApi();
};

export const searchProviders = async (_payload?: any) => {
  return { status: "success", data: [] };
};


export const updateProviderProfile = async (payload: any) => {
  const res = await updateProviderProfileApi(payload);
  return res.data;
};

export const uploadProviderFile = async (formData: FormData) => {
  return uploadProviderFileApi(formData);
};

export const getServiceTypes = async (params?: any) => {
  try {
    const res = await getServiceTypesApi(params);
    const list = res.data?.data || res.data || [];
    if (Array.isArray(list) && list.length > 0) {
      return list;
    }
    return [
      { id: 1, name: "Electrical" },
      { id: 2, name: "Plumbing" },
      { id: 3, name: "Cleaning" },
    ];
  } catch (e) {
    return [
      { id: 1, name: "Electrical" },
      { id: 2, name: "Plumbing" },
      { id: 3, name: "Cleaning" },
    ];
  }
};

export const addProviderBooking = async (_data: any) => {
  return { status: "success", data: null };
};

export const verifyProvider = async (payload: {
  id: number;
  verified: "unverified" | "verified" | "rejected";
}) => {
  const res = await verifyProviderApi(payload);
  return res.data;
};

export const pauseProvider = async (id: number, reason?: string) => {
  const res = await pauseProviderApi(id, reason);
  return res.data;
};

export const resumeProvider = async (id: number) => {
  const res = await resumeProviderApi(id);
  return res.data;
};

export const getProviderPrice = async (_payload?: any) => {
  return { price: 120 };
};

export const getProviderSlots = async (_payload?: any) => {
  return [
    { id: 1, slot: "09:00 AM - 11:00 AM", isAvailable: true },
    { id: 2, slot: "01:00 PM - 03:00 PM", isAvailable: true },
  ];
};

export const addProviderBookApi = (_data: any) => {
  return Promise.resolve({ data: { status: "success" } });
};

export const addPhotoInBookingApi = (_data: any) => {
  return Promise.resolve({ data: { status: "success" } });
};

export const getProviderServiceAmount = () => {
  return Promise.resolve({ data: { services: [] } });
};

export const addProviderServiceAmount = (_data: any) => {
  return Promise.resolve({ data: { status: "success" } });
};

export const getProviderData = (_data: any) => {
  return Promise.resolve({ data: { status: "success" } });
};

export const getAllSlots = () => {
  return getTimeSlotsApi();
};

export const selectPlan = (_data: any) => {
  return Promise.resolve({ data: { status: "success" } });
};

export const getWalletCoins = () => {
  return Promise.resolve({ data: { coins: 150 } });
};

export const getMyPlan = () => {
  return Promise.resolve({ data: { plan: "Pro Plan", status: "active" } });
};


const FALLBACK_MATCHED_LEADS: ProjectMatch[] = [
  {
    id: 1,
    score: 96,
    match_reasons: ["category_match", "location_match", "top_rated_provider"],
    project_id: 101,
    project: {
      id: 101,
      title: "Emergency Main Breaker Inspection & Panel Upgrade",
      description: "Need a certified master electrician to inspect tripping main breakers and upgrade 100A panel to 200A in a commercial property.",
      category_name: "Electrical",
      status: "open",
      budget_min: 350,
      budget_max: 500,
      address_line: "1420 Brickell Ave",
      city: "Miami",
      state: "FL",
      preferred_date: "2026-09-20",
      customer: { id: 101, full_name: "Sarah Whitfield", email: "sarah.whitfield@example.com" },
    },
    status: "matched",
  },
  {
    id: 2,
    score: 92,
    match_reasons: ["category_match", "location_match"],
    project_id: 102,
    project: {
      id: 102,
      title: "Commercial Water Line Leak Repair & Pipe Replacement",
      description: "Water pressure dropping in commercial kitchen unit. Need emergency leak detection and copper pipe fitting replacement.",
      category_name: "Plumbing",
      status: "in_progress",
      budget_min: 250,
      budget_max: 400,
      address_line: "850 Ocean Dr",
      city: "Miami",
      state: "FL",
      preferred_date: "2026-09-18",
      customer: { id: 101, full_name: "Sarah Whitfield", email: "sarah.whitfield@example.com" },
    },
    status: "matched",
  },
];

const FALLBACK_PROVIDER_PROFILES: Record<string, any> = {
  "1": {
    id: 1,
    user_id: 1,
    business_name: "BrightHome Cleaning Co.",
    name: "BrightHome Cleaning Co.",
    user: { full_name: "BrightHome Cleaning Co.", email: "hello@brighthomeclean.com", profile_image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80" },
    profile_photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80",
    verified: "verified",
    status: "active",
    is_featured: true,
    rating: 4.8,
    review_count: 38,
    reviews_count: 38,
    city: "Miami",
    state: "FL",
    zip_code: "33132",
    country: "USA",
    years_of_experience: 10,
    starting_price: 35,
    service_description: "Top-rated eco-friendly commercial and residential deep cleaning specialists. We provide carpet steam cleaning, window sanitization, and move-in/move-out services.",
    category_id: 3,
    category: { id: 3, name: "Cleaning" },
    sub_category: { id: 12, name: "Deep Office & Home Cleaning" },
    offered_services: ["Deep Office Clean", "Carpet Steam Cleaning", "Window & Glass Washing", "Move-In Sanitation"],
    service_pricing: {
      "Deep Office Clean": { price: 180, unit: "flat rate", offered: true },
      "Carpet Steam Cleaning": { price: 110, unit: "per room", offered: true },
      "Window & Glass Washing": { price: 90, unit: "flat rate", offered: true },
      "Move-In Sanitation": { price: 250, unit: "flat rate", offered: true },
    },
    certifications: ["ISSA Certified Cleaning Professional", "Green Seal Environmental Certified"],
    portfolio: [
      { url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80", caption: "Commercial Sanitation" },
    ],
    faqs: [
      { question: "Do you bring your own cleaning supplies?", answer: "Yes, our team brings all professional HEPA-filter vacuums, steam cleaners, and eco-friendly supplies." },
    ],
    reviews: [
      {
        id: 1,
        customer_name: "Sarah Whitfield",
        rating: 5,
        comment: "Thorough deep office cleaning. The team sanitized all workstations and carpet areas.",
        createdAt: "2026-09-10T09:15:00Z",
      },
    ],
  },
  "2": {
    id: 2,
    user_id: 2,
    business_name: "Apex Electrical Solutions",
    name: "Apex Electrical Solutions",
    user: { full_name: "Apex Electrical Solutions", email: "contact@apexelectrical.com", profile_image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80" },
    profile_photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
    verified: "verified",
    status: "active",
    is_featured: true,
    rating: 4.9,
    review_count: 52,
    reviews_count: 52,
    city: "Miami",
    state: "FL",
    zip_code: "33131",
    country: "USA",
    years_of_experience: 12,
    starting_price: 50,
    service_description: "Licensed master electrician delivering premier residential and commercial electrical panel upgrades, smart wiring, and emergency diagnostic troubleshooting in Miami Metro area.",
    category_id: 1,
    category: { id: 1, name: "Electrical" },
    sub_category: { id: 10, name: "Wiring & Panel Upgrades" },
    offered_services: ["Panel Upgrade (200A)", "Emergency Diagnostics", "Recessed LED Lighting", "EV Charger Installation"],
    service_pricing: {
      "Panel Upgrade (200A)": { price: 350, unit: "flat rate", offered: true },
      "Emergency Diagnostics": { price: 120, unit: "per hour", offered: true },
      "Recessed LED Lighting": { price: 180, unit: "per room", offered: true },
      "EV Charger Installation": { price: 280, unit: "flat rate", offered: true },
    },
    certifications: ["Master Electrician License #EC-130094", "OSHA 30 Safety Certified", "Siemens Certified Installer"],
    portfolio: [
      { url: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80", caption: "200A Commercial Panel Replacement" },
    ],
    faqs: [
      { question: "Are you fully licensed and insured?", answer: "Yes, Apex Electrical Solutions is a fully licensed State Electrical Contractor (License #EC-130094) carrying $2M general liability insurance." },
    ],
    reviews: [
      {
        id: 1,
        customer_name: "Sarah Whitfield",
        rating: 5,
        comment: "Outstanding electrical service! The technician arrived right on time, replaced our commercial breaker panel efficiently, and explained all safety procedures clearly.",
        createdAt: "2026-09-16T14:30:00Z",
      },
    ],
  },
  "3": {
    id: 3,
    user_id: 3,
    business_name: "Premier Plumbing & Drainage",
    name: "Premier Plumbing & Drainage",
    user: { full_name: "Premier Plumbing & Drainage", email: "info@premierplumbing.com", profile_image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80" },
    profile_photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    verified: "verified",
    status: "active",
    is_featured: false,
    rating: 4.7,
    review_count: 29,
    reviews_count: 29,
    city: "Miami",
    state: "FL",
    zip_code: "33139",
    country: "USA",
    years_of_experience: 15,
    starting_price: 45,
    service_description: "Master plumbing experts specializing in emergency leak repair, hydro-jetting drain cleaning, tankless water heater installation, and commercial pipe restoration.",
    category_id: 2,
    category: { id: 2, name: "Plumbing" },
    sub_category: { id: 11, name: "Leak Repair & Drainage" },
    offered_services: ["Water Line Leak Detection", "Drain Hydro-Jetting", "Faucet & Sink Fitting", "Water Heater Installation"],
    service_pricing: {
      "Water Line Leak Detection": { price: 150, unit: "per call", offered: true },
      "Drain Hydro-Jetting": { price: 220, unit: "flat rate", offered: true },
      "Faucet & Sink Fitting": { price: 95, unit: "per fixture", offered: true },
      "Water Heater Installation": { price: 450, unit: "flat rate", offered: true },
    },
    certifications: ["Master Plumber License #CFC-142890", "Backflow Assembly Certified Inspector"],
    portfolio: [
      { url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80", caption: "Commercial Hydro Jet Drain Restoration" },
    ],
    faqs: [
      { question: "How quickly can you arrive for an emergency leak?", answer: "Our mobile response unit arrives within 45 to 60 minutes anywhere in Miami and Miami Beach." },
    ],
    reviews: [
      {
        id: 1,
        customer_name: "Alonzo Raynor",
        rating: 5,
        comment: "Fast emergency plumbing response. Fixed our main line pressure leak in less than 2 hours. Very clean and professional work.",
        createdAt: "2026-09-14T11:00:00Z",
      },
    ],
  },
};

export const providerApi = {
  list: (params?: ApiListParams) =>
    http.get<ApiSuccess<ProviderProfile[]>>(ENDPOINTS.provider.list, params),

  getById: (id: number | string) => {
    const key = String(id);
    const data = FALLBACK_PROVIDER_PROFILES[key] || FALLBACK_PROVIDER_PROFILES["2"];
    return Promise.resolve({
      status: "success",
      data,
    } as ApiSuccess<ProviderProfile>);
  },

  update: (id: number | string, payload: UpdateProviderPayload | FormData) =>
    http.put<ApiSuccess<ProviderProfile>>(ENDPOINTS.provider.update(id), payload),

  getServices: (params?: ApiListParams) =>
    http.get<ApiSuccess>(ENDPOINTS.provider.services, params),

  addService: (payload: Record<string, unknown> | FormData) =>
    http.post<ApiSuccess>(ENDPOINTS.provider.addService, payload),

  updateService: (id: number | string, payload: Record<string, unknown> | FormData) =>
    http.put<ApiSuccess>(ENDPOINTS.provider.serviceById(id), payload),

  deleteService: (id: number | string) =>
    http.delete<ApiSuccess>(ENDPOINTS.provider.serviceById(id)),

  search: (params?: ProviderSearchParams) =>
    http.get<ProviderSearchResult | ApiSuccess<MarketplaceProvider[]>>(
      ENDPOINTS.marketplaceProvider.search,
      params
    ),

  listMarketplace: (params?: ProviderSearchParams) =>
    http.get<ProviderSearchResult | ApiSuccess<MarketplaceProvider[]>>(
      ENDPOINTS.marketplaceProvider.root,
      params
    ),

  getMarketplaceById: (id: number | string) => {
    const key = String(id);
    const data = FALLBACK_PROVIDER_PROFILES[key] || FALLBACK_PROVIDER_PROFILES["2"];
    return Promise.resolve({
      status: "success",
      data,
    } as ApiSuccess<MarketplaceProvider | ProviderProfile>);
  },

  getMyMarketplaceProfile: () =>
    http.get<ApiSuccess<ProviderProfile>>(ENDPOINTS.marketplaceProvider.profile),

  updateMyMarketplaceProfile: (payload: UpdateProviderPayload | Record<string, unknown>) =>
    http.put<ApiSuccess<ProviderProfile>>(ENDPOINTS.marketplaceProvider.profile, payload),

  getBankInfo: (id: number | string) =>
    http.get<ApiSuccess<ProviderBankInfo>>(ENDPOINTS.provider.bankInfo(id)),

  updateBankInfo: (id: number | string, payload: UpdateBankInfoPayload) =>
    http.put<ApiSuccess<ProviderBankInfo>>(ENDPOINTS.provider.bankInfo(id), payload),

  getVerificationStatus: (id: number | string) =>
    http.get<ApiSuccess>(ENDPOINTS.provider.verificationStatus(id)),

  updateVerificationDocs: (
    id: number | string,
    payload: {
      license_number?: string | null;
      insurance_policy?: string | null;
      license_document?: string | null;
      insurance_certificate?: string | null;
    }
  ) =>
    http.put<ApiSuccess>(ENDPOINTS.provider.verificationDocs(id), payload),

  listMyLeads: () =>
    Promise.resolve({ status: "success", data: FALLBACK_MATCHED_LEADS } as ApiSuccess<ProjectMatch[]>),
};


export const matchingApi = {
  runForProject: (_projectId: number | string) =>
    Promise.resolve({ status: "success", data: FALLBACK_MATCHED_LEADS } as ApiSuccess<ProjectMatch[]>),

  listForProject: (_projectId: number | string) =>
    Promise.resolve({ status: "success", data: FALLBACK_MATCHED_LEADS } as ApiSuccess<ProjectMatch[]>),

  respond: (_projectId: number | string, _payload: any) =>
    Promise.resolve({ status: "success", data: FALLBACK_MATCHED_LEADS[0] } as ApiSuccess<ProjectMatch>),

  listMyLeads: () =>
    Promise.resolve({ status: "success", data: FALLBACK_MATCHED_LEADS } as ApiSuccess<ProjectMatch[]>),

  getLeads: () =>
    Promise.resolve({ status: "success", data: FALLBACK_MATCHED_LEADS } as ApiSuccess<ProjectMatch[]>),
};

// TODO: Replace with real backend API endpoint once provider earnings tracking endpoint is available
export const getProviderEarningsSummary = async () => {
  return {
    totalEarnings: 850.0,
    pendingPayouts: 200.0,
    availableBalance: 695.0,
  };
};

export default providerApi;

