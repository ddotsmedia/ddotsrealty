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
import { NOC_TYPES, NOC_STATUSES, NOC_STATUS_VARIANT, labelOf } from "@/lib/constants"
import { formatDate } from "@/lib/utils"
import type { ColumnDef } from "@tanstack/react-table"

interface NocItem {
  id: string
  nocType: string
  status: string
  tenantName: string | null
  createdAt: Date | string
}

export default function NocRequestsPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<string | undefined>(undefined)
  const [nocType, setNocType] = useState<string | undefined>(undefined)

  const { data, isLoading } = trpc.noc.list.useQuery(
    { page, pageSize: 20, status, nocType },
    { placeholderData: (prev) => prev }
  )

  const columns: ColumnDef<NocItem>[] = [
    {
      accessorKey: "nocType",
      header: "Type",
      cell: ({ row }) => labelOf(NOC_TYPES, row.original.nocType),
    },
    {
      accessorKey: "tenantName",
      header: "Tenant",
      cell: ({ row }) => row.original.tenantName ?? "—",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge variant={NOC_STATUS_VARIANT[row.original.status] ?? "default"}>
          {labelOf(NOC_STATUSES, row.original.status)}
        </StatusBadge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="NOC Requests">
        <Link href="/noc-requests/new">
          <Button className="bg-primary">
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        </Link>
      </PageHeader>

      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <Select
            value={status ?? ""}
            onValueChange={(v) => {
              setStatus(v || undefined)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              {NOC_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={nocType ?? ""}
            onValueChange={(v) => {
              setNocType(v || undefined)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by type..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              {NOC_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(status || nocType) && (
            <Button
              variant="outline"
              onClick={() => {
                setStatus(undefined)
                setNocType(undefined)
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
        data={(data?.items as NocItem[]) ?? []}
        isLoading={isLoading}
        emptyState={
          <EmptyState
            icon={FileText}
            title="No NOC requests found"
            description="Create a new NOC request to get started"
          />
        }
        onRowClick={(row) => router.push(`/noc-requests/${row.id}`)}
        pagination={{
          page,
          pageCount: data?.pageCount ?? 1,
          onPageChange: setPage,
        }}
      />
    </div>
  )
}
