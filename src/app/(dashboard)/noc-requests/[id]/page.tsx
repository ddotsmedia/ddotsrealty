"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Trash2, Download } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { EmptyState } from "@/components/shared/empty-state"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { trpc } from "@/lib/trpc"
import {
  NOC_TYPES,
  NOC_STATUSES,
  NOC_STATUS_VARIANT,
  labelOf,
} from "@/lib/constants"
import { formatDate } from "@/lib/utils"

export default function NocRequestDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [validUntil, setValidUntil] = useState<string>("")
  const [rejectionReason, setRejectionReason] = useState<string>("")

  const { data: noc, isLoading, refetch } = trpc.noc.getById.useQuery({ id })
  const reviewMutation = trpc.noc.review.useMutation()
  const deleteMutation = trpc.noc.delete.useMutation()

  const handleReview = async (status: "under_review" | "approved" | "rejected") => {
    try {
      await reviewMutation.mutateAsync({
        id,
        status,
        rejectionReason: status === "rejected" ? rejectionReason : undefined,
        validUntil: validUntil ? new Date(validUntil) : undefined,
      })
      toast.success(`NOC marked as ${labelOf(NOC_STATUSES, status)}`)
      await refetch()
    } catch {
      toast.error("Failed to update NOC status")
    }
  }

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({ id })
      toast.success("NOC request deleted")
      router.push("/noc-requests")
    } catch {
      toast.error("Failed to delete NOC request")
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card className="p-6 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </Card>
      </div>
    )
  }

  if (!noc) {
    return (
      <div className="space-y-6">
        <PageHeader title="NOC Not Found" />
        <EmptyState
          title="NOC request not found"
          description="The NOC request you are looking for does not exist"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title={`NOC — ${labelOf(NOC_TYPES, noc.nocType)}`}>
        <div className="flex flex-wrap gap-2">
          <ConfirmDialog
            trigger={
              <Button variant="outline" size="sm" className="text-danger hover:bg-danger/10">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            }
            title="Delete NOC Request"
            description="Are you sure you want to delete this NOC request? This cannot be undone."
            confirmText="Delete"
            onConfirm={handleDelete}
            destructive
          />
        </div>
      </PageHeader>

      {/* Status Badge */}
      <div className="flex items-center gap-3">
        <StatusBadge variant={NOC_STATUS_VARIANT[noc.status] ?? "default"}>
          {labelOf(NOC_STATUSES, noc.status)}
        </StatusBadge>
      </div>

      {/* Details */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Request Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">NOC Type</p>
            <p className="font-semibold">{labelOf(NOC_TYPES, noc.nocType)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Tenant</p>
            <p className="font-semibold">{noc.tenantName ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Created</p>
            <p className="font-semibold">{formatDate(noc.createdAt)}</p>
          </div>
          {noc.reviewedAt && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Reviewed At</p>
              <p className="font-semibold">{formatDate(noc.reviewedAt)}</p>
            </div>
          )}
          {noc.validUntil && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Valid Until</p>
              <p className="font-semibold">{formatDate(noc.validUntil)}</p>
            </div>
          )}
          {noc.contractInfo && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Contract</p>
              <p className="font-semibold">
                {noc.contractInfo.ejariNumber
                  ? `Ejari: ${noc.contractInfo.ejariNumber}`
                  : `ID: ${noc.contractInfo.id.slice(0, 8)}`}
              </p>
            </div>
          )}
        </div>
      </Card>

      {noc.description && (
        <Card className="p-6">
          <h3 className="font-semibold mb-3">Description</h3>
          <p className="text-muted-foreground whitespace-pre-wrap">{noc.description}</p>
        </Card>
      )}

      {noc.rejectionReason && (
        <Card className="p-6 border-danger/30">
          <h3 className="font-semibold mb-3 text-danger">Rejection Reason</h3>
          <p className="text-muted-foreground whitespace-pre-wrap">{noc.rejectionReason}</p>
        </Card>
      )}

      {/* PDF Download — only when approved */}
      {noc.status === "approved" && (
        <Card className="p-6">
          <h3 className="font-semibold mb-3">NOC Document</h3>
          <Button
            render={
              <a
                href={`/api/noc/${id}/document`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download className="h-4 w-4 mr-2" />
                Download NOC PDF
              </a>
            }
            className="bg-primary"
          />
        </Card>
      )}

      {/* Review Panel */}
      <Card className="p-6 space-y-4">
        <h3 className="font-semibold">Review</h3>

        <div>
          <label className="text-sm font-medium mb-2 block">Valid Until (optional)</label>
          <Input
            type="date"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            className="max-w-xs"
          />
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button
              className="bg-primary"
              onClick={() => handleReview("approved")}
              disabled={reviewMutation.isPending}
            >
              {reviewMutation.isPending ? "Updating..." : "Approve"}
            </Button>

            <Button
              variant="outline"
              onClick={() => handleReview("under_review")}
              disabled={reviewMutation.isPending}
            >
              Mark Under Review
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium block">Rejection Reason (required for reject)</label>
            <Textarea
              placeholder="Provide a reason for rejection..."
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            <ConfirmDialog
              trigger={
                <Button
                  variant="outline"
                  className="text-danger hover:bg-danger/10"
                  disabled={reviewMutation.isPending}
                >
                  Reject
                </Button>
              }
              title="Reject NOC Request"
              description="Are you sure you want to reject this NOC request?"
              confirmText="Reject"
              onConfirm={() => handleReview("rejected")}
              destructive
            />
          </div>
        </div>
      </Card>
    </div>
  )
}
