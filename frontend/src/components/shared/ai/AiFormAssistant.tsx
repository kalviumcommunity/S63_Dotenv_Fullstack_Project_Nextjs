"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { safeVariants, microTransitions } from "@/lib/animations";

interface AiSuggestion {
  type: "category" | "department" | "quality";
  value: string;
  confidence: number;
  reason?: string;
}

interface AiFormAssistantProps {
  text: string;
  locationName?: string;
  onCategorySuggest?: (category: string, confidence: number) => void;
  onDepartmentSuggest?: (department: string, confidence: number) => void;
  onQualityHint?: (hints: string[]) => void;
  debounceMs?: number;
}

export default function AiFormAssistant({
  text,
  locationName,
  onCategorySuggest,
  onDepartmentSuggest,
  onQualityHint,
  debounceMs = 500,
}: AiFormAssistantProps) {
  const [suggestions, setSuggestions] = useState<AiSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [, setError] = useState<string | null>(null);

  const analyzeText = useCallback(
    async (inputText: string) => {
      if (!inputText || inputText.length < 10) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/ai/nlp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: inputText,
            locationName,
          }),
        });

        if (!response.ok) {
          throw new Error("AI analysis failed");
        }

        const data = await response.json();
        if (!data.success || !data.data) {
          throw new Error("Invalid AI response");
        }

        const nlpData = data.data;
        const newSuggestions: AiSuggestion[] = [];

        // Category suggestion (if we can infer from text)
        if (nlpData.entities) {
          const categoryMap: Record<string, string> = {
            road: "ROAD_DAMAGE",
            pothole: "ROAD_DAMAGE",
            garbage: "GARBAGE",
            waste: "GARBAGE",
            light: "STREETLIGHT",
            streetlight: "STREETLIGHT",
            water: "WATER_SUPPLY",
            leak: "WATER_SUPPLY",
          };

          for (const entity of nlpData.entities) {
            const lowerValue = entity.value.toLowerCase();
            for (const [keyword, category] of Object.entries(categoryMap)) {
              if (lowerValue.includes(keyword)) {
                newSuggestions.push({
                  type: "category",
                  value: category,
                  confidence: 0.7,
                  reason: `Detected "${entity.value}" in your description`,
                });
                break;
              }
            }
          }
        }

        // Department suggestion
        if (nlpData.suggestedDepartment) {
          newSuggestions.push({
            type: "department",
            value: nlpData.suggestedDepartment,
            confidence: 0.75,
            reason: "AI analysis suggests this department",
          });
        }

        // Quality hints
        if (nlpData.limitations && nlpData.limitations.length > 0) {
          onQualityHint?.(nlpData.limitations);
        }

        setSuggestions(newSuggestions);

        // Call callbacks
        const categorySuggestion = newSuggestions.find((s) => s.type === "category");
        if (categorySuggestion) {
          onCategorySuggest?.(categorySuggestion.value, categorySuggestion.confidence);
        }

        const deptSuggestion = newSuggestions.find((s) => s.type === "department");
        if (deptSuggestion) {
          onDepartmentSuggest?.(deptSuggestion.value, deptSuggestion.confidence);
        }
      } catch (err) {
        // Gracefully degrade - don't show error to user, just don't show suggestions
        setError(err instanceof Error ? err.message : "Analysis failed");
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    },
    [locationName, onCategorySuggest, onDepartmentSuggest, onQualityHint]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      analyzeText(text);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [text, analyzeText, debounceMs]);

  if (isLoading || suggestions.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        variants={safeVariants.slideDown}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={microTransitions.form}
        className="mt-2 space-y-2"
        role="region"
        aria-label="AI suggestions"
      >
        {suggestions.map((suggestion, idx) => (
          <motion.div
            key={`${suggestion.type}-${idx}`}
            variants={safeVariants.fadeIn}
            initial="initial"
            animate="animate"
            className="flex items-start gap-2 rounded-lg border border-cyan-200 bg-cyan-50/50 p-3 text-sm"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-cyan-900">
                  {suggestion.type === "category" && "Suggested category:"}
                  {suggestion.type === "department" && "Suggested department:"}
                </span>
                <span className="font-semibold text-cyan-700">{suggestion.value}</span>
                <span
                  className="text-xs text-gray-500"
                  aria-label={`Confidence: ${Math.round(suggestion.confidence * 100)}%`}
                >
                  ({Math.round(suggestion.confidence * 100)}%)
                </span>
              </div>
              {suggestion.reason && (
                <p className="mt-1 text-xs text-gray-600">{suggestion.reason}</p>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
