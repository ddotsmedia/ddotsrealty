"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { CalendarDays, List } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { StatusBadge } from "@/components/shared/status-badge"
import { DataTable } from "@/components/data/data-table"
import { WhatsAppButton } from "@/components/shared/whatsapp-button"
import { ChequeCalendar } from "@/components/data/cheque-calendar"
import { trpc } from "@/lib/trpc"
import {
  CHEQUE_STATUSES,
  CHEQUE_STATUS_VARIANT,
  labelOf,
} from "@/lib/constants"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { ColumnDef } from "@tanstack/react-table"

interface ChequeItem {
  id: string
  chequeNumber: string | null
  propertyTitle: string | null
  tenantName: string | null
  tenantPhone: string | null
  amount: string | number
  dueDate: Date | string
  status: string
}

export default function ChequesPage() {
  const router = useRouter()

  // View toggle
  const [view, setView] = useState<"calendar" | "list">("calendar")

  // Calendar state
  const now = new Date()
  const [calYear, setCalYear] = useState(now.getFullYear())
  const [calMonth, setCalMonth] = useState(now.getMonth() + 1) // 1-based

  const handlePrevMonth = () => {
    if (calMonth === 1) {
      setCalMonth(12)
      setCalYear((y) => y - 1)
    } else {
      setCalMonth((m) => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (calMonth === 12) {
      setCalMonth(1)
      setCalYear((y) => y + 1)
    } else {
      setCalMonth((m) => m + 1)
    }
  }

  const calendarQuery = trpc.cheque.calendar.useQuery(
    { year: calYear, month: calMonth },
    { placeholderData: (prev) => prev }
  )

  // List state
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<string | undefined>(undefined)
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")

  const listQuery = trpc.cheque.list.useQuery(
    {
      page,
      pageSize: 50,
      status,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    },
    {
      placeholderData: (prev) => prev,
      enabled: view === "list",
    }
  )

  const statsQuery = trpc.cheque.stats.useQuery()
  const sendReminderMutation = trpc.cheque.sendReminder.useMutation()

  const handleSendReminder = async (chequeId: string) => {
    try {
      const result = await sendReminderMutation.mutateAsync({ id: chequeId })
      if (result.phone) {
        const phoneDigits = result.phone.replace(/\D/g, "")
        const url = `https://wa.me/${phoneDigits}?text=${encodeURIComponent(result.message)}`
        window.open(url, "_blank")
      } else {
        toast.warning("No phone number on file for this tenant")
      }
    } catch {
      toast.error("Failed to prepare reminder")
    }
  }

  const columns: ColumnDef<ChequeItem>[] = [
    {
      accessorKey: "chequeNumber",
      header: "Cheque #",
      cell: ({ row }) => row.original.chequeNumber ?? "—",
    },
    {
      accessorKey: "propertyTitle",
      header: "Property",
      cell: ({ row }) => row.original.propertyTitle ?? "—",
    },
    {
      accessorKey: "tenantName",
      header: "Tenant",
      cell: ({ row }) => row.original.tenantName ?? "—",
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <span className="font-medium">{formatCurrency(row.original.amount)}</span>
      ),
    },
    {
      accessorKey: "dueDate",
      header: "Due Date",
      cell: ({ row }) => formatDate(row.original.dueDate),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge variant={CHEQUE_STATUS_VARIANT[row.original.status]}>
          {labelOf(CHEQUE_STATUSES, row.original.status)}
        </StatusBadge>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <WhatsAppButton
          size="sm"
          label="Remind"
          onClick={() => handleSendReminder(row.original.id)}
        />
      ),
    },
  ]

  const stats = statsQuery.data

  return (
    <div className="space-y-6">
      <PageHeader title="Cheques" />

      {/* Stats Strip */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground font-medium mb-1">Pending</p>
            <p className="text-xl font-bold">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">{formatCurrency(stats.pendingAmount)}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground font-medium mb-1">Cleared</p>
            <p className="text-xl font-bold text-success">{stats.cleared}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground font-medium mb-1">Bounced</p>
            <p className="text-xl font-bold text-danger">{stats.bounced}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground font-medium mb-1">Overdue</p>
            <p className="text-xl font-bold text-danger">{stats.overdueCount}</p>
            <p className="text-xs text-danger">{formatCurrency(stats.overdueAmount)}</p>
          </div>
        </div>
      )}

      {/* View toggle */}
      <div className="flex items-center gap-2">
        <div className="flex border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => setView("calendar")}
            className={`px-3 py-2 flex items-center gap-2 text-sm transition-colors ${
              view === "calendar"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            <CalendarDays className="h-4 w-4" />
            Calendar
          </button>
          <button
            onClick={() => setView("list")}
            className={`px-3 py-2 flex items-center gap-2 text-sm border-l border-border transition-colors ${
              view === "list"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            <List className="h-4 w-4" />
            List
          </button>
        </div>
      </div>

      {/* Calendar View */}
      {view === "calendar" && (
        <div>
          <ChequeCalendar
            year={calYear}
            month={calMonth}
            cheques={(calendarQuery.data?.cheques ?? []).map((c) => ({
              id: c.id,
              dueDate: c.dueDate,
              amount: c.amount,
              status: c.status,
              tenantName: c.tenantName,
              propertyTitle: c.propertyTitle,
            }))}
            onPrev={handlePrevMonth}
            onNext={handleNextMonth}
            onSelectCheque={(id) => router.push(`/cheques/${id}`)}
          />
        </div>
      )}

      {/* List View */}
      {view === "list" && (
        <div className="space-y-4">
          {/* List Filters */}
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex flex-wrap gap-3">
              <Select
                value={status ?? ""}
                onValueChange={(v) => {
                  setStatus(v || undefined)
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  {CHEQUE_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={from}
                  onChange={(e) => { setFrom(e.target.value); setPage(1) }}
                  className="w-36"
                  placeholder="From"
                />
                <span className="text-muted-foreground text-sm">—</span>
                <Input
                  type="date"
                  value={to}
                  onChange={(e) => { setTo(e.target.value); setPage(1) }}
                  className="w-36"
                  placeholder="To"
                />
              </div>

              {(status || from || to) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setStatus(undefined)
                    setFrom("")
                    setTo("")
                    setPage(1)
                  }}
                >
                  Reset
                </Button>
              )}
            </div>
          </div>

          <DataTable
            columns={columns}
            data={(listQuery.data?.items as ChequeItem[]) ?? []}
            isLoading={listQuery.isLoading}
            emptyState={
              <EmptyState
                title="No cheques found"
                description="Cheques are generated when you create a contract"
              />
            }
            onRowClick={(row) => router.push(`/cheques/${row.id}`)}
            pagination={{
              page,
              pageCount: listQuery.data?.pageCount ?? 1,
              onPageChange: setPage,
            }}
          />
        </div>
      )}
    </div>
  )
}
