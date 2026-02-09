"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { CATEGORIES } from "@/constants/mockData";
import { createIssue } from "@/lib/api";
import { searchLocation, reverseGeocode, type GeocodeResult } from "@/lib/services/geocoding";
import AiIssueVisionOverlay from "@/components/features/issues/AiIssueVisionOverlay";

const MAX_PHOTOS = 3;
const MAX_PHOTO_SIZE_MB = 5;

type VisionSuggestion = { category?: string; department?: string };
type VisionResult = {
  detections: Array<{ label: string; score: number; box: { xmin: number; ymin: number; xmax: number; ymax: number } }>;
  suggestion: VisionSuggestion;
  note?: string;
};
type NlpData = {
  summary: string;
  sentiment: string;
  urgency: string;
  entities: Array<{ type: string; value: string }>;
  suggestedDepartment?: string;
  keySignals: string[];
  limitations?: string[];
};
type PredictData = {
  urgencyScore: number;
  expectedResolutionHours: number;
  slaBreachProbability: number;
  priorityBand: string;
  rationale: string[];
  keyFactors: Array<{ factor: string; impact: string }>;
  recommendedActions?: string[];
  caveats?: string[];
};

function departmentToCategory(dept: string): string {
  const d = (dept || "").toLowerCase();
  if (d.includes("sanitation") || d.includes("garbage") || d.includes("waste")) return "GARBAGE";
  if (d.includes("road") || d.includes("transport")) return "ROAD_DAMAGE";
  if (d.includes("water") || d.includes("sewage")) return "WATER_SUPPLY";
  if (d.includes("electric") || d.includes("streetlight")) return "STREETLIGHT";
  return "OTHER";
}

