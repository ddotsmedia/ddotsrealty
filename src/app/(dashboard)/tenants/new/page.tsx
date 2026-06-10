"use client";

import { PageHeader } from "@/components/shared/page-header";
import { TenantForm } from "@/components/forms/tenant-form";
import { Card } from "@/components/ui/card";

export default function NewTenantPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Add Tenant" description="Create a new property tenant/renter" />
      <Card className="p-6">
        <TenantForm mode="create" />
      </Card>
    </div>
  );
}
