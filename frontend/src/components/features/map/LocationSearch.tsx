"use client";

import { useState, useRef, useEffect } from "react";
import { searchLocation, reverseGeocode, type GeocodeResult } from "@/lib/services/geocoding";

interface LocationSearchProps {
  onSelect: (lat: number, lng: number, displayName?: string) => void;
  placeholder?: string;
  className?: string;
}

export default function LocationSearch({
  onSelect,
  placeholder = "Search location (e.g. Jaipur, Malviya Nagar Jaipur)",
  className = "",
}: LocationSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const list = await searchLocation(query);
        setResults(list);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleUseLiveLocation() {
    setLiveError("");
    setLiveLoading(true);
    if (!navigator.geolocation) {
      setLiveError("Geolocation is not supported by your browser.");
      setLiveLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        onSelect(latitude, longitude, "Current location");
        setOpen(false);
        try {
          const displayName = await reverseGeocode(latitude, longitude);
          setQuery(displayName || "Current location");
        } catch {
          setQuery("Current location");
        } finally {
          setLiveLoading(false);
        }
      },
      () => {
        setLiveError("Could not get your location. Check permissions or try again.");
        setLiveLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          aria-label="Search location"
        />
        <button
          type="button"
          onClick={handleUseLiveLocation}
          disabled={liveLoading}
          className="shrink-0 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--border)]/50 disabled:opacity-50"
        >
          {liveLoading ? "Getting location…" : "Use my location"}
        </button>
      </div>
      {liveError && (
        <p className="mt-2 text-xs text-[var(--danger)]">{liveError}</p>
      )}
      {open && (
        <ul
          className="absolute top-full left-0 right-0 z-[1100] mt-1 max-h-60 overflow-auto rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-lg"
          role="listbox"
        >
          {loading && (
            <li className="px-4 py-3 text-sm text-[var(--muted)]">Searching…</li>
          )}
          {!loading && results.length === 0 && query.trim() && (
            <li className="px-4 py-3 text-sm text-[var(--muted)]">No places found in India.</li>
          )}
          {!loading &&
            results.map((r) => (
              <li
                key={r.placeId}
                role="option"
                tabIndex={0}
                className="cursor-pointer border-b border-[var(--border)] px-4 py-3 text-sm text-[var(--foreground)] last:border-0 hover:bg-[var(--border)]/50 focus:bg-[var(--border)]/50 focus:outline-none"
                onMouseDown={() => {
                  onSelect(r.lat, r.lng, r.displayName);
                  setQuery(r.displayName);
                  setOpen(false);
                }}
              >
                {r.displayName}
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
