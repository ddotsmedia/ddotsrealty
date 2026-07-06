"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Key, Plus } from "lucide-react"
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
import { labelOf } from "@/lib/constants"
import { formatDate } from "@/lib/utils"
import type { ColumnDef } from "@tanstack/react-table"

interface KeyHandoverItem {
  id: string
  propertyId: string
  propertyTitle: string | null
  type: string
  handoverDate: Date | string | null
  receivedBy: string | null
  handedBy: string | null
  receiptSigned: boolean
  createdAt: Date | string
}

const KEY_HANDOVER_TYPES = [
  { value: "handover", label: "Handover" },
  { value: "return", label: "Return" },
] as const

export default function KeyHandoversPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [type, setType] = useState<string | undefined>(undefined)

  const { data, isLoading } = trpc.keyHandover.list.useQuery(
    {
      page,
      pageSize: 20,
      type,
    },
    {
      placeholderData: (prev) => prev,
    }
  )

  const columns: ColumnDef<KeyHandoverItem>[] = [
    {
      accessorKey: "handoverDate",
      header: "Date",
      cell: ({ row }) =>
        row.original.handoverDate ? formatDate(row.original.handoverDate) : "—",
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <StatusBadge variant={row.original.type === "handover" ? "info" : "warning"}>
          {labelOf(KEY_HANDOVER_TYPES, row.original.type)}
        </StatusBadge>
      ),
    },
    {
      accessorKey: "propertyTitle",
      header: "Property",
      cell: ({ row }) => row.original.propertyTitle ?? "—",
    },
    {
      accessorKey: "receivedBy",
      header: "Received By",
      cell: ({ row }) => row.original.receivedBy ?? "—",
    },
    {
      accessorKey: "handedBy",
      header: "Handed By",
      cell: ({ row }) => row.original.handedBy ?? "—",
    },
    {
      accessorKey: "receiptSigned",
      header: "Signed",
      cell: ({ row }) => (
        <StatusBadge variant={row.original.receiptSigned ? "success" : "warning"}>
          {row.original.receiptSigned ? "Yes" : "No"}
        </StatusBadge>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Key Handovers">
        <Link href="/key-handovers/new">
          <Button className="bg-primary">
            <Plus className="h-4 w-4 mr-2" />
            New Handover
          </Button>
        </Link>
      </PageHeader>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <Select
            value={type || ""}
            onValueChange={(v) => {
              setType(v || undefined)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by type..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              {KEY_HANDOVER_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {type && (
            <Button
              variant="outline"
              onClick={() => {
                setType(undefined)
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
        data={(data?.items as KeyHandoverItem[]) ?? []}
        isLoading={isLoading}
        emptyState={
          <EmptyState
            icon={Key}
            title="No key handovers found"
            description="Create a new key handover to get started"
          />
        }
        onRowClick={(row) => router.push(`/key-handovers/${row.id}`)}
        pagination={{
          page,
          pageCount: data?.pageCount ?? 1,
          onPageChange: setPage,
        }}
      />
    </div>
  )
}
