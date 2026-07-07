"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/data/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/utils";
import { EmptyState } from "@/components/shared/empty-state";
import { Building2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

interface VacancyItem {
  id: string;
  title: string;
  community: string | null;
  emirate: string | null;
  since: Date;
  daysVacant: number;
}

export default function VacancyPage() {
  const { data, isLoading } = trpc.report.vacancy.useQuery();

  const columns: ColumnDef<VacancyItem>[] = [
    {
      accessorKey: "title",
      header: "Property",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.title}</span>
        </div>
      ),
    },
    {
      accessorKey: "community",
      header: "Community",
      cell: ({ row }) => row.original.community || "—",
    },
    {
      accessorKey: "emirate",
      header: "Emirate",
      cell: ({ row }) => row.original.emirate || "—",
    },
    {
      accessorKey: "since",
      header: "Vacant Since",
      cell: ({ row }) => formatDate(row.original.since),
    },
    {
      accessorKey: "daysVacant",
      header: "Days Vacant",
      cell: ({ row }) => {
        const days = row.original.daysVacant;
        let variant: "success" | "warning" | "danger" | "info" | "muted" | "default" = "info";
        if (days > 90) variant = "danger";
        else if (days > 30) variant = "warning";
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
      <PageHeader title="Vacancy Report">
        <Link href="/reports">
          <Button variant="outline" size="sm">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Vacant Units</p>
          <p className="text-3xl font-semibold mt-2">{data?.count ?? 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Est. Monthly Loss</p>
          <p className="text-3xl font-semibold mt-2">
            {formatCurrency(data?.estimatedMonthlyLoss ?? 0)}
          </p>
        </Card>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        emptyState={
          <EmptyState
            icon={Building2}
            title="No vacant properties"
            description="All properties are occupied"
          />
        }
      />
    </div>
  );
}
