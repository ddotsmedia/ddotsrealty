"use client";

import { PageHeader } from "@/components/shared/page-header";
import { OwnerForm } from "@/components/forms/owner-form";
import { Card } from "@/components/ui/card";

export default function NewOwnerPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Add Owner" description="Create a new property owner" />
      <Card className="p-6">
        <OwnerForm mode="create" />
      </Card>
    </div>
  );
}
