"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { PropertyForm } from "@/components/forms/property-form";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";

export default function EditPropertyPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: property, isLoading } = trpc.property.getById.useQuery({ id });

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

  if (!property) {
    return (
      <div className="space-y-6">
        <PageHeader title="Property Not Found" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Property"
        description={property.title}
      />
      <Card className="p-6">
        <PropertyForm
          mode="edit"
          propertyId={id}
          initial={{
            id: property.id,
            title: property.title,
            type: property.type,
            purpose: property.purpose,
            status: property.status,
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
            areaSqft: property.areaSqft,
            price: property.price,
            priceFrequency: property.priceFrequency,
            currency: property.currency,
            address: property.address,
            buildingName: property.buildingName,
            community: property.community,
            emirate: property.emirate,
            latitude: property.latitude ? Number(property.latitude) : null,
            longitude: property.longitude ? Number(property.longitude) : null,
            amenities: property.amenities || [],
            ownerId: property.ownerId,
            assignedBroker: property.assignedBroker,
            referenceNo: property.referenceNo,
            notes: property.notes,
          }}
        />
      </Card>
    </div>
  );
}
