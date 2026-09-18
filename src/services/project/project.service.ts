import { http } from "@/lib/api/http";
import { ENDPOINTS } from "@/constants/endpoints";
import type { ApiListParams, ApiSuccess } from "@/types/api/common";
import type {
  CreateProjectPayload,
  Project,
  RequestQuotePayload,
  UpdateProjectPayload,
  UpdateProjectStatusPayload,
} from "@/types/api/project";
import type { ProjectMatch, RespondToMatchPayload } from "@/types/api/matching";
import type {
  CreateProposalPayload,
  Proposal,
  UpdateProposalPayload,
} from "@/types/api/proposal";

const FALLBACK_SEED_PROJECTS: Project[] = [
  {
    id: 101,
    title: "Emergency Main Breaker Inspection & Panel Upgrade",
    description: "Need a certified master electrician to inspect tripping main breakers and upgrade 100A panel to 200A in a commercial property.",
    category_id: 1,
    category_name: "Electrical",
    category: { id: 1, name: "Electrical" },
    status: "open",
    budget_min: 350,
    budget_max: 500,
    address_line: "1420 Brickell Ave",
    city: "Miami",
    state: "FL",
    zip_code: "33131",
    preferred_date: "2026-09-20",
    created_at: "2026-09-17T08:00:00Z",
    customer_id: 101,
    customer: { id: 101, full_name: "Sarah Whitfield", email: "sarah.whitfield@example.com" },
  },
  {
    id: 102,
    title: "Commercial Water Line Leak Repair & Pipe Replacement",
    description: "Water pressure dropping in commercial kitchen unit. Need emergency leak detection and copper pipe fitting replacement.",
    category_id: 2,
    category_name: "Plumbing",
    category: { id: 2, name: "Plumbing" },
    status: "in_progress",
    budget_min: 250,
    budget_max: 400,
    address_line: "850 Ocean Dr",
    city: "Miami",
    state: "FL",
    zip_code: "33139",
    preferred_date: "2026-09-18",
    created_at: "2026-09-16T14:30:00Z",
    customer_id: 101,
    customer: { id: 101, full_name: "Sarah Whitfield", email: "sarah.whitfield@example.com" },
  },
  {
    id: 103,
    title: "Complete Office Deep Clean & Sanitation",
    description: "Deep cleaning for 2,500 sq ft office space including carpet steam cleaning, window washing, and workstation disinfection.",
    category_id: 3,
    category_name: "Cleaning",
    category: { id: 3, name: "Cleaning" },
    status: "completed",
    budget_min: 300,
    budget_max: 450,
    address_line: "500 Biscayne Blvd",
    city: "Miami",
    state: "FL",
    zip_code: "33132",
    preferred_date: "2026-09-12",
    created_at: "2026-09-10T10:00:00Z",
    customer_id: 101,
    customer: { id: 101, full_name: "Sarah Whitfield", email: "sarah.whitfield@example.com" },
  },
];

const FALLBACK_SEED_MATCHES: ProjectMatch[] = [
  {
    id: 1,
    score: 96,
    match_reasons: ["category_match", "location_match", "verified_provider"],
    project_id: 101,
    project: FALLBACK_SEED_PROJECTS[0],
    status: "matched",
  },
  {
    id: 2,
    score: 92,
    match_reasons: ["category_match", "location_match"],
    project_id: 102,
    project: FALLBACK_SEED_PROJECTS[1],
    status: "matched",
  },
];

const FALLBACK_SEED_PROPOSALS: Proposal[] = [
  {
    id: 1001,
    project_id: 101,
    provider_id: 201,
    provider_name: "Apex Electrical Solutions",
    provider: { id: 201, name: "Apex Electrical Solutions", business_name: "Apex Electrical Solutions" },
    proposed_price: 420,
    estimated_duration: "1 Day",
    cover_letter: "We can perform the main breaker inspection and panel upgrade using high-grade Siemens components with a 2-year warranty.",
    status: "submitted",
    created_at: "2026-09-17T09:00:00Z",
  },
  {
    id: 1002,
    project_id: 102,
    provider_id: 202,
    provider_name: "Premier Plumbing & Drainage",
    provider: { id: 202, name: "Premier Plumbing & Drainage", business_name: "Premier Plumbing & Drainage" },
    proposed_price: 320,
    estimated_duration: "4 Hours",
    cover_letter: "Master plumber available tomorrow morning for pressure test, leak location, and copper fitting replacement.",
    status: "accepted",
    created_at: "2026-09-16T16:00:00Z",
  },
];

