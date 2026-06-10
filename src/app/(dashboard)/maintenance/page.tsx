"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Wrench, Plus } from "lucide-react"
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
import { trpc } from "@/lib/trpc"
import {
  MAINTENANCE_CATEGORIES,
  MAINTENANCE_PRIORITIES,
  MAINTENANCE_STATUSES,
  MAINTENANCE_PRIORITY_VARIANT,
  MAINTENANCE_STATUS_VARIANT,
  labelOf,
} from "@/lib/constants"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { ColumnDef } from "@tanstack/react-table"

interface MaintenanceItem {
  id: string
  propertyId: string
  propertyTitle: string | null
  category: string
  priority: string
  status: string
  description: string
  costEstimate: string | number | null
  createdAt: Date | string
}

export default function MaintenancePage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 300)
  const [status, setStatus] = useState<string | undefined>(undefined)
  const [priority, setPriority] = useState<string | undefined>(undefined)
  const [category, setCategory] = useState<string | undefined>(undefined)

  const { data, isLoading } = trpc.maintenance.list.useQuery(
    {
      page,
      pageSize: 20,
      search: debouncedSearch || undefined,
      status,
      priority,
      category,
    },
    {
      placeholderData: (prev) => prev,
    }
  )

  const columns: ColumnDef<MaintenanceItem>[] = [
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <div className="max-w-md truncate">{row.original.description}</div>
      ),
    },
    {
      accessorKey: "propertyTitle",
      header: "Property",
      cell: ({ row }) => row.original.propertyTitle ?? "—",
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => labelOf(MAINTENANCE_CATEGORIES, row.original.category),
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => (
        <StatusBadge variant={MAINTENANCE_PRIORITY_VARIANT[row.original.priority]}>
          {labelOf(MAINTENANCE_PRIORITIES, row.original.priority)}
        </StatusBadge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge variant={MAINTENANCE_STATUS_VARIANT[row.original.status]}>
          {labelOf(MAINTENANCE_STATUSES, row.original.status)}
        </StatusBadge>
      ),
    },
    {
      accessorKey: "costEstimate",
      header: "Est. Cost",
      cell: ({ row }) =>
        row.original.costEstimate ? formatCurrency(row.original.costEstimate) : "—",
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Maintenance">
        <Link href="/maintenance/new">
          <Button className="bg-primary">
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        </Link>
      </PageHeader>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <Input
            placeholder="Search description..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full"
          />

          <Select
            value={status || ""}
            onValueChange={(v) => {
              setStatus(v || undefined)
              setPage(1)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              {MAINTENANCE_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={priority || ""}
            onValueChange={(v) => {
              setPriority(v || undefined)
              setPage(1)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Priorities</SelectItem>
              {MAINTENANCE_PRIORITIES.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={category || ""}
            onValueChange={(v) => {
              setCategory(v || undefined)
              setPage(1)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              {MAINTENANCE_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(status || priority || category || search) && (
            <Button
              variant="outline"
              onClick={() => {
                setSearch("")
                setStatus(undefined)
                setPriority(undefined)
                setCategory(undefined)
                setPage(1)
              }}
              className="w-full"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={(data?.items as MaintenanceItem[]) ?? []}
        isLoading={isLoading}
        emptyState={
          <EmptyState
            icon={Wrench}
            title="No maintenance requests found"
            description="Create a new maintenance request to get started"
          />
        }
        onRowClick={(row) => router.push(`/maintenance/${row.id}`)}
        pagination={{
          page,
          pageCount: data?.pageCount ?? 1,
          onPageChange: setPage,
        }}
      />
    </div>
  )
}
