"use client"

import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Trash2, Send } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared/page-header"
import { toast } from "sonner"
import { trpc } from "@/lib/trpc"
import { ANNOUNCEMENT_TARGETS, labelOf } from "@/lib/constants"
import { formatDateTime } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function AnnouncementDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const { data: announcement, isLoading } = trpc.announcement.getById.useQuery(
    { id }
  )

  const broadcastMutation = trpc.announcement.broadcast.useMutation({
    onSuccess: (data) => {
      toast.success(`Broadcast sent via: ${(data.channels ?? []).join(", ") || "no channels selected"}`)
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const deleteMutation = trpc.announcement.delete.useMutation({
    onSuccess: () => {
      toast.success("Announcement deleted successfully")
      router.push("/announcements")
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded w-32 animate-pulse" />
        <div className="bg-card border border-border rounded-lg p-6 h-64 animate-pulse" />
      </div>
    )
  }

  if (!announcement) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/announcements">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Announcement not found</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/announcements">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              broadcastMutation.mutate({ id })
            }}
            disabled={broadcastMutation.isPending}
          >
            <Send className="h-4 w-4 mr-2" />
            {broadcastMutation.isPending ? "Broadcasting..." : "Broadcast"}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{announcement.title}</h1>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-sm text-muted-foreground">Target Audience</p>
            <p className="font-medium">
              {labelOf(ANNOUNCEMENT_TARGETS, announcement.targetType)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Created By</p>
            <p className="font-medium">{announcement.createdByName ?? "—"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Created At</p>
            <p className="font-medium">
              {formatDateTime(announcement.createdAt)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Published</p>
            <p className="font-medium">
              {announcement.publishedAt
                ? formatDateTime(announcement.publishedAt)
                : "Not published"}
            </p>
          </div>
        </div>

        {announcement.sentVia && announcement.sentVia.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Sent Via</p>
            <div className="flex gap-2 flex-wrap">
              {announcement.sentVia.map((channel) => (
                <span
                  key={channel}
                  className="inline-block bg-secondary text-secondary-foreground text-sm px-3 py-1 rounded"
                >
                  {channel}
                </span>
              ))}
            </div>
          </div>
        )}

        {announcement.content && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Content</p>
            <div className="bg-muted p-4 rounded whitespace-pre-wrap text-sm">
              {announcement.content}
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this announcement? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteMutation.mutate({ id })
                setShowDeleteDialog(false)
              }}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
