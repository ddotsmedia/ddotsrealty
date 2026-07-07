"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

const formSchema = z.object({
  remindersEnabled: z.boolean(),
  chequeReminderDays: z.string(),
  contractReminderDays: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

function parseNumberArray(str: string): number[] {
  if (!str.trim()) return [];
  return str
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n));
}

export default function RemindersPage() {
  const { data: settings, isLoading } =
    trpc.settings.getReminderSettings.useQuery();
  const updateMutation = trpc.settings.updateReminderSettings.useMutation();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      remindersEnabled: true,
      chequeReminderDays: "3,7",
      contractReminderDays: "7,15,30,60,90",
    },
  });

  // Update form when settings load
  useEffect(() => {
    if (settings) {
      form.reset({
        remindersEnabled: settings.remindersEnabled,
        chequeReminderDays: settings.chequeReminderDays.join(","),
        contractReminderDays: settings.contractReminderDays.join(","),
      });
    }
  }, [settings, form]);

  const onSubmit = async (data: FormValues) => {
    try {
      await updateMutation.mutateAsync({
        remindersEnabled: data.remindersEnabled,
        chequeReminderDays: parseNumberArray(data.chequeReminderDays),
        contractReminderDays: parseNumberArray(data.contractReminderDays),
      });
      toast.success("Reminder settings updated successfully");
    } catch (error) {
      toast.error("Failed to update reminder settings");
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card className="p-6 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reminder Automation"
        description="Configure automated reminders via WhatsApp (daily at 9:00 AM Asia/Dubai)"
      >
        <Link href="/settings">
          <Button variant="outline" size="sm">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Settings
          </Button>
        </Link>
      </PageHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Enable/Disable Reminders */}
          <Card className="p-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="remindersEnabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel>Enable Automated Reminders</FormLabel>
                      <p className="text-xs text-muted-foreground mt-1">
                        Send automated reminders via WhatsApp for upcoming cheques and contract expirations
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </Card>

          {/* Cheque Reminder Settings */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Cheque Reminders</h3>
            <FormField
              control={form.control}
              name="chequeReminderDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Days Before Due Date
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="3,7"
                      {...field}
                      disabled={!form.watch("remindersEnabled")}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground mt-2">
                    Enter comma-separated numbers (e.g., 3,7 to remind 3 and 7 days before due date)
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Card>

          {/* Contract Reminder Settings */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Contract Expiry Reminders</h3>
            <FormField
              control={form.control}
              name="contractReminderDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Days Before Expiration
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="7,15,30,60,90"
                      {...field}
                      disabled={!form.watch("remindersEnabled")}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground mt-2">
                    Enter comma-separated numbers (e.g., 7,15,30,60,90 to remind at each interval before expiration)
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Card>

          {/* Info Box */}
          <Card className="p-4 bg-muted/50 border-0">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Reminders are sent daily at 9:00 AM Asia/Dubai time via WhatsApp. Make sure all team members have WhatsApp set up and phone numbers configured in their profiles.
            </p>
          </Card>

          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              render={<Link href="/settings" />}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="bg-primary"
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
