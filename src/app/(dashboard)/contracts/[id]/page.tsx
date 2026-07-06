"use client"

import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useState } from "react"
import { Edit, Trash2, Plus } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { EmptyState } from "@/components/shared/empty-state"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { WhatsAppButton } from "@/components/shared/whatsapp-button"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { trpc } from "@/lib/trpc"
import {
  CONTRACT_STATUSES,
  CONTRACT_STATUS_VARIANT,
  CHEQUE_STATUSES,
  CHEQUE_STATUS_VARIANT,
  PAYMENT_MODES,
  SECURITY_DEPOSIT_STATUSES,
  SECURITY_DEPOSIT_STATUS_VARIANT,
  OCCUPANT_RELATIONSHIPS,
  labelOf,
} from "@/lib/constants"
import { formatCurrency, formatDate, daysUntil, cn } from "@/lib/utils"

export default function ContractDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [openOccupantDialog, setOpenOccupantDialog] = useState(false)
  const [occupantName, setOccupantName] = useState("")
  const [occupantEmiratesId, setOccupantEmiratesId] = useState("")
  const [occupantRelationship, setOccupantRelationship] = useState<string>("other")
  const [occupantNationality, setOccupantNationality] = useState("")

  const { data: contract, isLoading } = trpc.contract.getById.useQuery({ id })
  const { data: occupants, refetch: refetchOccupants } = trpc.occupant.listByContract.useQuery({ contractId: id })
  const deleteMutation = trpc.contract.delete.useMutation()
  const sendReminderMutation = trpc.cheque.sendReminder.useMutation()
  const createOccupantMutation = trpc.occupant.create.useMutation()
  const deleteOccupantMutation = trpc.occupant.delete.useMutation()

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({ id })
      toast.success("Contract deleted")
      router.push("/contracts")
    } catch {
      toast.error("Failed to delete contract")
    }
  }

  const handleSendReminder = async (chequeId: string) => {
    try {
      const result = await sendReminderMutation.mutateAsync({ id: chequeId })
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

  const handleAddOccupant = async () => {
    if (!occupantName.trim()) {
      toast.error("Name is required")
      return
    }
    try {
      await createOccupantMutation.mutateAsync({
        contractId: id,
        name: occupantName,
        emiratesId: occupantEmiratesId || undefined,
        relationship: occupantRelationship as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        nationality: occupantNationality || undefined,
      })
      toast.success("Occupant added successfully")
      setOpenOccupantDialog(false)
      setOccupantName("")
      setOccupantEmiratesId("")
      setOccupantRelationship("other")
      setOccupantNationality("")
      refetchOccupants()
    } catch (error) {
      toast.error("Failed to add occupant")
      console.error(error)
    }
  }

  const handleDeleteOccupant = async (occupantId: string) => {
    try {
      await deleteOccupantMutation.mutateAsync({ id: occupantId })
      toast.success("Occupant deleted successfully")
      refetchOccupants()
    } catch (error) {
      toast.error("Failed to delete occupant")
      console.error(error)
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

  if (!contract) {
    return (
      <div className="space-y-6">
        <PageHeader title="Contract Not Found" />
        <EmptyState
          title="Contract not found"
          description="The contract you're looking for doesn't exist"
        />
      </div>
    )
  }

  const days = daysUntil(contract.endDate)
  const isExpiringSoon = days !== null && days >= 0 && days <= 60
  const isExpired = days !== null && days < 0

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Contract — ${contract.property?.title ?? contract.propertyId}`}
        description={
          contract.ejariNumber ? `Ejari: ${contract.ejariNumber}` : undefined
        }
      >
        <div className="flex flex-wrap gap-2">
          <Link href={`/contracts/${id}/edit`}>
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
            title="Delete Contract"
            description="Are you sure? This will also delete all associated cheques and cannot be undone."
            confirmText="Delete"
            onConfirm={handleDelete}
            destructive
          />
        </div>
      </PageHeader>

      {/* Status & Expiry Banner */}
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge variant={CONTRACT_STATUS_VARIANT[contract.status]}>
          {labelOf(CONTRACT_STATUSES, contract.status)}
        </StatusBadge>
        {isExpiringSoon && !isExpired && (
          <span
            className={cn(
              "text-sm font-medium px-3 py-1 rounded-full",
              days! <= 14
                ? "bg-danger/10 text-danger"
                : "bg-warning/10 text-warning"
            )}
          >
            Expires in {days} day{days !== 1 ? "s" : ""}
          </span>
        )}
        {isExpired && (
          <span className="text-sm font-medium px-3 py-1 rounded-full bg-danger/10 text-danger">
            Expired {Math.abs(days!)} day{Math.abs(days!) !== 1 ? "s" : ""} ago
          </span>
        )}
      </div>

      {/* Key Facts */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Contract Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Start Date</p>
            <p className="font-semibold">{formatDate(contract.startDate)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">End Date</p>
            <p className="font-semibold">{formatDate(contract.endDate)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Annual Rent</p>
            <p className="font-semibold text-lg">{formatCurrency(contract.rentAmount)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Payment Mode</p>
            <p className="font-semibold">{labelOf(PAYMENT_MODES, contract.paymentMode)}</p>
          </div>
          {contract.securityDeposit && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Security Deposit</p>
              <p className="font-semibold">{formatCurrency(contract.securityDeposit)}</p>
            </div>
          )}
          {contract.commissionPct && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Commission</p>
              <p className="font-semibold">{Number(contract.commissionPct).toFixed(2)}%</p>
            </div>
          )}
          {contract.ejariNumber && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Ejari No.</p>
              <p className="font-semibold">{contract.ejariNumber}</p>
            </div>
          )}
          {contract.tawtheeqNumber && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Tawtheeq No.</p>
              <p className="font-semibold">{contract.tawtheeqNumber}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Parties */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Parties</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Property</p>
            {contract.property ? (
              <Link href={`/properties/${contract.property.id}`} className="font-semibold text-primary hover:underline">
                {contract.property.title}
                {contract.property.referenceNo && (
                  <span className="text-xs text-muted-foreground ml-1">({contract.property.referenceNo})</span>
                )}
              </Link>
            ) : (
              <p className="font-semibold">—</p>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Tenant</p>
            <p className="font-semibold">{contract.tenant?.name ?? "—"}</p>
            {contract.tenant?.phone && (
              <p className="text-xs text-muted-foreground">{contract.tenant.phone}</p>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Owner</p>
            <p className="font-semibold">{contract.owner?.name ?? "—"}</p>
            {contract.owner?.phone && (
              <p className="text-xs text-muted-foreground">{contract.owner.phone}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Lease Terms */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Lease Terms</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {contract.rentFreeMonths && contract.rentFreeMonths > 0 && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Rent-Free Months</p>
              <p className="font-semibold">{contract.rentFreeMonths}</p>
            </div>
          )}
          {contract.gracePeriodDays && contract.gracePeriodDays > 0 && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Grace Period</p>
              <p className="font-semibold">{contract.gracePeriodDays} days</p>
            </div>
          )}
          {contract.escalationPct && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Annual Escalation</p>
              <p className="font-semibold">{Number(contract.escalationPct).toFixed(2)}%</p>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Auto-Renew</p>
            <p className="font-semibold">{contract.autoRenew ? "Yes" : "No"}</p>
          </div>
          {contract.terminationNoticeDays && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Termination Notice</p>
              <p className="font-semibold">{contract.terminationNoticeDays} days</p>
            </div>
          )}
          {contract.earlyTerminationPenalty && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Early Termination Penalty</p>
              <p className="font-semibold">{formatCurrency(contract.earlyTerminationPenalty)}</p>
            </div>
          )}
          {contract.dewaPremiseNo && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">DEWA Premise No.</p>
              <p className="font-semibold">{contract.dewaPremiseNo}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Security Deposit */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Security Deposit</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Status</p>
            <StatusBadge variant={SECURITY_DEPOSIT_STATUS_VARIANT[contract.securityDepositStatus]}>
              {labelOf(SECURITY_DEPOSIT_STATUSES, contract.securityDepositStatus)}
            </StatusBadge>
          </div>
          {Number(contract.depositDeductions ?? 0) > 0 && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Deductions</p>
              <p className="font-semibold">{formatCurrency(contract.depositDeductions)}</p>
            </div>
          )}
          {contract.depositRefundDate && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Refund Date</p>
              <p className="font-semibold">{formatDate(contract.depositRefundDate)}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Cheques */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">
            Cheques ({contract.cheques?.length ?? 0})
          </h3>
          <Link href="/cheques">
            <Button variant="outline" size="sm">View All Cheques</Button>
          </Link>
        </div>

        {(!contract.cheques || contract.cheques.length === 0) ? (
          <EmptyState
            title="No cheques"
            description="No cheques are linked to this contract"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Cheque #</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Due Date</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">Amount</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Status</th>
                  <th className="py-2 px-3"></th>
                </tr>
              </thead>
              <tbody>
                {contract.cheques.map((cheque: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                  <tr
                    key={cheque.id}
                    className="border-b border-border hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-2 px-3">
                      <Link
                        href={`/cheques/${cheque.id}`}
                        className="text-primary hover:underline font-medium"
                      >
                        {cheque.chequeNumber ?? `#${contract.cheques.indexOf(cheque) + 1}`}
                      </Link>
                    </td>
                    <td className="py-2 px-3">{formatDate(cheque.dueDate)}</td>
                    <td className="py-2 px-3 text-right font-medium">{formatCurrency(cheque.amount)}</td>
                    <td className="py-2 px-3">
                      <StatusBadge variant={CHEQUE_STATUS_VARIANT[cheque.status]}>
                        {labelOf(CHEQUE_STATUSES, cheque.status)}
                      </StatusBadge>
                    </td>
                    <td className="py-2 px-3">
                      <WhatsAppButton
                        size="sm"
                        label="Remind"
                        onClick={() => handleSendReminder(cheque.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Occupants (Ejari) */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">
            Occupants ({occupants?.length ?? 0})
          </h3>
          <Dialog open={openOccupantDialog} onOpenChange={setOpenOccupantDialog}>
            <DialogTrigger>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Occupant
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Occupant</DialogTitle>
                <DialogDescription>
                  Add a new occupant to this contract (Ejari)
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Name *</label>
                  <Input
                    placeholder="Full name"
                    value={occupantName}
                    onChange={(e) => setOccupantName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Relationship</label>
                  <Select
                    value={occupantRelationship}
                    onValueChange={(v) => setOccupantRelationship(v as string)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      {OCCUPANT_RELATIONSHIPS.map((rel) => (
                        <SelectItem key={rel.value} value={rel.value}>
                          {rel.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Emirates ID</label>
                  <Input
                    placeholder="123-1234-5678901-1"
                    value={occupantEmiratesId}
                    onChange={(e) => setOccupantEmiratesId(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Nationality</label>
                  <Input
                    placeholder="Country"
                    value={occupantNationality}
                    onChange={(e) => setOccupantNationality(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenOccupantDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAddOccupant}
                  disabled={createOccupantMutation.isPending}
                >
                  {createOccupantMutation.isPending ? "Adding..." : "Add Occupant"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {(!occupants || occupants.length === 0) ? (
          <EmptyState
            title="No occupants"
            description="No occupants added to this contract yet"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Name</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Relationship</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Emirates ID</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Nationality</th>
                  <th className="py-2 px-3"></th>
                </tr>
              </thead>
              <tbody>
                {occupants.map((occupant: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                  <tr
                    key={occupant.id}
                    className="border-b border-border hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-2 px-3 font-medium">{occupant.name}</td>
                    <td className="py-2 px-3">{labelOf(OCCUPANT_RELATIONSHIPS, occupant.relationship)}</td>
                    <td className="py-2 px-3">{occupant.emiratesId ?? "—"}</td>
                    <td className="py-2 px-3">{occupant.nationality ?? "—"}</td>
                    <td className="py-2 px-3">
                      <ConfirmDialog
                        trigger={
                          <button className="text-danger hover:text-danger/80 text-sm">
                            Delete
                          </button>
                        }
                        title="Delete Occupant"
                        description="Are you sure you want to delete this occupant?"
                        confirmText="Delete"
                        onConfirm={() => handleDeleteOccupant(occupant.id)}
                        destructive
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Notes */}
      {contract.notes && (
        <Card className="p-6">
          <h3 className="font-semibold mb-3">Notes</h3>
          <p className="text-muted-foreground whitespace-pre-wrap">{contract.notes}</p>
        </Card>
      )}

      {/* Metadata */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Metadata</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-muted-foreground">
          <div>
            <p className="font-medium mb-1">Created</p>
            <p>{formatDate(contract.createdAt)}</p>
          </div>
          <div>
            <p className="font-medium mb-1">Last Updated</p>
            <p>{formatDate(contract.updatedAt)}</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
