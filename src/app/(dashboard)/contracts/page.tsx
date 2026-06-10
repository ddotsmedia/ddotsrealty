"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { FileText, Plus } from "lucide-react"
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
import {
  CONTRACT_STATUSES,
  CONTRACT_STATUS_VARIANT,
  labelOf,
} from "@/lib/constants"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { ColumnDef } from "@tanstack/react-table"

interface ContractItem {
  id: string
  propertyTitle: string | null
  propertyRef: string | null
  tenantName: string | null
  rentAmount: string | number
  startDate: Date | string
  endDate: Date | string
  status: string
  chequeCount: number
}

export default function ContractsPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<string | undefined>(undefined)

  const { data, isLoading } = trpc.contract.list.useQuery(
    {
      page,
      pageSize: 20,
      status,
    },
    {
      placeholderData: (prev) => prev,
    }
  )

  const columns: ColumnDef<ContractItem>[] = [
    {
      accessorKey: "propertyTitle",
      header: "Property",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.propertyTitle ?? "—"}</span>
          {row.original.propertyRef && (
            <span className="text-xs text-muted-foreground">{row.original.propertyRef}</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "tenantName",
      header: "Tenant",
      cell: ({ row }) => row.original.tenantName ?? "—",
    },
    {
      accessorKey: "rentAmount",
      header: "Rent (AED/yr)",
      cell: ({ row }) => formatCurrency(row.original.rentAmount),
    },
    {
      accessorKey: "startDate",
      header: "Period",
      cell: ({ row }) => (
        <span className="text-sm">
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
    {
      accessorKey: "chequeCount",
      header: "# Cheques",
      cell: ({ row }) => row.original.chequeCount,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Contracts">
        <Link href="/contracts/new">
          <Button className="bg-primary">
            <Plus className="h-4 w-4 mr-2" />
            Add Contract
          </Button>
        </Link>
      </PageHeader>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex flex-wrap gap-3">
          <Select
            value={status ?? ""}
            onValueChange={(v) => {
              setStatus(v || undefined)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              {CONTRACT_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(status) && (
            <Button
              variant="outline"
              onClick={() => {
                setStatus(undefined)
                setPage(1)
              }}
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={(data?.items as ContractItem[]) ?? []}
        isLoading={isLoading}
        emptyState={
          <EmptyState
            icon={FileText}
            title="No contracts found"
            description="Create a contract to get started"
          />
        }
        onRowClick={(row) => router.push(`/contracts/${row.id}`)}
        pagination={{
          page,
          pageCount: data?.pageCount ?? 1,
          onPageChange: setPage,
        }}
      />
    </div>
  )
}
