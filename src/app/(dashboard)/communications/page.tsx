"use client"

import { useState } from "react"
import { MessageSquare, Plus } from "lucide-react"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { StatusBadge } from "@/components/shared/status-badge"
import { DataTable } from "@/components/data/data-table"
import { toast } from "sonner"
import { trpc } from "@/lib/trpc"
import {
  COMMUNICATION_CHANNELS,
  COMMUNICATION_DIRECTIONS,
  labelOf,
} from "@/lib/constants"
import { formatDate } from "@/lib/utils"
import type { ColumnDef } from "@tanstack/react-table"

interface CommunicationItem {
  id: string
  channel: string
  direction: string
  subject: string | null
  content: string | null
  sentByName: string | null
  createdAt: Date | string
}

const ENTITY_TYPES = [
  { value: "property_tenant", label: "Property Tenant" },
  { value: "owner", label: "Owner" },
  { value: "lead", label: "Lead" },
  { value: "staff", label: "Staff" },
] as const

const COMMUNICATION_STATUSES = [
  { value: "sent", label: "Sent" },
  { value: "delivered", label: "Delivered" },
  { value: "read", label: "Read" },
  { value: "failed", label: "Failed" },
] as const

const COMMUNICATION_STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "info" | "muted" | "default"> = {
  sent: "info",
  delivered: "success",
  read: "success",
  failed: "danger",
}

export default function CommunicationsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 300)
  const [channel, setChannel] = useState<string | undefined>(undefined)
  const [entityType, setEntityType] = useState<string | undefined>(undefined)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    entityType: "property_tenant",
    channel: "whatsapp",
    direction: "outbound",
    subject: "",
    content: "",
  })

  const { data, isLoading } = trpc.communication.list.useQuery(
    {
      page,
      pageSize: 30,
      search: debouncedSearch || undefined,
      channel,
      entityType,
    },
    {
      placeholderData: (prev) => prev,
    }
  )

  const createMutation = trpc.communication.create.useMutation({
    onSuccess: () => {
      toast.success("Communication logged successfully")
      setIsDialogOpen(false)
      setFormData({
        entityType: "property_tenant",
        channel: "whatsapp",
        direction: "outbound",
        subject: "",
        content: "",
      })
      utils.communication.list.invalidate()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const utils = trpc.useUtils()

  const columns: ColumnDef<CommunicationItem>[] = [
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      accessorKey: "channel",
      header: "Channel",
      cell: ({ row }) => (
        <StatusBadge variant="info">
          {labelOf(COMMUNICATION_CHANNELS, row.original.channel)}
        </StatusBadge>
      ),
    },
    {
      accessorKey: "direction",
      header: "Direction",
      cell: ({ row }) => labelOf(COMMUNICATION_DIRECTIONS, row.original.direction),
    },
    {
      accessorKey: "subject",
      header: "Subject",
      cell: ({ row }) => row.original.subject ?? "—",
    },
    {
      accessorKey: "content",
      header: "Content",
      cell: ({ row }) => {
        const content = row.original.content
        if (!content) return "—"
        return content.length > 100 ? `${content.substring(0, 100)}...` : content
      },
    },
    {
      accessorKey: "sentByName",
      header: "Sent By",
      cell: ({ row }) => row.original.sentByName ?? "—",
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Communications">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button className="bg-primary">
              <Plus className="h-4 w-4 mr-2" />
              Log Communication
            </Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log Communication</DialogTitle>
              <DialogDescription>
                Record a new communication log entry
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="entityType">Entity Type</Label>
                  <Select
                    value={formData.entityType ?? ""}
                    onValueChange={(v: string | null) =>
                      setFormData({ ...formData, entityType: v ?? "" })
                    }
                  >
                    <SelectTrigger id="entityType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ENTITY_TYPES.map((et) => (
                        <SelectItem key={et.value} value={et.value}>
                          {et.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="channel">Channel</Label>
                  <Select
                    value={formData.channel ?? ""}
                    onValueChange={(v: string | null) =>
                      setFormData({ ...formData, channel: v ?? "" })
                    }
                  >
                    <SelectTrigger id="channel">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMUNICATION_CHANNELS.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="direction">Direction</Label>
                  <Select
                    value={formData.direction ?? ""}
                    onValueChange={(v: string | null) =>
                      setFormData({ ...formData, direction: v ?? "" })
                    }
                  >
                    <SelectTrigger id="direction">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMUNICATION_DIRECTIONS.map((d) => (
                        <SelectItem key={d.value} value={d.value}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="Communication subject"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Communication details..."
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  className="min-h-24"
                />
              </div>

              <Button
                className="w-full bg-primary"
                onClick={() => {
                  createMutation.mutate({
                    entityType: formData.entityType as any,
                    channel: formData.channel as any,
                    direction: formData.direction as any,
                    subject: formData.subject || undefined,
                    content: formData.content || undefined,
                  })
                }}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Logging..." : "Log Communication"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Input
            placeholder="Search subject/content..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full"
          />

          <Select
            value={channel || ""}
            onValueChange={(v) => {
              setChannel(v || undefined)
              setPage(1)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Channel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Channels</SelectItem>
              {COMMUNICATION_CHANNELS.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={entityType || ""}
            onValueChange={(v) => {
              setEntityType(v || undefined)
              setPage(1)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Entity Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              {ENTITY_TYPES.map((et) => (
                <SelectItem key={et.value} value={et.value}>
                  {et.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(channel || entityType || search) && (
            <Button
              variant="outline"
              onClick={() => {
                setSearch("")
                setChannel(undefined)
                setEntityType(undefined)
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
        data={(data?.items as CommunicationItem[]) ?? []}
        isLoading={isLoading}
        emptyState={
          <EmptyState
            icon={MessageSquare}
            title="No communications found"
            description="Log a new communication to get started"
          />
        }
        pagination={{
          page,
          pageCount: data?.pageCount ?? 1,
          onPageChange: setPage,
        }}
      />
    </div>
  )
}
