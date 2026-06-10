"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { BarChart3 } from "lucide-react";

interface AgingBucket {
  bucket: string;
  count: number;
  amount: number;
}

interface AgingWidgetProps {
  buckets: AgingBucket[];
  loading?: boolean;
}

const bucketColors: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  current: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    label: "Current",
  },
  "0-30": {
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    label: "0-30 Days",
  },
  "31-60": {
    bg: "bg-orange-100",
    text: "text-orange-700",
    label: "31-60 Days",
  },
  "61-90": {
    bg: "bg-red-100",
    text: "text-red-700",
    label: "61-90 Days",
  },
  "90+": {
    bg: "bg-red-200",
    text: "text-red-800",
    label: "90+ Days",
  },
};

export function AgingWidget({ buckets, loading }: AgingWidgetProps) {
  if (loading) {
    return (
      <Card className="p-6">
        <h3 className="font-display font-semibold text-foreground mb-6 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Rent Receivable Aging
        </h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="font-display font-semibold text-foreground mb-6 flex items-center gap-2">
        <BarChart3 className="h-5 w-5" />
        Rent Receivable Aging
      </h3>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5 md:gap-4">
        {buckets.map((bucket) => {
          const colors = bucketColors[bucket.bucket];
          return (
            <div
              key={bucket.bucket}
              className={`${colors.bg} rounded-lg p-4 text-center`}
            >
              <p className={`text-xs font-semibold ${colors.text} mb-2`}>
                {colors.label}
              </p>
              <p className={`text-lg font-display font-semibold ${colors.text}`}>
                {formatCurrency(bucket.amount)}
              </p>
              <p className={`text-xs ${colors.text} opacity-75 mt-2`}>
                {bucket.count} {bucket.count === 1 ? "cheque" : "cheques"}
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
