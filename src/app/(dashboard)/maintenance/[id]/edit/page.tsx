"use client"

import { PageHeader } from "@/components/shared/page-header"
import { MaintenanceForm } from "@/components/forms/maintenance-form"

export default function MaintenanceEditPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Edit Maintenance Request" />
      <MaintenanceForm mode="edit" />
    </div>
  )
}
