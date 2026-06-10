"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { leadCreateSchema, type LeadCreate } from "@/lib/validators/lead"
import { LEAD_SOURCES, LEAD_STATUSES, labelOf } from "@/lib/constants"
import { trpc } from "@/lib/trpc"
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
import { Skeleton } from "@/components/ui/skeleton"

interface LeadFormProps {
  mode: "create" | "edit"
  lead?: Record<string, any>
}

export function LeadForm({ mode, lead }: LeadFormProps) {
  const router = useRouter()

  const form = useForm<LeadCreate>({
    resolver: zodResolver(leadCreateSchema) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    defaultValues: lead || {
      name: "",
      phone: undefined,
      email: undefined,
      source: "website",
      status: "new",
      listingId: undefined,
      assignedTo: undefined,
      budgetMin: undefined,
      budgetMax: undefined,
      requirements: undefined,
      nextFollowUp: undefined,
      notes: undefined,
    },
  })

  const selectableBrokersQuery = trpc.lead.selectableBrokers.useQuery()
  const selectableListingsQuery = trpc.lead.selectableListings.useQuery()
  const createMutation = trpc.lead.create.useMutation()
  const updateMutation = trpc.lead.update.useMutation()

  const isLoading = selectableBrokersQuery.isLoading || selectableListingsQuery.isLoading

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

  const onSubmit = async (data: LeadCreate) => {
    try {
      if (mode === "create") {
        const result = await createMutation.mutateAsync(data)
        toast.success("Lead created")
        router.push(`/leads/${result.id}`)
      } else {
        if (!lead?.id) {
          toast.error("Lead ID required for update")
          return
        }
        await updateMutation.mutateAsync({ ...data, id: lead.id })
        toast.success("Lead updated")
        router.push(`/leads/${lead.id}`)
      }
    } catch (error) {
      toast.error(`Failed to ${mode === "create" ? "create" : "update"} lead`)
      console.error(error)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Contact */}
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-base">Contact</h3>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Lead name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="+971 50 123 4567" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="email@example.com" type="email" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="source"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Source</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {LEAD_SOURCES.map((s) => (
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
        </Card>

        {/* Pipeline */}
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-base">Pipeline</h3>

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {LEAD_STATUSES.map((s) => (
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

          <FormField
            control={form.control}
            name="assignedTo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assigned To</FormLabel>
                <Select value={field.value ?? ""} onValueChange={(v) => field.onChange(v || null)}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select broker" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {(selectableBrokersQuery.data ?? []).map((b: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
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
            name="listingId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Listing</FormLabel>
                <Select value={field.value ?? ""} onValueChange={(v) => field.onChange(v || null)}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select listing" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {(selectableListingsQuery.data ?? []).map((l: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                      <SelectItem key={l.id} value={l.id}>
                        {l.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </Card>

        {/* Budget */}
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-base">Budget</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="budgetMin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget Min (AED)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      placeholder="100000"
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
              name="budgetMax"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget Max (AED)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      placeholder="500000"
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

        {/* Follow-up */}
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-base">Follow-up</h3>

          <FormField
            control={form.control}
            name="nextFollowUp"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Next Follow-up</FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    value={field.value instanceof Date ? field.value.toISOString().slice(0, 16) : String(field.value ?? "")}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </Card>

        {/* Notes */}
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-base">Notes</h3>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Additional notes about this lead..."
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
              ? "Saving..."
              : mode === "create"
                ? "Create Lead"
                : "Update Lead"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
