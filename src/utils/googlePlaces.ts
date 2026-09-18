/// <reference types="google.maps" />

export interface ParsedGoogleAddress {
  address: string;
  streetNumber: string;
  route: string;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  zipCode?: string;
  country: string;
  lat: number;
  lng: number;
}

/**
 * Parses Google Place Result address components into a clean, normalized structure.
 * Reusable across registration, profile settings, and booking wizards.
 */
export function parseGooglePlace(place: {
  address: string;
  lat: number;
  lng: number;
  fullPlace?: google.maps.places.PlaceResult;
}): ParsedGoogleAddress {
  const comps = place.fullPlace?.address_components || [];

  const getComp = (type: string) =>
    comps.find((c) => c.types.includes(type))?.long_name || "";
  const getShortComp = (type: string) =>
    comps.find((c) => c.types.includes(type))?.short_name || "";

  const streetNumber = getComp("street_number");
  const route = getComp("route");
  const streetAddress =
    [streetNumber, route].filter(Boolean).join(" ") ||
    (place.address ? place.address.split(",")[0].trim() : "");

  const city =
    getComp("locality") ||
    getComp("sublocality") ||
    getComp("sublocality_level_1") ||
    getComp("postal_town") ||
    getComp("neighborhood") ||
    "";

  const state =
    getComp("administrative_area_level_1") ||
    getShortComp("administrative_area_level_1") ||
    "";

  const zip = getComp("postal_code") || "";
  const country = getComp("country") || "United States";

  return {
    address: place.address || streetAddress,
    streetNumber,
    route,
    streetAddress,
    city,
    state,
    zip,
    zipCode: zip,
    country,
    lat: place.lat,
    lng: place.lng,
  };
}
