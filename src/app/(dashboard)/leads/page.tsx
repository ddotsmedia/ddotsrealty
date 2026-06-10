"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { Users, LayoutGrid, List, Plus } from "lucide-react"
import { useDebounce } from "@/lib/hooks/use-debounce"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { StatusBadge } from "@/components/shared/status-badge"
import { DataTable } from "@/components/data/data-table"
import { LeadKanban } from "@/components/data/lead-kanban"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"
import { trpc } from "@/lib/trpc"
import {
  LEAD_SOURCES,
  LEAD_STATUSES,
  LEAD_STATUS_VARIANT,
  labelOf,
} from "@/lib/constants"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { ColumnDef } from "@tanstack/react-table"

interface LeadItem {
  id: string
  name: string
  phone: string | null
  email: string | null
  source: string
  status: string
  budgetMin: string | number | null
  budgetMax: string | number | null
  nextFollowUp: Date | null
  assignedName: string | null
}

export default function LeadsPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [view, setView] = useState<"kanban" | "list">("kanban")
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 300)
  const [status, setStatus] = useState<string | undefined>(undefined)
  const [source, setSource] = useState<string | undefined>(undefined)

  // Kanban query
  const boardQuery = trpc.lead.board.useQuery(undefined, {
    enabled: view === "kanban",
  })

  // List query
  const listQuery = trpc.lead.list.useQuery(
    {
      page,
      pageSize: 20,
      search: debouncedSearch || undefined,
      status,
      source,
    },
    {
      enabled: view === "list",
      placeholderData: (prev) => prev,
    }
  )

  const updateStatusMutation = trpc.lead.updateStatus.useMutation()

  const handleMove = async (id: string, newStatus: string) => {
    try {
      await updateStatusMutation.mutateAsync({
        id,
        status: newStatus as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      })
      boardQuery.refetch()
    } catch (error) {
      console.error("Failed to update status", error)
    }
  }

  const tableColumns: ColumnDef<LeadItem>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.name}</span>
          {row.original.email && (
            <span className="text-xs text-muted-foreground">{row.original.email}</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => row.original.phone || "—",
    },
    {
      accessorKey: "source",
      header: "Source",
      cell: ({ row }) => labelOf(LEAD_SOURCES, row.original.source),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge variant={LEAD_STATUS_VARIANT[row.original.status]}>
          {labelOf(LEAD_STATUSES, row.original.status)}
        </StatusBadge>
      ),
    },
    {
      accessorKey: "budgetMin",
      header: "Budget",
      cell: ({ row }) => {
        if (row.original.budgetMin || row.original.budgetMax) {
          return (
            <span className="text-sm">
              {row.original.budgetMin && row.original.budgetMax
                ? `${formatCurrency(row.original.budgetMin)} - ${formatCurrency(row.original.budgetMax)}`
                : row.original.budgetMin
                  ? `From ${formatCurrency(row.original.budgetMin)}`
                  : `Up to ${formatCurrency(row.original.budgetMax)}`}
            </span>
          )
        }
        return "—"
      },
    },
    {
      accessorKey: "nextFollowUp",
      header: "Follow-up",
      cell: ({ row }) => row.original.nextFollowUp ? formatDate(row.original.nextFollowUp) : "—",
    },
  ]

  const handleReset = useCallback(() => {
    setSearch("")
    setStatus(undefined)
    setSource(undefined)
    setPage(1)
  }, [])

  const isLoading = view === "kanban" ? boardQuery.isLoading : listQuery.isLoading

  return (
    <div className="space-y-6">
      <PageHeader title="Leads">
        <Link href="/leads/new">
          <Button className="bg-primary">
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
        </Link>
      </PageHeader>

      {/* Filter Bar */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Input
            placeholder="Search name, phone, email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full"
          />

          <Select value={status || ""} onValueChange={(v) => { setStatus(v || undefined); setPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              {LEAD_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={source || ""} onValueChange={(v) => { setSource(v || undefined); setPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Sources</SelectItem>
              {LEAD_SOURCES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex-1"
            >
              Reset
            </Button>
          </div>
        </div>

        <div className="flex border border-border rounded-lg">
          <button
            onClick={() => setView("kanban")}
            className={`flex-1 p-2 flex items-center justify-center transition-colors ${
              view === "kanban"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="ml-2 text-sm font-medium">Kanban</span>
          </button>
          <button
            onClick={() => setView("list")}
            className={`flex-1 p-2 flex items-center justify-center transition-colors border-l border-border ${
              view === "list"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            <List className="h-4 w-4" />
            <span className="ml-2 text-sm font-medium">List</span>
          </button>
        </div>
      </div>

      {/* Kanban View */}
      {view === "kanban" && (
        <>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : (boardQuery.data?.length ?? 0) === 0 ? (
            <EmptyState
              icon={Users}
              title="No leads found"
              description="Create your first lead to get started"
            />
          ) : (
            <LeadKanban leads={boardQuery.data || []} onMove={handleMove} />
          )}
        </>
      )}

      {/* List View */}
      {view === "list" && (
        <DataTable
          columns={tableColumns}
          data={listQuery.data?.items || []}
          isLoading={isLoading}
          emptyState={
            <EmptyState
              icon={Users}
              title="No leads found"
              description="Try adjusting your filters or create a new lead"
            />
          }
          onRowClick={(lead) => router.push(`/leads/${lead.id}`)}
          pagination={{
            page,
            pageCount: listQuery.data?.pageCount || 1,
            onPageChange: setPage,
          }}
        />
      )}
    </div>
  )
}
