"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { trpc } from "@/lib/trpc"
import { ANNOUNCEMENT_TARGETS } from "@/lib/constants"

const BROADCAST_CHANNELS = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
  { value: "portal", label: "Portal" },
] as const

export default function NewAnnouncementPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    targetType: "all",
    sentVia: [] as string[],
  })

  const createMutation = trpc.announcement.create.useMutation({
    onSuccess: (data) => {
      toast.success("Announcement created successfully")
      router.push(`/announcements/${data.id}`)
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const handleToggleChannel = (channel: string) => {
    setFormData((prev) => ({
      ...prev,
      sentVia: prev.sentVia.includes(channel)
        ? prev.sentVia.filter((c) => c !== channel)
        : [...prev.sentVia, channel],
    }))
  }

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error("Title is required")
      return
    }

    createMutation.mutate({
      title: formData.title,
      content: formData.content || undefined,
      targetType: formData.targetType as any,
      sentVia: formData.sentVia,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/announcements">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Create Announcement</h1>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 max-w-2xl space-y-6">
        <div>
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            placeholder="Announcement title"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="content">Content</Label>
          <Textarea
            id="content"
            placeholder="Announcement message..."
            value={formData.content}
            onChange={(e) =>
              setFormData({ ...formData, content: e.target.value })
            }
            className="min-h-32 mt-2"
          />
        </div>

        <div>
          <Label htmlFor="targetType">Target Audience</Label>
          <Select
            value={formData.targetType ?? ""}
            onValueChange={(v: string | null) =>
              setFormData({ ...formData, targetType: v ?? "" })
            }
          >
            <SelectTrigger id="targetType" className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ANNOUNCEMENT_TARGETS.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Send Via</Label>
          <div className="mt-3 space-y-2">
            {BROADCAST_CHANNELS.map((channel) => (
              <div key={channel.value} className="flex items-center gap-2">
                <Checkbox
                  id={channel.value}
                  checked={formData.sentVia.includes(channel.value)}
                  onCheckedChange={() =>
                    handleToggleChannel(channel.value)
                  }
                />
                <Label htmlFor={channel.value} className="font-normal cursor-pointer">
                  {channel.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            className="bg-primary"
            onClick={handleSubmit}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? "Creating..." : "Create Announcement"}
          </Button>
          <Link href="/announcements">
            <Button variant="outline">Cancel</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
