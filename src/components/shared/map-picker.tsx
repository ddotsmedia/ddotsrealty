"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

interface MapPickerProps {
  latitude?: number | null;
  longitude?: number | null;
  onChange: (lat: number, lng: number) => void;
}

export function MapPicker({
  latitude,
  longitude,
  onChange,
}: MapPickerProps) {
  const [lat, setLat] = useState<string>(latitude?.toString() ?? "");
  const [lng, setLng] = useState<string>(longitude?.toString() ?? "");

  const hasApiKey = !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const handleLatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLat(val);
    if (val && lng) {
      const latNum = parseFloat(val);
      const lngNum = parseFloat(lng);
      if (!isNaN(latNum) && !isNaN(lngNum)) {
        onChange(latNum, lngNum);
      }
    }
  };

  const handleLngChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLng(val);
    if (val && lat) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(val);
      if (!isNaN(latNum) && !isNaN(lngNum)) {
        onChange(latNum, lngNum);
      }
    }
  };

  const mapEmbedUrl =
    lat && lng
      ? `https://www.google.com/maps?q=${encodeURIComponent(lat)},${encodeURIComponent(lng)}&output=embed`
      : null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Latitude
          </label>
          <Input
            type="number"
            step="0.0001"
            placeholder="25.2048"
            value={lat}
            onChange={handleLatChange}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Longitude
          </label>
          <Input
            type="number"
            step="0.0001"
            placeholder="55.2708"
            value={lng}
            onChange={handleLngChange}
            className="w-full"
          />
        </div>
      </div>

      {!hasApiKey && (
        <p className="text-xs text-muted-foreground">
          Map disabled (no API key) — enter coordinates manually.
        </p>
      )}

      {hasApiKey && mapEmbedUrl && (
        <div>
          <p className="text-sm font-medium text-foreground mb-2">
            Map preview
          </p>
          <iframe
            width="100%"
            height="240"
            style={{ border: 0, borderRadius: "0.5rem" }}
            loading="lazy"
            allowFullScreen={true}
            src={mapEmbedUrl}
          />
        </div>
      )}
    </div>
  );
}