export default function ReportPage() {
  const searchParams = useSearchParams();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]?.id ?? "OTHER");
  const [locationAddress, setLocationAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successId, setSuccessId] = useState<string | null>(null);
  const [locationFetching, setLocationFetching] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState<GeocodeResult[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addressWrapperRef = useRef<HTMLDivElement>(null);

  const [visionResult, setVisionResult] = useState<VisionResult | null>(null);
  const [visionLoading, setVisionLoading] = useState(false);
  const [visionError, setVisionError] = useState("");
  const [nlpResult, setNlpResult] = useState<NlpData | null>(null);
  const [nlpLoading, setNlpLoading] = useState(false);
  const [nlpError, setNlpError] = useState("");
  const [predictResult, setPredictResult] = useState<PredictData | null>(null);
  const [predictLoading, setPredictLoading] = useState(false);
  const [predictError, setPredictError] = useState("");

  // Pre-fill from map: /report?lat=...&lng=...&address=...
  useEffect(() => {
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const address = searchParams.get("address");
    if (lat && lng) {
      setLatitude(lat);
      setLongitude(lng);
      if (address) setLocationAddress(decodeURIComponent(address));
    }
  }, [searchParams]);

  // Address autocomplete
  useEffect(() => {
    const q = locationAddress.trim();
    if (!q || q.length < 2) {
      setAddressSuggestions([]);
      setSuggestionsOpen(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSuggestionsLoading(true);
      try {
        const list = await searchLocation(q);
        setAddressSuggestions(list);
        setSuggestionsOpen(true);
      } catch {
        setAddressSuggestions([]);
      } finally {
        setSuggestionsLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [locationAddress]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (addressWrapperRef.current && !addressWrapperRef.current.contains(e.target as Node))
        setSuggestionsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Photo preview URLs cleanup
  useEffect(() => {
    const urls = photoPreviews;
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [photoPreviews]);

  async function handleFetchCoordinates() {
    const trimmed = locationAddress.trim();
    if (!trimmed) {
      setLocationError("Enter an address or place name first.");
      return;
    }
    setLocationError("");
    setLocationFetching(true);
    try {
      const results = await searchLocation(trimmed);
      if (results.length === 0) {
        setLocationError("No location found. Try a different address or place in India.");
        return;
      }
      const first = results[0];
      setLatitude(first.lat.toFixed(6));
      setLongitude(first.lng.toFixed(6));
      setLocationAddress(first.displayName);
    } catch {
      setLocationError("Failed to fetch coordinates. Please try again.");
    } finally {
      setLocationFetching(false);
    }
  }

  function handleUseMyLocation() {
    setLocationError("");
    setLocationFetching(true);
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      setLocationFetching(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLatitude(lat.toFixed(6));
        setLongitude(lng.toFixed(6));
        try {
          const displayName = await reverseGeocode(lat, lng);
          setLocationAddress(displayName || "Current location");
        } catch {
          setLocationAddress("Current location");
        } finally {
          setLocationFetching(false);
        }
      },
      () => {
        setLocationError("Could not get your location. Check permissions or try again.");
        setLocationFetching(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const valid: File[] = [];
    for (const f of files) {
      if (!f.type.startsWith("image/")) continue;
      if (f.size > MAX_PHOTO_SIZE_MB * 1024 * 1024) continue;
      if (photoFiles.length + valid.length >= MAX_PHOTOS) break;
      valid.push(f);
    }
    if (valid.length === 0) return;
    const newFiles = [...photoFiles, ...valid].slice(0, MAX_PHOTOS);
    setPhotoFiles(newFiles);
    setPhotoPreviews(newFiles.map((f) => URL.createObjectURL(f)));
    setVisionResult(null);
  }

  function removePhoto(index: number) {
    const next = photoFiles.filter((_, i) => i !== index);
    setPhotoFiles(next);
    setPhotoPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
    if (index === 0) setVisionResult(null);
  }

  async function runVision() {
    if (photoFiles.length === 0) return;
    setVisionError("");
    setVisionLoading(true);
    setVisionResult(null);
    try {
      const form = new FormData();
      form.set("image", photoFiles[0]);
      let w = 1000,
        h = 1000;
      try {
        const img = await createImageBitmap(photoFiles[0]);
        w = img.width;
        h = img.height;
        img.close();
      } catch {
        /* use defaults */
      }
      form.set("imageWidth", String(w));
      form.set("imageHeight", String(h));
      const res = await fetch("/api/ai/vision", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Vision request failed");
      setVisionResult({
        detections: data.detections || [],
        suggestion: data.suggestion || {},
        note: data.note,
      });
    } catch (e) {
      setVisionError(e instanceof Error ? e.message : "AI vision failed.");
    } finally {
      setVisionLoading(false);
    }
  }

  async function runNlp() {
    const text = [title.trim(), description.trim()].filter(Boolean).join("\n");
    if (!text) return;
    setNlpError("");
    setNlpLoading(true);
    setNlpResult(null);
    try {
      const res = await fetch("/api/ai/nlp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, locationName: locationAddress || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "NLP request failed");
      setNlpResult(data.data || null);
    } catch (e) {
      setNlpError(e instanceof Error ? e.message : "AI NLP failed.");
    } finally {
      setNlpLoading(false);
    }
  }

  async function runPredict() {
    const t = title.trim();
    if (!t) return;
    setPredictError("");
    setPredictLoading(true);
    setPredictResult(null);
    try {
      const body: Record<string, unknown> = {
        title: t,
        description: description.trim() || undefined,
        category,
        locationName: locationAddress || undefined,
      };
      if (visionResult?.detections?.[0]) {
        body.vision = {
          model: "gemini-vision",
          topLabel: visionResult.detections[0].label,
          topScore: visionResult.detections[0].score,
        };
      }
      const res = await fetch("/api/ai/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Predict request failed");
      setPredictResult(data.data || null);
    } catch (e) {
      setPredictError(e instanceof Error ? e.message : "Priority prediction failed.");
    } finally {
      setPredictLoading(false);
    }
  }

  function applyVisionCategory() {
    const cat = visionResult?.suggestion?.category;
    if (cat && CATEGORIES.some((c) => c.id === cat)) setCategory(cat);
  }

  function applyNlpCategory() {
    const dept = nlpResult?.suggestedDepartment;
    if (dept) setCategory(departmentToCategory(dept));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccessId(null);
    const t = title.trim();
    if (!t) {
      const errorMessage = "Please enter a title.";
      setError(errorMessage);
      toast.error(errorMessage);
      return;
    }
    const lat = latitude.trim() ? Number(latitude) : NaN;
    const lng = longitude.trim() ? Number(longitude) : NaN;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      const errorMessage = "Location is required. Enter an address and fetch coordinates, use your location, or select a location on the map.";
      setError(errorMessage);
      toast.error(errorMessage);
      return;
    }
    if (photoFiles.length === 0) {
      const errorMessage = "At least one photo is required to submit the report.";
      setError(errorMessage);
      toast.error(errorMessage);
      return;
    }
    setSubmitting(true);
    const loadingToast = toast.loading("Submitting your report...");
    try {
      const body: Parameters<typeof createIssue>[0] = {
        title: t,
        description: description.trim() || undefined,
        category,
        isAnonymous,
        latitude: lat,
        longitude: lng,
      };
      const data = await createIssue(body);
      const id = data?.data?.id ?? data?.id;
      toast.dismiss(loadingToast);
      toast.success("Issue reported successfully!");
      setSuccessId(id != null ? String(id) : null);
      setTitle("");
      setDescription("");
      setLocationAddress("");
      setLatitude("");
      setLongitude("");
      setPhotoFiles([]);
      setPhotoPreviews((prev) => {
        prev.forEach((u) => URL.revokeObjectURL(u));
        return [];
      });
    } catch (err) {
      toast.dismiss(loadingToast);
      const errorMessage = err instanceof Error ? err.message : "Failed to submit issue.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Report an Issue</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Describe the civic issue. You can add location on the{" "}
          <Link href="/map" className="text-[var(--primary)] underline">
            Map
          </Link>{" "}
          and use it when reporting.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm"
        >
        {error && (
          <div className="mb-4 rounded-lg border border-[var(--danger)]/50 bg-[var(--danger-bg)]/40 p-3 text-sm text-[var(--danger)]">
            {error}
          </div>
        )}
        {successId && (
          <div className="mb-4 rounded-lg border border-[var(--success)]/50 bg-[var(--success)]/10 p-3 text-sm text-[var(--success)]">
            Issue reported successfully.{" "}
            <Link href={`/issues/${successId}`} className="font-medium underline">
              View issue
            </Link>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="report-title" className="mb-1 block text-sm font-medium text-[var(--foreground)]">
              Title <span className="text-[var(--danger)]">*</span>
            </label>
            <input
              id="report-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Pothole near Main Road"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="report-desc" className="mb-1 block text-sm font-medium text-[var(--foreground)]">
              Description
            </label>
            <textarea
              id="report-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details..."
              rows={3}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="report-category" className="mb-1 block text-sm font-medium text-[var(--foreground)]">
              Category <span className="text-[var(--danger)]">*</span>
            </label>
            <select
              id="report-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Photo upload (mandatory) */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
              Photos <span className="text-[var(--danger)]">*</span>
            </label>
            <p className="mb-2 text-xs text-[var(--muted)]">
              At least one photo required (up to {MAX_PHOTOS} images, max {MAX_PHOTO_SIZE_MB} MB each). Helps officers verify the issue.
            </p>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoChange}
              className="hidden"
              id="report-photos"
            />
            <label
              htmlFor="report-photos"
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--border)]/30"
            >
              <span aria-hidden>📷</span> Choose photos
            </label>
            {photoPreviews.length > 0 && (
              <div className="mt-2 space-y-2">
                {visionResult && photoPreviews[0] && visionResult.detections.length > 0 && (
                  <div className="rounded-lg border border-[var(--primary)]/40 bg-[var(--background)] p-2">
                    <p className="mb-1 text-xs font-medium text-[var(--primary)]">AI Vision – detections</p>
                    <AiIssueVisionOverlay
                      imageUrl={photoPreviews[0]}
                      imageWidth={640}
                      imageHeight={480}
                      detections={visionResult.detections}
                    />
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {photoPreviews.map((url, i) => (
                    <div key={url} className="relative">
                      <img
                        src={url}
                        alt={`Preview ${i + 1}`}
                        className="h-20 w-20 rounded-lg border border-[var(--border)] object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-xs text-[var(--foreground)] shadow hover:bg-[var(--danger)] hover:text-white"
                        aria-label="Remove photo"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Location (mandatory) */}
          <div className="space-y-3">
            <div>
              <label htmlFor="report-location" className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                Location <span className="text-[var(--danger)]">*</span>
              </label>
              <p className="mb-2 text-xs text-[var(--muted)]">
                Enter an address for suggestions, fetch coordinates, use your live location, or{" "}
                <Link
                  href="/map?returnTo=report"
                  className="font-medium text-[var(--primary)] underline"
                >
                  select a location on map
                </Link>
                .
              </p>
              <div ref={addressWrapperRef} className="relative">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    id="report-location"
                    type="text"
                    value={locationAddress}
                    onChange={(e) => {
                      setLocationAddress(e.target.value);
                      setLocationError("");
                    }}
                    onFocus={() => addressSuggestions.length > 0 && setSuggestionsOpen(true)}
                    placeholder="e.g. Jaipur, Malviya Nagar Jaipur, Pink City"
                    className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                    aria-autocomplete="list"
                    aria-expanded={suggestionsOpen}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleFetchCoordinates}
                      disabled={locationFetching}
                      className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--border)]/50 disabled:opacity-50"
                    >
                      {locationFetching ? "Fetching…" : "Fetch coordinates"}
                    </button>
                    <button
                      type="button"
                      onClick={handleUseMyLocation}
                      disabled={locationFetching}
                      className="rounded-lg border border-[var(--primary)] bg-[var(--primary-light)]/30 px-4 py-2 text-sm font-medium text-[var(--primary)] hover:bg-[var(--primary-light)]/50 disabled:opacity-50"
                    >
                      Use my location
                    </button>
                  </div>
                </div>
                {suggestionsOpen && addressSuggestions.length > 0 && (
                  <ul
                    className="absolute top-full left-0 right-0 z-[1100] mt-1 max-h-60 overflow-auto rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-lg"
                    role="listbox"
                  >
                    {suggestionsLoading && (
                      <li className="px-4 py-3 text-sm text-[var(--muted)]">Searching…</li>
                    )}
                    {!suggestionsLoading &&
                      addressSuggestions.map((r) => (
                        <li
                          key={r.placeId}
                          role="option"
                          className="cursor-pointer border-b border-[var(--border)] px-4 py-3 text-sm text-[var(--foreground)] last:border-0 hover:bg-[var(--border)]/50"
                          onMouseDown={() => {
                            setLocationAddress(r.displayName);
                            setLatitude(r.lat.toFixed(6));
                            setLongitude(r.lng.toFixed(6));
                            setSuggestionsOpen(false);
                          }}
                        >
                          {r.displayName}
                        </li>
                      ))}
                  </ul>
                )}
                {locationError && (
                  <p className="mt-1 text-xs text-[var(--danger)]">{locationError}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="report-lat" className="mb-1 block text-xs font-medium text-[var(--foreground)]">
                  Latitude <span className="text-[var(--danger)]">*</span>
                </label>
                <input
                  id="report-lat"
                  type="text"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="e.g. 26.9124"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label htmlFor="report-lng" className="mb-1 block text-xs font-medium text-[var(--foreground)]">
                  Longitude <span className="text-[var(--danger)]">*</span>
                </label>
                <input
                  id="report-lng"
                  type="text"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="e.g. 75.7873"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                />
              </div>
            </div>
            {latitude.trim() && longitude.trim() && Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude)) && (
              <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] overflow-hidden">
                <p className="px-2 py-1 text-xs font-medium text-[var(--muted)]">Location on map</p>
                <iframe
                  title="Location preview"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(longitude) - 0.01},${Number(latitude) - 0.01},${Number(longitude) + 0.01},${Number(latitude) + 0.01}&layer=mapnik&marker=${latitude},${longitude}`}
                  className="h-40 w-full border-0"
                />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              id="report-anonymous"
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--border)]"
            />
            <label htmlFor="report-anonymous" className="text-sm text-[var(--foreground)]">
              Report anonymously
            </label>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-[var(--primary-dark)] disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Submit Report"}
            </button>
            <Link
              href="/feed"
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-5 py-2.5 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--border)]/50"
            >
              Cancel
            </Link>
          </div>
        </form>

        {/* AI-powered suggestions - Right side panel */}
        <div className="lg:sticky lg:top-6 h-fit">
          <div className="group relative overflow-hidden rounded-xl border border-[var(--primary)]/30 bg-gradient-to-br from-[var(--card)] via-[var(--card)] to-[var(--primary-light)]/10 p-5 shadow-lg animate-glow-pulse">
            {/* Animated Tech Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {/* Animated Grid Pattern */}
              <div 
                className="absolute inset-0 opacity-20 animate-tech-grid"
                style={{
                  backgroundImage: `
                    linear-gradient(rgba(14, 165, 233, 0.1) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(14, 165, 233, 0.1) 1px, transparent 1px)
                  `,
                  backgroundSize: '30px 30px',
                }}
              />
              
              {/* Floating Particles */}
              {[...Array(12)].map((_, i) => (
                <div
                  key={`particle-${i}`}
                  className="absolute rounded-full bg-[var(--primary)]/30 animate-particle"
                  style={{
                    left: `${(i * 8) % 100}%`,
                    top: `${(i * 7) % 100}%`,
                    width: `${4 + (i % 3) * 2}px`,
                    height: `${4 + (i % 3) * 2}px`,
                    animationDelay: `${i * 0.5}s`,
                    animationDuration: `${6 + (i % 4)}s`,
                  }}
                />
              ))}

              {/* Circuit Lines */}
              <svg className="absolute inset-0 w-full h-full opacity-10" style={{ transform: 'perspective(1000px) rotateX(5deg)' }}>
                <defs>
                  <linearGradient id="circuitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgba(14, 165, 233, 0.3)" />
                    <stop offset="50%" stopColor="rgba(14, 165, 233, 0.6)" />
                    <stop offset="100%" stopColor="rgba(14, 165, 233, 0.3)" />
                  </linearGradient>
                </defs>
                <path
                  d="M 0,50 Q 100,20 200,50 T 400,50"
                  stroke="url(#circuitGradient)"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray="10,5"
                  className="animate-circuit-flow"
                />
                <path
                  d="M 0,100 Q 150,70 300,100 T 600,100"
                  stroke="url(#circuitGradient)"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray="10,5"
                  className="animate-circuit-flow"
                  style={{ animationDelay: '1s' }}
                />
                <path
                  d="M 0,150 Q 120,120 240,150 T 480,150"
                  stroke="url(#circuitGradient)"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray="10,5"
                  className="animate-circuit-flow"
                  style={{ animationDelay: '2s' }}
                />
              </svg>

              {/* Holographic Scan Lines */}
              <div className="absolute inset-0 opacity-30">
                <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent animate-hologram-scan" />
                <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent animate-hologram-scan" style={{ animationDelay: '1.5s', top: '50%' }} />
                <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent animate-hologram-scan" style={{ animationDelay: '3s', top: '100%' }} />
              </div>

              {/* Neural Network Nodes */}
              {[...Array(8)].map((_, i) => (
                <div
                  key={`node-${i}`}
                  className="absolute rounded-full border-2 border-[var(--primary)]/40 bg-[var(--primary)]/20 animate-neural-network"
                  style={{
                    left: `${20 + (i * 12) % 60}%`,
                    top: `${15 + (i * 10) % 70}%`,
                    width: `${8 + (i % 3) * 4}px`,
                    height: `${8 + (i % 3) * 4}px`,
                    animationDelay: `${i * 0.8}s`,
                    animationDuration: `${5 + (i % 3)}s`,
                    transform: 'perspective(500px) translateZ(0)',
                  }}
                />
              ))}

              {/* Data Streams */}
              {[...Array(6)].map((_, i) => (
                <div
                  key={`stream-${i}`}
                  className="absolute w-1 h-20 bg-gradient-to-b from-[var(--primary)]/60 via-[var(--primary)]/30 to-transparent animate-data-stream"
                  style={{
                    left: `${10 + i * 15}%`,
                    top: `${-20 + (i * 5)}%`,
                    animationDelay: `${i * 0.7}s`,
                    animationDuration: `${4 + (i % 2)}s`,
                    transform: `rotate(${i * 15}deg)`,
                  }}
                />
              ))}

              {/* 3D Rotating Tech Elements */}
              <div className="absolute top-10 right-10 w-20 h-20 opacity-10 animate-rotate-3d" style={{ transformStyle: 'preserve-3d' }}>
                <div className="absolute inset-0 border-2 border-[var(--primary)]/30" style={{ transform: 'rotateY(45deg) rotateX(15deg)' }} />
                <div className="absolute inset-0 border-2 border-[var(--primary)]/30" style={{ transform: 'rotateY(-45deg) rotateX(-15deg)' }} />
              </div>

              {/* Glowing Orbs */}
              <div className="absolute bottom-10 left-10 w-16 h-16 rounded-full bg-[var(--primary)]/20 blur-xl animate-float" />
              <div className="absolute top-1/3 right-5 w-12 h-12 rounded-full bg-[var(--primary)]/15 blur-lg animate-float-reverse" style={{ animationDelay: '1s' }} />
              <div className="absolute bottom-1/4 left-1/4 w-10 h-10 rounded-full bg-[var(--primary)]/25 blur-md animate-float" style={{ animationDelay: '2s' }} />
            </div>
            {/* Content Layer (above animated background) */}
            <div className="relative z-10">
              <div className="mb-4 flex items-center gap-2">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--primary)]/40 to-transparent"></div>
                <h3 className="text-sm font-bold bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] bg-clip-text text-transparent drop-shadow-sm">
                  🤖 AI Intelligence
                </h3>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--primary)]/40 to-transparent"></div>
              </div>
              <p className="mb-4 text-center text-xs text-[var(--muted)] drop-shadow-sm">
                Advanced AI analysis powered by Gemini. Results are probabilistic and for guidance only.
              </p>

              <div className="space-y-4">
              {/* AI Vision */}
              <div className="group relative overflow-hidden rounded-xl border border-[var(--primary)]/20 bg-gradient-to-br from-[var(--background)] via-[var(--card)] to-[var(--primary-light)]/10 p-4 shadow-md shadow-[var(--primary)]/5 transition-all duration-300 hover:border-[var(--primary)]/40 hover:shadow-lg hover:shadow-[var(--primary)]/10 hover:-translate-y-0.5">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] text-white shadow-md">
                      <span className="text-sm">🔍</span>
                    </div>
                    <p className="text-sm font-bold text-[var(--foreground)]">Computer Vision</p>
                  </div>
                  <p className="mb-3 text-xs text-[var(--muted)] leading-relaxed">
                    Analyze your photo to detect issues and suggest category using advanced image recognition.
                  </p>
                  <button
                    type="button"
                    onClick={runVision}
                    disabled={visionLoading || photoFiles.length === 0}
                    className="w-full rounded-lg bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] px-4 py-2 text-xs font-semibold text-white shadow-md transition-all hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {visionLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
                        Analyzing…
                      </span>
                    ) : (
                      "Analyze Photo"
                    )}
                  </button>
                  {visionError && (
                    <p className="mt-2 rounded bg-[var(--danger)]/10 px-2 py-1 text-xs text-[var(--danger)] border border-[var(--danger)]/20">
                      {visionError}
                    </p>
                  )}
                  {visionResult && (
                    <div className="mt-3 space-y-2 rounded-lg border border-[var(--primary)]/20 bg-[var(--background)]/50 p-2.5 backdrop-blur-sm">
                      {visionResult.detections.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {visionResult.detections.slice(0, 3).map((d, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 rounded-full bg-[var(--primary)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--primary)] border border-[var(--primary)]/20"
                            >
                              {d.label} {(d.score * 100).toFixed(0)}%
                            </span>
                          ))}
                        </div>
                      )}
                      {(visionResult.suggestion.category || visionResult.suggestion.department) && (
                        <div className="space-y-1.5">
                          <p className="text-xs font-medium text-[var(--foreground)]">
                            💡 Suggested: <span className="text-[var(--primary)]">{visionResult.suggestion.category?.replace(/_/g, " ") || "—"}</span>
                            {visionResult.suggestion.department && (
                              <span className="text-[var(--muted)]"> · {visionResult.suggestion.department}</span>
                            )}
                          </p>
                          {visionResult.suggestion.category && CATEGORIES.some((c) => c.id === visionResult.suggestion!.category) && (
                            <button
                              type="button"
                              onClick={applyVisionCategory}
                              className="w-full rounded-md border border-[var(--primary)] bg-[var(--primary-light)]/30 px-2 py-1 text-[11px] font-medium text-[var(--primary)] transition-colors hover:bg-[var(--primary-light)]/50"
                            >
                              ✓ Apply to Category
                            </button>
                          )}
                        </div>
                      )}
                      {visionResult.note && (
                        <p className="text-[10px] text-[var(--muted)] italic">{visionResult.note}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* AI NLP */}
              <div className="group relative overflow-hidden rounded-xl border border-[var(--primary)]/20 bg-gradient-to-br from-[var(--background)] via-[var(--card)] to-[var(--primary-light)]/10 p-4 shadow-md shadow-[var(--primary)]/5 transition-all duration-300 hover:border-[var(--primary)]/40 hover:shadow-lg hover:shadow-[var(--primary)]/10 hover:-translate-y-0.5">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] text-white shadow-md">
                      <span className="text-sm">📝</span>
                    </div>
                    <p className="text-sm font-bold text-[var(--foreground)]">NLP Understanding</p>
                  </div>
                  <p className="mb-3 text-xs text-[var(--muted)] leading-relaxed">
                    Extract summary, sentiment, urgency and entities from your title & description using natural language processing.
                  </p>
                  <button
                    type="button"
                    onClick={runNlp}
                    disabled={nlpLoading || !title.trim()}
                    className="w-full rounded-lg bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] px-4 py-2 text-xs font-semibold text-white shadow-md transition-all hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {nlpLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
                        Analyzing…
                      </span>
                    ) : (
                      "Analyze Text"
                    )}
                  </button>
                  {nlpError && (
                    <p className="mt-2 rounded bg-[var(--danger)]/10 px-2 py-1 text-xs text-[var(--danger)] border border-[var(--danger)]/20">
                      {nlpError}
                    </p>
                  )}
                  {nlpResult && (
                    <div className="mt-3 space-y-2 rounded-lg border border-[var(--primary)]/20 bg-[var(--background)]/50 p-2.5 backdrop-blur-sm">
                      <p className="text-xs font-medium text-[var(--foreground)] leading-relaxed">{nlpResult.summary}</p>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--primary)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--primary)] border border-[var(--primary)]/20">
                          {nlpResult.sentiment}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--primary)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--primary)] border border-[var(--primary)]/20">
                          {nlpResult.urgency} urgency
                        </span>
                        {nlpResult.suggestedDepartment && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--primary)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--primary)] border border-[var(--primary)]/20">
                            {nlpResult.suggestedDepartment}
                          </span>
                        )}
                      </div>
                      {nlpResult.entities?.length > 0 && (
                        <p className="text-[10px] text-[var(--muted)]">
                          Entities: {nlpResult.entities.slice(0, 3).map((e) => `${e.type}=${e.value}`).join(", ")}
                        </p>
                      )}
                      {nlpResult.keySignals?.length > 0 && (
                        <p className="text-[10px] text-[var(--muted)] italic">
                          Signals: {nlpResult.keySignals.slice(0, 2).join("; ")}
                        </p>
                      )}
                      {nlpResult.suggestedDepartment && (
                        <button
                          type="button"
                          onClick={applyNlpCategory}
                          className="w-full rounded-md border border-[var(--primary)] bg-[var(--primary-light)]/30 px-2 py-1 text-[11px] font-medium text-[var(--primary)] transition-colors hover:bg-[var(--primary-light)]/50"
                        >
                          ✓ Apply Category
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* AI Priority prediction */}
              <div className="group relative overflow-hidden rounded-xl border border-[var(--primary)]/20 bg-gradient-to-br from-[var(--background)] via-[var(--card)] to-[var(--primary-light)]/10 p-4 shadow-md shadow-[var(--primary)]/5 transition-all duration-300 hover:border-[var(--primary)]/40 hover:shadow-lg hover:shadow-[var(--primary)]/10 hover:-translate-y-0.5">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] text-white shadow-md">
                      <span className="text-sm">📊</span>
                    </div>
                    <p className="text-sm font-bold text-[var(--foreground)]">Priority & SLA</p>
                  </div>
                  <p className="mb-3 text-xs text-[var(--muted)] leading-relaxed">
                    Predict urgency and SLA breach risk based on title, category, and optional vision analysis.
                  </p>
                  <button
                    type="button"
                    onClick={runPredict}
                    disabled={predictLoading || !title.trim()}
                    className="w-full rounded-lg bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] px-4 py-2 text-xs font-semibold text-white shadow-md transition-all hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {predictLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
                        Predicting…
                      </span>
                    ) : (
                      "Predict Priority"
                    )}
                  </button>
                  {predictError && (
                    <p className="mt-2 rounded bg-[var(--danger)]/10 px-2 py-1 text-xs text-[var(--danger)] border border-[var(--danger)]/20">
                      {predictError}
                    </p>
                  )}
                  {predictResult && (
                    <div className="mt-3 space-y-2 rounded-lg border border-[var(--primary)]/20 bg-[var(--background)]/50 p-2.5 backdrop-blur-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[var(--foreground)]">Priority:</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          predictResult.priorityBand === "critical" ? "bg-[var(--danger)]/20 text-[var(--danger)] border border-[var(--danger)]/30" :
                          predictResult.priorityBand === "high" ? "bg-orange-500/20 text-orange-600 border border-orange-500/30" :
                          predictResult.priorityBand === "medium" ? "bg-yellow-500/20 text-yellow-600 border border-yellow-500/30" :
                          "bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/30"
                        }`}>
                          {predictResult.priorityBand}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-[var(--muted)]">
                          Urgency: <span className="font-medium text-[var(--foreground)]">{predictResult.urgencyScore}</span> · 
                          SLA Risk: <span className="font-medium text-[var(--danger)]">{(predictResult.slaBreachProbability * 100).toFixed(0)}%</span>
                        </p>
                        <p className="text-[10px] text-[var(--muted)]">
                          Expected: ~<span className="font-medium text-[var(--foreground)]">{predictResult.expectedResolutionHours}h</span>
                        </p>
                      </div>
                      {predictResult.rationale?.length > 0 && (
                        <ul className="space-y-0.5 text-[10px] text-[var(--muted)] list-none">
                          {predictResult.rationale.slice(0, 2).map((r, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-[var(--primary)] mt-0.5">•</span>
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
