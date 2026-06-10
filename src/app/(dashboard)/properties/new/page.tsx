"use client";

import { PageHeader } from "@/components/shared/page-header";
import { PropertyForm } from "@/components/forms/property-form";
import { Card } from "@/components/ui/card";

export default function NewPropertyPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Add Property" description="Create a new property listing" />
      <Card className="p-6">
        <PropertyForm mode="create" />
      </Card>
    </div>
  );
}
