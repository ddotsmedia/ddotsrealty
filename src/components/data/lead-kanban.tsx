"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { StatusBadge } from "@/components/shared/status-badge"
import { LEAD_STATUSES, LEAD_STATUS_VARIANT, labelOf } from "@/lib/constants"
import { formatCurrency, formatDate } from "@/lib/utils"

export interface BoardLead {
  id: string
  name: string
  phone: string | null
  status: string
  source: string
  budgetMin: string | null
  budgetMax: string | null
  nextFollowUp: Date | null
  assignedTo: string | null
}

interface LeadKanbanProps {
  leads: BoardLead[]
  onMove: (id: string, status: string) => void
}

export function LeadKanban({ leads, onMove }: LeadKanbanProps) {
  const groupedByStatus = LEAD_STATUSES.reduce(
    (acc, status) => {
      acc[status.value] = leads.filter((l) => l.status === status.value)
      return acc
    },
    {} as Record<string, BoardLead[]>
  )

  return (
    <div className="overflow-x-auto pb-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4 min-w-max lg:min-w-full">
        {LEAD_STATUSES.map((status) => {
          const items = groupedByStatus[status.value] || []
          return (
            <div
              key={status.value}
              className="flex flex-col min-w-[280px] bg-muted/30 rounded-lg p-4 border border-border"
            >
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">{status.label}</h3>
                  <span className="text-xs bg-muted px-2 py-1 rounded font-medium">
                    {items.length}
                  </span>
                </div>
              </div>

              <div className="space-y-3 flex-1">
                {items.map((lead) => (
                  <Card
                    key={lead.id}
                    className="p-3 space-y-2 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <Link href={`/leads/${lead.id}`}>
                      <h4 className="font-medium text-sm text-primary hover:underline">
                        {lead.name}
                      </h4>
                    </Link>

                    {lead.phone && (
                      <p className="text-xs text-muted-foreground">{lead.phone}</p>
                    )}

                    {(lead.budgetMin || lead.budgetMax) && (
                      <p className="text-xs font-medium text-muted-foreground">
                        {lead.budgetMin && lead.budgetMax
                          ? `${formatCurrency(lead.budgetMin)} - ${formatCurrency(lead.budgetMax)}`
                          : lead.budgetMin
                            ? `From ${formatCurrency(lead.budgetMin)}`
                            : `Up to ${formatCurrency(lead.budgetMax)}`}
                      </p>
                    )}

                    {lead.nextFollowUp && (
                      <p className="text-xs text-muted-foreground">
                        Follow up: {formatDate(lead.nextFollowUp)}
                      </p>
                    )}

                    <div className="pt-2 border-t border-border">
                      <Select
                        value={lead.status}
                        onValueChange={(newStatus) => onMove(lead.id, newStatus ?? "")}
                      >
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LEAD_STATUSES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </Card>
                ))}
              </div>

              {items.length === 0 && (
                <div className="text-center text-xs text-muted-foreground py-8">
                  No leads
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
