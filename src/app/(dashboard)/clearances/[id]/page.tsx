"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Trash2, Download } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { EmptyState } from "@/components/shared/empty-state"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
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
import { trpc } from "@/lib/trpc"
import {
  CLEARANCE_STATUSES,
  CLEARANCE_STATUS_VARIANT,
  SETTLEMENT_STATUSES,
  DEPOSIT_REFUND_METHODS,
  labelOf,
} from "@/lib/constants"
import { formatDate, formatCurrency } from "@/lib/utils"

export default function ClearanceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  // Notice fields
  const [noticeDate, setNoticeDate] = useState("")
  const [noticePeriodDays, setNoticePeriodDays] = useState("")
  const [plannedMoveOut, setPlannedMoveOut] = useState("")
  const [actualMoveOut, setActualMoveOut] = useState("")

  // Financials
  const [outstandingRent, setOutstandingRent] = useState("0")
  const [outstandingUtility, setOutstandingUtility] = useState("0")
  const [outstandingMaintenance, setOutstandingMaintenance] = useState("0")
  const [penaltyAmount, setPenaltyAmount] = useState("0")
  const [settlementStatus, setSettlementStatus] = useState("pending")
  const [clearanceStatus, setClearanceStatus] = useState("in_progress")

  // Security deposit
  const [depositAmount, setDepositAmount] = useState("")
  const [depositDeductions, setDepositDeductions] = useState("0")
  const [depositRefundAmount, setDepositRefundAmount] = useState("0")
  const [depositRefundMethod, setDepositRefundMethod] = useState("")
  const [depositRefundDate, setDepositRefundDate] = useState("")
  const [depositRefundRef, setDepositRefundRef] = useState("")

  // Checklist
  const [chequesReturned, setChequesReturned] = useState(false)
  const [dewaCleared, setDewaCleared] = useState(false)
  const [ejariCancelled, setEjariCancelled] = useState(false)
  const [keysReturned, setKeysReturned] = useState(false)

  // Complete
  const [clearanceCertUrl, setClearanceCertUrl] = useState<string[]>([])

  const [initialized, setInitialized] = useState(false)

  const { data: clearance, isLoading, refetch } = trpc.clearance.getById.useQuery({ id })
  const updateMutation = trpc.clearance.update.useMutation()
  const completeMutation = trpc.clearance.complete.useMutation()
  const deleteMutation = trpc.clearance.delete.useMutation()

  useEffect(() => {
    if (clearance && !initialized) {
      setNoticeDate(clearance.noticeDate ? new Date(clearance.noticeDate).toISOString().split("T")[0] : "")
      setNoticePeriodDays(clearance.noticePeriodDays != null ? String(clearance.noticePeriodDays) : "")
      setPlannedMoveOut(clearance.plannedMoveOut ? new Date(clearance.plannedMoveOut).toISOString().split("T")[0] : "")
      setActualMoveOut(clearance.actualMoveOut ? new Date(clearance.actualMoveOut).toISOString().split("T")[0] : "")
      setOutstandingRent(clearance.outstandingRent ?? "0")
      setOutstandingUtility(clearance.outstandingUtility ?? "0")
      setOutstandingMaintenance(clearance.outstandingMaintenance ?? "0")
      setPenaltyAmount(clearance.penaltyAmount ?? "0")
      setSettlementStatus(clearance.settlementStatus ?? "pending")
      setClearanceStatus(clearance.clearanceStatus ?? "in_progress")
      setDepositAmount(clearance.depositAmount != null ? String(clearance.depositAmount) : "")
      setDepositDeductions(clearance.depositDeductions ?? "0")
      setDepositRefundAmount(clearance.depositRefundAmount ?? "0")
      setDepositRefundMethod(clearance.depositRefundMethod ?? "")
      setDepositRefundDate(clearance.depositRefundDate ? new Date(clearance.depositRefundDate).toISOString().split("T")[0] : "")
      setDepositRefundRef(clearance.depositRefundRef ?? "")
      setChequesReturned(clearance.chequesReturned ?? false)
      setDewaCleared(clearance.dewaCleared ?? false)
      setEjariCancelled(clearance.ejariCancelled ?? false)
      setKeysReturned(clearance.keysReturned ?? false)
      setInitialized(true)
    }
  }, [clearance, initialized])

  const totalOutstanding =
    Number(outstandingRent || 0) +
    Number(outstandingUtility || 0) +
    Number(outstandingMaintenance || 0) +
    Number(penaltyAmount || 0)

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        id,
        noticeDate: noticeDate ? new Date(noticeDate) : undefined,
        noticePeriodDays: noticePeriodDays ? Number(noticePeriodDays) : undefined,
        plannedMoveOut: plannedMoveOut ? new Date(plannedMoveOut) : undefined,
        actualMoveOut: actualMoveOut ? new Date(actualMoveOut) : undefined,
        outstandingRent: Number(outstandingRent || 0),
        outstandingUtility: Number(outstandingUtility || 0),
        outstandingMaintenance: Number(outstandingMaintenance || 0),
        penaltyAmount: Number(penaltyAmount || 0),
        settlementStatus: settlementStatus as "pending" | "partial" | "settled",
        clearanceStatus: clearanceStatus as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        depositAmount: depositAmount ? Number(depositAmount) : undefined,
        depositDeductions: Number(depositDeductions || 0),
        depositRefundAmount: Number(depositRefundAmount || 0),
        depositRefundMethod: (depositRefundMethod || undefined) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        depositRefundDate: depositRefundDate ? new Date(depositRefundDate) : undefined,
        depositRefundRef: depositRefundRef || undefined,
        chequesReturned,
        dewaCleared,
        ejariCancelled,
        keysReturned,
      })
      toast.success("Clearance updated")
      await refetch()
    } catch {
      toast.error("Failed to save clearance")
    }
  }

  const handleComplete = async () => {
    try {
      await completeMutation.mutateAsync({
        id,
        clearanceCertUrl: clearanceCertUrl[0] ?? undefined,
      })
      toast.success("Clearance completed — property set to available")
      await refetch()
    } catch {
      toast.error("Failed to complete clearance")
    }
  }

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({ id })
      toast.success("Clearance deleted")
      router.push("/clearances")
    } catch {
      toast.error("Failed to delete clearance")
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

  if (!clearance) {
    return (
      <div className="space-y-6">
        <PageHeader title="Clearance Not Found" />
        <EmptyState
          title="Clearance not found"
          description="The tenant clearance you are looking for does not exist"
        />
      </div>
    )
  }

  const isCompleted = clearance.clearanceStatus === "completed"

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Clearance — ${clearance.tenantName ?? clearance.id.slice(0, 8)}`}
      >
        <div className="flex flex-wrap gap-2">
          <ConfirmDialog
            trigger={
              <Button variant="outline" size="sm" className="text-danger hover:bg-danger/10">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            }
            title="Delete Clearance"
            description="Are you sure? This cannot be undone."
            confirmText="Delete"
            onConfirm={handleDelete}
            destructive
          />
        </div>
      </PageHeader>

      {/* Status badge */}
      <div className="flex items-center gap-3">
        <StatusBadge variant={CLEARANCE_STATUS_VARIANT[clearance.clearanceStatus] ?? "default"}>
          {labelOf(CLEARANCE_STATUSES, clearance.clearanceStatus)}
        </StatusBadge>
      </div>

      {/* Summary */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Clearance Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Tenant</p>
            <p className="font-semibold">{clearance.tenantName ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Property</p>
            <p className="font-semibold">{clearance.propertyTitle ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Created</p>
            <p className="font-semibold">{formatDate(clearance.createdAt)}</p>
          </div>
          {clearance.clearedAt && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Cleared At</p>
              <p className="font-semibold">{formatDate(clearance.clearedAt)}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Notice Details */}
      <Card className="p-6 space-y-4">
        <h3 className="font-semibold">Notice Details</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Notice Date</label>
            <Input
              type="date"
              value={noticeDate}
              onChange={(e) => setNoticeDate(e.target.value)}
              disabled={isCompleted}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Notice Period (days)</label>
            <Input
              type="number"
              min="0"
              value={noticePeriodDays}
              onChange={(e) => setNoticePeriodDays(e.target.value)}
              disabled={isCompleted}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Planned Move-Out</label>
            <Input
              type="date"
              value={plannedMoveOut}
              onChange={(e) => setPlannedMoveOut(e.target.value)}
              disabled={isCompleted}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Actual Move-Out</label>
            <Input
              type="date"
              value={actualMoveOut}
              onChange={(e) => setActualMoveOut(e.target.value)}
              disabled={isCompleted}
            />
          </div>
        </div>
      </Card>

      {/* Financials */}
      <Card className="p-6 space-y-4">
        <h3 className="font-semibold">Financials</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Outstanding Rent (AED)</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={outstandingRent}
              onChange={(e) => setOutstandingRent(e.target.value)}
              disabled={isCompleted}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Outstanding Utility (AED)</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={outstandingUtility}
              onChange={(e) => setOutstandingUtility(e.target.value)}
              disabled={isCompleted}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Outstanding Maintenance (AED)</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={outstandingMaintenance}
              onChange={(e) => setOutstandingMaintenance(e.target.value)}
              disabled={isCompleted}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Penalty Amount (AED)</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={penaltyAmount}
              onChange={(e) => setPenaltyAmount(e.target.value)}
              disabled={isCompleted}
            />
          </div>
        </div>

        <div className="bg-muted rounded-lg p-4">
          <p className="text-sm font-medium text-muted-foreground">Total Outstanding</p>
          <p className="text-2xl font-bold text-primary">
            {formatCurrency(totalOutstanding)}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Settlement Status</label>
            <Select
              value={settlementStatus}
              onValueChange={(v) => setSettlementStatus(v ?? "pending")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SETTLEMENT_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Clearance Status</label>
            <Select
              value={clearanceStatus}
              onValueChange={(v) => setClearanceStatus(v ?? "in_progress")}
              disabled={isCompleted}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CLEARANCE_STATUSES.filter((s) => s.value !== "completed").map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Security Deposit */}
      <Card className="p-6 space-y-4">
        <h3 className="font-semibold">Security Deposit</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Deposit Held (AED)</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              disabled={isCompleted}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Deposit Deductions (AED)</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={depositDeductions}
              onChange={(e) => setDepositDeductions(e.target.value)}
              disabled={isCompleted}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Deposit Refund Amount (AED)</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={depositRefundAmount}
              onChange={(e) => setDepositRefundAmount(e.target.value)}
              disabled={isCompleted}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Refund Method</label>
            <Select
              value={depositRefundMethod}
              onValueChange={(v) => setDepositRefundMethod(v ?? "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select method..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">— None —</SelectItem>
                {DEPOSIT_REFUND_METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Refund Date</label>
            <Input
              type="date"
              value={depositRefundDate}
              onChange={(e) => setDepositRefundDate(e.target.value)}
              disabled={isCompleted}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Refund Reference</label>
            <Input
              type="text"
              placeholder="Cheque no. / transfer ref..."
              value={depositRefundRef}
              onChange={(e) => setDepositRefundRef(e.target.value)}
              disabled={isCompleted}
            />
          </div>
        </div>
      </Card>

      {/* Checklist */}
      <Card className="p-6 space-y-4">
        <h3 className="font-semibold">Move-Out Checklist</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: "Cheques Returned", value: chequesReturned, setter: setChequesReturned },
            { label: "DEWA Cleared", value: dewaCleared, setter: setDewaCleared },
            { label: "Ejari Cancelled", value: ejariCancelled, setter: setEjariCancelled },
            { label: "Keys Returned", value: keysReturned, setter: setKeysReturned },
          ].map(({ label, value, setter }) => (
            <button
              key={label}
              type="button"
              onClick={() => !isCompleted && setter(!value)}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                value
                  ? "border-success bg-success/10 text-success"
                  : "border-border bg-card text-muted-foreground"
              } ${isCompleted ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:border-primary"}`}
            >
              <span
                className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  value ? "border-success bg-success" : "border-muted-foreground"
                }`}
              >
                {value && (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Save */}
      {!isCompleted && (
        <div className="flex justify-start">
          <Button
            className="bg-primary"
            onClick={handleSave}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      )}

      {/* Complete Clearance */}
      {!isCompleted && (
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold">Complete Clearance</h3>
          <p className="text-sm text-muted-foreground">
            Completing the clearance will mark the tenant as cleared and set the property status
            back to available.
          </p>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Clearance Certificate (optional)
            </label>
            <FileUpload
              value={clearanceCertUrl}
              onChange={setClearanceCertUrl}
              folder="clearances"
              multiple={false}
              label="Upload clearance certificate"
            />
          </div>

          <ConfirmDialog
            trigger={
              <Button className="bg-primary" disabled={completeMutation.isPending}>
                {completeMutation.isPending ? "Completing..." : "Complete Clearance"}
              </Button>
            }
            title="Complete Clearance"
            description="This will mark the clearance as completed and set the property to 'Available'. Are you sure?"
            confirmText="Complete"
            onConfirm={handleComplete}
          />
        </Card>
      )}

      {/* Download Certificate — only when completed */}
      {isCompleted && (
        <Card className="p-6">
          <h3 className="font-semibold mb-3">Clearance Certificate</h3>
          <Button
            render={
              <a
                href={`/api/clearances/${id}/certificate`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Clearance Certificate
              </a>
            }
            className="bg-primary"
          />
        </Card>
      )}
    </div>
  )
}
