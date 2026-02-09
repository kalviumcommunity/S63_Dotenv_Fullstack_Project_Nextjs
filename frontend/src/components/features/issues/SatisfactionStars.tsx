"use client";

import { useState } from "react";

export default function SatisfactionStars({
  value = 0,
  max = 5,
  readonly = false,
  onChange,
}: {
  value?: number;
  max?: number;
  readonly?: boolean;
  onChange?: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const display = readonly ? value : hover || value;

  return (
    <div className="flex items-center gap-0.5" role={readonly ? undefined : "slider"} aria-label="Satisfaction rating">
      {Array.from({ length: max }, (_, i) => (
        <button
          key={i}
          type="button"
          disabled={readonly}
          className={`text-xl transition ${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"}`}
          onMouseEnter={() => !readonly && setHover(i + 1)}
          onMouseLeave={() => !readonly && setHover(0)}
          onClick={() => !readonly && onChange?.(i + 1)}
          aria-label={`Rate ${i + 1} out of ${max}`}
        >
          {i < display ? "★" : "☆"}
        </button>
      ))}
    </div>
  );
}
