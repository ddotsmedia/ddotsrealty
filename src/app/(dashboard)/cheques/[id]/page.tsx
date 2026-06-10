"use client"

import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { EmptyState } from "@/components/shared/empty-state"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { WhatsAppButton } from "@/components/shared/whatsapp-button"
import { FileUpload } from "@/components/shared/file-upload"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { trpc } from "@/lib/trpc"
import {
  CHEQUE_STATUSES,
  CHEQUE_STATUS_VARIANT,
  CONTRACT_STATUSES,
  CONTRACT_STATUS_VARIANT,
  labelOf,
} from "@/lib/constants"
import { formatCurrency, formatDate } from "@/lib/utils"

type ChequeStatus = "pending" | "deposited" | "cleared" | "bounced" | "replaced" | "cancelled"

const STATUS_TRANSITIONS: Record<string, ChequeStatus[]> = {
  pending: ["deposited", "bounced", "cancelled"],
  deposited: ["cleared", "bounced"],
  cleared: [],
  bounced: ["replaced", "cancelled"],
  replaced: [],
  cancelled: [],
}

export default function ChequeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [nextStatus, setNextStatus] = useState<ChequeStatus | "">("")
  const [bounceReason, setBounceReason] = useState("")
  const [chequeImageUrls, setChequeImageUrls] = useState<string[]>([])
  const [showBounceDialog, setShowBounceDialog] = useState(false)

  const utils = trpc.useUtils()
  const { data: cheque, isLoading } = trpc.cheque.getById.useQuery({ id })
  const updateStatusMutation = trpc.cheque.updateStatus.useMutation({
    onSuccess: () => {
      utils.cheque.getById.invalidate({ id })
      utils.cheque.stats.invalidate()
    },
  })
  const sendReminderMutation = trpc.cheque.sendReminder.useMutation()

  const handleUpdateStatus = async (status: ChequeStatus, reason?: string, imageUrl?: string) => {
    try {
      await updateStatusMutation.mutateAsync({
        id,
        status,
        bounceReason: reason,
        chequeImageUrl: imageUrl ?? chequeImageUrls[0],
      })
      toast.success(`Cheque status updated to ${labelOf(CHEQUE_STATUSES, status)}`)
      setNextStatus("")
      setBounceReason("")
      setChequeImageUrls([])
    } catch {
      toast.error("Failed to update status")
    }
  }

  const handleConfirmStatusChange = async () => {
    if (!nextStatus) return

    if (nextStatus === "bounced") {
      if (!bounceReason.trim()) {
        toast.warning("Please provide a bounce reason")
        return
      }
      await handleUpdateStatus("bounced", bounceReason)
    } else {
      await handleUpdateStatus(nextStatus)
    }
  }

  const handleSendReminder = async () => {
    try {
      const result = await sendReminderMutation.mutateAsync({ id })
      if (result.phone) {
        const phoneDigits = result.phone.replace(/\D/g, "")
        const url = `https://wa.me/${phoneDigits}?text=${encodeURIComponent(result.message)}`
        window.open(url, "_blank")
      } else {
        toast.warning("No phone number on file for this tenant")
      }
    } catch {
      toast.error("Failed to prepare reminder")
    }
  }

  const handleImageSave = async () => {
    if (chequeImageUrls.length === 0) return
    try {
      await updateStatusMutation.mutateAsync({
        id,
        status: cheque!.status as ChequeStatus,
        chequeImageUrl: chequeImageUrls[0],
      })
      toast.success("Cheque image saved")
      setChequeImageUrls([])
    } catch {
      toast.error("Failed to save image")
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

  if (!cheque) {
    return (
      <div className="space-y-6">
        <PageHeader title="Cheque Not Found" />
        <EmptyState
          title="Cheque not found"
          description="The cheque you're looking for doesn't exist"
        />
      </div>
    )
  }

  const currentStatus = cheque.status as ChequeStatus
  const allowedTransitions = STATUS_TRANSITIONS[currentStatus] ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Cheque${cheque.chequeNumber ? ` #${cheque.chequeNumber}` : ""}`}
      >
        <WhatsAppButton
          label="Send Reminder"
          onClick={handleSendReminder}
        />
      </PageHeader>

      {/* Status */}
      <div className="flex items-center gap-3">
        <StatusBadge variant={CHEQUE_STATUS_VARIANT[cheque.status]}>
          {labelOf(CHEQUE_STATUSES, cheque.status)}
        </StatusBadge>
      </div>

      {/* Cheque Details */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Cheque Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Amount</p>
            <p className="text-xl font-bold">{formatCurrency(cheque.amount)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Due Date</p>
            <p className="font-semibold">{formatDate(cheque.dueDate)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Cheque Number</p>
            <p className="font-semibold">{cheque.chequeNumber ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Bank</p>
            <p className="font-semibold">{cheque.bankName ?? "—"}</p>
          </div>
          {cheque.depositedDate && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Deposited Date</p>
              <p className="font-semibold">{formatDate(cheque.depositedDate)}</p>
            </div>
          )}
          {cheque.clearedDate && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Cleared Date</p>
              <p className="font-semibold">{formatDate(cheque.clearedDate)}</p>
            </div>
          )}
          {cheque.bounceReason && (
            <div className="sm:col-span-2 lg:col-span-3">
              <p className="text-xs text-muted-foreground font-medium mb-1">Bounce Reason</p>
              <p className="font-semibold text-danger">{cheque.bounceReason}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Linked Records */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Linked Records</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Property</p>
            {cheque.property ? (
              <Link
                href={`/properties/${cheque.property.id}`}
                className="font-semibold text-primary hover:underline"
              >
                {cheque.property.title}
                {cheque.property.referenceNo && (
                  <span className="text-xs text-muted-foreground ml-1">({cheque.property.referenceNo})</span>
                )}
              </Link>
            ) : (
              <p className="font-semibold">—</p>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Tenant</p>
            <p className="font-semibold">{cheque.tenant?.name ?? "—"}</p>
            {cheque.tenant?.phone && (
              <p className="text-xs text-muted-foreground">{cheque.tenant.phone}</p>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Contract</p>
            {cheque.contract ? (
              <Link
                href={`/contracts/${cheque.contract.id}`}
                className="font-semibold text-primary hover:underline"
              >
                {formatDate(cheque.contract.startDate)} – {formatDate(cheque.contract.endDate)}
              </Link>
            ) : (
              <p className="font-semibold">—</p>
            )}
          </div>
        </div>
      </Card>

      {/* Status Workflow */}
      {allowedTransitions.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Update Status</h3>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[180px]">
                <p className="text-xs text-muted-foreground font-medium mb-1.5">New Status</p>
                <Select value={nextStatus} onValueChange={(v) => setNextStatus(v as ChequeStatus)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    {allowedTransitions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {labelOf(CHEQUE_STATUSES, s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Bounce reason textarea */}
            {nextStatus === "bounced" && (
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1.5">Bounce Reason *</p>
                <Textarea
                  placeholder="Describe the reason for bounce (e.g., insufficient funds)"
                  value={bounceReason}
                  onChange={(e) => setBounceReason(e.target.value)}
                  rows={3}
                />
              </div>
            )}

            {nextStatus && (
              <ConfirmDialog
                trigger={
                  <Button
                    className="bg-primary"
                    disabled={updateStatusMutation.isPending || (nextStatus === "bounced" && !bounceReason.trim())}
                  >
                    {updateStatusMutation.isPending
                      ? "Updating..."
                      : `Mark as ${labelOf(CHEQUE_STATUSES, nextStatus)}`}
                  </Button>
                }
                title={`Mark as ${labelOf(CHEQUE_STATUSES, nextStatus)}`}
                description={`Are you sure you want to change this cheque's status to "${labelOf(CHEQUE_STATUSES, nextStatus)}"?`}
                confirmText="Confirm"
                onConfirm={handleConfirmStatusChange}
                destructive={nextStatus === "bounced" || nextStatus === "cancelled"}
              />
            )}
          </div>
        </Card>
      )}

      {/* Cheque Image */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Cheque Image</h3>
        {cheque.chequeImageUrl && (
          <div className="mb-4">
            <a
              href={cheque.chequeImageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline text-sm"
            >
              View existing cheque image
            </a>
          </div>
        )}
        <FileUpload
          value={chequeImageUrls}
          onChange={setChequeImageUrls}
          folder="cheques"
          multiple={false}
          maxFiles={1}
          label="Upload Cheque Image"
        />
        {chequeImageUrls.length > 0 && (
          <Button
            onClick={handleImageSave}
            disabled={updateStatusMutation.isPending}
            className="mt-3 bg-primary"
            size="sm"
          >
            {updateStatusMutation.isPending ? "Saving..." : "Save Image"}
          </Button>
        )}
      </Card>

      {/* Metadata */}
      <Card className="p-6">
        <h3 className="font-semibold mb-3">Metadata</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-muted-foreground">
          <div>
            <p className="font-medium mb-1">Created</p>
            <p>{formatDate(cheque.createdAt)}</p>
          </div>
          <div>
            <p className="font-medium mb-1">Last Updated</p>
            <p>{formatDate(cheque.updatedAt)}</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
