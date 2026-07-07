"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, Home, TrendingUp, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { KpiCard } from "@/components/data/kpi-card";
import { DataTable } from "@/components/data/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { trpc } from "@/lib/trpc";
import {
  PROPERTY_STATUSES,
  PROPERTY_STATUS_VARIANT,
  CHEQUE_STATUSES,
  CHEQUE_STATUS_VARIANT,
  LEAD_STATUSES,
  LEAD_STATUS_VARIANT,
  labelOf,
} from "@/lib/constants";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";

interface ChequeBreakdownRow {
  status: string;
  count: number;
  amount: number;
}

interface PropertyStatusRow {
  status: string;
  count: number;
}

interface LeadStatusRow {
  status: string;
  count: number;
}

export default function ReportsPage() {
  const { data: portfolioData, isLoading: portfolioLoading } =
    trpc.report.portfolio.useQuery();

  const { data: chequeData, isLoading: chequeLoading } =
    trpc.report.chequeBreakdown.useQuery();

  const { data: leadData, isLoading: leadLoading } =
    trpc.report.leadConversion.useQuery();

  const chequeColumns: ColumnDef<ChequeBreakdownRow>[] = [
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge variant={CHEQUE_STATUS_VARIANT[row.original.status]}>
          {labelOf(CHEQUE_STATUSES, row.original.status)}
        </StatusBadge>
      ),
    },
    {
      accessorKey: "count",
      header: "Count",
      cell: ({ row }) => formatNumber(row.original.count),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => formatCurrency(row.original.amount),
    },
  ];

  const propertyColumns: ColumnDef<PropertyStatusRow>[] = [
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge variant={PROPERTY_STATUS_VARIANT[row.original.status]}>
          {labelOf(PROPERTY_STATUSES, row.original.status)}
        </StatusBadge>
      ),
    },
    {
      accessorKey: "count",
      header: "Count",
      cell: ({ row }) => formatNumber(row.original.count),
    },
  ];

  const leadColumns: ColumnDef<LeadStatusRow>[] = [
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge variant={LEAD_STATUS_VARIANT[row.original.status]}>
          {labelOf(LEAD_STATUSES, row.original.status)}
        </StatusBadge>
      ),
    },
    {
      accessorKey: "count",
      header: "Count",
      cell: ({ row }) => formatNumber(row.original.count),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" />

      {/* Detailed Reports Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Detailed Reports</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/reports/rent-roll">
            <Card className="p-6 cursor-pointer hover:ring-2 hover:ring-primary transition-all h-full">
              <h3 className="font-semibold text-lg">Rent Roll</h3>
              <p className="text-sm text-muted-foreground mt-2">
                View all active rental contracts with tenant details and annual rent projection
              </p>
            </Card>
          </Link>
          <Link href="/reports/vacancy">
            <Card className="p-6 cursor-pointer hover:ring-2 hover:ring-primary transition-all h-full">
              <h3 className="font-semibold text-lg">Vacancy Report</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Monitor vacant properties and estimated monthly revenue loss
              </p>
            </Card>
          </Link>
          <Link href="/reports/lease-expiry">
            <Card className="p-6 cursor-pointer hover:ring-2 hover:ring-primary transition-all h-full">
              <h3 className="font-semibold text-lg">Lease Expiry</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Track upcoming lease expirations within the next 90 days
              </p>
            </Card>
          </Link>
        </div>
      </div>

      {/* Portfolio Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Portfolio Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard
            label="Total Portfolio Value"
            value={formatCurrency(portfolioData?.totalPortfolioValue ?? 0)}
            icon={Home}
            accent="navy"
            loading={portfolioLoading}
          />
          <KpiCard
            label="Occupancy Rate"
            value={`${(portfolioData?.occupancyRate ?? 0).toFixed(1)}%`}
            icon={TrendingUp}
            accent="success"
            loading={portfolioLoading}
          />
          <div className="grid grid-cols-1 gap-2">
            {portfolioData?.statusBreakdown && (
              <DataTable
                columns={propertyColumns}
                data={portfolioData.statusBreakdown}
                isLoading={portfolioLoading}
              />
            )}
          </div>
        </div>
      </div>

      {/* Cheque Breakdown Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Cheque Status</h2>
        {(chequeData?.overdueCount ?? 0) > 0 && chequeData && (
          <Card className="p-4 border-l-4 border-l-orange-500 bg-orange-50">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-sm">Overdue Cheques</h3>
                <p className="text-sm text-muted-foreground">
                  {chequeData.overdueCount} cheques overdue for{" "}
                  {formatCurrency(chequeData.overdueAmount)}
                </p>
              </div>
            </div>
          </Card>
        )}
        <DataTable
          columns={chequeColumns}
          data={chequeData?.breakdown || []}
          isLoading={chequeLoading}
        />
      </div>

      {/* Lead Conversion Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Lead Pipeline</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <KpiCard
            label="Total Leads"
            value={formatNumber(leadData?.totalLeads ?? 0)}
            icon={Users}
            accent="navy"
            loading={leadLoading}
          />
          <KpiCard
            label="Conversion Rate"
            value={`${(leadData?.conversionRate ?? 0).toFixed(1)}%`}
            sublabel={`${formatNumber(leadData?.wonCount ?? 0)} won`}
            accent="gold"
            loading={leadLoading}
          />
        </div>
        <DataTable
          columns={leadColumns}
          data={leadData?.breakdown || []}
          isLoading={leadLoading}
        />
      </div>
    </div>
  );
}
