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
import { FileUpload } from "@/components/shared/file-upload"
import { trpc } from "@/lib/trpc"
import {
  UTILITY_TYPES,
  UTILITY_STATUSES,
  UTILITY_STATUS_VARIANT,
  labelOf,
} from "@/lib/constants"
import { formatCurrency, formatDate } from "@/lib/utils"

export default function UtilityDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [newStatus, setNewStatus] = useState<string>("")
  const [clearanceCertUrl, setClearanceCertUrl] = useState<string>("")
  const [depositRefunded, setDepositRefunded] = useState<boolean | null>(null)

  const { data: utility, isLoading } = trpc.utility.getById.useQuery({ id })
  const deleteMutation = trpc.utility.delete.useMutation()
  const updateStatusMutation = trpc.utility.updateStatus.useMutation()

  // Initialize states from utility data
  if (utility && newStatus === "") {
    setNewStatus(utility.status)
    if (utility.clearanceCertUrl) setClearanceCertUrl(utility.clearanceCertUrl)
    if (depositRefunded === null) setDepositRefunded(utility.depositRefunded || false)
  }

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({ id })
      toast.success("Utility account deleted")
      router.push("/utilities")
    } catch {
      toast.error("Failed to delete utility account")
    }
  }

  const handleStatusUpdate = async () => {
    try {
      await updateStatusMutation.mutateAsync({
        id,
        status: newStatus as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        clearanceCertUrl: clearanceCertUrl || undefined,
        depositRefunded: depositRefunded ?? false,
      })
      toast.success("Status updated")
    } catch {
      toast.error("Failed to update status")
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

  if (!utility) {
    return (
      <div className="space-y-6">
        <PageHeader title="Account Not Found" />
        <EmptyState
          title="Utility account not found"
          description="The account you're looking for doesn't exist"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${labelOf(UTILITY_TYPES, utility.utilityType)} — ${utility.property?.title ?? utility.propertyId}`}
      >
        <div className="flex flex-wrap gap-2">
          <Link href={`/utilities/${id}/edit`}>
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
            title="Delete Account"
            description="Are you sure? This cannot be undone."
            confirmText="Delete"
            onConfirm={handleDelete}
            destructive
          />
        </div>
      </PageHeader>

      {/* Status Badge */}
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge variant={UTILITY_STATUS_VARIANT[utility.status]}>
          {labelOf(UTILITY_STATUSES, utility.status)}
        </StatusBadge>
      </div>

      {/* Key Facts */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Account Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Property</p>
            {utility.property ? (
              <Link
                href={`/properties/${utility.property.id}`}
                className="font-semibold text-primary hover:underline"
              >
                {utility.property.title}
              </Link>
            ) : (
              <p className="font-semibold">—</p>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Utility Type</p>
            <p className="font-semibold">{labelOf(UTILITY_TYPES, utility.utilityType)}</p>
          </div>
          {utility.accountNumber && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Account Number</p>
              <p className="font-semibold">{utility.accountNumber}</p>
            </div>
          )}
          {utility.premiseNumber && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Premise Number</p>
              <p className="font-semibold">{utility.premiseNumber}</p>
            </div>
          )}
          {utility.activationDate && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Activation Date</p>
              <p className="font-semibold">{formatDate(utility.activationDate)}</p>
            </div>
          )}
          {utility.deactivationDate && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Deactivation Date</p>
              <p className="font-semibold">{formatDate(utility.deactivationDate)}</p>
            </div>
          )}
          {utility.securityDeposit && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Security Deposit</p>
              <p className="font-semibold">{formatCurrency(utility.securityDeposit)}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Notes */}
      {utility.notes && (
        <Card className="p-6">
          <h3 className="font-semibold mb-3">Notes</h3>
          <p className="text-muted-foreground whitespace-pre-wrap">{utility.notes}</p>
        </Card>
      )}

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
                {UTILITY_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {newStatus === "clearance_pending" && (
            <div>
              <label className="text-sm font-medium mb-2 block">Clearance Certificate</label>
              <FileUpload
                value={clearanceCertUrl ? [clearanceCertUrl] : []}
                onChange={(urls) => setClearanceCertUrl(urls[0] ?? "")}
                folder="utilities"
                label="Upload clearance certificate"
              />
            </div>
          )}

          {(newStatus === "cleared" || newStatus === "deactivated") && (
            <div className="flex items-center gap-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="depositRefunded"
                  checked={depositRefunded ?? false}
                  onChange={(e) => setDepositRefunded(e.target.checked)}
                  className="h-4 w-4"
                />
                <label htmlFor="depositRefunded" className="ml-2 text-sm font-medium">
                  Deposit Refunded
                </label>
              </div>
            </div>
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

      {/* Clearance Certificate */}
      {utility.clearanceCertUrl && (
        <Card className="p-6">
          <h3 className="font-semibold mb-3">Clearance Certificate</h3>
          <a
            href={utility.clearanceCertUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline break-all"
          >
            {utility.clearanceCertUrl}
          </a>
        </Card>
      )}

      {/* Metadata */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Metadata</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-muted-foreground">
          <div>
            <p className="font-medium mb-1">Created</p>
            <p>{formatDate(utility.createdAt)}</p>
          </div>
          <div>
            <p className="font-medium mb-1">Last Updated</p>
            <p>{formatDate(utility.updatedAt)}</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
