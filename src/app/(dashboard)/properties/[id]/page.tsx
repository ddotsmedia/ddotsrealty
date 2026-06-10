"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Edit, Trash2, Building2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PhotoGallery } from "@/components/shared/photo-gallery";
import { MapPicker } from "@/components/shared/map-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileUpload } from "@/components/shared/file-upload";
import { trpc } from "@/lib/trpc";
import {
  PROPERTY_TYPES,
  PROPERTY_PURPOSES,
  PROPERTY_STATUSES,
  PROPERTY_STATUS_VARIANT,
  EMIRATES,
  labelOf,
} from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  const { data: property, isLoading } = trpc.property.getById.useQuery({ id });
  const deleteMutation = trpc.property.delete.useMutation();
  const addPhotosMutation = trpc.property.addPhotos.useMutation();
  const removePhotoMutation = trpc.property.removePhoto.useMutation();
  const setPrimaryPhotoMutation = trpc.property.setPrimaryPhoto.useMutation();

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Property deleted successfully");
      router.push("/properties");
    } catch (error) {
      toast.error("Failed to delete property");
      console.error(error);
    }
  };

  const handleAddPhotos = async () => {
    if (photoUrls.length === 0) return;
    try {
      await addPhotosMutation.mutateAsync({
        propertyId: id,
        photos: photoUrls.map((url) => ({ url, caption: "" })),
      });
      setPhotoUrls([]);
      toast.success("Photos added successfully");
    } catch (error) {
      toast.error("Failed to add photos");
      console.error(error);
    }
  };

  const handleRemovePhoto = async (photoId: string) => {
    try {
      await removePhotoMutation.mutateAsync({ id: photoId });
      toast.success("Photo removed");
    } catch (error) {
      toast.error("Failed to remove photo");
      console.error(error);
    }
  };

  const handleSetPrimary = async (photoId: string) => {
    try {
      await setPrimaryPhotoMutation.mutateAsync({ propertyId: id, photoId });
      toast.success("Primary photo updated");
    } catch (error) {
      toast.error("Failed to update primary photo");
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card className="p-6 space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
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
        <EmptyState
          title="Property not found"
          description="The property you're looking for doesn't exist"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={property.title}>
        <div className="flex gap-2">
          <Link href={`/properties/${id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <ConfirmDialog
            trigger={
              <Button variant="outline" size="sm" className="text-danger hover:bg-danger/10">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            }
            title="Delete Property"
            description="Are you sure you want to delete this property? This action cannot be undone."
            confirmText="Delete"
            onConfirm={handleDelete}
            destructive
          />
        </div>
      </PageHeader>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="cheques">Cheques</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Reference</p>
                <p className="font-semibold">{property.referenceNo || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Type</p>
                <p className="font-semibold">{labelOf(PROPERTY_TYPES, property.type)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Purpose</p>
                <p className="font-semibold">{labelOf(PROPERTY_PURPOSES, property.purpose)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Status</p>
                <StatusBadge variant={PROPERTY_STATUS_VARIANT[property.status]}>
                  {labelOf(PROPERTY_STATUSES, property.status)}
                </StatusBadge>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Pricing</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Price</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(property.price)} {property.priceFrequency && `/ ${property.priceFrequency}`}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Currency</p>
                <p className="font-semibold">{property.currency}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Specifications</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Bedrooms</p>
                <p className="font-semibold">{property.bedrooms ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Bathrooms</p>
                <p className="font-semibold">{property.bathrooms ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Area (sqft)</p>
                <p className="font-semibold">{property.areaSqft ?? "—"}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Location</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Emirate</p>
                <p className="font-semibold">{labelOf(EMIRATES, property.emirate) || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Community</p>
                <p className="font-semibold">{property.community || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Building</p>
                <p className="font-semibold">{property.buildingName || "—"}</p>
              </div>
            </div>
            {property.address && (
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Address</p>
                <p className="font-semibold whitespace-pre-wrap">{property.address}</p>
              </div>
            )}
          </Card>

          {property.latitude && property.longitude && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Map</h3>
              <MapPicker
                latitude={Number(property.latitude)}
                longitude={Number(property.longitude)}
                onChange={() => {}}
              />
            </Card>
          )}

          {property.amenities && property.amenities.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {property.amenities.map((amenity: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </Card>
          )}

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Contacts</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Owner</p>
                <p className="font-semibold">{property.ownerName || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Assigned Broker</p>
                <p className="font-semibold">{property.brokerName || "—"}</p>
              </div>
            </div>
          </Card>

          {property.notes && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Notes</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{property.notes}</p>
            </Card>
          )}

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Metadata</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-muted-foreground">
              <div>
                <p className="font-medium mb-1">Created</p>
                <p>{formatDate(property.createdAt)}</p>
              </div>
              <div>
                <p className="font-medium mb-1">Last Updated</p>
                <p>{formatDate(property.updatedAt)}</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Photos Tab */}
        <TabsContent value="photos" className="space-y-6">
          {property.photos.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Property Photos</h3>
              <PhotoGallery
                photos={property.photos}
                onSetPrimary={(url) => {
                  const photo = property.photos.find((p: any) => p.url === url); // eslint-disable-line @typescript-eslint/no-explicit-any
                  if (photo?.id) {
                    handleSetPrimary(photo.id);
                  }
                }}
                onRemove={(url) => {
                  const photo = property.photos.find((p: any) => p.url === url); // eslint-disable-line @typescript-eslint/no-explicit-any
                  if (photo?.id) {
                    handleRemovePhoto(photo.id);
                  }
                }}
              />
            </Card>
          )}

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Add More Photos</h3>
            <FileUpload
              value={photoUrls}
              onChange={setPhotoUrls}
              folder="properties"
              multiple
              maxFiles={5}
              label="Upload Photos"
            />
            {photoUrls.length > 0 && (
              <Button
                onClick={handleAddPhotos}
                disabled={addPhotosMutation.isPending}
                className="mt-4 bg-primary"
              >
                {addPhotosMutation.isPending ? "Adding..." : "Add Photos"}
              </Button>
            )}
          </Card>
        </TabsContent>

        {/* Contracts Tab */}
        <TabsContent value="contracts">
          <Card className="p-6">
            <EmptyState
              title="No contracts yet"
              description="Contracts for this property will appear here"
            />
          </Card>
        </TabsContent>

        {/* Cheques Tab */}
        <TabsContent value="cheques">
          <Card className="p-6">
            <EmptyState
              title="No cheques yet"
              description="Cheques for this property will appear here"
            />
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card className="p-6">
            <EmptyState
              title="No documents yet"
              description="Documents for this property will appear here"
            />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
