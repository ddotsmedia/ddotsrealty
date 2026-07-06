"use client"

import { PageHeader } from "@/components/shared/page-header"
import { KeyHandoverForm } from "@/components/forms/key-handover-form"

export default function KeyHandoverEditPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Edit Key Handover" />
      <KeyHandoverForm mode="edit" />
    </div>
  )
}
