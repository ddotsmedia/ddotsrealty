"use client"

import { useRouter, useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"
import {
  inspectionCreateSchema,
  inspectionUpdateSchema,
  type InspectionCreate,
  type InspectionUpdate,
} from "@/lib/validators/inspection"
import {
  INSPECTION_TYPES,
  INSPECTION_CONDITIONS,
  INSPECTION_ROOMS,
  INSPECTION_ITEM_CONDITIONS,
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
import { FileUpload } from "@/components/shared/file-upload"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"

interface InspectionFormProps {
  mode: "create" | "edit"
}

interface ItemRow {
  room: string
  item: string
  condition: string
  notes: string
  photos: string[]
  deductionAmount: string
}

export function InspectionForm({ mode }: InspectionFormProps) {
  const router = useRouter()
  const params = useParams()
  const id = mode === "edit" ? (params.id as string) : undefined

  const form = useForm<InspectionCreate | InspectionUpdate>({
    resolver: zodResolver(
      mode === "create" ? inspectionCreateSchema : inspectionUpdateSchema
    ) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    defaultValues: {
      propertyId: "",
      contractId: undefined,
      propertyTenantId: undefined,
      type: "move_in",
      inspectionDate: undefined,
      inspectorName: "",
      inspectorRole: "",
      overallCondition: undefined,
      notes: "",
      tenantSigned: false,
      items: [],
    },
  })

  const selectablePropertiesQuery = trpc.inspection.selectableProperties.useQuery()
  const getByIdQuery = mode === "edit" ? trpc.inspection.getById.useQuery({ id: id! }) : undefined
  const createMutation = trpc.inspection.create.useMutation()
  const updateMutation = trpc.inspection.update.useMutation()

  const itemRows = form.watch("items") || []

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
      type: (data.type as any) || "move_in", // eslint-disable-line @typescript-eslint/no-explicit-any
      inspectionDate: data.inspectionDate ? new Date(data.inspectionDate) : undefined,
      inspectorName: data.inspectorName || "",
      inspectorRole: data.inspectorRole || "",
      overallCondition: (data.overallCondition as any) || undefined, // eslint-disable-line @typescript-eslint/no-explicit-any
      notes: data.notes || "",
      tenantSigned: data.tenantSigned || false,
      items: (data.items as any) || [], // eslint-disable-line @typescript-eslint/no-explicit-any
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

  const onSubmit = async (data: InspectionCreate | InspectionUpdate) => {
    try {
      if (mode === "create") {
        const result = await createMutation.mutateAsync(data as InspectionCreate)
        toast.success("Inspection created")
        router.push(`/inspections/${result.id}`)
      } else {
        await updateMutation.mutateAsync(data as InspectionUpdate)
        toast.success("Inspection updated")
        router.push(`/inspections/${id}`)
      }
    } catch (error) {
      toast.error(
        mode === "create" ? "Failed to create inspection" : "Failed to update inspection"
      )
    }
  }

  const handleAddItem = () => {
    const items = form.getValues("items") || []
    form.setValue("items", [
      ...items,
      {
        room: "other",
        item: "",
        condition: "good",
        notes: "",
        photos: [],
        deductionAmount: undefined,
      },
    ])
  }

  const handleRemoveItem = (index: number) => {
    const items = form.getValues("items") || []
    form.setValue("items", items.filter((_, i) => i !== index))
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card className="p-6 space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-lg font-semibold">Inspection Details</h2>
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
                        {INSPECTION_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Inspection Date */}
            <FormField
              control={form.control}
              name="inspectionDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inspection Date</FormLabel>
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
            {/* Inspector Name */}
            <FormField
              control={form.control}
              name="inspectorName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inspector Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Inspector Role */}
            <FormField
              control={form.control}
              name="inspectorRole"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inspector Role</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Property Manager" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Overall Condition */}
          <FormField
            control={form.control}
            name="overallCondition"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Overall Condition</FormLabel>
                <FormControl>
                  <Select
                    value={field.value || ""}
                    onValueChange={(v) => field.onChange(v || undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {INSPECTION_CONDITIONS.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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

          {/* Tenant Signed */}
          <FormField
            control={form.control}
            name="tenantSigned"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Tenant Signed</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Confirm that tenant has signed the inspection report
                  </p>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </Card>

        {/* Items Section */}
        <Card className="p-6 space-y-6">
          <div className="border-b pb-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold">Inspection Items</h2>
            <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
              + Add Item
            </Button>
          </div>

          {itemRows.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No items added. Click "Add Item" to begin.
            </p>
          ) : (
            <div className="space-y-4">
              {itemRows.map((_, index) => (
                <div
                  key={index}
                  className="border border-border rounded-lg p-4 space-y-4 relative"
                >
                  <div className="absolute top-3 right-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(index)}
                      className="text-danger hover:bg-danger/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Room */}
                    <FormField
                      control={form.control}
                      name={`items.${index}.room`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Room</FormLabel>
                          <FormControl>
                            <Select
                              value={field.value}
                              onValueChange={(v) => field.onChange(v ?? "")}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {INSPECTION_ROOMS.map((r) => (
                                  <SelectItem key={r.value} value={r.value}>
                                    {r.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Item */}
                    <FormField
                      control={form.control}
                      name={`items.${index}.item`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Item *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. Wall paint, Sofa, Door handle"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Condition */}
                    <FormField
                      control={form.control}
                      name={`items.${index}.condition`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Condition</FormLabel>
                          <FormControl>
                            <Select
                              value={field.value}
                              onValueChange={(v) => field.onChange(v ?? "")}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {INSPECTION_ITEM_CONDITIONS.map((c) => (
                                  <SelectItem key={c.value} value={c.value}>
                                    {c.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Deduction Amount */}
                    <FormField
                      control={form.control}
                      name={`items.${index}.deductionAmount`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Deduction Amount (AED)</FormLabel>
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
                  </div>

                  {/* Notes */}
                  <FormField
                    control={form.control}
                    name={`items.${index}.notes`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Deep scratch on surface" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Photos */}
                  <FormField
                    control={form.control}
                    name={`items.${index}.photos`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Photos</FormLabel>
                        <FormControl>
                          <FileUpload
                            value={field.value || []}
                            onChange={field.onChange}
                            folder="inspections"
                            multiple
                            label="Upload item photos"
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
              ? "Create Inspection"
              : "Update Inspection"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}
