"use client";

import { formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityItem {
  type: string;
  title: string;
  subtitle?: string;
  date: string | Date;
}

interface ActivityFeedProps {
  items: ActivityItem[];
  loading?: boolean;
}

const typeColors: Record<string, string> = {
  lead: "bg-blue-100 text-blue-700",
  contract: "bg-purple-100 text-purple-700",
  cheque: "bg-amber-100 text-amber-700",
  transaction: "bg-green-100 text-green-700",
};

export function ActivityFeed({ items, loading = false }: ActivityFeedProps) {
  if (loading) {
    return (
      <Card className="p-6">
        <h3 className="font-display font-semibold text-foreground mb-4">
          Recent Activity
        </h3>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-2 w-2 rounded-full mt-2 flex-shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-4 w-40 mb-1" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="font-display font-semibold text-foreground mb-4">
          Recent Activity
        </h3>
        <EmptyState
          icon={Activity}
          title="No activity yet"
          description="Your recent activities will appear here"
        />
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="font-display font-semibold text-foreground mb-4">
        Recent Activity
      </h3>
      <div className="space-y-4">
        {items.map((item, idx) => {
          const colorClass = typeColors[item.type] || typeColors.lead;
          return (
            <div key={idx} className="flex gap-3">
              <div
                className={cn(
                  "h-2 w-2 rounded-full mt-2 flex-shrink-0",
                  colorClass
                )}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {item.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.subtitle} • {formatDate(item.date)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
