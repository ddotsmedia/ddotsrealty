"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { PageHeader } from "@/components/shared/page-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { trpc } from "@/lib/trpc"
import { NOC_TYPES } from "@/lib/constants"

export default function NocRequestNewPage() {
  const router = useRouter()

  const [propertyTenantId, setPropertyTenantId] = useState<string>("")
  const [contractId, setContractId] = useState<string>("")
  const [nocType, setNocType] = useState<string>("other")
  const [description, setDescription] = useState<string>("")

  const { data: tenants } = trpc.noc.selectableTenants.useQuery()
  const { data: contracts } = trpc.noc.selectableContracts.useQuery()
  const createMutation = trpc.noc.create.useMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const result = await createMutation.mutateAsync({
        propertyTenantId: propertyTenantId || undefined,
        contractId: contractId || undefined,
        nocType: nocType as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        description: description || undefined,
      })
      toast.success("NOC request created")
      router.push(`/noc-requests/${result.id}`)
    } catch {
      toast.error("Failed to create NOC request")
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="New NOC Request" />

      <Card className="p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm font-medium mb-2 block">Tenant</label>
            <Select
              value={propertyTenantId}
              onValueChange={(v) => setPropertyTenantId(v ?? "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select tenant (optional)..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">— None —</SelectItem>
                {tenants?.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Contract (optional)</label>
            <Select
              value={contractId}
              onValueChange={(v) => setContractId(v ?? "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select contract (optional)..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">— None —</SelectItem>
                {contracts?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">NOC Type</label>
            <Select
              value={nocType}
              onValueChange={(v) => setNocType(v ?? "other")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NOC_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Description (optional)</label>
            <Textarea
              placeholder="Describe the reason for this NOC request..."
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              className="bg-primary"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Create Request"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/noc-requests")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
