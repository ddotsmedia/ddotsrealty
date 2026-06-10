"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { OwnerForm } from "@/components/forms/owner-form";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";

export default function EditOwnerPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: owner, isLoading } = trpc.owner.getById.useQuery({ id });

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

  if (!owner) {
    return (
      <div className="space-y-6">
        <PageHeader title="Owner Not Found" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Owner"
        description={owner.name}
      />
      <Card className="p-6">
        <OwnerForm
          mode="edit"
          ownerId={id}
          initial={{
            id: owner.id,
            name: owner.name,
            phone: owner.phone,
            email: owner.email,
            emiratesId: owner.emiratesId,
            passportNo: owner.passportNo,
            nationality: owner.nationality,
            address: owner.address,
            bankName: owner.bankName,
            bankIban: owner.bankIban,
            notes: owner.notes,
          }}
        />
      </Card>
    </div>
  );
}
