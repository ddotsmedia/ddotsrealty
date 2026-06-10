"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable } from "@/components/data/data-table";
import { KpiCard } from "@/components/data/kpi-card";
import { RevenueBarChart } from "@/components/data/stat-chart";
import { trpc } from "@/lib/trpc";
import {
  TRANSACTION_TYPES,
  TRANSACTION_STATUSES,
  TRANSACTION_STATUS_VARIANT,
  labelOf,
} from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";

interface TransactionItem {
  id: string;
  type: string;
  amount: string | number;
  fromEntity: string | null;
  toEntity: string | null;
  paymentMethod: string | null;
  status: string;
  transactionDate: Date | string;
}

const tabs = [
  { label: "Transactions", href: "/accounting" },
  { label: "Commissions", href: "/accounting/commissions" },
  { label: "Reports", href: "/accounting/reports" },
];

export default function AccountingPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [type, setType] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [dateFrom, setDateFrom] = useState<string | undefined>(undefined);
  const [dateTo, setDateTo] = useState<string | undefined>(undefined);

  // Parse dates for queries
  const from = dateFrom ? new Date(dateFrom) : undefined;
  const to = dateTo ? new Date(dateTo) : undefined;

  const { data: summaryData, isLoading: summaryLoading } =
    trpc.transaction.summary.useQuery();

  const { data: listData, isLoading: listLoading } =
    trpc.transaction.list.useQuery(
      {
        page,
        pageSize: 20,
        search: debouncedSearch || undefined,
        type,
        status,
        from,
        to,
      },
      {
        placeholderData: (prev) => prev,
      }
    );

  const tableColumns: ColumnDef<TransactionItem>[] = [
    {
      accessorKey: "transactionDate",
      header: "Date",
      cell: ({ row }) => formatDate(row.original.transactionDate),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <StatusBadge variant="info">
          {labelOf(TRANSACTION_TYPES, row.original.type)}
        </StatusBadge>
      ),
    },
    {
      accessorKey: "fromEntity",
      header: "From",
      cell: ({ row }) => row.original.fromEntity || "—",
    },
    {
      accessorKey: "toEntity",
      header: "To",
      cell: ({ row }) => row.original.toEntity || "—",
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => formatCurrency(row.original.amount),
    },
    {
      accessorKey: "paymentMethod",
      header: "Method",
      cell: ({ row }) => row.original.paymentMethod || "—",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge variant={TRANSACTION_STATUS_VARIANT[row.original.status]}>
          {labelOf(TRANSACTION_STATUSES, row.original.status)}
        </StatusBadge>
      ),
    },
  ];

  const handleReset = () => {
    setSearch("");
    setType(undefined);
    setStatus(undefined);
    setDateFrom(undefined);
    setDateTo(undefined);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Accounting">
        <div className="flex gap-2">
          <div className="flex border border-border rounded-lg bg-muted">
            {tabs.map((tab) => (
              <Link key={tab.href} href={tab.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={
                    tab.href === "/accounting"
                      ? "bg-primary text-primary-foreground"
                      : ""
                  }
                >
                  {tab.label}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Income"
          value={formatCurrency(summaryData?.totalIncome ?? 0)}
          icon={TrendingUp}
          accent="success"
          loading={summaryLoading}
        />
        <KpiCard
          label="Total Expense"
          value={formatCurrency(summaryData?.totalExpense ?? 0)}
          icon={TrendingDown}
          accent="warning"
          loading={summaryLoading}
        />
        <KpiCard
          label="Net"
          value={formatCurrency(summaryData?.net ?? 0)}
          accent="navy"
          loading={summaryLoading}
        />
        <KpiCard
          label="VAT Collected"
          value={formatCurrency(summaryData?.vatCollected ?? 0)}
          icon={DollarSign}
          accent="gold"
          loading={summaryLoading}
        />
      </div>

      {/* Revenue Chart */}
      {!summaryLoading && summaryData?.incomeSeries && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="font-semibold mb-4">Monthly Income Trend</h3>
          <RevenueBarChart data={summaryData.incomeSeries} />
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <Input
            placeholder="Search from/to entity..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full"
          />

          <Select value={type || ""} onValueChange={(v) => { setType(v || undefined); setPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              {TRANSACTION_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={status || ""} onValueChange={(v) => { setStatus(v || undefined); setPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              {TRANSACTION_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={dateFrom || ""}
            onChange={(e) => {
              setDateFrom(e.target.value || undefined);
              setPage(1);
            }}
            className="w-full"
          />

          <Input
            type="date"
            value={dateTo || ""}
            onChange={(e) => {
              setDateTo(e.target.value || undefined);
              setPage(1);
            }}
            className="w-full"
          />
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={tableColumns}
        data={listData?.items || []}
        isLoading={listLoading}
        emptyState={
          <EmptyState
            icon={DollarSign}
            title="No transactions found"
            description="Create your first transaction or adjust your filters"
          />
        }
        pagination={{
          page,
          pageCount: listData?.pageCount || 1,
          onPageChange: setPage,
        }}
      />
    </div>
  );
}
