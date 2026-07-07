"use client"

import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useState } from "react"
import { Edit, Trash2, Phone, Mail, Sparkles, Copy, Send } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { EmptyState } from "@/components/shared/empty-state"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import { trpc } from "@/lib/trpc"
import {
  LEAD_STATUSES,
  LEAD_STATUS_VARIANT,
  LEAD_SOURCES,
  LEAD_ACTIVITY_TYPES,
  labelOf,
} from "@/lib/constants"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { leadActivitySchema, type LeadActivity } from "@/lib/validators/lead"

export default function LeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [suggestDialogOpen, setSuggestDialogOpen] = useState(false)
  const [suggestedReply, setSuggestedReply] = useState("")

  const { data: lead, isLoading, refetch } = trpc.lead.getById.useQuery({ id })
  const deleteMutation = trpc.lead.delete.useMutation()
  const updateStatusMutation = trpc.lead.updateStatus.useMutation()
  const addActivityMutation = trpc.lead.addActivity.useMutation()
  const aiSuggestReplyMutation = trpc.ai.suggestLeadReply.useMutation()

  const activityForm = useForm<LeadActivity>({
    resolver: zodResolver(leadActivitySchema) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    defaultValues: {
      leadId: id,
      type: "call",
      content: "",
      scheduledAt: undefined,
    },
  })

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({ id })
      toast.success("Lead deleted")
      router.push("/leads")
    } catch {
      toast.error("Failed to delete lead")
    }
  }

  const handleStatusChange = async (newStatus: string | null) => {
    try {
      await updateStatusMutation.mutateAsync({
        id,
        status: (newStatus as any) ?? "new", // eslint-disable-line @typescript-eslint/no-explicit-any
      })
      await refetch()
      toast.success("Status updated")
    } catch {
      toast.error("Failed to update status")
    }
  }

  const onActivitySubmit = async (data: LeadActivity) => {
    try {
      await addActivityMutation.mutateAsync(data)
      activityForm.reset({
        leadId: id,
        type: "call",
        content: "",
        scheduledAt: undefined,
      })
      await refetch()
      toast.success("Activity added")
    } catch (error) {
      toast.error("Failed to add activity")
      console.error(error)
    }
  }

  const handleSuggestReply = async () => {
    try {
      if (!lead) return

      const enquiry = lead.notes ?? "General enquiry"
      const result = await aiSuggestReplyMutation.mutateAsync({
        leadName: lead.name,
        enquiry,
      })

      setSuggestedReply(result.text)
      setSuggestDialogOpen(true)
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      toast.error(error?.message || "Failed to suggest reply")
      console.error(error)
    }
  }

  const handleCopyReply = async () => {
    try {
      await navigator.clipboard.writeText(suggestedReply)
      toast.success("Reply copied to clipboard")
    } catch {
      toast.error("Failed to copy reply")
    }
  }

  const handleSendWhatsApp = () => {
    if (!lead?.phone) {
      toast.error("No phone number available")
      return
    }

    const digits = lead.phone.replace(/\D/g, "")
    const whatsappUrl = `https://wa.me/${digits}?text=${encodeURIComponent(suggestedReply)}`
    window.open(whatsappUrl, "_blank")
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card className="p-6 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </Card>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="space-y-6">
        <PageHeader title="Lead Not Found" />
        <EmptyState
          title="Lead not found"
          description="The lead you're looking for doesn't exist"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={lead.name}
        description={`Lead • ${labelOf(LEAD_SOURCES, lead.source)}`}
      >
        <div className="flex flex-wrap gap-2">
          <Link href={`/leads/${id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <ConfirmDialog
            trigger={
              <Button variant="outline" size="sm" className="text-danger hover:bg-danger/10">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            }
            title="Delete Lead"
            description="Are you sure? This will also delete all associated activities and cannot be undone."
            confirmText="Delete"
            onConfirm={handleDelete}
            destructive
          />
        </div>
      </PageHeader>

      {/* Status */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Status</h3>
        <div className="flex items-center gap-3">
          <StatusBadge variant={LEAD_STATUS_VARIANT[lead.status]}>
            {labelOf(LEAD_STATUSES, lead.status)}
          </StatusBadge>
          <Select value={lead.status} onValueChange={(v) => handleStatusChange(v as string | null)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LEAD_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Contact Info */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {lead.phone && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Phone</p>
              <div className="flex items-center gap-2">
                <p className="font-semibold">{lead.phone}</p>
                <a
                  href={`tel:${lead.phone}`}
                  className="text-primary hover:underline"
                >
                  <Phone className="h-4 w-4" />
                </a>
              </div>
            </div>
          )}
          {lead.email && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Email</p>
              <div className="flex items-center gap-2">
                <p className="font-semibold">{lead.email}</p>
                <a
                  href={`mailto:${lead.email}`}
                  className="text-primary hover:underline"
                >
                  <Mail className="h-4 w-4" />
                </a>
              </div>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Source</p>
            <p className="font-semibold">{labelOf(LEAD_SOURCES, lead.source)}</p>
          </div>
          {lead.assignedName && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Assigned To</p>
              <p className="font-semibold">{lead.assignedName}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Budget & Details */}
      {(lead.budgetMin || lead.budgetMax || lead.listingTitle) && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(lead.budgetMin || lead.budgetMax) && (
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Budget</p>
                <p className="font-semibold">
                  {lead.budgetMin && lead.budgetMax
                    ? `${formatCurrency(lead.budgetMin)} - ${formatCurrency(lead.budgetMax)}`
                    : lead.budgetMin
                      ? `From ${formatCurrency(lead.budgetMin)}`
                      : `Up to ${formatCurrency(lead.budgetMax)}`}
                </p>
              </div>
            )}
            {lead.nextFollowUp && (
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Next Follow-up</p>
                <p className="font-semibold">{formatDate(lead.nextFollowUp)}</p>
              </div>
            )}
            {lead.listingTitle && (
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Listing</p>
                <p className="font-semibold">{lead.listingTitle}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Notes */}
      {lead.notes && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Notes</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSuggestReply}
              disabled={aiSuggestReplyMutation.isPending}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Suggest Reply (AI)
            </Button>
          </div>
          <p className="text-muted-foreground whitespace-pre-wrap">{lead.notes}</p>
        </Card>
      )}

      {/* AI Suggestion Dialog */}
      <Dialog open={suggestDialogOpen} onOpenChange={setSuggestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suggested Reply</DialogTitle>
          </DialogHeader>
          <Textarea
            value={suggestedReply}
            readOnly
            className="min-h-[150px]"
          />
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyReply}
              render={
                <button className="flex items-center gap-2">
                  <Copy className="h-4 w-4" />
                  Copy
                </button>
              }
            />
            {lead?.phone && (
              <Button
                size="sm"
                onClick={handleSendWhatsApp}
                render={
                  <button className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Send via WhatsApp
                  </button>
                }
              />
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activities */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Activity Timeline</h3>
        {(!lead.activities || lead.activities.length === 0) ? (
          <EmptyState
            title="No activities"
            description="No activities recorded for this lead yet"
          />
        ) : (
          <div className="space-y-4">
            {lead.activities.map((activity: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
              <div key={activity.id} className="flex gap-4 pb-4 border-b border-border last:border-0">
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    {labelOf(LEAD_ACTIVITY_TYPES, activity.type)}
                  </p>
                  {activity.content && (
                    <p className="text-sm text-muted-foreground mt-1">{activity.content}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatDate(activity.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add Activity Form */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Add Activity</h3>
        <Form {...activityForm}>
          <form
            onSubmit={activityForm.handleSubmit(onActivitySubmit)}
            className="space-y-4"
          >
            <FormField
              control={activityForm.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Activity Type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {LEAD_ACTIVITY_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={activityForm.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Details about this activity..."
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={activityForm.control}
              name="scheduledAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scheduled For</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      value={field.value instanceof Date ? field.value.toISOString().slice(0, 16) : String(field.value ?? "")}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={addActivityMutation.isPending}
              className="bg-primary"
            >
              {addActivityMutation.isPending ? "Adding..." : "Add Activity"}
            </Button>
          </form>
        </Form>
      </Card>

      {/* Metadata */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Metadata</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-muted-foreground">
          <div>
            <p className="font-medium mb-1">Created</p>
            <p>{formatDate(lead.createdAt)}</p>
          </div>
          <div>
            <p className="font-medium mb-1">Last Updated</p>
            <p>{formatDate(lead.updatedAt)}</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