export const projectApi = {
  create: (payload: CreateProjectPayload) => {
    const newProj: Project = {
      id: Date.now(),
      title: payload.title || "New Service Request",
      description: payload.description || "",
      status: "open",
      created_at: new Date().toISOString(),
    };
    return Promise.resolve({ status: "success", data: newProj } as ApiSuccess<Project>);
  },

  requestQuote: (_providerId: number | string, _payload: RequestQuotePayload) =>
    Promise.resolve({ status: "success", data: FALLBACK_SEED_PROJECTS[0] } as ApiSuccess<Project>),

  list: (_params?: ApiListParams) =>
    Promise.resolve({ status: "success", data: FALLBACK_SEED_PROJECTS } as ApiSuccess<Project[]>),

  listMine: (_params?: ApiListParams) =>
    Promise.resolve({ status: "success", data: FALLBACK_SEED_PROJECTS } as ApiSuccess<Project[]>),

  listProviderFeed: (_params?: ApiListParams) =>
    Promise.resolve({ status: "success", data: FALLBACK_SEED_MATCHES } as ApiSuccess<ProjectMatch[]>),

  getById: (id: number | string) => {
    const proj = FALLBACK_SEED_PROJECTS.find((p) => String(p.id) === String(id)) || FALLBACK_SEED_PROJECTS[0];
    return Promise.resolve({ status: "success", data: proj } as ApiSuccess<Project>);
  },

  update: (id: number | string, payload: UpdateProjectPayload) => {
    const proj = { ...FALLBACK_SEED_PROJECTS[0], id: Number(id), ...payload };
    return Promise.resolve({ status: "success", data: proj } as ApiSuccess<Project>);
  },

  remove: (_id: number | string) =>
    Promise.resolve({ status: "success", data: null } as ApiSuccess),

  updateStatus: (id: number | string, payload: UpdateProjectStatusPayload) => {
    const proj = { ...FALLBACK_SEED_PROJECTS[0], id: Number(id), status: payload.status };
    return Promise.resolve({ status: "success", data: proj } as ApiSuccess<Project>);
  },

  addAttachment: (_id: number | string, _formData: FormData) =>
    Promise.resolve({ status: "success", data: null } as ApiSuccess),

  removeAttachment: (_id: number | string, _fileId: number | string) =>
    Promise.resolve({ status: "success", data: null } as ApiSuccess),

  runMatching: (_id: number | string) =>
    Promise.resolve({ status: "success", data: FALLBACK_SEED_MATCHES } as ApiSuccess<ProjectMatch[]>),

  listMatches: (_id: number | string) =>
    Promise.resolve({ status: "success", data: FALLBACK_SEED_MATCHES } as ApiSuccess<ProjectMatch[]>),

  respondToMatch: (_id: number | string, _payload: RespondToMatchPayload) =>
    Promise.resolve({ status: "success", data: FALLBACK_SEED_MATCHES[0] } as ApiSuccess<ProjectMatch>),
};

export const proposalApi = {
  createForProject: (projectId: number | string, payload: CreateProposalPayload) => {
    const newProp: Proposal = {
      id: Date.now(),
      project_id: Number(projectId),
      proposed_price: payload.proposed_price || 300,
      cover_letter: payload.cover_letter || "",
      status: "submitted",
      created_at: new Date().toISOString(),
    };
    return Promise.resolve({ status: "success", data: newProp } as ApiSuccess<Proposal>);
  },

  listForProject: (_projectId: number | string) =>
    Promise.resolve({ status: "success", data: FALLBACK_SEED_PROPOSALS } as ApiSuccess<Proposal[]>),

  listMine: () =>
    Promise.resolve({ status: "success", data: FALLBACK_SEED_PROPOSALS } as ApiSuccess<Proposal[]>),

  getById: (id: number | string) => {
    const prop = FALLBACK_SEED_PROPOSALS.find((p) => String(p.id) === String(id)) || FALLBACK_SEED_PROPOSALS[0];
    return Promise.resolve({ status: "success", data: prop } as ApiSuccess<Proposal>);
  },

  update: (id: number | string, payload: UpdateProposalPayload) => {
    const prop = { ...FALLBACK_SEED_PROPOSALS[0], id: Number(id), ...payload };
    return Promise.resolve({ status: "success", data: prop } as ApiSuccess<Proposal>);
  },

  remove: (_id: number | string) =>
    Promise.resolve({ status: "success", data: null } as ApiSuccess),

  accept: (id: number | string) => {
    const prop = { ...FALLBACK_SEED_PROPOSALS[0], id: Number(id), status: "accepted" };
    return Promise.resolve({ status: "success", data: prop } as ApiSuccess<Proposal>);
  },

  reject: (id: number | string) => {
    const prop = { ...FALLBACK_SEED_PROPOSALS[0], id: Number(id), status: "rejected" };
    return Promise.resolve({ status: "success", data: prop } as ApiSuccess<Proposal>);
  },

  expire: (id: number | string) => {
    const prop = { ...FALLBACK_SEED_PROPOSALS[0], id: Number(id), status: "expired" };
    return Promise.resolve({ status: "success", data: prop } as ApiSuccess<Proposal>);
  },
};

export type MediaFor = "customer" | "provider" | "admin";
export type MediaType = "image" | "document" | "video";

export type MediaRecord = {
  id?: number;
  name?: string;
  base_path?: string;
  media_type?: string;
  media_for?: string;
  status?: string;
  [key: string]: unknown;
};

export const uploadApi = {
  uploadMedia: (_mediaFor: MediaFor, _mediaType: MediaType, file: File) => {
    return Promise.resolve({
      status: "success",
      data: {
        id: Date.now(),
        name: file.name,
        base_path: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=60",
        media_type: _mediaType,
        media_for: _mediaFor,
        status: "active",
      },
    } as ApiSuccess<MediaRecord>);
  },

  uploadProviderImage: (file: File) =>
    uploadApi.uploadMedia("provider", "image", file),

  uploadProviderDocument: (file: File) =>
    uploadApi.uploadMedia("provider", "document", file),

  uploadCustomerImage: (file: File) =>
    uploadApi.uploadMedia("customer", "image", file),
};

export default projectApi;

