"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { KpiCard } from "@/components/data/kpi-card";
import { RevenueBarChart } from "@/components/data/stat-chart";
import { trpc } from "@/lib/trpc";
import {
  TRANSACTION_TYPES,
  TRANSACTION_STATUS_VARIANT,
  labelOf,
} from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data/data-table";

const tabs = [
  { label: "Transactions", href: "/accounting" },
  { label: "Commissions", href: "/accounting/commissions" },
  { label: "Reports", href: "/accounting/reports" },
];

interface FinancialRow {
  month: string;
  income: number;
  expense: number;
  net: number;
}

export default function AccountingReportsPage() {
  const { data: financialData, isLoading: financialLoading } =
    trpc.report.financial.useQuery();

  const financialColumns: ColumnDef<FinancialRow>[] = [
    {
      accessorKey: "month",
      header: "Month",
    },
    {
      accessorKey: "income",
      header: "Income",
      cell: ({ row }) => formatCurrency(row.original.income),
    },
    {
      accessorKey: "expense",
      header: "Expense",
      cell: ({ row }) => formatCurrency(row.original.expense),
    },
    {
      accessorKey: "net",
      header: "Net",
      cell: ({ row }) => formatCurrency(row.original.net),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Financial Reports">
        <div className="flex border border-border rounded-lg bg-muted">
          {tabs.map((tab) => (
            <Link key={tab.href} href={tab.href}>
              <Button
                variant="ghost"
                size="sm"
                className={
                  tab.href === "/accounting/reports"
                    ? "bg-primary text-primary-foreground"
                    : ""
                }
              >
                {tab.label}
              </Button>
            </Link>
          ))}
        </div>
      </PageHeader>

      {/* Income vs Expense Chart */}
      {!financialLoading && financialData && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Income vs Expense</h3>
          <RevenueBarChart
            data={financialData.map((row) => ({
              month: row.month,
              value: row.income,
            }))}
          />
        </Card>
      )}

      {/* Financial Summary Table */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Monthly Summary</h3>
        <DataTable
          columns={financialColumns}
          data={financialData || []}
          isLoading={financialLoading}
        />
      </Card>
    </div>
  );
}
