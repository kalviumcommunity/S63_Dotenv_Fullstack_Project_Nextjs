"use client";

import { useEffect, useRef, useState } from "react";

interface CountUpProps {
  end: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  decimals?: number;
  className?: string;
}

export default function CountUp({ end, suffix = "", prefix = "", duration = 1500, decimals = 0, className = "" }: CountUpProps) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        done.current = true;
        const start = 0;
        const startTime = performance.now();

        function tick(now: number) {
          const elapsed = now - startTime;
          const t = Math.min(elapsed / duration, 1);
          const easeOut = 1 - Math.pow(1 - t, 2);
          const current = start + (end - start) * easeOut;
          setValue(current);
          if (t < 1) requestAnimationFrame(tick);
        }

        requestAnimationFrame(tick);
      },
      { threshold: 0.2, rootMargin: "0px 0px -50px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration]);

  const display = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();

  return (
    <span ref={ref} className={className}>
      {prefix}{display}{suffix}
    </span>
  );
}
