"use client"

import { PageHeader } from "@/components/shared/page-header"
import { MaintenanceForm } from "@/components/forms/maintenance-form"

export default function MaintenanceNewPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="New Maintenance Request" />
      <MaintenanceForm mode="create" />
    </div>
  )
}
