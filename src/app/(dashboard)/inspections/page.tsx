"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ClipboardList, Plus } from "lucide-react"
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
  INSPECTION_TYPES,
  INSPECTION_CONDITIONS,
  INSPECTION_CONDITION_VARIANT,
  labelOf,
} from "@/lib/constants"
import { formatDate } from "@/lib/utils"
import type { ColumnDef } from "@tanstack/react-table"

interface InspectionItem {
  id: string
  propertyId: string
  propertyTitle: string | null
  type: string
  inspectionDate: Date | string | null
  overallCondition: string | null
  inspectorName: string | null
  tenantSigned: boolean
  createdAt: Date | string
  itemCount: number
}

export default function InspectionsPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [type, setType] = useState<string | undefined>(undefined)

  const { data, isLoading } = trpc.inspection.list.useQuery(
    {
      page,
      pageSize: 20,
      type,
    },
    {
      placeholderData: (prev) => prev,
    }
  )

  const columns: ColumnDef<InspectionItem>[] = [
    {
      accessorKey: "inspectionDate",
      header: "Date",
      cell: ({ row }) =>
        row.original.inspectionDate ? formatDate(row.original.inspectionDate) : "—",
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <StatusBadge variant="info">
          {labelOf(INSPECTION_TYPES, row.original.type)}
        </StatusBadge>
      ),
    },
    {
      accessorKey: "propertyTitle",
      header: "Property",
      cell: ({ row }) => row.original.propertyTitle ?? "—",
    },
    {
      accessorKey: "overallCondition",
      header: "Condition",
      cell: ({ row }) =>
        row.original.overallCondition ? (
          <StatusBadge
            variant={
              INSPECTION_CONDITION_VARIANT[row.original.overallCondition] || "default"
            }
          >
            {labelOf(INSPECTION_CONDITIONS, row.original.overallCondition)}
          </StatusBadge>
        ) : (
          "—"
        ),
    },
    {
      accessorKey: "inspectorName",
      header: "Inspector",
      cell: ({ row }) => row.original.inspectorName ?? "—",
    },
    {
      accessorKey: "tenantSigned",
      header: "Signed",
      cell: ({ row }) => (
        <StatusBadge variant={row.original.tenantSigned ? "success" : "warning"}>
          {row.original.tenantSigned ? "Yes" : "No"}
        </StatusBadge>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Inspections">
        <Link href="/inspections/new">
          <Button className="bg-primary">
            <Plus className="h-4 w-4 mr-2" />
            New Inspection
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
              {INSPECTION_TYPES.map((t) => (
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
        data={(data?.items as InspectionItem[]) ?? []}
        isLoading={isLoading}
        emptyState={
          <EmptyState
            icon={ClipboardList}
            title="No inspections found"
            description="Create a new inspection to get started"
          />
        }
        onRowClick={(row) => router.push(`/inspections/${row.id}`)}
        pagination={{
          page,
          pageCount: data?.pageCount ?? 1,
          onPageChange: setPage,
        }}
      />
    </div>
  )
}
