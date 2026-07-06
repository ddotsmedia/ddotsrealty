"use client"

import { PageHeader } from "@/components/shared/page-header"
import { KeyHandoverForm } from "@/components/forms/key-handover-form"

export default function KeyHandoverNewPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="New Key Handover" />
      <KeyHandoverForm mode="create" />
    </div>
  )
}
