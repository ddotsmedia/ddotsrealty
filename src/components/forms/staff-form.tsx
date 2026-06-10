"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { staffCreateSchema } from "@/lib/validators/staff";
import { trpc } from "@/lib/trpc";
import { ROLE_LABELS } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StaffData {
  id?: string;
  name: string;
  email: string;
  phone?: string | null;
  role: "admin" | "manager" | "broker" | "accountant" | "viewer";
  reraBrn?: string | null;
  password?: string;
  isActive?: boolean;
}

interface StaffFormProps {
  mode: "create" | "edit";
  initial?: StaffData;
  staffId?: string;
}

export function StaffForm({ mode, initial, staffId }: StaffFormProps) {
  const router = useRouter();

  const form = useForm<any>({ // eslint-disable-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(
      mode === "create"
        ? staffCreateSchema
        : staffCreateSchema.partial().omit({ password: true })
    ) as any,
    defaultValues: initial || {
      name: "",
      email: "",
      phone: "",
      role: "broker",
      reraBrn: "",
      password: "",
      isActive: true,
    },
  });

  const createMutation = trpc.staff.create.useMutation();
  const updateMutation = trpc.staff.update.useMutation();

  const onSubmit = async (data: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    try {
      if (mode === "create") {
        const result = await createMutation.mutateAsync(data);
        toast.success("Staff member created successfully");
        router.push(`/staff/${result.id}`);
      } else {
        const { password, ...updateData } = data;
        await updateMutation.mutateAsync({
          ...updateData,
          id: staffId!,
        });
        toast.success("Staff member updated successfully");
        router.back();
      }
    } catch (error) {
      toast.error("Failed to save staff member");
      console.error(error);
    }
  };

  const isLoading = false;

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Information */}
        <div>
          <h3 className="font-semibold mb-4">Personal Information</h3>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Full name" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@example.com" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+971..." {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {/* Role & Credentials */}
        <div className="border-t pt-6">
          <h3 className="font-semibold mb-4">Role & Credentials</h3>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(ROLE_LABELS)
                        .filter(([key]) => !["super_admin"].includes(key))
                        .map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reraBrn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RERA BRN</FormLabel>
                  <FormControl>
                    <Input placeholder="RERA registration number" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {mode === "create" && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password *</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Minimum 8 characters"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="bg-primary"
          >
            {createMutation.isPending || updateMutation.isPending
              ? "Saving..."
              : mode === "create"
                ? "Create Staff"
                : "Update Staff"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
