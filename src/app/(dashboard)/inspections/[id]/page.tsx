"use client"

import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useState } from "react"
import { Edit, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { EmptyState } from "@/components/shared/empty-state"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { DataTable } from "@/components/data/data-table"
import { trpc } from "@/lib/trpc"
import {
  INSPECTION_TYPES,
  INSPECTION_CONDITIONS,
  INSPECTION_CONDITION_VARIANT,
  INSPECTION_ROOMS,
  INSPECTION_ITEM_CONDITIONS,
  INSPECTION_ITEM_CONDITION_VARIANT,
  labelOf,
} from "@/lib/constants"
import { formatDate, formatCurrency } from "@/lib/utils"
import type { ColumnDef } from "@tanstack/react-table"

interface InspectionItemRow {
  id: string
  room: string
  item: string
  condition: string
  notes: string | null
  photos: string[]
  deductionAmount: string | null
}

export default function InspectionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data: inspection, isLoading } = trpc.inspection.getById.useQuery({ id })
  const deleteMutation = trpc.inspection.delete.useMutation()

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({ id })
      toast.success("Inspection deleted")
      router.push("/inspections")
    } catch {
      toast.error("Failed to delete inspection")
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card className="p-6 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </Card>
      </div>
    )
  }

  if (!inspection) {
    return (
      <div className="space-y-6">
        <PageHeader title="Inspection Not Found" />
        <EmptyState
          title="Inspection not found"
          description="The inspection you're looking for doesn't exist"
        />
      </div>
    )
  }

  const deductionsTotal =
    inspection.items?.reduce((sum, item) => {
      const amount = item.deductionAmount ? parseFloat(item.deductionAmount) : 0
      return sum + amount
    }, 0) ?? 0

  const columns: ColumnDef<InspectionItemRow>[] = [
    {
      accessorKey: "room",
      header: "Room",
      cell: ({ row }) => labelOf(INSPECTION_ROOMS, row.original.room),
    },
    {
      accessorKey: "item",
      header: "Item",
      cell: ({ row }) => <div className="max-w-xs truncate">{row.original.item}</div>,
    },
    {
      accessorKey: "condition",
      header: "Condition",
      cell: ({ row }) => (
        <StatusBadge
          variant={
            INSPECTION_ITEM_CONDITION_VARIANT[row.original.condition] || "default"
          }
        >
          {labelOf(INSPECTION_ITEM_CONDITIONS, row.original.condition)}
        </StatusBadge>
      ),
    },
    {
      accessorKey: "notes",
      header: "Notes",
      cell: ({ row }) =>
        row.original.notes ? (
          <div className="max-w-xs truncate">{row.original.notes}</div>
        ) : (
          "—"
        ),
    },
    {
      accessorKey: "deductionAmount",
      header: "Deduction",
      cell: ({ row }) =>
        row.original.deductionAmount
          ? formatCurrency(row.original.deductionAmount)
          : "—",
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Inspection — ${inspection.property?.title ?? inspection.propertyId}`}
      >
        <div className="flex flex-wrap gap-2">
          <Link href={`/inspections/${id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <ConfirmDialog
            trigger={
              <Button
                variant="outline"
                size="sm"
                className="text-danger hover:bg-danger/10"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            }
            title="Delete Inspection"
            description="Are you sure? This cannot be undone."
            confirmText="Delete"
            onConfirm={handleDelete}
            destructive
          />
        </div>
      </PageHeader>

      {/* Type & Condition Badges */}
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge variant="info">
          {labelOf(INSPECTION_TYPES, inspection.type)}
        </StatusBadge>
        {inspection.overallCondition && (
          <StatusBadge
            variant={
              INSPECTION_CONDITION_VARIANT[inspection.overallCondition] || "default"
            }
          >
            {labelOf(INSPECTION_CONDITIONS, inspection.overallCondition)}
          </StatusBadge>
        )}
        {inspection.tenantSigned && (
          <StatusBadge variant="success">Signed by Tenant</StatusBadge>
        )}
      </div>

      {/* Key Facts */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Inspection Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Property</p>
            {inspection.property ? (
              <Link
                href={`/properties/${inspection.property.id}`}
                className="font-semibold text-primary hover:underline"
              >
                {inspection.property.title}
              </Link>
            ) : (
              <p className="font-semibold">—</p>
            )}
          </div>
          {inspection.tenant && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Tenant</p>
              <p className="font-semibold">{inspection.tenant.name}</p>
            </div>
          )}
          {inspection.inspectionDate && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">
                Inspection Date
              </p>
              <p className="font-semibold">{formatDate(inspection.inspectionDate)}</p>
            </div>
          )}
          {inspection.inspectorName && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Inspector</p>
              <p className="font-semibold">{inspection.inspectorName}</p>
            </div>
          )}
          {inspection.inspectorRole && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">
                Inspector Role
              </p>
              <p className="font-semibold">{inspection.inspectorRole}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Created</p>
            <p className="font-semibold">{formatDate(inspection.createdAt)}</p>
          </div>
        </div>
      </Card>

      {/* Notes */}
      {inspection.notes && (
        <Card className="p-6">
          <h3 className="font-semibold mb-3">Notes</h3>
          <p className="text-muted-foreground whitespace-pre-wrap">
            {inspection.notes}
          </p>
        </Card>
      )}

      {/* Items Table */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Inspection Items</h3>
        <DataTable
          columns={columns}
          data={(inspection.items as InspectionItemRow[]) ?? []}
          isLoading={false}
        />
      </Card>

      {/* Deductions Summary */}
      {deductionsTotal > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-3">Deductions Summary</h3>
          <div className="text-lg font-semibold text-danger">
            Total Deductions: {formatCurrency(deductionsTotal)}
          </div>
        </Card>
      )}

      {/* Metadata */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Metadata</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-muted-foreground">
          <div>
            <p className="font-medium mb-1">Created</p>
            <p>{formatDate(inspection.createdAt)}</p>
          </div>
          <div>
            <p className="font-medium mb-1">Last Updated</p>
            <p>{formatDate(inspection.updatedAt)}</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
