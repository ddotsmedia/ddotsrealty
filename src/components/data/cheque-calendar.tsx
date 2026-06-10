"use client"

import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  format,
} from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { CHEQUE_STATUS_VARIANT } from "@/lib/constants"
import { formatCurrency, cn } from "@/lib/utils"

interface CalendarCheque {
  id: string
  dueDate: string | Date
  amount: string | number
  status: string
  tenantName?: string | null
  propertyTitle?: string | null
}

interface ChequeCalendarProps {
  year: number
  month: number
  cheques: CalendarCheque[]
  onPrev: () => void
  onNext: () => void
  onSelectCheque?: (id: string) => void
}

const STATUS_CHIP_CLASSES: Record<string, string> = {
  pending: "bg-warning/10 text-warning border border-warning/20",
  deposited: "bg-info/10 text-info border border-info/20",
  cleared: "bg-success/10 text-success border border-success/20",
  bounced: "bg-danger/10 text-danger border border-danger/20",
  replaced: "bg-muted/30 text-muted-foreground border border-border",
  cancelled: "bg-muted/30 text-muted-foreground border border-border",
}

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export function ChequeCalendar({
  year,
  month,
  cheques,
  onPrev,
  onNext,
  onSelectCheque,
}: ChequeCalendarProps) {
  // month is 1-based
  const monthDate = new Date(year, month - 1, 1)
  const monthStart = startOfMonth(monthDate)
  const monthEnd = endOfMonth(monthDate)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  const allDays = eachDayOfInterval({ start: calStart, end: calEnd })
  const today = new Date()

  const chequesByDay = (day: Date) =>
    cheques.filter((c) => isSameDay(new Date(c.dueDate), day))

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <button
          onClick={onPrev}
          className="p-1.5 rounded hover:bg-muted transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h2 className="font-display font-semibold text-base sm:text-lg">
          {format(monthDate, "MMMM yyyy")}
        </h2>
        <button
          onClick={onNext}
          className="p-1.5 rounded hover:bg-muted transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {DAY_HEADERS.map((d) => (
          <div
            key={d}
            className="text-center text-xs font-medium text-muted-foreground py-2"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {allDays.map((day, idx) => {
          const isCurrentMonth = isSameMonth(day, monthDate)
          const isToday = isSameDay(day, today)
          const dayCheques = chequesByDay(day)
          const overflow = dayCheques.length > 3

          return (
            <div
              key={idx}
              className={cn(
                "min-h-[80px] sm:min-h-[100px] p-1 sm:p-2 border-b border-r border-border last:border-r-0",
                !isCurrentMonth && "bg-muted/30",
                isToday && "ring-2 ring-inset ring-primary"
              )}
            >
              <div
                className={cn(
                  "text-xs font-medium mb-1",
                  !isCurrentMonth && "text-muted-foreground",
                  isToday && "text-primary font-bold"
                )}
              >
                {format(day, "d")}
              </div>
              <div className="space-y-0.5">
                {dayCheques.slice(0, 3).map((cheque) => (
                  <button
                    key={cheque.id}
                    onClick={() => onSelectCheque?.(cheque.id)}
                    className={cn(
                      "w-full text-left rounded px-1 py-0.5 text-xs truncate transition-opacity hover:opacity-80",
                      STATUS_CHIP_CLASSES[cheque.status] ?? "bg-muted/20 text-foreground border border-border"
                    )}
                    title={`${cheque.tenantName ?? ""} — ${formatCurrency(cheque.amount)}`}
                  >
                    <span className="hidden sm:inline">{formatCurrency(cheque.amount)}</span>
                    <span className="sm:hidden">{Number(cheque.amount).toLocaleString("en-AE", { maximumFractionDigits: 0 })}</span>
                  </button>
                ))}
                {overflow && (
                  <div className="text-xs text-muted-foreground px-1">
                    +{dayCheques.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
