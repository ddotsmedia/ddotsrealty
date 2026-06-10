"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { Building2, Plus } from "lucide-react"
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
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"
import { trpc } from "@/lib/trpc"
import {
  LISTING_STATUSES,
  LISTING_TYPES,
  LISTING_STATUS_VARIANT,
  labelOf,
} from "@/lib/constants"
import { formatCurrency } from "@/lib/utils"
import type { ColumnDef } from "@tanstack/react-table"

interface ListingItem {
  id: string
  title: string
  propertyTitle: string | null
  propertyEmirate: string | null
  listingType: string
  price: string | number | null
  status: string
  isFeatured: boolean
  viewsCount: number
  enquiriesCount: number
}

export default function ListingsPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 300)
  const [status, setStatus] = useState<string | undefined>(undefined)
  const [listingType, setListingType] = useState<string | undefined>(undefined)

  const { data, isLoading } = trpc.listing.list.useQuery(
    {
      page,
      pageSize: 20,
      search: debouncedSearch || undefined,
      status,
      listingType,
    },
    {
      placeholderData: (prev) => prev,
    }
  )

  const tableColumns: ColumnDef<ListingItem>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.title}</span>
          <span className="text-xs text-muted-foreground">
            {row.original.propertyTitle || "—"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "listingType",
      header: "Type",
      cell: ({ row }) => labelOf(LISTING_TYPES, row.original.listingType),
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => {
        const price = row.original.price
        return price ? formatCurrency(price) : "—"
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge variant={LISTING_STATUS_VARIANT[row.original.status]}>
          {labelOf(LISTING_STATUSES, row.original.status)}
        </StatusBadge>
      ),
    },
    {
      accessorKey: "isFeatured",
      header: "Featured",
      cell: ({ row }) =>
        row.original.isFeatured ? (
          <span className="text-lg">⭐</span>
        ) : (
          "—"
        ),
    },
    {
      accessorKey: "viewsCount",
      header: "Views",
      cell: ({ row }) => row.original.viewsCount,
    },
    {
      accessorKey: "enquiriesCount",
      header: "Enquiries",
      cell: ({ row }) => row.original.enquiriesCount,
    },
  ]

  const handleReset = useCallback(() => {
    setSearch("")
    setStatus(undefined)
    setListingType(undefined)
    setPage(1)
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader title="Listings">
        <Link href="/listings/new">
          <Button className="bg-primary">
            <Plus className="h-4 w-4 mr-2" />
            New Listing
          </Button>
        </Link>
      </PageHeader>

      {/* Filter Bar */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Input
            placeholder="Search title..."
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
              {LISTING_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={listingType || ""} onValueChange={(v) => { setListingType(v || undefined); setPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              {LISTING_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={handleReset}
            className="w-full"
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={tableColumns}
        data={data?.items || []}
        isLoading={isLoading}
        emptyState={
          <EmptyState
            icon={Building2}
            title="No listings found"
            description="Try adjusting your filters or create a new listing"
          />
        }
        onRowClick={(listing) => router.push(`/listings/${listing.id}`)}
        pagination={{
          page,
          pageCount: data?.pageCount || 1,
          onPageChange: setPage,
        }}
      />
    </div>
  )
}
