"use client"

import { PageHeader } from "@/components/shared/page-header"
import { LeadForm } from "@/components/forms/lead-form"

export default function NewLeadPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Create Lead" description="Add a new lead to your pipeline" />
      <LeadForm mode="create" />
    </div>
  )
}
