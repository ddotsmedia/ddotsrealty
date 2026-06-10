"use client"

import { useRouter, useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import {
  maintenanceCreateSchema,
  maintenanceUpdateSchema,
  type MaintenanceCreate,
  type MaintenanceUpdate,
} from "@/lib/validators/maintenance"
import {
  MAINTENANCE_CATEGORIES,
  MAINTENANCE_PRIORITIES,
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

interface MaintenanceFormProps {
  mode: "create" | "edit"
}

export function MaintenanceForm({ mode }: MaintenanceFormProps) {
  const router = useRouter()
  const params = useParams()
  const id = mode === "edit" ? (params.id as string) : undefined

  const form = useForm<MaintenanceCreate | MaintenanceUpdate>({
    resolver: zodResolver(
      mode === "create" ? maintenanceCreateSchema : maintenanceUpdateSchema
    ) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    defaultValues: {
      propertyId: "",
      propertyTenantId: undefined,
      category: "other",
      priority: "medium",
      status: "reported",
      description: "",
      assignedTo: undefined,
      costEstimate: undefined,
      beforePhotos: [],
    },
  })

  const selectablePropertiesQuery = trpc.maintenance.selectableProperties.useQuery()
  const selectableTenantsQuery = trpc.maintenance.selectableTenants.useQuery()
  const getByIdQuery = mode === "edit" ? trpc.maintenance.getById.useQuery({ id: id! }) : undefined
  const createMutation = trpc.maintenance.create.useMutation()
  const updateMutation = trpc.maintenance.update.useMutation()

  const isLoading =
    selectablePropertiesQuery.isLoading ||
    selectableTenantsQuery.isLoading ||
    (mode === "edit" && getByIdQuery?.isLoading)

  // Populate form when edit data loads
  if (mode === "edit" && getByIdQuery?.data && !form.formState.isDirty) {
    const data = getByIdQuery.data
    form.reset({
      id: data.id,
      propertyId: data.propertyId,
      propertyTenantId: data.propertyTenantId || undefined,
      category: (data.category as any) || "other", // eslint-disable-line @typescript-eslint/no-explicit-any
      priority: (data.priority as any) || "medium", // eslint-disable-line @typescript-eslint/no-explicit-any
      status: (data.status as any) || "reported", // eslint-disable-line @typescript-eslint/no-explicit-any
      description: data.description,
      assignedTo: data.assignedTo || undefined,
      costEstimate: data.costEstimate ? Number(data.costEstimate) : undefined,
      beforePhotos: (data.beforePhotos as string[]) || [],
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

  const onSubmit = async (data: MaintenanceCreate | MaintenanceUpdate) => {
    try {
      if (mode === "create") {
        const result = await createMutation.mutateAsync(data as MaintenanceCreate)
        toast.success("Maintenance request created")
        router.push(`/maintenance/${result.id}`)
      } else {
        await updateMutation.mutateAsync(data as MaintenanceUpdate)
        toast.success("Maintenance request updated")
        router.push(`/maintenance/${id}`)
      }
    } catch (error) {
      toast.error(mode === "create" ? "Failed to create request" : "Failed to update request")
      console.error(error)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Property & Details */}
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-base">Request Details</h3>

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

          <FormField
            control={form.control}
            name="propertyTenantId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tenant (Optional)</FormLabel>
                <Select value={field.value ?? ""} onValueChange={(v) => field.onChange(v || null)}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tenant (optional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {(selectableTenantsQuery.data ?? []).map((t: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                      <SelectItem key={t.id} value={t.id}>
                        {t.label}
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
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MAINTENANCE_CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
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
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MAINTENANCE_PRIORITIES.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Card>

        {/* Description */}
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-base">Issue Description</h3>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description *</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe the maintenance issue..."
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </Card>

        {/* Assignment & Costs */}
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-base">Assignment &amp; Costs</h3>

          <FormField
            control={form.control}
            name="assignedTo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assigned To (Vendor/Person)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Vendor or person name"
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
            name="costEstimate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cost Estimate (AED)</FormLabel>
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

        {/* Photos */}
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-base">Before Photos</h3>

          <FormField
            control={form.control}
            name="beforePhotos"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Before Photos</FormLabel>
                <FormControl>
                  <FileUpload
                    value={field.value ?? []}
                    onChange={field.onChange}
                    folder="maintenance"
                    multiple
                    label="Upload before photos"
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
              ? "Create Request"
              : "Update Request"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
