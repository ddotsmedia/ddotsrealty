"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/data/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { trpc } from "@/lib/trpc";
import { formatDate } from "@/lib/utils";
import { EmptyState } from "@/components/shared/empty-state";
import { Building2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

interface LeaseExpiryItem {
  contractId: string;
  propertyTitle: string;
  tenantName: string;
  endDate: Date;
  daysLeft: number;
  bucket: string;
}

interface BucketItem {
  bucket: string;
  count: number;
}

export default function LeaseExpiryPage() {
  const { data, isLoading } = trpc.report.leaseExpiry.useQuery();

  const getBucketVariant = (bucket: string): "success" | "warning" | "danger" | "info" | "muted" | "default" => {
    if (bucket === "0-30") return "danger";
    if (bucket === "31-60") return "warning";
    if (bucket === "61-90") return "warning";
    return "muted";
  };

  const getBucketLabel = (bucket: string): string => {
    if (bucket === "0-30") return "0-30 Days";
    if (bucket === "31-60") return "31-60 Days";
    if (bucket === "61-90") return "61-90 Days";
    return "90+ Days";
  };

  const columns: ColumnDef<LeaseExpiryItem>[] = [
    {
      accessorKey: "propertyTitle",
      header: "Property",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.propertyTitle}</span>
        </div>
      ),
    },
    {
      accessorKey: "tenantName",
      header: "Tenant",
      cell: ({ row }) => row.original.tenantName,
    },
    {
      accessorKey: "endDate",
      header: "End Date",
      cell: ({ row }) => formatDate(row.original.endDate),
    },
    {
      accessorKey: "daysLeft",
      header: "Days Left",
      cell: ({ row }) => {
        const days = row.original.daysLeft;
        const variant = getBucketVariant(row.original.bucket);
        return (
          <StatusBadge variant={variant}>
            {days} days
          </StatusBadge>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Lease Expiry">
        <Link href="/reports">
          <Button variant="outline" size="sm">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
      </PageHeader>

      {/* Bucket Stat Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {data?.buckets.map((bucket: BucketItem) => (
          <Card key={bucket.bucket} className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              {getBucketLabel(bucket.bucket)}
            </p>
            <div className="mt-3 flex items-end justify-between">
              <p className="text-3xl font-bold">{bucket.count}</p>
              <div className={`w-1 h-8 rounded-full ${
                bucket.bucket === "0-30" ? "bg-red-500" :
                bucket.bucket === "31-60" ? "bg-yellow-500" :
                bucket.bucket === "61-90" ? "bg-yellow-500" :
                "bg-gray-400"
              }`} />
            </div>
          </Card>
        ))}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        emptyState={
          <EmptyState
            icon={Building2}
            title="No expiring leases"
            description="All lease agreements are stable for the next 90 days"
          />
        }
      />
    </div>
  );
}
