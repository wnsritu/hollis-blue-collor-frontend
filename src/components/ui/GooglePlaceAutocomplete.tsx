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
  id?: string;
  name?: string;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

const GooglePlaceAutocomplete = ({
  value,
  onChange,
  onSelect,
  placeholder,
  className,
  id,
  name,
  onBlur,
  disabled,
}: Props) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!inputRef.current) return;

    let autocomplete: google.maps.places.Autocomplete | null = null;

    const initAutocomplete = () => {
      if (!window.google?.maps?.places?.Autocomplete || !inputRef.current) return;

      autocomplete = new google.maps.places.Autocomplete(
        inputRef.current,
        {
          fields: ["formatted_address", "geometry", "name", "address_components"],
          types: ["geocode"],
        },
      );

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete!.getPlace();

        const address = place.formatted_address || place.name || "";
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
    };

    if (window.google?.maps?.places) {
      initAutocomplete();
    } else {
      const interval = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(interval);
          initAutocomplete();
        }
      }, 300);
      return () => clearInterval(interval);
    }
  }, []);

  return (
    <Input
      ref={inputRef}
      id={id}
      name={name}
      value={value}
      placeholder={placeholder || "Search address..."}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      disabled={disabled}
      className={className}
    />
  );
};

export default GooglePlaceAutocomplete;
