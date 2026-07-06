"use client"

import { useRouter, useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"
import {
  keyHandoverCreateSchema,
  keyHandoverUpdateSchema,
  type KeyHandoverCreate,
  type KeyHandoverUpdate,
} from "@/lib/validators/key-handover"
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
import { Switch } from "@/components/ui/switch"

interface KeyHandoverFormProps {
  mode: "create" | "edit"
}

interface KeyRow {
  type: string
  quantity: number
  condition?: string
}

export function KeyHandoverForm({ mode }: KeyHandoverFormProps) {
  const router = useRouter()
  const params = useParams()
  const id = mode === "edit" ? (params.id as string) : undefined

  const form = useForm<KeyHandoverCreate | KeyHandoverUpdate>({
    resolver: zodResolver(
      mode === "create" ? keyHandoverCreateSchema : keyHandoverUpdateSchema
    ) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    defaultValues: {
      propertyId: "",
      contractId: undefined,
      propertyTenantId: undefined,
      type: "handover",
      handoverDate: undefined,
      keys: [],
      receivedBy: "",
      handedBy: "",
      receiptSigned: false,
      notes: "",
    },
  })

  const selectablePropertiesQuery = trpc.keyHandover.selectableProperties.useQuery()
  const getByIdQuery = mode === "edit" ? trpc.keyHandover.getById.useQuery({ id: id! }) : undefined
  const createMutation = trpc.keyHandover.create.useMutation()
  const updateMutation = trpc.keyHandover.update.useMutation()

  const keyRows = form.watch("keys") || []

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
      type: (data.type as any) || "handover", // eslint-disable-line @typescript-eslint/no-explicit-any
      handoverDate: data.handoverDate ? new Date(data.handoverDate) : undefined,
      keys: (data.keys as any) || [], // eslint-disable-line @typescript-eslint/no-explicit-any
      receivedBy: data.receivedBy || "",
      handedBy: data.handedBy || "",
      receiptSigned: data.receiptSigned || false,
      notes: data.notes || "",
    } as any) // eslint-disable-line @typescript-eslint/no-explicit-any
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </Card>
    )
  }

  const onSubmit = async (data: KeyHandoverCreate | KeyHandoverUpdate) => {
    try {
      if (mode === "create") {
        const result = await createMutation.mutateAsync(data as KeyHandoverCreate)
        toast.success("Key handover created")
        router.push(`/key-handovers/${result.id}`)
      } else {
        await updateMutation.mutateAsync(data as KeyHandoverUpdate)
        toast.success("Key handover updated")
        router.push(`/key-handovers/${id}`)
      }
    } catch (error) {
      toast.error(
        mode === "create" ? "Failed to create key handover" : "Failed to update key handover"
      )
    }
  }

  const handleAddKey = () => {
    const keys = form.getValues("keys") || []
    form.setValue("keys", [
      ...keys,
      {
        type: "",
        quantity: 1,
        condition: "",
      },
    ])
  }

  const handleRemoveKey = (index: number) => {
    const keys = form.getValues("keys") || []
    form.setValue("keys", keys.filter((_, i) => i !== index))
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card className="p-6 space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-lg font-semibold">Handover Details</h2>
          </div>

          {/* Property */}
          <FormField
            control={form.control}
            name="propertyId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Property *</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={(v) => field.onChange(v ?? "")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select property" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectablePropertiesQuery.data?.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={(v) => field.onChange(v ?? "")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="handover">Handover</SelectItem>
                        <SelectItem value="return">Return</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Handover Date */}
            <FormField
              control={form.control}
              name="handoverDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Handover Date</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      value={
                        field.value
                          ? new Date(field.value).toISOString().slice(0, 16)
                          : ""
                      }
                      onChange={(e) =>
                        field.onChange(e.target.value ? new Date(e.target.value) : null)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Handed By */}
            <FormField
              control={form.control}
              name="handedBy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Handed By</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Received By */}
            <FormField
              control={form.control}
              name="receivedBy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Received By</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Jane Smith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Notes */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea placeholder="Add any additional notes..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Receipt Signed */}
          <FormField
            control={form.control}
            name="receiptSigned"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Receipt Signed</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Confirm that receipt has been signed
                  </p>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </Card>

        {/* Keys Section */}
        <Card className="p-6 space-y-6">
          <div className="border-b pb-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold">Keys</h2>
            <Button type="button" variant="outline" size="sm" onClick={handleAddKey}>
              + Add Key
            </Button>
          </div>

          {keyRows.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No keys added. Click "Add Key" to begin.
            </p>
          ) : (
            <div className="space-y-4">
              {keyRows.map((_, index) => (
                <div
                  key={index}
                  className="border border-border rounded-lg p-4 space-y-4 relative"
                >
                  <div className="absolute top-3 right-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveKey(index)}
                      className="text-danger hover:bg-danger/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Key Type */}
                    <FormField
                      control={form.control}
                      name={`keys.${index}.type`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Key Type *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. Main Door, Gate, Office"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Quantity */}
                    <FormField
                      control={form.control}
                      name={`keys.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Condition */}
                  <FormField
                    control={form.control}
                    name={`keys.${index}.condition`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Condition</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Good, Worn, New"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Submit */}
        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="bg-primary"
          >
            {createMutation.isPending || updateMutation.isPending
              ? "Saving..."
              : mode === "create"
              ? "Create Handover"
              : "Update Handover"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}
