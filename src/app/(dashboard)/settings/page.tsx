"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { EMIRATES } from "@/lib/constants";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileUpload } from "@/components/shared/file-upload";

const companySettingsSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  tradeLicense: z.string().optional().nullable(),
  reraOrn: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  address: z.string().optional().nullable(),
  emirate: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
});

type CompanySettings = z.infer<typeof companySettingsSchema>;

export default function SettingsPage() {
  const [logoUrl, setLogoUrl] = useState<string[]>([]);

  const { data: company, isLoading } = trpc.settings.getCompany.useQuery();
  const updateMutation = trpc.settings.updateCompany.useMutation();

  const form = useForm<CompanySettings>({
    resolver: zodResolver(companySettingsSchema),
    defaultValues: {
      name: "",
      tradeLicense: "",
      reraOrn: "",
      phone: "",
      email: "",
      address: "",
      emirate: "",
      logoUrl: "",
    },
  });

  // Update form when company data loads
  useEffect(() => {
    if (company) {
      form.reset({
        name: company.name,
        tradeLicense: company.tradeLicense || "",
        reraOrn: company.reraOrn || "",
        phone: company.phone || "",
        email: company.email || "",
        address: company.address || "",
        emirate: company.emirate || "",
        logoUrl: company.logoUrl || "",
      });
      if (company.logoUrl) {
        setLogoUrl([company.logoUrl]);
      }
    }
  }, [company, form]);

  const onSubmit = async (data: CompanySettings) => {
    try {
      const logoValue = logoUrl.length > 0 ? logoUrl[0] : data.logoUrl;
      await updateMutation.mutateAsync({
        ...data,
        logoUrl: logoValue,
      });
      toast.success("Company settings updated successfully");
    } catch (error) {
      toast.error("Failed to update company settings");
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card className="p-6 space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Company Settings" description="Manage your company profile and settings" />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Basic Information</h3>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Your company name" {...field} value={field.value || ""} />
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
                        <Input type="email" placeholder="company@example.com" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </Card>

          {/* Location & Registration */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Location & Registration</h3>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Office address" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="emirate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emirate</FormLabel>
                      <Select value={field.value || ""} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select emirate" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {EMIRATES.map((emirate) => (
                            <SelectItem key={emirate.value} value={emirate.value}>
                              {emirate.label}
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
                  name="tradeLicense"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trade License</FormLabel>
                      <FormControl>
                        <Input placeholder="License number" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="reraOrn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RERA ORN</FormLabel>
                    <FormControl>
                      <Input placeholder="RERA Organization Registration Number" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Card>

          {/* Logo */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Company Logo</h3>
            <FileUpload
              value={logoUrl}
              onChange={setLogoUrl}
              folder="logos"
              multiple={false}
              maxFiles={1}
              label="Upload Company Logo"
            />
          </Card>

          <div className="flex gap-3 justify-end pt-4">
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

      {/* Reminder Automation Link */}
      <Card className="p-6 border-dashed">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Reminder Automation</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Configure automated reminders for cheques and contracts
            </p>
          </div>
          <Button
            render={<a href="/settings/reminders" />}
            variant="outline"
            size="sm"
          >
            Configure
          </Button>
        </div>
      </Card>
    </div>
  );
}
