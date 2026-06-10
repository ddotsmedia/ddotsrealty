"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import {
  COMMISSION_STATUSES,
  COMMISSION_STATUS_VARIANT,
  COMMISSION_DEAL_TYPES,
  labelOf,
} from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";

interface CommissionItem {
  id: string;
  brokerName: string | null;
  dealType: string;
  dealValue: string | number | null;
  commissionAmount: string | number | null;
  status: string;
  createdAt: Date | string;
}

const tabs = [
  { label: "Transactions", href: "/accounting" },
  { label: "Commissions", href: "/accounting/commissions" },
  { label: "Reports", href: "/accounting/reports" },
];

export default function CommissionsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<"pending" | "approved" | "paid">("pending");
  const [showDialog, setShowDialog] = useState(false);

  const { data: summaryData, isLoading: summaryLoading } =
    trpc.commission.summary.useQuery();

  const { data: listData, isLoading: listLoading } =
    trpc.commission.list.useQuery(
      {
        page,
        pageSize: 20,
        status,
      },
      {
        placeholderData: (prev) => prev,
      }
    );

  const utils = trpc.useUtils();
  const updateStatusMutation = trpc.commission.updateStatus.useMutation({
    onSuccess: () => {
      // Invalidate both queries
      void utils.commission.list.invalidate();
      void utils.commission.summary.invalidate();
      setShowDialog(false);
    },
  });

  const handleStatusChange = (id: string) => {
    setSelectedId(id);
    setNewStatus("pending");
    setShowDialog(true);
  };

  const handleConfirm = () => {
    if (selectedId) {
      updateStatusMutation.mutate({
        id: selectedId,
        status: newStatus,
      });
    }
  };

  const tableColumns: ColumnDef<CommissionItem>[] = [
    {
      accessorKey: "brokerName",
      header: "Broker",
      cell: ({ row }) => row.original.brokerName || "—",
    },
    {
      accessorKey: "dealType",
      header: "Deal Type",
      cell: ({ row }) =>
        labelOf(COMMISSION_DEAL_TYPES, row.original.dealType),
    },
    {
      accessorKey: "dealValue",
      header: "Deal Value",
      cell: ({ row }) => formatCurrency(row.original.dealValue),
    },
    {
      accessorKey: "commissionAmount",
      header: "Commission",
      cell: ({ row }) => formatCurrency(row.original.commissionAmount),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge variant={COMMISSION_STATUS_VARIANT[row.original.status]}>
          {labelOf(COMMISSION_STATUSES, row.original.status)}
        </StatusBadge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleStatusChange(row.original.id)}
        >
          Update
        </Button>
      ),
    },
  ];

  const handleReset = () => {
    setStatus(undefined);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Commissions">
        <div className="flex border border-border rounded-lg bg-muted">
          {tabs.map((tab) => (
            <Link key={tab.href} href={tab.href}>
              <Button
                variant="ghost"
                size="sm"
                className={
                  tab.href === "/accounting/commissions"
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KpiCard
          label="Pending Commissions"
          value={String(summaryData?.pendingCount ?? 0)}
          sublabel={formatCurrency(summaryData?.pendingAmount ?? 0)}
          icon={AlertCircle}
          accent="warning"
          loading={summaryLoading}
        />
        <KpiCard
          label="Paid Commissions"
          value={String(summaryData?.paidCount ?? 0)}
          sublabel={formatCurrency(summaryData?.paidAmount ?? 0)}
          icon={CheckCircle}
          accent="success"
          loading={summaryLoading}
        />
      </div>

      {/* Filter Bar */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-4">
        <div className="flex gap-3 items-end">
          <div className="flex-1 max-w-xs">
            <label className="text-sm text-muted-foreground mb-2 block">
              Status
            </label>
            <Select
              value={status || ""}
              onValueChange={(v) => {
                setStatus(v || undefined);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                {COMMISSION_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
            title="No commissions found"
            description="Commissions will appear here once deals are created"
          />
        }
        pagination={{
          page,
          pageCount: listData?.pageCount || 1,
          onPageChange: setPage,
        }}
      />

      {/* Status Update Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Commission Status</DialogTitle>
            <DialogDescription>
              Change the status of this commission
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                New Status
              </label>
              <Select
                value={newStatus}
                onValueChange={(v) =>
                  setNewStatus(v as "pending" | "approved" | "paid")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMMISSION_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={updateStatusMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? "Updating..." : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
