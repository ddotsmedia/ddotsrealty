import type { ReactNode } from "react";
import type { BadgeVariant } from "@/types";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
  info: "bg-primary/10 text-primary",
  muted: "bg-muted text-muted-foreground",
  default: "bg-secondary text-secondary-foreground",
};

export function StatusBadge({
  variant = "default",
  children,
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-xs font-medium inline-flex items-center gap-1",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
