import type { ProjectUrgency } from "./api/project";

export interface CreateProjectFormValues {
  title: string;
  category_id: string;
  service_type_id: string;
  description: string;
  address_line: string;
  city: string;
  state: string;
  zip_code: string;
  latitude: number | null;
  longitude: number | null;
  budget_min: string;
  budget_max: string;
  urgency: ProjectUrgency;
  preferred_date: string;
}

export interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreated?: (projectId: number) => void;
  initialCategoryId?: number;
  initialServiceTypeId?: number;
  providerId?: number;
  providerName?: string;
  categoryName?: string;
  subCategoryName?: string;
}
