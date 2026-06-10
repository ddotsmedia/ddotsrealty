"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { EmptyState } from "@/components/shared/empty-state"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { WhatsAppButton } from "@/components/shared/whatsapp-button"
import { FileUpload } from "@/components/shared/file-upload"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { trpc } from "@/lib/trpc"
import {
  CHEQUE_STATUSES,
  CHEQUE_STATUS_VARIANT,
  CHEQUE_DIRECTIONS,
  labelOf,
} from "@/lib/constants"
import { formatCurrency, formatDate } from "@/lib/utils"

type ChequeStatus =
  | "pending"
  | "collected"
  | "in_custody"
  | "with_owner"
  | "pending_deposit"
  | "deposited"
  | "cleared"
  | "bounced"
  | "replaced"
  | "postponed"
  | "returned"
  | "cancelled"
  | "stale"

const STATUS_TRANSITIONS: Record<string, ChequeStatus[]> = {
  pending: ["collected", "in_custody", "deposited", "postponed", "bounced", "cancelled"],
  collected: ["in_custody", "with_owner", "pending_deposit", "deposited", "cancelled"],
  in_custody: ["with_owner", "pending_deposit", "deposited", "returned", "cancelled"],
  with_owner: ["pending_deposit", "deposited", "returned", "cancelled"],
  pending_deposit: ["deposited", "postponed", "returned", "cancelled"],
  deposited: ["cleared", "bounced"],
  cleared: [],
  bounced: ["replaced", "cancelled"],
  replaced: [],
  postponed: ["pending", "collected", "deposited", "cancelled"],
  returned: ["cancelled"],
  cancelled: [],
  stale: ["cancelled"],
}

