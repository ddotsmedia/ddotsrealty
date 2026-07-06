"use client"

import { PageHeader } from "@/components/shared/page-header"
import { Card } from "@/components/ui/card"
import { ParkingForm } from "@/components/forms/parking-form"

export default function NewParkingPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Create Parking Slot" />
      <Card className="p-6">
        <ParkingForm mode="create" />
      </Card>
    </div>
  )
}
