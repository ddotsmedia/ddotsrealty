"use client"

import { PageHeader } from "@/components/shared/page-header"
import { ListingForm } from "@/components/forms/listing-form"

export default function NewListingPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Create Listing" />
      <ListingForm mode="create" />
    </div>
  )
}
