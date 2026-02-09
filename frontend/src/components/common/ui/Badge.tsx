import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "success" | "warning" | "danger" | "outline";
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variants = {
      default: "bg-[var(--primary)] text-white",
      secondary: "bg-[var(--secondary)] text-[var(--secondary-foreground)] border border-[var(--border)]",
      success: "bg-[var(--success-bg)] text-[var(--success)]",
      warning: "bg-[var(--warning-bg)] text-[var(--warning)]",
      danger: "bg-[var(--danger-bg)] text-[var(--danger)]",
      outline: "border border-[var(--border)] bg-transparent text-[var(--foreground)]",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";

export default Badge;
