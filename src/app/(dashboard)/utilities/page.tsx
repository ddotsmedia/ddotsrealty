"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Zap, Plus } from "lucide-react"
import { useDebounce } from "@/lib/hooks/use-debounce"
import { Button } from "@/components/ui/button"
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
  UTILITY_TYPES,
  UTILITY_STATUSES,
  UTILITY_STATUS_VARIANT,
  labelOf,
} from "@/lib/constants"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { ColumnDef } from "@tanstack/react-table"

interface UtilityItem {
  id: string
  propertyId: string
  propertyTitle: string | null
  utilityType: string
  accountNumber: string | null
  premiseNumber: string | null
  status: string
  securityDeposit: string | null
  createdAt: Date | string
}

export default function UtilitiesPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [utilityType, setUtilityType] = useState<string | undefined>(undefined)
  const [status, setStatus] = useState<string | undefined>(undefined)

  const { data, isLoading } = trpc.utility.list.useQuery(
    {
      page,
      pageSize: 20,
      utilityType,
      status,
    },
    {
      placeholderData: (prev) => prev,
    }
  )

  const columns: ColumnDef<UtilityItem>[] = [
    {
      accessorKey: "utilityType",
      header: "Type",
      cell: ({ row }) => (
        <StatusBadge variant="info">
          {labelOf(UTILITY_TYPES, row.original.utilityType)}
        </StatusBadge>
      ),
    },
    {
      accessorKey: "propertyTitle",
      header: "Property",
      cell: ({ row }) => row.original.propertyTitle ?? "—",
    },
    {
      accessorKey: "accountNumber",
      header: "Account #",
      cell: ({ row }) => row.original.accountNumber ?? "—",
    },
    {
      accessorKey: "premiseNumber",
      header: "Premise #",
      cell: ({ row }) => row.original.premiseNumber ?? "—",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge variant={UTILITY_STATUS_VARIANT[row.original.status]}>
          {labelOf(UTILITY_STATUSES, row.original.status)}
        </StatusBadge>
      ),
    },
    {
      accessorKey: "securityDeposit",
      header: "Security Deposit",
      cell: ({ row }) =>
        row.original.securityDeposit ? formatCurrency(row.original.securityDeposit) : "—",
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Utility Accounts (DEWA)">
        <Link href="/utilities/new">
          <Button className="bg-primary">
            <Plus className="h-4 w-4 mr-2" />
            New Account
          </Button>
        </Link>
      </PageHeader>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            value={utilityType || ""}
            onValueChange={(v) => {
              setUtilityType(v || undefined)
              setPage(1)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Utility Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              {UTILITY_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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
              {UTILITY_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(utilityType || status) && (
            <Button
              variant="outline"
              onClick={() => {
                setUtilityType(undefined)
                setStatus(undefined)
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
        data={(data?.items as UtilityItem[]) ?? []}
        isLoading={isLoading}
        emptyState={
          <EmptyState
            icon={Zap}
            title="No utility accounts found"
            description="Create a new utility account to get started"
          />
        }
        onRowClick={(row) => router.push(`/utilities/${row.id}`)}
        pagination={{
          page,
          pageCount: data?.pageCount ?? 1,
          onPageChange: setPage,
        }}
      />
    </div>
  )
}
