"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { TenantForm } from "@/components/forms/tenant-form";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";

export default function EditTenantPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: tenant, isLoading } = trpc.propertyTenant.getById.useQuery({ id });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card className="p-6 space-y-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </Card>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="space-y-6">
        <PageHeader title="Tenant Not Found" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Tenant"
        description={tenant.name}
      />
      <Card className="p-6">
        <TenantForm
          mode="edit"
          tenantId={id}
          initial={{
            id: tenant.id,
            name: tenant.name,
            phone: tenant.phone,
            email: tenant.email,
            emiratesId: tenant.emiratesId,
            passportNo: tenant.passportNo,
            nationality: tenant.nationality,
            companyName: tenant.companyName,
            emergencyContact: tenant.emergencyContact,
            notes: tenant.notes,
          }}
        />
      </Card>
    </div>
  );
}
