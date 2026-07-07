"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/data/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { trpc } from "@/lib/trpc";
import {
  CONTRACT_STATUSES,
  CONTRACT_STATUS_VARIANT,
  labelOf,
} from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import { EmptyState } from "@/components/shared/empty-state";
import { Building2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

interface RentRollItem {
  contractId: string;
  propertyTitle: string;
  community: string | null;
  tenantName: string;
  rentAmount: number;
  startDate: Date;
  endDate: Date;
  status: string;
}

export default function RentRollPage() {
  const { data, isLoading } = trpc.report.rentRoll.useQuery();

  const columns: ColumnDef<RentRollItem>[] = [
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
      accessorKey: "community",
      header: "Community",
      cell: ({ row }) => row.original.community || "—",
    },
    {
      accessorKey: "tenantName",
      header: "Tenant",
      cell: ({ row }) => row.original.tenantName,
    },
    {
      accessorKey: "rentAmount",
      header: "Rent",
      cell: ({ row }) => formatCurrency(row.original.rentAmount),
    },
    {
      accessorKey: "period",
      header: "Period",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.startDate)} – {formatDate(row.original.endDate)}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge variant={CONTRACT_STATUS_VARIANT[row.original.status]}>
          {labelOf(CONTRACT_STATUSES, row.original.status)}
        </StatusBadge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Rent Roll">
        <Link href="/reports">
          <Button variant="outline" size="sm">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
      </PageHeader>

      {/* Summary Chip */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Annual Rent</p>
            <p className="text-2xl font-semibold mt-1">
              {formatCurrency(data?.totalAnnualRent ?? 0)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Active Contracts</p>
            <p className="text-2xl font-semibold mt-1">{data?.items.length ?? 0}</p>
          </div>
        </div>
      </Card>

      {/* Table */}
      <DataTable
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        emptyState={
          <EmptyState
            icon={Building2}
            title="No active contracts"
            description="Create a new contract to get started"
          />
        }
      />
    </div>
  );
}
