"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ClipboardCheck, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { StatusBadge } from "@/components/shared/status-badge"
import { DataTable } from "@/components/data/data-table"
import { trpc } from "@/lib/trpc"
import { CLEARANCE_STATUSES, CLEARANCE_STATUS_VARIANT, labelOf } from "@/lib/constants"
import { formatDate, formatCurrency } from "@/lib/utils"
import type { ColumnDef } from "@tanstack/react-table"

interface ClearanceItem {
  id: string
  tenantName: string | null
  propertyTitle: string | null
  plannedMoveOut: Date | string | null
  clearanceStatus: string
  totalOutstanding: string | number
}

export default function ClearancesPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [clearanceStatus, setClearanceStatus] = useState<string | undefined>(undefined)

  const { data, isLoading } = trpc.clearance.list.useQuery(
    { page, pageSize: 20, clearanceStatus },
    { placeholderData: (prev) => prev }
  )

  const columns: ColumnDef<ClearanceItem>[] = [
    {
      accessorKey: "tenantName",
      header: "Tenant",
      cell: ({ row }) => row.original.tenantName ?? "—",
    },
    {
      accessorKey: "propertyTitle",
      header: "Property",
      cell: ({ row }) => row.original.propertyTitle ?? "—",
    },
    {
      accessorKey: "plannedMoveOut",
      header: "Planned Move-Out",
      cell: ({ row }) =>
        row.original.plannedMoveOut ? formatDate(row.original.plannedMoveOut) : "—",
    },
    {
      accessorKey: "clearanceStatus",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge
          variant={CLEARANCE_STATUS_VARIANT[row.original.clearanceStatus] ?? "default"}
        >
          {labelOf(CLEARANCE_STATUSES, row.original.clearanceStatus)}
        </StatusBadge>
      ),
    },
    {
      accessorKey: "totalOutstanding",
      header: "Total Outstanding",
      cell: ({ row }) => formatCurrency(row.original.totalOutstanding),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Tenant Clearances">
        <Link href="/clearances/new">
          <Button className="bg-primary">
            <Plus className="h-4 w-4 mr-2" />
            New Clearance
          </Button>
        </Link>
      </PageHeader>

      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <Select
            value={clearanceStatus ?? ""}
            onValueChange={(v) => {
              setClearanceStatus(v || undefined)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-full sm:w-52">
              <SelectValue placeholder="Filter by status..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              {CLEARANCE_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {clearanceStatus && (
            <Button
              variant="outline"
              onClick={() => {
                setClearanceStatus(undefined)
                setPage(1)
              }}
              className="w-full sm:w-auto"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={(data?.items as ClearanceItem[]) ?? []}
        isLoading={isLoading}
        emptyState={
          <EmptyState
            icon={ClipboardCheck}
            title="No clearances found"
            description="Create a new tenant clearance to get started"
          />
        }
        onRowClick={(row) => router.push(`/clearances/${row.id}`)}
        pagination={{
          page,
          pageCount: data?.pageCount ?? 1,
          onPageChange: setPage,
        }}
      />
    </div>
  )
}
