"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Car, Plus } from "lucide-react"
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
  PARKING_TYPES,
  labelOf,
} from "@/lib/constants"
import type { ColumnDef } from "@tanstack/react-table"

interface ParkingItem {
  id: string
  propertyId: string
  propertyTitle: string | null
  slotNumber: string | null
  type: string
  floorLevel: string | null
  assignedTenantName: string | null
  vehiclePlate: string | null
  isAvailable: boolean
  createdAt: Date | string
}

export default function ParkingPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [type, setType] = useState<string | undefined>(undefined)
  const [isAvailable, setIsAvailable] = useState<boolean | undefined>(undefined)

  const { data, isLoading } = trpc.parking.list.useQuery(
    {
      page,
      pageSize: 20,
      type,
      isAvailable,
    },
    {
      placeholderData: (prev) => prev,
    }
  )

  const columns: ColumnDef<ParkingItem>[] = [
    {
      accessorKey: "slotNumber",
      header: "Slot #",
      cell: ({ row }) => row.original.slotNumber ?? "—",
    },
    {
      accessorKey: "propertyTitle",
      header: "Property",
      cell: ({ row }) => row.original.propertyTitle ?? "—",
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <StatusBadge variant="info">
          {labelOf(PARKING_TYPES, row.original.type)}
        </StatusBadge>
      ),
    },
    {
      accessorKey: "floorLevel",
      header: "Floor",
      cell: ({ row }) => row.original.floorLevel ?? "—",
    },
    {
      accessorKey: "assignedTenantName",
      header: "Assigned To",
      cell: ({ row }) =>
        row.original.assignedTenantName ? (
          row.original.assignedTenantName
        ) : (
          <StatusBadge variant="success">Available</StatusBadge>
        ),
    },
    {
      accessorKey: "vehiclePlate",
      header: "Vehicle Plate",
      cell: ({ row }) => row.original.vehiclePlate ?? "—",
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Parking Slots">
        <Link href="/parking/new">
          <Button className="bg-primary">
            <Plus className="h-4 w-4 mr-2" />
            New Slot
          </Button>
        </Link>
      </PageHeader>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            value={type || ""}
            onValueChange={(v) => {
              setType(v || undefined)
              setPage(1)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              {PARKING_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={isAvailable === undefined ? "" : isAvailable ? "true" : "false"}
            onValueChange={(v) => {
              if (v === "") setIsAvailable(undefined)
              else setIsAvailable(v === "true")
              setPage(1)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Availability" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
              <SelectItem value="true">Available</SelectItem>
              <SelectItem value="false">Assigned</SelectItem>
            </SelectContent>
          </Select>

          {(type || isAvailable !== undefined) && (
            <Button
              variant="outline"
              onClick={() => {
                setType(undefined)
                setIsAvailable(undefined)
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
        data={(data?.items as ParkingItem[]) ?? []}
        isLoading={isLoading}
        emptyState={
          <EmptyState
            icon={Car}
            title="No parking slots found"
            description="Create a new parking slot to get started"
          />
        }
        onRowClick={(row) => router.push(`/parking/${row.id}`)}
        pagination={{
          page,
          pageCount: data?.pageCount ?? 1,
          onPageChange: setPage,
        }}
      />
    </div>
  )
}
