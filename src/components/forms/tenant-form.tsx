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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  VISA_STATUSES,
  SALARY_RANGES,
  SCREENING_STATUSES,
} from "@/lib/constants";

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
  // Screening & Employment
  photoUrl?: string | null;
  visaStatus?: string | null;
  visaExpiry?: Date | null;
  visaUid?: string | null;
  salaryRange?: string | null;
  employerName?: string | null;
  employerPhone?: string | null;
  previousAddress?: string | null;
  previousLandlord?: string | null;
  previousLandlordPhone?: string | null;
  blacklisted?: boolean;
  blacklistReason?: string | null;
  screeningStatus?: string;
  screeningDate?: Date | null;
  screeningNotes?: string | null;
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
      photoUrl: "",
      visaStatus: "",
      visaExpiry: null,
      visaUid: "",
      salaryRange: "",
      employerName: "",
      employerPhone: "",
      previousAddress: "",
      previousLandlord: "",
      previousLandlordPhone: "",
      blacklisted: false,
      blacklistReason: "",
      screeningStatus: "pending",
      screeningDate: null,
      screeningNotes: "",
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

        {/* Screening & Employment */}
        <div className="border-t pt-6">
          <h3 className="font-semibold mb-4">Screening & Employment</h3>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="visaStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visa Status</FormLabel>
                  <FormControl>
                    <Select value={field.value || ""} onValueChange={(v) => field.onChange(v || null)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select visa status" />
                      </SelectTrigger>
                      <SelectContent>
                        {VISA_STATUSES.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="visaExpiry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visa Expiry Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      value={
                        field.value
                          ? new Date(field.value).toISOString().split("T")[0]
                          : ""
                      }
                      onChange={(e) => {
                        field.onChange(e.target.value ? new Date(e.target.value) : null);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="visaUid"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visa UID</FormLabel>
                  <FormControl>
                    <Input placeholder="Visa ID" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="salaryRange"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Salary Range</FormLabel>
                  <FormControl>
                    <Select value={field.value || ""} onValueChange={(v) => field.onChange(v || null)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select salary range" />
                      </SelectTrigger>
                      <SelectContent>
                        {SALARY_RANGES.map((range) => (
                          <SelectItem key={range.value} value={range.value}>
                            {range.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="employerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employer Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Company name" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="employerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employer Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+971..." {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="previousAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Previous Address</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Previous residence address" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="previousLandlord"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Previous Landlord</FormLabel>
                    <FormControl>
                      <Input placeholder="Name" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="previousLandlordPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Previous Landlord Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+971..." {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="screeningStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Screening Status</FormLabel>
                  <FormControl>
                    <Select value={field.value || "pending"} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select screening status" />
                      </SelectTrigger>
                      <SelectContent>
                        {SCREENING_STATUSES.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                ? "Create Tenant"
                : "Update Tenant"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
