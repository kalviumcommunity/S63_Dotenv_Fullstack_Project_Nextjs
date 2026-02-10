"use client";

import { useEffect } from "react";
import Link from "next/link";
import Button from "@/components/common/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/common/ui/Card";

export default function OfficerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Officer dashboard error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center p-4">
      <Card className="w-full max-w-md border-[var(--border)] bg-[var(--card)]">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--danger-bg)]">
            <svg
              className="h-8 w-8 text-[var(--danger)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <CardTitle className="text-center text-xl font-bold text-[var(--foreground)]">
            Unable to load dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            We couldn&apos;t load your assignment dashboard. Please try again.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              variant="primary"
              onClick={reset}
              className="w-full sm:w-auto"
              aria-label="Retry loading officer dashboard"
            >
              Try Again
            </Button>
            <Link href="/" className="w-full sm:w-auto">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                aria-label="Go to home page"
              >
                Go Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
