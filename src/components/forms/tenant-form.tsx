"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { tenantCreateSchema } from "@/lib/validators/contact";
import { trpc } from "@/lib/trpc";
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
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface TenantData {
  id?: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  emiratesId?: string | null;
  passportNo?: string | null;
  nationality?: string | null;
  companyName?: string | null;
  emergencyContact?: string | null;
  notes?: string | null;
}

interface TenantFormProps {
  mode: "create" | "edit";
  initial?: TenantData;
  tenantId?: string;
}

export function TenantForm({ mode, initial, tenantId }: TenantFormProps) {
  const router = useRouter();

  const form = useForm<TenantData>({
    resolver: zodResolver(tenantCreateSchema) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    defaultValues: initial || {
      name: "",
      phone: "",
      email: "",
      emiratesId: "",
      passportNo: "",
      nationality: "",
      companyName: "",
      emergencyContact: "",
      notes: "",
    },
  });

  const createMutation = trpc.propertyTenant.create.useMutation();
  const updateMutation = trpc.propertyTenant.update.useMutation();

  const onSubmit = async (data: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    try {
      if (mode === "create") {
        const result = await createMutation.mutateAsync(data);
        toast.success("Tenant created successfully");
        router.push(`/tenants/${result.id}`);
      } else {
        await updateMutation.mutateAsync({
          ...data,
          id: tenantId!,
        });
        toast.success("Tenant updated successfully");
        router.back();
      }
    } catch (error) {
      toast.error("Failed to save tenant");
      console.error(error);
    }
  };

  const isLoading = false;

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div>
          <h3 className="font-semibold mb-4">Basic Information</h3>
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

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@example.com" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nationality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nationality</FormLabel>
                    <FormControl>
                      <Input placeholder="Country" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Company..." {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {/* PII Information */}
        <div className="border-t pt-6">
          <h3 className="font-semibold mb-2">Personal Identification</h3>
          <p className="text-xs text-muted-foreground mb-4">Encrypted at rest</p>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="emiratesId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emirates ID</FormLabel>
                    <FormControl>
                      <Input placeholder="123-1234-5678901-1" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="passportNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Passport No</FormLabel>
                    <FormControl>
                      <Input placeholder="A12345678" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="border-t pt-6">
          <FormField
            control={form.control}
            name="emergencyContact"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Emergency Contact</FormLabel>
                <FormControl>
                  <Input placeholder="Name and phone number" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Notes */}
        <div className="border-t pt-6">
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea placeholder="Additional information" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
                ? "Create Tenant"
                : "Update Tenant"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
