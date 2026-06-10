"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string;
  sublabel?: string;
  icon?: LucideIcon;
  accent?: "navy" | "gold" | "success" | "warning" | "danger";
  loading?: boolean;
}

const accentStyles: Record<string, { bg: string; text: string }> = {
  navy: { bg: "bg-[#1e3a5f]/10", text: "text-[#1e3a5f]" },
  gold: { bg: "bg-[#c8a45c]/10", text: "text-[#c8a45c]" },
  success: { bg: "bg-[#2d8b4e]/10", text: "text-[#2d8b4e]" },
  warning: { bg: "bg-[#e8922a]/10", text: "text-[#e8922a]" },
  danger: { bg: "bg-[#dc2626]/10", text: "text-[#dc2626]" },
};

export function KpiCard({
  label,
  value,
  sublabel,
  icon: Icon,
  accent = "navy",
  loading = false,
}: KpiCardProps) {
  const styles = accentStyles[accent];

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-32" />
            {sublabel && <Skeleton className="h-3 w-20 mt-4" />}
          </div>
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-3xl font-display font-semibold mt-2 text-foreground">
            {value}
          </p>
          {sublabel && (
            <p className="text-xs text-muted-foreground mt-4">{sublabel}</p>
          )}
        </div>
        {Icon && (
          <div className={cn("p-2 rounded-lg", styles.bg)}>
            <Icon className={cn("h-5 w-5", styles.text)} />
          </div>
        )}
      </div>
    </Card>
  );
}
