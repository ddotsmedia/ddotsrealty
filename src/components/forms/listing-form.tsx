"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { listingCreateSchema, type ListingCreate } from "@/lib/validators/listing"
import { LISTING_STATUSES, LISTING_TYPES, labelOf } from "@/lib/constants"
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
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"

interface ListingFormProps {
  mode: "create" | "edit"
  initialData?: any // eslint-disable-line @typescript-eslint/no-explicit-any
}

export function ListingForm({ mode, initialData }: ListingFormProps) {
  const router = useRouter()

  const form = useForm<ListingCreate>({
    resolver: zodResolver(listingCreateSchema) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    defaultValues: initialData || {
      propertyId: "",
      brokerId: "",
      title: "",
      description: "",
      listingType: "rent",
      price: undefined,
      isFeatured: false,
      featuredUntil: undefined,
      trakheesiPermit: "",
      permitExpiry: undefined,
      status: "draft",
      expiresAt: undefined,
    },
  })

  const selectablePropertiesQuery = trpc.listing.selectableProperties.useQuery()
  const selectableBrokersQuery = trpc.listing.selectableBrokers.useQuery()
  const createMutation = trpc.listing.create.useMutation()
  const updateMutation = trpc.listing.update.useMutation()

  const selectedPropertyId = form.watch("propertyId")
  const isFeatured = form.watch("isFeatured")

  const isLoading = selectablePropertiesQuery.isLoading || selectableBrokersQuery.isLoading

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

  const onSubmit = async (data: ListingCreate) => {
    try {
      if (mode === "create") {
        const result = await createMutation.mutateAsync(data)
        toast.success("Listing created")
        router.push(`/listings/${result.id}`)
      } else {
        await updateMutation.mutateAsync({ ...data, id: initialData.id })
        toast.success("Listing updated")
        router.push(`/listings/${initialData.id}`)
      }
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      toast.error(error?.message || "Failed to save listing")
      console.error(error)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Source */}
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-base">Source</h3>

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
        </Card>

        {/* Details */}
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-base">Details</h3>

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title *</FormLabel>
                <FormControl>
                  <Input placeholder="Listing title" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="listingType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {LISTING_TYPES.map((t) => (
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (AED)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      placeholder="50000"
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
              name="brokerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Broker</FormLabel>
                  <Select value={field.value ?? ""} onValueChange={(v) => field.onChange(v || null)}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select broker (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {(selectableBrokersQuery.data ?? []).map((b: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                        <SelectItem key={b.id} value={b.id}>
                          {b.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Listing description..."
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </Card>

        {/* Compliance */}
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-base">Compliance</h3>

          <FormField
            control={form.control}
            name="trakheesiPermit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Trakheesi Permit (Required to publish Dubai listings)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Trakheesi permit number"
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
            name="permitExpiry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Permit Expiry Date</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={field.value instanceof Date ? field.value.toISOString().split("T")[0] : (field.value ?? "") as string}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </Card>

        {/* Settings */}
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-base">Settings</h3>

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
                    {LISTING_STATUSES.map((s) => (
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

          <div className="flex items-center gap-2">
            <FormField
              control={form.control}
              name="isFeatured"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Featured Listing</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {isFeatured && (
            <FormField
              control={form.control}
              name="featuredUntil"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Featured Until</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={field.value instanceof Date ? field.value.toISOString().split("T")[0] : (field.value ?? "") as string}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="expiresAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expiration Date</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={field.value instanceof Date ? field.value.toISOString().split("T")[0] : (field.value ?? "") as string}
                    onChange={(e) => field.onChange(e.target.value)}
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
                ? "Create Listing"
                : "Update Listing"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
