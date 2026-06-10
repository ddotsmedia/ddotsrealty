"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { contractCreateSchema, type ContractCreate } from "@/lib/validators/contract"
import { PAYMENT_MODES, CONTRACT_STATUSES, labelOf } from "@/lib/constants"
import { trpc } from "@/lib/trpc"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { FileUpload } from "@/components/shared/file-upload"
import { Skeleton } from "@/components/ui/skeleton"
import { ExternalLink } from "lucide-react"

const NUM_CHEQUES_OPTIONS = [1, 2, 3, 4, 6, 12]

const CONTRACT_TYPES = [
  { value: "new", label: "New Contract" },
  { value: "renewal", label: "Renewal" },
]

export function ContractForm() {
  const router = useRouter()

  const form = useForm<ContractCreate>({
    resolver: zodResolver(contractCreateSchema) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    defaultValues: {
      contractType: "new",
      paymentMode: "cheques",
      numCheques: 1,
      rentAmount: undefined,
      securityDeposit: undefined,
      commissionPct: undefined,
      ejariNumber: "",
      tawtheeqNumber: "",
      contractDocUrl: "",
      notes: "",
    },
  })

  const selectablePropertiesQuery = trpc.contract.selectableProperties.useQuery()
  const selectableTenantsQuery = trpc.contract.selectableTenants.useQuery()
  const selectableOwnersQuery = trpc.contract.selectableOwners.useQuery()
  const createMutation = trpc.contract.create.useMutation()

  const paymentMode = form.watch("paymentMode")
  const rentAmount = form.watch("rentAmount")
  const numCheques = form.watch("numCheques")

  const showCheques = paymentMode === "cheques" || paymentMode === "mixed"
  const chequeAmount =
    rentAmount && numCheques && numCheques > 0
      ? Math.round((Number(rentAmount) / Number(numCheques)) * 100) / 100
      : null

  const isLoading =
    selectablePropertiesQuery.isLoading ||
    selectableTenantsQuery.isLoading ||
    selectableOwnersQuery.isLoading

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </Card>
    )
  }

  const onSubmit = async (data: ContractCreate) => {
    try {
      const result = await createMutation.mutateAsync(data)
      toast.success(`Contract created (${result.chequesCreated} cheques generated)`)
      router.push(`/contracts/${result.id}`)
    } catch (error) {
      toast.error("Failed to create contract")
      console.error(error)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Property & Parties */}
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-base">Property &amp; Parties</h3>

          <FormField
            control={form.control}
            name="propertyId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Property *</FormLabel>
                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select property" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(selectablePropertiesQuery.data ?? []).map((p: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                      <SelectItem key={p.id} value={p.id}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="propertyTenantId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tenant *</FormLabel>
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <Select value={field.value ?? ""} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select tenant" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(selectableTenantsQuery.data ?? []).map((t: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                          <SelectItem key={t.id} value={t.id}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Link href="/tenants/new" target="_blank">
                    <Button type="button" variant="outline" size="sm" className="whitespace-nowrap">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      New Tenant
                    </Button>
                  </Link>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ownerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Owner</FormLabel>
                <Select value={field.value ?? ""} onValueChange={(v) => field.onChange(v || null)}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select owner (optional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {(selectableOwnersQuery.data ?? []).map((o: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                      <SelectItem key={o.id} value={o.id}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contractType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contract Type</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CONTRACT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </Card>

        {/* Term */}
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-base">Contract Term</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date *</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={field.value instanceof Date ? field.value.toISOString().split("T")[0] : (field.value as string) ?? ""}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date *</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={field.value instanceof Date ? field.value.toISOString().split("T")[0] : (field.value as string) ?? ""}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Card>

        {/* Financials */}
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-base">Financials</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="rentAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Annual Rent (AED) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      placeholder="120000"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="securityDeposit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Security Deposit (AED)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      placeholder="10000"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="commissionPct"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Commission (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      placeholder="5"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="paymentMode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Mode</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PAYMENT_MODES.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {showCheques && (
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="numCheques"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Cheques</FormLabel>
                    <Select
                      value={String(field.value ?? 1)}
                      onValueChange={(v) => field.onChange(Number(v))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {NUM_CHEQUES_OPTIONS.map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n} {n === 1 ? "cheque" : "cheques"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {chequeAmount !== null && Number(rentAmount) > 0 && (
                <div className="rounded-md bg-primary/5 border border-primary/20 px-4 py-3 text-sm">
                  <span className="font-medium text-primary">Cheque Preview: </span>
                  Will generate{" "}
                  <strong>{numCheques}</strong>{" "}
                  {numCheques === 1 ? "cheque" : "cheques"} of approximately{" "}
                  <strong>{formatCurrency(chequeAmount)}</strong> each
                  {numCheques > 1 && " (last cheque absorbs rounding remainder)"}
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Compliance */}
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-base">Compliance &amp; Documents</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="ejariNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ejari Number</FormLabel>
                  <FormControl>
                    <Input placeholder="EJARI-XXXXXXX" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tawtheeqNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tawtheeq Number</FormLabel>
                  <FormControl>
                    <Input placeholder="TAWTHEEQ-XXXXXXX" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="contractDocUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contract Document</FormLabel>
                <FormControl>
                  <FileUpload
                    value={field.value ? [field.value] : []}
                    onChange={(urls) => field.onChange(urls[0] ?? "")}
                    folder="contracts"
                    multiple={false}
                    maxFiles={1}
                    label="Upload Contract Document"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Additional notes..."
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </Card>

        <div className="flex gap-3 justify-end pt-2 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createMutation.isPending}
            className="bg-primary"
          >
            {createMutation.isPending ? "Creating..." : "Create Contract"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
