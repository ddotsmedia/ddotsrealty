"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { PageHeader } from "@/components/shared/page-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { trpc } from "@/lib/trpc"

export default function ClearanceNewPage() {
  const router = useRouter()

  const [contractId, setContractId] = useState<string>("")
  const [noticeDate, setNoticeDate] = useState<string>("")
  const [noticePeriodDays, setNoticePeriodDays] = useState<string>("")
  const [plannedMoveOut, setPlannedMoveOut] = useState<string>("")
  const [depositAmount, setDepositAmount] = useState<string>("")

  const { data: contracts } = trpc.clearance.selectableContracts.useQuery()
  const createMutation = trpc.clearance.create.useMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contractId) {
      toast.error("Please select a contract")
      return
    }
    try {
      const result = await createMutation.mutateAsync({
        contractId,
        noticeDate: noticeDate ? new Date(noticeDate) : undefined,
        noticePeriodDays: noticePeriodDays ? Number(noticePeriodDays) : undefined,
        plannedMoveOut: plannedMoveOut ? new Date(plannedMoveOut) : undefined,
        depositAmount: depositAmount ? Number(depositAmount) : undefined,
      })
      toast.success("Clearance created")
      router.push(`/clearances/${result.id}`)
    } catch {
      toast.error("Failed to create clearance")
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="New Tenant Clearance" />

      <Card className="p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm font-medium mb-2 block">Contract</label>
            <Select
              value={contractId}
              onValueChange={(v) => setContractId(v ?? "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select contract..." />
              </SelectTrigger>
              <SelectContent>
                {contracts?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Notice Date</label>
            <Input
              type="date"
              value={noticeDate}
              onChange={(e) => setNoticeDate(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Notice Period (days)</label>
            <Input
              type="number"
              min="0"
              placeholder="e.g. 90"
              value={noticePeriodDays}
              onChange={(e) => setNoticePeriodDays(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Planned Move-Out Date</label>
            <Input
              type="date"
              value={plannedMoveOut}
              onChange={(e) => setPlannedMoveOut(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Security Deposit Amount (AED)</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              className="bg-primary"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Create Clearance"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/clearances")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