export default function ChequeDetailPage() {
  const params = useParams()
  const id = params.id as string

  // Status update state
  const [nextStatus, setNextStatus] = useState<ChequeStatus | "">("")
  const [bounceReason, setBounceReason] = useState("")
  const [chequeImageUrls, setChequeImageUrls] = useState<string[]>([])

  // Postpone dialog state
  const [postponeOpen, setPostponeOpen] = useState(false)
  const [postponeDate, setPostponeDate] = useState("")
  const [postponeNote, setPostponeNote] = useState("")

  // Details section state (seeded from cheque on first load)
  const [detailDirection, setDetailDirection] = useState<string>("receivable")
  const [detailBankAccountId, setDetailBankAccountId] = useState<string>("")
  const [detailCustodyHolder, setDetailCustodyHolder] = useState("")
  const [detailCustodyDate, setDetailCustodyDate] = useState("")
  const [detailPenaltyAmount, setDetailPenaltyAmount] = useState("")
  const [detailReceiptNumber, setDetailReceiptNumber] = useState("")
  const [detailsDirty, setDetailsDirty] = useState(false)

  const utils = trpc.useUtils()
  const { data: cheque, isLoading } = trpc.cheque.getById.useQuery({ id })

  // Bank accounts for the details selector
  const bankAccountsQuery = trpc.bankAccount.selectable.useQuery(undefined, {
    placeholderData: (prev) => prev,
  })

  // Seed details form fields once on first successful load (not on every refetch)
  useEffect(() => {
    if (cheque && !detailsDirty) {
      setDetailDirection(cheque.direction ?? "receivable")
      setDetailBankAccountId(cheque.bankAccountId ?? "")
      setDetailCustodyHolder(cheque.custodyHolder ?? "")
      setDetailCustodyDate(
        cheque.custodyDate
          ? new Date(cheque.custodyDate).toISOString().split("T")[0]
          : ""
      )
      setDetailPenaltyAmount(cheque.penaltyAmount ? String(cheque.penaltyAmount) : "")
      setDetailReceiptNumber(cheque.receiptNumber ?? "")
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cheque?.id])

  const updateStatusMutation = trpc.cheque.updateStatus.useMutation({
    onSuccess: () => {
      utils.cheque.getById.invalidate({ id })
      utils.cheque.stats.invalidate()
    },
  })
  const postponeMutation = trpc.cheque.postpone.useMutation({
    onSuccess: () => {
      utils.cheque.getById.invalidate({ id })
      utils.cheque.stats.invalidate()
    },
  })
  const updateDetailsMutation = trpc.cheque.updateDetails.useMutation({
    onSuccess: () => {
      utils.cheque.getById.invalidate({ id })
      setDetailsDirty(false)
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

  const handlePostpone = async () => {
    if (!postponeDate) {
      toast.warning("Please select a new due date")
      return
    }
    try {
      await postponeMutation.mutateAsync({
        id,
        newDueDate: new Date(postponeDate),
        note: postponeNote || undefined,
      })
      toast.success("Cheque postponed successfully")
      setPostponeOpen(false)
      setPostponeDate("")
      setPostponeNote("")
    } catch {
      toast.error("Failed to postpone cheque")
    }
  }

  const handleSaveDetails = async () => {
    try {
      await updateDetailsMutation.mutateAsync({
        id,
        direction: (detailDirection as "receivable" | "payable") || undefined,
        bankAccountId: detailBankAccountId || null,
        custodyHolder: detailCustodyHolder || null,
        custodyDate: detailCustodyDate ? new Date(detailCustodyDate) : null,
        penaltyAmount: detailPenaltyAmount ? Number(detailPenaltyAmount) : null,
        receiptNumber: detailReceiptNumber || null,
      })
      toast.success("Details saved")
    } catch {
      toast.error("Failed to save details")
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
        {currentStatus !== "cleared" && currentStatus !== "cancelled" && (
          <Button
            variant="outline"
            onClick={() => setPostponeOpen(true)}
          >
            Postpone
          </Button>
        )}
      </PageHeader>

      {/* Status badges */}
      <div className="flex items-center gap-3 flex-wrap">
        <StatusBadge variant={CHEQUE_STATUS_VARIANT[cheque.status]}>
          {labelOf(CHEQUE_STATUSES, cheque.status)}
        </StatusBadge>
        {cheque.direction && (
          <StatusBadge variant="info">
            {labelOf(CHEQUE_DIRECTIONS, cheque.direction)}
          </StatusBadge>
        )}
        {cheque.postponed && (
          <StatusBadge variant="warning">Postponed</StatusBadge>
        )}
      </div>

      {/* Auto-created transaction notice */}
      {cheque.linkedTransactionId && (
        <div className="rounded-lg border border-success/40 bg-success/5 px-4 py-3 text-sm text-success">
          A transaction was automatically created when this cheque was cleared.{" "}
          <Link
            href={`/accounting/transactions/${cheque.linkedTransactionId}`}
            className="font-medium underline"
          >
            View transaction
          </Link>
        </div>
      )}

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
          {cheque.postponed && cheque.originalDueDate && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Original Due Date</p>
              <p className="font-semibold text-muted-foreground line-through">
                {formatDate(cheque.originalDueDate)}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Cheque Number</p>
            <p className="font-semibold">{cheque.chequeNumber ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Bank</p>
            <p className="font-semibold">{cheque.bankName ?? "—"}</p>
          </div>
          {cheque.receiptNumber && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Receipt Number</p>
              <p className="font-semibold">{cheque.receiptNumber}</p>
            </div>
          )}
          {cheque.penaltyAmount && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Penalty Amount</p>
              <p className="font-semibold text-danger">{formatCurrency(cheque.penaltyAmount)}</p>
            </div>
          )}
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
          {cheque.custodyHolder && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Custody Holder</p>
              <p className="font-semibold">{cheque.custodyHolder}</p>
            </div>
          )}
          {cheque.custodyDate && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Custody Date</p>
              <p className="font-semibold">{formatDate(cheque.custodyDate)}</p>
            </div>
          )}
          {cheque.bounceReason && (
            <div className="sm:col-span-2 lg:col-span-3">
              <p className="text-xs text-muted-foreground font-medium mb-1">Bounce Reason</p>
              <p className="font-semibold text-danger">{cheque.bounceReason}</p>
            </div>
          )}
          {cheque.notes && (
            <div className="sm:col-span-2 lg:col-span-3">
              <p className="text-xs text-muted-foreground font-medium mb-1">Notes</p>
              <p className="text-sm whitespace-pre-wrap">{cheque.notes}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Editable Additional Details */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Additional Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1.5">Direction</p>
            <Select
              value={detailDirection}
              onValueChange={(v) => {
                setDetailDirection((v as string) ?? "receivable")
                setDetailsDirty(true)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select direction" />
              </SelectTrigger>
              <SelectContent>
                {CHEQUE_DIRECTIONS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1.5">Bank Account</p>
            <Select
              value={detailBankAccountId}
              onValueChange={(v) => {
                setDetailBankAccountId((v as string) ?? "")
                setDetailsDirty(true)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select bank account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {(bankAccountsQuery.data ?? []).map((ba) => (
                  <SelectItem key={ba.id} value={ba.id}>
                    {ba.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1.5">Custody Holder</p>
            <Input
              value={detailCustodyHolder}
              onChange={(e) => { setDetailCustodyHolder(e.target.value); setDetailsDirty(true) }}
              placeholder="Name of custody holder"
            />
          </div>

          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1.5">Custody Date</p>
            <Input
              type="date"
              value={detailCustodyDate}
              onChange={(e) => { setDetailCustodyDate(e.target.value); setDetailsDirty(true) }}
            />
          </div>

          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1.5">Penalty Amount</p>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={detailPenaltyAmount}
              onChange={(e) => { setDetailPenaltyAmount(e.target.value); setDetailsDirty(true) }}
              placeholder="0.00"
            />
          </div>

          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1.5">Receipt Number</p>
            <Input
              value={detailReceiptNumber}
              onChange={(e) => { setDetailReceiptNumber(e.target.value); setDetailsDirty(true) }}
              placeholder="Receipt / voucher number"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            onClick={handleSaveDetails}
            disabled={updateDetailsMutation.isPending || !detailsDirty}
            className="bg-primary"
            size="sm"
          >
            {updateDetailsMutation.isPending ? "Saving..." : "Save Details"}
          </Button>
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

      {/* Postpone Dialog */}
      <Dialog open={postponeOpen} onOpenChange={setPostponeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Postpone Cheque</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {cheque.originalDueDate && (
              <p className="text-sm text-muted-foreground">
                Original due date:{" "}
                <span className="font-medium">{formatDate(cheque.originalDueDate)}</span>
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Current due date:{" "}
              <span className="font-medium">{formatDate(cheque.dueDate)}</span>
            </p>
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1.5">New Due Date *</p>
              <Input
                type="date"
                value={postponeDate}
                onChange={(e) => setPostponeDate(e.target.value)}
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1.5">Note (optional)</p>
              <Textarea
                placeholder="Reason for postponement..."
                value={postponeNote}
                onChange={(e) => setPostponeNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPostponeOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handlePostpone}
              disabled={postponeMutation.isPending || !postponeDate}
              className="bg-primary"
            >
              {postponeMutation.isPending ? "Postponing..." : "Confirm Postpone"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
