export interface ServiceItem {
  id: number;
  name: string;
  category_id?: number;
}

export interface PricingItem {
  item_id: number;
  service_id: number;
  not_offered: boolean | number;
  price: string | number;
}

export interface ServiceType {
  id: number;
  name: string;
}

export interface VehicleType {
  id: string;
  label: string;
}

export interface BookingValidationResult {
  isOffered: boolean;
  warningMessage: string;
  bedPricingItem?: PricingItem | null;
  bathPricingItem?: PricingItem | null;
  vehiclePricingItem?: PricingItem | null;
}

export interface OfferedService {
  id: string | number;
  name: string;
  description?: string;
  category_id?: number;
  price?: number | string;
  unit?: string;
}

export interface SelectedItem {
  id: string | number;
  name: string;
  description?: string;
  quantity?: number;
  qty?: number;
  price: number | string;
  unit?: string;
  service_id?: number;
}

export interface CustomerBookingDetails {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  zip?: string;
  notes?: string;
  service_date?: string;
  time_window?: string;
  vehicle_type?: string;
  cleaning_type?: string;
  bedrooms?: number;
  bathrooms?: number;
}

