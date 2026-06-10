"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Plus, Star, Pencil, Trash2 } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { StatusBadge } from "@/components/shared/status-badge"
import { trpc } from "@/lib/trpc"

interface BankAccountFormState {
  bankName: string
  accountNumber: string
  iban: string
  swiftCode: string
  branch: string
  isDefault: boolean
}

const emptyForm: BankAccountFormState = {
  bankName: "",
  accountNumber: "",
  iban: "",
  swiftCode: "",
  branch: "",
  isDefault: false,
}

export default function BankAccountsPage() {
  const [addOpen, setAddOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<BankAccountFormState>(emptyForm)

  const utils = trpc.useUtils()

  const listQuery = trpc.bankAccount.list.useQuery(undefined, {
    placeholderData: (prev) => prev,
  })

  const createMutation = trpc.bankAccount.create.useMutation({
    onSuccess: () => {
      utils.bankAccount.list.invalidate()
      utils.bankAccount.selectable.invalidate()
      toast.success("Bank account added")
      setAddOpen(false)
      setForm(emptyForm)
    },
    onError: () => toast.error("Failed to add bank account"),
  })

  const updateMutation = trpc.bankAccount.update.useMutation({
    onSuccess: () => {
      utils.bankAccount.list.invalidate()
      utils.bankAccount.selectable.invalidate()
      toast.success("Bank account updated")
      setEditId(null)
      setForm(emptyForm)
    },
    onError: () => toast.error("Failed to update bank account"),
  })

  const deleteMutation = trpc.bankAccount.delete.useMutation({
    onSuccess: () => {
      utils.bankAccount.list.invalidate()
      utils.bankAccount.selectable.invalidate()
      toast.success("Bank account deleted")
    },
    onError: () => toast.error("Failed to delete bank account"),
  })

  const setDefaultMutation = trpc.bankAccount.setDefault.useMutation({
    onSuccess: () => {
      utils.bankAccount.list.invalidate()
      utils.bankAccount.selectable.invalidate()
      toast.success("Default bank account updated")
    },
    onError: () => toast.error("Failed to set default"),
  })

  const handleOpenAdd = () => {
    setForm(emptyForm)
    setEditId(null)
    setAddOpen(true)
  }

  const handleOpenEdit = (account: NonNullable<typeof listQuery.data>[number]) => {
    setForm({
      bankName: account.bankName,
      accountNumber: account.accountNumber ?? "",
      iban: account.iban ?? "",
      swiftCode: account.swiftCode ?? "",
      branch: account.branch ?? "",
      isDefault: account.isDefault,
    })
    setEditId(account.id)
    setAddOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.bankName.trim()) {
      toast.warning("Bank name is required")
      return
    }
    if (editId) {
      await updateMutation.mutateAsync({
        id: editId,
        bankName: form.bankName,
        accountNumber: form.accountNumber || undefined,
        iban: form.iban || undefined,
        swiftCode: form.swiftCode || undefined,
        branch: form.branch || undefined,
        isDefault: form.isDefault,
      })
    } else {
      await createMutation.mutateAsync({
        bankName: form.bankName,
        accountNumber: form.accountNumber || undefined,
        iban: form.iban || undefined,
        swiftCode: form.swiftCode || undefined,
        branch: form.branch || undefined,
        isDefault: form.isDefault,
      })
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bank Accounts"
        description="Manage your company bank accounts for cheque and payment tracking"
      >
        <Button onClick={handleOpenAdd} className="bg-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Bank Account
        </Button>
      </PageHeader>

      {listQuery.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : !listQuery.data || listQuery.data.length === 0 ? (
        <EmptyState
          title="No bank accounts"
          description="Add your company bank accounts to link them with cheques and transactions"
        />
      ) : (
        <div className="space-y-3">
          {listQuery.data.map((account) => (
            <Card key={account.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-semibold text-sm">{account.bankName}</p>
                    {account.isDefault && (
                      <StatusBadge variant="success">Default</StatusBadge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1 text-xs text-muted-foreground">
                    {account.accountNumber && (
                      <div>
                        <span className="font-medium">Account: </span>
                        {account.accountNumber}
                      </div>
                    )}
                    {account.iban && (
                      <div>
                        <span className="font-medium">IBAN: </span>
                        {account.iban}
                      </div>
                    )}
                    {account.swiftCode && (
                      <div>
                        <span className="font-medium">SWIFT: </span>
                        {account.swiftCode}
                      </div>
                    )}
                    {account.branch && (
                      <div>
                        <span className="font-medium">Branch: </span>
                        {account.branch}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!account.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDefaultMutation.mutate({ id: account.id })}
                      disabled={setDefaultMutation.isPending}
                      title="Set as default"
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEdit(account)}
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <ConfirmDialog
                    trigger={
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-danger" />
                      </Button>
                    }
                    title="Delete Bank Account"
                    description={`Are you sure you want to delete "${account.bankName}"? This cannot be undone.`}
                    confirmText="Delete"
                    destructive
                    onConfirm={async () => {
                      await deleteMutation.mutateAsync({ id: account.id });
                    }}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={addOpen} onOpenChange={(open) => { setAddOpen(open); if (!open) setForm(emptyForm) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Bank Account" : "Add Bank Account"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1.5">Bank Name *</p>
              <Input
                value={form.bankName}
                onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))}
                placeholder="e.g. Emirates NBD"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1.5">Account Number</p>
                <Input
                  value={form.accountNumber}
                  onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value }))}
                  placeholder="1234567890"
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1.5">IBAN</p>
                <Input
                  value={form.iban}
                  onChange={(e) => setForm((f) => ({ ...f, iban: e.target.value }))}
                  placeholder="AE07 0331 2345 6789 0123 456"
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1.5">SWIFT / BIC Code</p>
                <Input
                  value={form.swiftCode}
                  onChange={(e) => setForm((f) => ({ ...f, swiftCode: e.target.value }))}
                  placeholder="EBILAEAD"
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1.5">Branch</p>
                <Input
                  value={form.branch}
                  onChange={(e) => setForm((f) => ({ ...f, branch: e.target.value }))}
                  placeholder="Main Branch"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
                className="rounded border-border"
              />
              <span className="text-sm">Set as default bank account</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSaving}
              className="bg-primary"
            >
              {isSaving ? "Saving..." : editId ? "Save Changes" : "Add Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
