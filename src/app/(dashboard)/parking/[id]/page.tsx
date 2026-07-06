"use client"

import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useState } from "react"
import { Edit, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { EmptyState } from "@/components/shared/empty-state"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { trpc } from "@/lib/trpc"
import {
  PARKING_TYPES,
  labelOf,
} from "@/lib/constants"
import { formatDate } from "@/lib/utils"

const assignSchema = z.object({
  assignedTo: z.string().uuid("Tenant is required"),
  contractId: z.string().uuid().nullish(),
  vehiclePlate: z.string().max(50).optional(),
  vehicleMake: z.string().max(100).optional(),
})

type AssignFormData = z.infer<typeof assignSchema>

export default function ParkingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [openAssignDialog, setOpenAssignDialog] = useState(false)

  const { data: slot, isLoading } = trpc.parking.getById.useQuery({ id })
  const selectableTenantsQuery = trpc.parking.selectableTenants.useQuery()
  const deleteMutation = trpc.parking.delete.useMutation()
  const assignMutation = trpc.parking.assign.useMutation()
  const unassignMutation = trpc.parking.unassign.useMutation()

  const assignForm = useForm<AssignFormData>({
    resolver: zodResolver(assignSchema),
    defaultValues: {
      assignedTo: "",
      contractId: undefined,
      vehiclePlate: "",
      vehicleMake: "",
    },
  })

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({ id })
      toast.success("Parking slot deleted")
      router.push("/parking")
    } catch {
      toast.error("Failed to delete parking slot")
    }
  }

  const handleAssign = async (data: AssignFormData) => {
    try {
      await assignMutation.mutateAsync({
        id,
        assignedTo: data.assignedTo,
        contractId: data.contractId,
        vehiclePlate: data.vehiclePlate,
        vehicleMake: data.vehicleMake,
      })
      toast.success("Parking slot assigned")
      setOpenAssignDialog(false)
      assignForm.reset()
    } catch {
      toast.error("Failed to assign parking slot")
    }
  }

  const handleUnassign = async () => {
    try {
      await unassignMutation.mutateAsync({ id })
      toast.success("Parking slot unassigned")
    } catch {
      toast.error("Failed to unassign parking slot")
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

  if (!slot) {
    return (
      <div className="space-y-6">
        <PageHeader title="Slot Not Found" />
        <EmptyState
          title="Parking slot not found"
          description="The slot you're looking for doesn't exist"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Parking Slot — ${slot.property?.title ?? slot.propertyId}`}
      >
        <div className="flex flex-wrap gap-2">
          <Link href={`/parking/${id}/edit`}>
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
            title="Delete Slot"
            description="Are you sure? This cannot be undone."
            confirmText="Delete"
            onConfirm={handleDelete}
            destructive
          />
        </div>
      </PageHeader>

      {/* Availability Badge */}
      <div className="flex flex-wrap items-center gap-3">
        {slot.isAvailable ? (
          <StatusBadge variant="success">Available</StatusBadge>
        ) : (
          <StatusBadge variant="info">Assigned</StatusBadge>
        )}
      </div>

      {/* Key Facts */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Slot Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Property</p>
            {slot.property ? (
              <Link
                href={`/properties/${slot.property.id}`}
                className="font-semibold text-primary hover:underline"
              >
                {slot.property.title}
              </Link>
            ) : (
              <p className="font-semibold">—</p>
            )}
          </div>
          {slot.slotNumber && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Slot Number</p>
              <p className="font-semibold">{slot.slotNumber}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Type</p>
            <p className="font-semibold">{labelOf(PARKING_TYPES, slot.type)}</p>
          </div>
          {slot.floorLevel && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Floor Level</p>
              <p className="font-semibold">{slot.floorLevel}</p>
            </div>
          )}
          {slot.assignedTenant && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Assigned Tenant</p>
              <p className="font-semibold">{slot.assignedTenant.name}</p>
            </div>
          )}
          {slot.vehiclePlate && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Vehicle Plate</p>
              <p className="font-semibold">{slot.vehiclePlate}</p>
            </div>
          )}
          {slot.vehicleMake && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Vehicle Make</p>
              <p className="font-semibold">{slot.vehicleMake}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Notes */}
      {slot.notes && (
        <Card className="p-6">
          <h3 className="font-semibold mb-3">Notes</h3>
          <p className="text-muted-foreground whitespace-pre-wrap">{slot.notes}</p>
        </Card>
      )}

      {/* Assignment Section */}
      <Card className="p-6 space-y-4">
        <h3 className="font-semibold mb-3">Assignment</h3>

        {slot.isAvailable ? (
          <Dialog open={openAssignDialog} onOpenChange={setOpenAssignDialog}>
            <DialogTrigger render={<Button className="bg-primary">Assign Slot</Button>} />
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Assign Parking Slot</DialogTitle>
              </DialogHeader>
              <Form {...assignForm}>
                <form onSubmit={assignForm.handleSubmit(handleAssign)} className="space-y-4">
                  <FormField
                    control={assignForm.control}
                    name="assignedTo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tenant *</FormLabel>
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={assignForm.control}
                    name="vehiclePlate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vehicle Plate</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., AA-123"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={assignForm.control}
                    name="vehicleMake"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vehicle Make</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Toyota Camry"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-3 justify-end pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOpenAssignDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={assignMutation.isPending}
                      className="bg-primary"
                    >
                      {assignMutation.isPending ? "Assigning..." : "Assign"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        ) : (
          <div>
            <p className="text-sm text-muted-foreground mb-3">
              This slot is assigned to {slot.assignedTenant?.name}.
            </p>
            <Button
              variant="outline"
              onClick={handleUnassign}
              disabled={unassignMutation.isPending}
            >
              {unassignMutation.isPending ? "Unassigning..." : "Unassign Slot"}
            </Button>
          </div>
        )}
      </Card>

      {/* Metadata */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Metadata</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-muted-foreground">
          <div>
            <p className="font-medium mb-1">Created</p>
            <p>{formatDate(slot.createdAt)}</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
