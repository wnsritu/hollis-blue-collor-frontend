import type { ReactNode } from "react";
import type { NavLinkProps } from "react-router-dom";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children?: ReactNode;
}

export interface NavItemConfig {
  label: string;
  path: string;
  icon?: any;
  badge?: string | number;
}

export interface TimelineProps {
  steps: string[];
  current: string;
  stepStates?: Record<string, TimelineStepState>;
}

export type TimelineStepState = "done" | "active" | "crossed" | "pending";

export interface NavItem {
  name: string;
  href: string;
  icon: any;
  badge?: string | number;
}

export interface ProviderCardProps {
  id: string;
  user_id?: string | number;
  name: string;
  rating: number;
  distance: string;
  startingPrice: number;
  services?: string[];
  showMessage?: boolean;
  description?: string;
  location?: string;
  image?: string;
  photo?: string;
  onAuthRequired?: () => void;
}

export interface StarRatingProps {
  rating: number;
  size?: number;
  color?: string;
}

export interface NavLinkCompatProps extends Omit<NavLinkProps, "className"> {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
}

export interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: any;
}

export interface CategoryFilterTabsProps {
  activeCategory: string;
  onChange: (category: string) => void;
}

export interface DashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: any;
  trend?: { value: string; positive: boolean };
  className?: string;
}

export interface ProgressCategoryData {
  name: string;
  value: number;
  color?: string;
}

export interface ProgressCategoryChartProps {
  data: ProgressCategoryData[];
  title?: string;
}

export interface BarChartData {
  label: string;
  value: number;
}

export interface VerticalBarChartProps {
  data: BarChartData[];
  title?: string;
}

export interface GenericProvider {
  id: string | number;
  user_id?: string | number;
  name: string;
  category?: string;
  avatarUrl?: string;
  rating?: number | string;
  reviews?: number | string;
  verified?: boolean;
  featured?: boolean;
  initials?: string;
  city?: string;
  state?: string;
  service_location_address?: string;
  services?: any[];
  startingPrice?: number;
  bio?: string;
  availability?: string;
}

export interface GenericBooking {
  id: string | number;
  booking_code?: string;
  order_number?: string;
  category?: string;
  provider_name?: string;
  provider_avatar?: string;
  service_name?: string;
  date?: string;
  time?: string;
  status: string;
  total_amount?: number | string;
  address?: string;
  items?: any[];
}

export interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  docUrl: string | null;
  docName?: string;
}

export interface CategoryTreeProps {
  categories: any[];
  selectedIds: (number | string)[];
  onToggle: (id: number | string) => void;
  readOnly?: boolean;
}

export interface LineItemInput {
  description: string;
  unit: string;
  qty: number;
  rate: number;
}

export interface SubmitProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number | string;
  projectTitle?: string;
  onSuccess?: () => void;
}

