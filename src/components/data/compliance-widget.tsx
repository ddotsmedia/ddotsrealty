"use client";

import { AlertCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { trpc } from "@/lib/trpc";
import { formatDate } from "@/lib/utils";

export function ComplianceWidget() {
  const { data: expiring, isLoading } = trpc.document.expiringSoon.useQuery();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Compliance Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-8 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const items = expiring || [];

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Compliance Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={CheckCircle}
            title="All documents current"
            description="No documents or permits expiring within the next 30 days"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-warning" />
          Compliance Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item, idx) => {
            const isExpired = item.daysLeft < 0;
            const variant = isExpired ? "danger" : "warning";
            const statusText = isExpired
              ? "Expired"
              : `Expires in ${item.daysLeft} day${item.daysLeft !== 1 ? "s" : ""}`;

            return (
              <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {item.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.kind === "document" && item.docType
                      ? `Document • ${item.docType}`
                      : item.kind === "permit"
                        ? "Trakheesi Permit"
                        : "Item"}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(item.expiryDate)}
                  </span>
                  <StatusBadge variant={variant}>{statusText}</StatusBadge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
