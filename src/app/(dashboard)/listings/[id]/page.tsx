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
import { trpc } from "@/lib/trpc"
import {
  LISTING_STATUSES,
  LISTING_TYPES,
  LISTING_STATUS_VARIANT,
  labelOf,
} from "@/lib/constants"
import { formatCurrency, formatDate, cn } from "@/lib/utils"

export default function ListingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data: listing, isLoading } = trpc.listing.getById.useQuery({ id })
  const deleteMutation = trpc.listing.delete.useMutation()
  const publishMutation = trpc.listing.publish.useMutation()
  const [isPublishing, setIsPublishing] = useState(false)

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({ id })
      toast.success("Listing deleted")
      router.push("/listings")
    } catch {
      toast.error("Failed to delete listing")
    }
  }

  const handlePublish = async () => {
    try {
      setIsPublishing(true)
      await publishMutation.mutateAsync({ id })
      toast.success("Listing published")
      router.refresh()
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      toast.error(error?.message || "Failed to publish listing")
    } finally {
      setIsPublishing(false)
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

  const canPublish = listing.status === "draft" && listing.property

  return (
    <div className="space-y-6">
      <PageHeader
        title={listing.title}
        description={listing.property?.title ?? "Property"}
      >
        <div className="flex flex-wrap gap-2">
          {canPublish && listing.status === "draft" && (
            <Button
              onClick={handlePublish}
              disabled={isPublishing}
              className="bg-success text-success-foreground hover:bg-success/90"
            >
              {isPublishing ? "Publishing..." : "Publish"}
            </Button>
          )}
          <Link href={`/listings/${id}/edit`}>
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
            title="Delete Listing"
            description="Are you sure? This action cannot be undone."
            confirmText="Delete"
            onConfirm={handleDelete}
            destructive
          />
        </div>
      </PageHeader>

      {/* Status Banner */}
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge variant={LISTING_STATUS_VARIANT[listing.status]}>
          {labelOf(LISTING_STATUSES, listing.status)}
        </StatusBadge>
        {listing.isFeatured && (
          <span className="text-sm font-medium px-3 py-1 rounded-full bg-warning/10 text-warning">
            ⭐ Featured
          </span>
        )}
      </div>

      {/* Key Facts */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Listing Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Type</p>
            <p className="font-semibold">{labelOf(LISTING_TYPES, listing.listingType)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Price</p>
            <p className="font-semibold text-lg">
              {listing.price ? formatCurrency(listing.price) : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Views</p>
            <p className="font-semibold">{listing.viewsCount}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Enquiries</p>
            <p className="font-semibold">{listing.enquiriesCount}</p>
          </div>
          {listing.property?.emirate && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Emirate</p>
              <p className="font-semibold">{listing.property.emirate}</p>
            </div>
          )}
          {listing.trakheesiPermit && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Trakheesi Permit</p>
              <p className="font-semibold">{listing.trakheesiPermit}</p>
            </div>
          )}
          {listing.permitExpiry && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Permit Expiry</p>
              <p className="font-semibold">{formatDate(listing.permitExpiry)}</p>
            </div>
          )}
          {listing.expiresAt && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Expires At</p>
              <p className="font-semibold">{formatDate(listing.expiresAt)}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Property & Broker */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Property & Broker</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Property</p>
            {listing.property ? (
              <Link
                href={`/properties/${listing.property.id}`}
                className="font-semibold text-primary hover:underline"
              >
                {listing.property.title}
                {listing.property.referenceNo && (
                  <span className="text-xs text-muted-foreground ml-1">
                    ({listing.property.referenceNo})
                  </span>
                )}
              </Link>
            ) : (
              <p className="font-semibold">—</p>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Broker</p>
            <p className="font-semibold">{listing.brokerName ?? "—"}</p>
          </div>
        </div>
      </Card>

      {/* Description */}
      {listing.description && (
        <Card className="p-6">
          <h3 className="font-semibold mb-3">Description</h3>
          <p className="text-muted-foreground whitespace-pre-wrap">{listing.description}</p>
        </Card>
      )}

      {/* Metadata */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Metadata</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-muted-foreground">
          <div>
            <p className="font-medium mb-1">Created</p>
            <p>{formatDate(listing.createdAt)}</p>
          </div>
          <div>
            <p className="font-medium mb-1">Last Updated</p>
            <p>{formatDate(listing.updatedAt)}</p>
          </div>
          {listing.publishedAt && (
            <div>
              <p className="font-medium mb-1">Published</p>
              <p>{formatDate(listing.publishedAt)}</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
