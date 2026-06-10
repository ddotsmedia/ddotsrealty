"use client"

import { useParams } from "next/navigation"
import { PageHeader } from "@/components/shared/page-header"
import { ListingForm } from "@/components/forms/listing-form"
import { EmptyState } from "@/components/shared/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"
import { trpc } from "@/lib/trpc"

export default function EditListingPage() {
  const params = useParams()
  const id = params.id as string

  const { data: listing, isLoading } = trpc.listing.getById.useQuery({ id })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card className="p-6 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </Card>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="space-y-6">
        <PageHeader title="Listing Not Found" />
        <EmptyState
          title="Listing not found"
          description="The listing you're looking for doesn't exist"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title={`Edit: ${listing.title}`} />
      <ListingForm mode="edit" initialData={listing} />
    </div>
  )
}
