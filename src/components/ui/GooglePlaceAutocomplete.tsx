/// <reference types="google.maps" />
import { useEffect, useRef } from "react";
import { Input } from "./input";

interface Props {
  value: string;
  onChange: (val: string) => void;
  onSelect: (place: {
    address: string;
    lat: number;
    lng: number;
    fullPlace?: google.maps.places.PlaceResult;
  }) => void;
  placeholder?: string;
  className?: string;
}

const GooglePlaceAutocomplete = ({
  value,
  onChange,
  onSelect,
  placeholder,
  className,
}: Props) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!window.google) return;

    const autocomplete = new google.maps.places.Autocomplete(
      inputRef.current as HTMLInputElement,
      {
        fields: ["formatted_address", "geometry", "name", "address_components"],
        types: ["geocode"],
      },
    );

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();

      const address = place.formatted_address || "";
      const lat = place.geometry?.location?.lat() || 0;
      const lng = place.geometry?.location?.lng() || 0;

      onSelect({
        address,
        lat,
        lng,
        fullPlace: place,
      });

      onChange(address);
    });
  }, []);

  return (
    <Input
      ref={inputRef}
      value={value}
      placeholder={placeholder || "Search address..."}
      onChange={(e) => onChange(e.target.value)}
      className={className}
    />
  );
};

export default GooglePlaceAutocomplete;
