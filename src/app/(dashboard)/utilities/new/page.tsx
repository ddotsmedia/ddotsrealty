"use client"

import { PageHeader } from "@/components/shared/page-header"
import { Card } from "@/components/ui/card"
import { UtilityForm } from "@/components/forms/utility-form"

export default function NewUtilityPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Create Utility Account" />
      <Card className="p-6">
        <UtilityForm mode="create" />
      </Card>
    </div>
  )
}
