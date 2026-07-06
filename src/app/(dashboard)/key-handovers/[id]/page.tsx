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
import { labelOf } from "@/lib/constants"
import { formatDate } from "@/lib/utils"
import type { ColumnDef } from "@tanstack/react-table"

interface KeyRow {
  type: string
  quantity: number
  condition?: string
}

const KEY_HANDOVER_TYPES = [
  { value: "handover", label: "Handover" },
  { value: "return", label: "Return" },
] as const

export default function KeyHandoverDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data: handover, isLoading } = trpc.keyHandover.getById.useQuery({ id })
  const deleteMutation = trpc.keyHandover.delete.useMutation()

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({ id })
      toast.success("Key handover deleted")
      router.push("/key-handovers")
    } catch {
      toast.error("Failed to delete key handover")
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

  if (!handover) {
    return (
      <div className="space-y-6">
        <PageHeader title="Key Handover Not Found" />
        <EmptyState
          title="Key handover not found"
          description="The key handover you're looking for doesn't exist"
        />
      </div>
    )
  }

  const columns: ColumnDef<KeyRow>[] = [
    {
      accessorKey: "type",
      header: "Key Type",
      cell: ({ row }) => <div className="font-medium">{row.original.type}</div>,
    },
    {
      accessorKey: "quantity",
      header: "Quantity",
      cell: ({ row }) => row.original.quantity,
    },
    {
      accessorKey: "condition",
      header: "Condition",
      cell: ({ row }) =>
        row.original.condition ? (
          <StatusBadge variant="info">{row.original.condition}</StatusBadge>
        ) : (
          "—"
        ),
    },
  ]

  const keys = (handover.keys as KeyRow[]) || []

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Key ${
          handover.type === "handover" ? "Handover" : "Return"
        } — ${handover.property?.title ?? handover.propertyId}`}
      >
        <div className="flex flex-wrap gap-2">
          <Link href={`/key-handovers/${id}/edit`}>
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
            title="Delete Key Handover"
            description="Are you sure? This cannot be undone."
            confirmText="Delete"
            onConfirm={handleDelete}
            destructive
          />
        </div>
      </PageHeader>

      {/* Type & Status Badges */}
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge variant={handover.type === "handover" ? "info" : "warning"}>
          {labelOf(KEY_HANDOVER_TYPES, handover.type)}
        </StatusBadge>
        {handover.receiptSigned && (
          <StatusBadge variant="success">Receipt Signed</StatusBadge>
        )}
      </div>

      {/* Key Facts */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Handover Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Property</p>
            {handover.property ? (
              <Link
                href={`/properties/${handover.property.id}`}
                className="font-semibold text-primary hover:underline"
              >
                {handover.property.title}
              </Link>
            ) : (
              <p className="font-semibold">—</p>
            )}
          </div>
          {handover.tenant && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Tenant</p>
              <p className="font-semibold">{handover.tenant.name}</p>
            </div>
          )}
          {handover.handoverDate && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">
                Handover Date
              </p>
              <p className="font-semibold">{formatDate(handover.handoverDate)}</p>
            </div>
          )}
          {handover.handedBy && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Handed By</p>
              <p className="font-semibold">{handover.handedBy}</p>
            </div>
          )}
          {handover.receivedBy && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">
                Received By
              </p>
              <p className="font-semibold">{handover.receivedBy}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Created</p>
            <p className="font-semibold">{formatDate(handover.createdAt)}</p>
          </div>
        </div>
      </Card>

      {/* Keys Table */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Keys</h3>
        {keys.length > 0 ? (
          <DataTable columns={columns} data={keys} isLoading={false} />
        ) : (
          <p className="text-muted-foreground text-sm">No keys recorded.</p>
        )}
      </Card>

      {/* Notes */}
      {handover.notes && (
        <Card className="p-6">
          <h3 className="font-semibold mb-3">Notes</h3>
          <p className="text-muted-foreground whitespace-pre-wrap">
            {handover.notes}
          </p>
        </Card>
      )}

      {/* Metadata */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Metadata</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-muted-foreground">
          <div>
            <p className="font-medium mb-1">Created</p>
            <p>{formatDate(handover.createdAt)}</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
