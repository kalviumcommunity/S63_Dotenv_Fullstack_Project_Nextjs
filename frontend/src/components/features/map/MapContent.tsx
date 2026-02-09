"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";

// Fix default marker icon issue
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });
}

// India center coordinates
const INDIA_CENTER: [number, number] = [20.5937, 78.9629];
const INDIA_BOUNDS: [[number, number], [number, number]] = [
  [6.5, 68.0], // Southwest
  [37.0, 97.5], // Northeast
];

interface LocationMarkerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  selectedLocation?: [number, number] | null;
}

function FlyTo({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 14, { duration: 1.2 });
  }, [map, center]);
  return null;
}

function LocationMarker({ onLocationSelect, selectedLocation }: LocationMarkerProps) {
  const [position, setPosition] = useState<[number, number] | null>(selectedLocation || null);

  useEffect(() => {
    if (selectedLocation) setPosition(selectedLocation);
  }, [selectedLocation]);

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      onLocationSelect(lat, lng);
    },
  });

  return position ? (
    <Marker position={position}>
      <Popup>
        Selected Location
        <br />
        Lat: {position[0].toFixed(4)}, Lng: {position[1].toFixed(4)}
      </Popup>
    </Marker>
  ) : null;
}

interface MapContentProps {
  onLocationSelect?: (lat: number, lng: number) => void;
  markers?: Array<{ id: string; lat: number; lng: number; title: string; status: string }>;
  selectedLocation?: [number, number] | null;
  center?: [number, number] | null;
  height: string;
}

export default function MapContent({
  onLocationSelect,
  markers = [],
  selectedLocation,
  center,
  height,
}: MapContentProps) {
  const getMarkerColor = (status: string) => {
    if (status === "RESOLVED") return "#10b981";
    if (status === "REPORTED" || status === "ASSIGNED") return "#ef4444";
    return "#0ea5e9";
  };

  return (
    <MapContainer
      center={center || INDIA_CENTER}
      zoom={center ? 14 : 5}
      style={{ height, width: "100%", zIndex: 0 }}
      maxBounds={INDIA_BOUNDS}
      minZoom={4}
      maxZoom={18}
      scrollWheelZoom={true}
    >
      {center && <FlyTo center={center} />}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {onLocationSelect && (
        <LocationMarker
          onLocationSelect={onLocationSelect}
          selectedLocation={selectedLocation}
        />
      )}
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          position={[marker.lat, marker.lng]}
          icon={L.divIcon({
            className: "custom-marker",
            html: `<div style="background-color: ${getMarkerColor(marker.status)}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          })}
        >
          <Popup>
            <strong>{marker.title}</strong>
            <br />
            Status: {marker.status}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
