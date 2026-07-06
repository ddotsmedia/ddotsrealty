"use client"

import { PageHeader } from "@/components/shared/page-header"
import { InspectionForm } from "@/components/forms/inspection-form"

export default function InspectionNewPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="New Inspection" />
      <InspectionForm mode="create" />
    </div>
  )
}
