"use client"

import { PageHeader } from "@/components/shared/page-header"
import { Card } from "@/components/ui/card"
import { UtilityForm } from "@/components/forms/utility-form"

export default function EditUtilityPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Edit Utility Account" />
      <Card className="p-6">
        <UtilityForm mode="edit" />
      </Card>
    </div>
  )
}
