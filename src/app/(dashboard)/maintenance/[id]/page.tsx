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
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { FileUpload } from "@/components/shared/file-upload"
import { trpc } from "@/lib/trpc"
import {
  MAINTENANCE_CATEGORIES,
  MAINTENANCE_PRIORITIES,
  MAINTENANCE_STATUSES,
  MAINTENANCE_PRIORITY_VARIANT,
  MAINTENANCE_STATUS_VARIANT,
  labelOf,
} from "@/lib/constants"
import { formatCurrency, formatDate } from "@/lib/utils"

export default function MaintenanceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [newStatus, setNewStatus] = useState<string>("")
  const [costActual, setCostActual] = useState<string>("")
  const [afterPhotos, setAfterPhotos] = useState<string[]>([])
  const [invoiceUrl, setInvoiceUrl] = useState<string>("")
  const [costApprovedState, setCostApprovedState] = useState<boolean | null>(null)

  const { data: request, isLoading } = trpc.maintenance.getById.useQuery({ id })
  const deleteMutation = trpc.maintenance.delete.useMutation()
  const updateStatusMutation = trpc.maintenance.updateStatus.useMutation()
  const approveCostMutation = trpc.maintenance.approveCost.useMutation()

  // Initialize states from request data
  if (request && newStatus === "") {
    setNewStatus(request.status)
    if (request.costActual) setCostActual(String(request.costActual))
    if (request.afterPhotos && Array.isArray(request.afterPhotos)) {
      setAfterPhotos(request.afterPhotos as string[])
    }
    if (request.invoiceUrl) setInvoiceUrl(request.invoiceUrl)
    if (costApprovedState === null) setCostApprovedState(request.costApproved || false)
  }

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({ id })
      toast.success("Maintenance request deleted")
      router.push("/maintenance")
    } catch {
      toast.error("Failed to delete request")
    }
  }

  const handleStatusUpdate = async () => {
    try {
      await updateStatusMutation.mutateAsync({
        id,
        status: newStatus as "reported" | "approved" | "in_progress" | "completed" | "cancelled",
        costActual: costActual ? Number(costActual) : undefined,
        afterPhotos,
        invoiceUrl,
      })
      toast.success("Status updated")
    } catch {
      toast.error("Failed to update status")
    }
  }

  const handleApproveCost = async (approve: boolean) => {
    try {
      await approveCostMutation.mutateAsync({
        id,
        costApproved: approve,
      })
      setCostApprovedState(approve)
      toast.success(approve ? "Cost approved" : "Cost approval removed")
    } catch {
      toast.error("Failed to update cost approval")
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

  if (!request) {
    return (
      <div className="space-y-6">
        <PageHeader title="Request Not Found" />
        <EmptyState
          title="Maintenance request not found"
          description="The request you're looking for doesn't exist"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Maintenance — ${request.property?.title ?? request.propertyId}`}
      >
        <div className="flex flex-wrap gap-2">
          <Link href={`/maintenance/${id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <ConfirmDialog
            trigger={
              <Button variant="outline" size="sm" className="text-danger hover:bg-danger/10">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            }
            title="Delete Request"
            description="Are you sure? This cannot be undone."
            confirmText="Delete"
            onConfirm={handleDelete}
            destructive
          />
        </div>
      </PageHeader>

      {/* Status & Priority Badges */}
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge variant={MAINTENANCE_STATUS_VARIANT[request.status]}>
          {labelOf(MAINTENANCE_STATUSES, request.status)}
        </StatusBadge>
        <StatusBadge variant={MAINTENANCE_PRIORITY_VARIANT[request.priority]}>
          {labelOf(MAINTENANCE_PRIORITIES, request.priority)}
        </StatusBadge>
      </div>

      {/* Key Facts */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Request Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Property</p>
            {request.property ? (
              <Link
                href={`/properties/${request.property.id}`}
                className="font-semibold text-primary hover:underline"
              >
                {request.property.title}
              </Link>
            ) : (
              <p className="font-semibold">—</p>
            )}
          </div>
          {request.tenant && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Tenant</p>
              <p className="font-semibold">{request.tenant.name}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Category</p>
            <p className="font-semibold">{labelOf(MAINTENANCE_CATEGORIES, request.category)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Reported By</p>
            <p className="font-semibold">{request.reportedByName ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Created</p>
            <p className="font-semibold">{formatDate(request.createdAt)}</p>
          </div>
          {request.completedAt && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Completed</p>
              <p className="font-semibold">{formatDate(request.completedAt)}</p>
            </div>
          )}
          {request.assignedTo && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Assigned To</p>
              <p className="font-semibold">{request.assignedTo}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Description */}
      <Card className="p-6">
        <h3 className="font-semibold mb-3">Description</h3>
        <p className="text-muted-foreground whitespace-pre-wrap">{request.description}</p>
      </Card>

      {/* Status Workflow */}
      <Card className="p-6 space-y-4">
        <h3 className="font-semibold mb-3">Status Workflow</h3>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-2 block">Update Status</label>
            <Select value={newStatus} onValueChange={(v) => setNewStatus(v ?? "")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MAINTENANCE_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(newStatus === "completed" || newStatus === "in_progress") && (
            <>
              <div>
                <label className="text-sm font-medium mb-2 block">Actual Cost (AED)</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={costActual}
                  onChange={(e) => setCostActual(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">After Photos</label>
                <FileUpload
                  value={afterPhotos}
                  onChange={setAfterPhotos}
                  folder="maintenance"
                  multiple
                  label="Upload after photos"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Invoice/Receipt URL</label>
                <Input
                  type="text"
                  placeholder="https://..."
                  value={invoiceUrl}
                  onChange={(e) => setInvoiceUrl(e.target.value)}
                />
              </div>
            </>
          )}

          <Button
            onClick={handleStatusUpdate}
            disabled={updateStatusMutation.isPending}
            className="bg-primary"
          >
            {updateStatusMutation.isPending ? "Updating..." : "Update Status"}
          </Button>
        </div>
      </Card>

      {/* Cost Section */}
      {request.costEstimate && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Cost Approval</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Estimated Cost</p>
                <p className="font-semibold text-lg">{formatCurrency(request.costEstimate)}</p>
              </div>
              {request.costActual && (
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">Actual Cost</p>
                  <p className="font-semibold text-lg">{formatCurrency(request.costActual)}</p>
                </div>
              )}
            </div>

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-muted">
                <span className="text-sm font-medium">
                  Cost {costApprovedState ? "Approved" : "Pending Approval"}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant={costApprovedState ? "outline" : "default"}
                onClick={() => handleApproveCost(true)}
                disabled={approveCostMutation.isPending || costApprovedState === true}
              >
                {approveCostMutation.isPending ? "Processing..." : "Approve Cost"}
              </Button>
              {costApprovedState && (
                <Button
                  variant="outline"
                  onClick={() => handleApproveCost(false)}
                  disabled={approveCostMutation.isPending}
                >
                  Revoke Approval
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Before Photos */}
      {request.beforePhotos && (request.beforePhotos as string[]).length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Before Photos</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(request.beforePhotos as string[]).map((url, idx) => (
              <div key={idx} className="rounded-lg border border-border overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Before ${idx + 1}`}
                  className="w-full aspect-video object-cover"
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* After Photos */}
      {request.afterPhotos && (request.afterPhotos as string[]).length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">After Photos</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(request.afterPhotos as string[]).map((url, idx) => (
              <div key={idx} className="rounded-lg border border-border overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`After ${idx + 1}`}
                  className="w-full aspect-video object-cover"
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Invoice */}
      {request.invoiceUrl && (
        <Card className="p-6">
          <h3 className="font-semibold mb-3">Invoice/Receipt</h3>
          <a
            href={request.invoiceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline break-all"
          >
            {request.invoiceUrl}
          </a>
        </Card>
      )}

      {/* Metadata */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Metadata</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-muted-foreground">
          <div>
            <p className="font-medium mb-1">Created</p>
            <p>{formatDate(request.createdAt)}</p>
          </div>
          <div>
            <p className="font-medium mb-1">Last Updated</p>
            <p>{formatDate(request.updatedAt)}</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
