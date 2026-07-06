"use client"

import { useRouter, useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import {
  utilityCreateSchema,
  utilityUpdateSchema,
  type UtilityCreate,
  type UtilityUpdate,
} from "@/lib/validators/utility"
import {
  UTILITY_TYPES,
  UTILITY_STATUSES,
  labelOf,
} from "@/lib/constants"
import { trpc } from "@/lib/trpc"
import {
  Button,
} from "@/components/ui/button"
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
import { Skeleton } from "@/components/ui/skeleton"

interface UtilityFormProps {
  mode: "create" | "edit"
}

export function UtilityForm({ mode }: UtilityFormProps) {
  const router = useRouter()
  const params = useParams()
  const id = mode === "edit" ? (params.id as string) : undefined

  const form = useForm<UtilityCreate | UtilityUpdate>({
    resolver: zodResolver(
      mode === "create" ? utilityCreateSchema : utilityUpdateSchema
    ) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    defaultValues: {
      propertyId: "",
      contractId: undefined,
      propertyTenantId: undefined,
      utilityType: "dewa",
      accountNumber: "",
      premiseNumber: "",
      status: "pending_activation",
      activationDate: undefined,
      deactivationDate: undefined,
      securityDeposit: undefined,
      depositRefunded: false,
      clearanceCertUrl: undefined,
      notes: "",
    },
  })

  const selectablePropertiesQuery = trpc.utility.selectableProperties.useQuery()
  const getByIdQuery = mode === "edit" ? trpc.utility.getById.useQuery({ id: id! }) : undefined
  const createMutation = trpc.utility.create.useMutation()
  const updateMutation = trpc.utility.update.useMutation()

  const isLoading =
    selectablePropertiesQuery.isLoading ||
    (mode === "edit" && getByIdQuery?.isLoading)

  // Populate form when edit data loads
  if (mode === "edit" && getByIdQuery?.data && !form.formState.isDirty) {
    const data = getByIdQuery.data
    form.reset({
      id: data.id,
      propertyId: data.propertyId,
      contractId: data.contractId || undefined,
      propertyTenantId: data.propertyTenantId || undefined,
      utilityType: (data.utilityType as any) || "dewa", // eslint-disable-line @typescript-eslint/no-explicit-any
      accountNumber: data.accountNumber || "",
      premiseNumber: data.premiseNumber || "",
      status: (data.status as any) || "pending_activation", // eslint-disable-line @typescript-eslint/no-explicit-any
      activationDate: data.activationDate ? new Date(data.activationDate) : undefined,
      deactivationDate: data.deactivationDate ? new Date(data.deactivationDate) : undefined,
      securityDeposit: data.securityDeposit ? Number(data.securityDeposit) : undefined,
      depositRefunded: data.depositRefunded || false,
      clearanceCertUrl: data.clearanceCertUrl || undefined,
      notes: data.notes || "",
    } as any) // eslint-disable-line @typescript-eslint/no-explicit-any
  }

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

  const onSubmit = async (data: UtilityCreate | UtilityUpdate) => {
    try {
      if (mode === "create") {
        const result = await createMutation.mutateAsync(data as UtilityCreate)
        toast.success("Utility account created")
        router.push(`/utilities/${result.id}`)
      } else {
        await updateMutation.mutateAsync(data as UtilityUpdate)
        toast.success("Utility account updated")
        router.push(`/utilities/${id}`)
      }
    } catch (error) {
      toast.error(mode === "create" ? "Failed to create utility account" : "Failed to update utility account")
      console.error(error)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-base">Utility Account Details</h3>

          <FormField
            control={form.control}
            name="propertyId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Property *</FormLabel>
                <Select value={field.value ?? ""} onValueChange={field.onChange} disabled={mode === "edit"}>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="utilityType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Utility Type *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {UTILITY_TYPES.map((t) => (
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

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {UTILITY_STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="accountNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Account number"
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
              name="premiseNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Premise Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Premise number"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Card>

        {/* Dates & Financials */}
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-base">Timeline &amp; Financials</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="activationDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Activation Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      value={
                        field.value instanceof Date
                          ? field.value.toISOString().split("T")[0]
                          : field.value || ""
                      }
                      onChange={(e) => {
                        const val = e.target.value
                        field.onChange(val ? new Date(val) : null)
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deactivationDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deactivation Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      value={
                        field.value instanceof Date
                          ? field.value.toISOString().split("T")[0]
                          : field.value || ""
                      }
                      onChange={(e) => {
                        const val = e.target.value
                        field.onChange(val ? new Date(val) : null)
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

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
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </Card>

        {/* Notes */}
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-base">Additional Information</h3>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Add notes about this utility account..."
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
            disabled={createMutation.isPending || updateMutation.isPending}
            className="bg-primary"
          >
            {createMutation.isPending || updateMutation.isPending
              ? mode === "create"
                ? "Creating..."
                : "Updating..."
              : mode === "create"
              ? "Create Utility Account"
              : "Update Utility Account"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
