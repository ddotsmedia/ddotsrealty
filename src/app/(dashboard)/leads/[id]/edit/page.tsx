"use client"

import { useParams } from "next/navigation"
import { PageHeader } from "@/components/shared/page-header"
import { LeadForm } from "@/components/forms/lead-form"
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"
import { trpc } from "@/lib/trpc"

export default function EditLeadPage() {
  const params = useParams()
  const id = params.id as string

  const { data: lead, isLoading } = trpc.lead.getById.useQuery({ id })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Lead" description={`Editing ${lead?.name}`} />
      {lead && <LeadForm mode="edit" lead={lead} />}
    </div>
  )
}
