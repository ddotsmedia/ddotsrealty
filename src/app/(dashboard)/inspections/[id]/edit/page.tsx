"use client"

import { PageHeader } from "@/components/shared/page-header"
import { InspectionForm } from "@/components/forms/inspection-form"

export default function InspectionEditPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Edit Inspection" />
      <InspectionForm mode="edit" />
    </div>
  )
}
