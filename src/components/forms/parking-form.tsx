"use client"

import { useRouter, useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import {
  parkingCreateSchema,
  parkingUpdateSchema,
  type ParkingCreate,
  type ParkingUpdate,
} from "@/lib/validators/parking"
import {
  PARKING_TYPES,
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

interface ParkingFormProps {
  mode: "create" | "edit"
}

export function ParkingForm({ mode }: ParkingFormProps) {
  const router = useRouter()
  const params = useParams()
  const id = mode === "edit" ? (params.id as string) : undefined

  const form = useForm<ParkingCreate | ParkingUpdate>({
    resolver: zodResolver(
      mode === "create" ? parkingCreateSchema : parkingUpdateSchema
    ) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    defaultValues: {
      propertyId: "",
      slotNumber: "",
      floorLevel: "",
      type: "covered",
      assignedTo: undefined,
      contractId: undefined,
      vehiclePlate: "",
      vehicleMake: "",
      isAvailable: true,
      notes: "",
    },
  })

  const selectablePropertiesQuery = trpc.parking.selectableProperties.useQuery()
  const getByIdQuery = mode === "edit" ? trpc.parking.getById.useQuery({ id: id! }) : undefined
  const createMutation = trpc.parking.create.useMutation()
  const updateMutation = trpc.parking.update.useMutation()

  const isLoading =
    selectablePropertiesQuery.isLoading ||
    (mode === "edit" && getByIdQuery?.isLoading)

  // Populate form when edit data loads
  if (mode === "edit" && getByIdQuery?.data && !form.formState.isDirty) {
    const data = getByIdQuery.data
    form.reset({
      id: data.id,
      propertyId: data.propertyId,
      slotNumber: data.slotNumber || "",
      floorLevel: data.floorLevel || "",
      type: (data.type as any) || "covered", // eslint-disable-line @typescript-eslint/no-explicit-any
      assignedTo: data.assignedTo || undefined,
      contractId: data.contractId || undefined,
      vehiclePlate: data.vehiclePlate || "",
      vehicleMake: data.vehicleMake || "",
      isAvailable: data.isAvailable ?? true,
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

  const onSubmit = async (data: ParkingCreate | ParkingUpdate) => {
    try {
      if (mode === "create") {
        const result = await createMutation.mutateAsync(data as ParkingCreate)
        toast.success("Parking slot created")
        router.push(`/parking/${result.id}`)
      } else {
        await updateMutation.mutateAsync(data as ParkingUpdate)
        toast.success("Parking slot updated")
        router.push(`/parking/${id}`)
      }
    } catch (error) {
      toast.error(mode === "create" ? "Failed to create parking slot" : "Failed to update parking slot")
      console.error(error)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Slot Details */}
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-base">Parking Slot Details</h3>

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
              name="slotNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slot Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., A-101"
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
              name="floorLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Floor Level</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Ground, P1, P2"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type *</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PARKING_TYPES.map((t) => (
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

        {/* Availability */}
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-base">Status &amp; Assignment</h3>

          <FormField
            control={form.control}
            name="isAvailable"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Availability</FormLabel>
                <Select
                  value={field.value ? "true" : "false"}
                  onValueChange={(v) => field.onChange(v === "true")}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="true">Available</SelectItem>
                    <SelectItem value="false">Assigned</SelectItem>
                  </SelectContent>
                </Select>
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
                    placeholder="Add notes about this parking slot..."
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
              ? "Create Parking Slot"
              : "Update Parking Slot"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
