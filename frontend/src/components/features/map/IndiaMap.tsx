"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const MapContent = dynamic(() => import("./MapContent"), {
  ssr: false,
  loading: () => (
    <div
      className="flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)]"
      style={{ height: "70vh", minHeight: "400px" }}
    >
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
        <p className="mt-3 text-sm text-[var(--muted)]">Loading map...</p>
      </div>
    </div>
  ),
});

interface IndiaMapProps {
  onLocationSelect?: (lat: number, lng: number) => void;
  markers?: Array<{ id: string; lat: number; lng: number; title: string; status: string }>;
  height?: string;
  /** When set, map flies to this point (e.g. after search or "Use my location"). */
  center?: [number, number] | null;
  /** When set, show this as the selected location marker (e.g. from search or live location). */
  selectedLocation?: [number, number] | null;
}

export default function IndiaMap({
  onLocationSelect,
  markers = [],
  height = "70vh",
  center = null,
  selectedLocation: selectedLocationProp = null,
}: IndiaMapProps) {
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(selectedLocationProp);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (selectedLocationProp) setSelectedLocation(selectedLocationProp);
  }, [selectedLocationProp]);

  function handleLocationSelect(lat: number, lng: number) {
    setSelectedLocation([lat, lng]);
    onLocationSelect?.(lat, lng);
  }

  const displayLocation = selectedLocationProp ?? selectedLocation;

  if (!mounted) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)]"
        style={{ height, minHeight: "400px" }}
      >
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
          <p className="mt-3 text-sm text-[var(--muted)]">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-lg">
      <MapContent
        onLocationSelect={handleLocationSelect}
        markers={markers}
        selectedLocation={displayLocation}
        center={center}
        height={height}
      />
      {onLocationSelect && (
        <div className="absolute bottom-4 left-4 z-[1000] rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2 shadow-lg">
          <p className="text-xs font-medium text-[var(--foreground)]">
            Click on the map to select location
          </p>
          {displayLocation && (
            <p className="mt-1 text-xs text-[var(--muted)]">
              Lat: {displayLocation[0].toFixed(4)}, Lng: {displayLocation[1].toFixed(4)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
