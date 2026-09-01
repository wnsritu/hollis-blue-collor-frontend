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

const DEFAULT_VEHICLE_TYPES: VehicleType[] = [
  { id: "sedan", label: "Sedan" },
  { id: "suv", label: "SUV" },
  { id: "truck", label: "Truck" },
  { id: "van", label: "Van" },
  { id: "other", label: "Other / Large Vehicle" },
];

/**
 * Checks if a house cleaning configuration is offered by a provider.
 */
export function checkCleaningOffered(
  rawItems: ServiceItem[],
  rawPricing: PricingItem[],
  cleaningType: string | number | null,
  bedrooms: number,
  bathrooms: number,
  services: ServiceType[] = []
) {
  const activePricing = (rawPricing || []).filter(
    (p) => !p.not_offered && parseFloat(String(p.price)) > 0
  );

  if (activePricing.length === 0) {
    return {
      isOffered: false,
      warningMessage: "This service provider does not offer House Cleaning services currently. Please select another provider.",
      bedPricingItem: null,
      bathPricingItem: null,
    };
  }

  const effCleaningType = cleaningType || (services.length > 0 ? services[0].id : null);
  if (!effCleaningType) {
    return { isOffered: true, warningMessage: "" };
  }

  let bedItemName = "Studio/1 Bed";
  if (bedrooms === 2) bedItemName = "2 Bedrooms";
  else if (bedrooms === 3) bedItemName = "3 Bedrooms";
  else if (bedrooms >= 4) bedItemName = "4+ Bedrooms";

  const bedDbItem = (rawItems || []).find((i) => i.name.toLowerCase() === bedItemName.toLowerCase());
  const bathDbItem = (rawItems || []).find((i) => i.name.toLowerCase() === "extra bathroom");

  const bedPricingItem = bedDbItem
    ? (rawPricing || []).find((p) => p.item_id === bedDbItem.id && p.service_id === Number(effCleaningType))
    : null;
  const bathPricingItem =
    bathrooms > 1 && bathDbItem
      ? (rawPricing || []).find((p) => p.item_id === bathDbItem.id && p.service_id === Number(effCleaningType))
      : null;

  const isBedOffered = !!bedPricingItem && !bedPricingItem.not_offered && parseFloat(String(bedPricingItem.price)) > 0;
  const isBathOffered = bathrooms <= 1 || (!!bathPricingItem && !bathPricingItem.not_offered && parseFloat(String(bathPricingItem.price)) > 0);

  const isCleaningOffered = isBedOffered && isBathOffered;
  let warningMessage = "";

  if (!isCleaningOffered) {
    const selectedCleaningTypeObj = (services || []).find((s) => s.id === Number(effCleaningType));
    warningMessage = `This provider does not offer the requested configuration (${bedrooms} Bed, ${bathrooms} Bath) for ${
      selectedCleaningTypeObj?.name || "the selected cleaning type"
    }. Please select another provider.`;
  }

  return {
    isOffered: isCleaningOffered,
    warningMessage,
    bedPricingItem,
    bathPricingItem,
  };
}

/**
 * Checks if a car wash configuration is offered by a provider.
 */
export function checkCarWashOffered(
  rawItems: ServiceItem[],
  rawPricing: PricingItem[],
  cwService: string | number | null,
  cwVehicle: string | null,
  services: ServiceType[] = [],
  vehicleTypes: VehicleType[] = DEFAULT_VEHICLE_TYPES
) {
  const activePricing = (rawPricing || []).filter(
    (p) => !p.not_offered && parseFloat(String(p.price)) > 0
  );

  if (activePricing.length === 0) {
    return {
      isOffered: false,
      warningMessage: "This service provider does not offer Car Wash services currently. Please select another provider.",
      cwPricingItem: null,
    };
  }

  const effService = cwService || (services.length > 0 ? services[0].id : null);
  const effVehicle = cwVehicle || "sedan";

  const normalizedCwVehicle = String(effVehicle).toLowerCase();
  const vehicleItem = (rawItems || []).find((i) => {
    const itemName = i.name.toLowerCase();
    if (normalizedCwVehicle.includes("sedan") && itemName.includes("sedan")) return true;
    if (normalizedCwVehicle.includes("suv") && itemName.includes("suv")) return true;
    if (normalizedCwVehicle.includes("truck") && itemName.includes("truck")) return true;
    if (normalizedCwVehicle.includes("van") && itemName.includes("van")) return true;
    if (normalizedCwVehicle.includes("other") && itemName.includes("other")) return true;
    return itemName === normalizedCwVehicle;
  });

  const cwPricingItem = vehicleItem
    ? (rawPricing || []).find((p) => p.item_id === vehicleItem.id && p.service_id === Number(effService))
    : null;

  const isCarWashOffered = !!cwPricingItem && !cwPricingItem.not_offered && parseFloat(String(cwPricingItem.price)) > 0;
  let warningMessage = "";

  if (!isCarWashOffered) {
    const selectedCwServiceObj = (services || []).find((s) => s.id === Number(effService));
    const selectedVehicleObj = (vehicleTypes || []).find((v) => v.id === effVehicle || v.id === normalizedCwVehicle);
    warningMessage = `This provider does not offer ${
      selectedCwServiceObj?.name || "the selected service"
    } for the vehicle type "${selectedVehicleObj?.label || effVehicle}". Please select another provider.`;
  }

  return {
    isOffered: isCarWashOffered,
    warningMessage,
    cwPricingItem,
  };
}
