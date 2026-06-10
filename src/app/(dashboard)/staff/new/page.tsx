"use client";

import { PageHeader } from "@/components/shared/page-header";
import { StaffForm } from "@/components/forms/staff-form";
import { Card } from "@/components/ui/card";

export default function NewStaffPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Add Staff" description="Create a new staff member account" />
      <Card className="p-6">
        <StaffForm mode="create" />
      </Card>
    </div>
  );
}
