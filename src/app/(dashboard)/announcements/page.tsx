"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Megaphone, Plus } from "lucide-react"
import { useDebounce } from "@/lib/hooks/use-debounce"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { DataTable } from "@/components/data/data-table"
import { trpc } from "@/lib/trpc"
import {
  ANNOUNCEMENT_TARGETS,
  labelOf,
} from "@/lib/constants"
import { formatDate } from "@/lib/utils"
import type { ColumnDef } from "@tanstack/react-table"

interface AnnouncementItem {
  id: string
  title: string
  targetType: string
  sentVia: string[]
  publishedAt: Date | string | null
  createdByName: string | null
}

export default function AnnouncementsPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading } = trpc.announcement.list.useQuery(
    {
      page,
      pageSize: 20,
      search: debouncedSearch || undefined,
    },
    {
      placeholderData: (prev) => prev,
    }
  )

  const columns: ColumnDef<AnnouncementItem>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <div className="font-medium max-w-md truncate">{row.original.title}</div>
      ),
    },
    {
      accessorKey: "targetType",
      header: "Target",
      cell: ({ row }) => labelOf(ANNOUNCEMENT_TARGETS, row.original.targetType),
    },
    {
      accessorKey: "sentVia",
      header: "Sent Via",
      cell: ({ row }) => {
        const channels = row.original.sentVia
        if (channels.length === 0) return "—"
        return (
          <div className="flex gap-1 flex-wrap">
            {channels.map((ch) => (
              <span
                key={ch}
                className="inline-block bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded"
              >
                {ch}
              </span>
            ))}
          </div>
        )
      },
    },
    {
      accessorKey: "publishedAt",
      header: "Published",
      cell: ({ row }) => {
        const published = row.original.publishedAt
        return published ? formatDate(published) : "—"
      },
    },
    {
      accessorKey: "createdByName",
      header: "Created By",
      cell: ({ row }) => row.original.createdByName ?? "—",
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Announcements">
        <Link href="/announcements/new">
          <Button className="bg-primary">
            <Plus className="h-4 w-4 mr-2" />
            New Announcement
          </Button>
        </Link>
      </PageHeader>

      {/* Search */}
      <div className="bg-card border border-border rounded-lg p-4">
        <Input
          placeholder="Search announcements..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="w-full"
        />
      </div>

      <DataTable
        columns={columns}
        data={(data?.items as AnnouncementItem[]) ?? []}
        isLoading={isLoading}
        emptyState={
          <EmptyState
            icon={Megaphone}
            title="No announcements found"
            description="Create a new announcement to get started"
          />
        }
        onRowClick={(row) => router.push(`/announcements/${row.id}`)}
        pagination={{
          page,
          pageCount: data?.pageCount ?? 1,
          onPageChange: setPage,
        }}
      />
    </div>
  )
}
