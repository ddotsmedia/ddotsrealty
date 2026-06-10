"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  PROPERTY_TYPES,
  PROPERTY_PURPOSES,
  PROPERTY_STATUSES,
  PRICE_FREQUENCIES,
  EMIRATES,
  COMMUNITIES,
} from "@/lib/constants";
import { propertyCreateSchema } from "@/lib/validators/property";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { FileUpload } from "@/components/shared/file-upload";
import { MapPicker } from "@/components/shared/map-picker";
import { Skeleton } from "@/components/ui/skeleton";

interface PropertyData {
  id?: string;
  title: string;
  type: "apartment" | "villa" | "townhouse" | "office" | "warehouse" | "land" | "building" | "penthouse" | "studio";
  purpose: "rent" | "sale" | "both";
  status: "available" | "rented" | "sold" | "under_maintenance" | "off_market";
  bedrooms: number | null;
  bathrooms: number | null;
  areaSqft: string | number | null;
  price: string | number | null;
  priceFrequency: "yearly" | "monthly" | "weekly" | "daily" | "total" | null;
  currency: string;
  address: string | null;
  buildingName: string | null;
  community: string | null;
  emirate: "abu_dhabi" | "dubai" | "sharjah" | "ajman" | "umm_al_quwain" | "ras_al_khaimah" | "fujairah" | null;
  latitude: number | null;
  longitude: number | null;
  amenities: string[];
  ownerId: string | null;
  assignedBroker: string | null;
  referenceNo: string | null;
  notes: string | null;
}

interface PropertyFormProps {
  mode: "create" | "edit";
  initial?: PropertyData;
  propertyId?: string;
}

export function PropertyForm({ mode, initial, propertyId }: PropertyFormProps) {
  const router = useRouter();
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  const form = useForm<PropertyData>({
    resolver: zodResolver(propertyCreateSchema) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    defaultValues: initial || {
      title: "",
      type: "apartment",
      purpose: "rent",
      status: "available",
      bedrooms: null,
      bathrooms: null,
      areaSqft: null,
      price: null,
      priceFrequency: "yearly",
      currency: "AED",
      address: "",
      buildingName: "",
      community: "",
      emirate: null,
      latitude: null,
      longitude: null,
      amenities: [],
      ownerId: null,
      assignedBroker: null,
      referenceNo: "",
      notes: "",
    },
  });

  const selectableOwnersQuery = trpc.property.selectableOwners.useQuery();
  const selectableBrokersQuery = trpc.property.selectableBrokers.useQuery();
  const createMutation = trpc.property.create.useMutation();
  const updateMutation = trpc.property.update.useMutation();
  const addPhotosMutation = trpc.property.addPhotos.useMutation();

  const onSubmit = async (data: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    try {
      const amenitiesArray = data.amenities
        ? typeof data.amenities === "string"
          ? data.amenities.split(",").map((s: string) => s.trim()).filter((s: string) => s)
          : data.amenities
        : [];

      const payload = {
        ...data,
        amenities: amenitiesArray,
        bedrooms: data.bedrooms === "" ? null : data.bedrooms,
        bathrooms: data.bathrooms === "" ? null : data.bathrooms,
        areaSqft: data.areaSqft === "" ? null : data.areaSqft,
        price: data.price === "" ? null : data.price,
      };

      if (mode === "create") {
        const result = await createMutation.mutateAsync(payload);

        if (photoUrls.length > 0) {
          await addPhotosMutation.mutateAsync({
            propertyId: result.id,
            photos: photoUrls.map((url) => ({
              url,
              caption: "",
            })),
          });
        }

        toast.success("Property created successfully");
        router.push(`/properties/${result.id}`);
      } else {
        await updateMutation.mutateAsync({
          ...payload,
          id: propertyId!,
        });

        if (photoUrls.length > 0) {
          await addPhotosMutation.mutateAsync({
            propertyId: propertyId!,
            photos: photoUrls.map((url) => ({
              url,
              caption: "",
            })),
          });
        }

        toast.success("Property updated successfully");
        router.back();
      }
    } catch (error) {
      toast.error("Failed to save property");
      console.error(error);
    }
  };

  const amenitiesValue = form.watch("amenities");
  const amenitiesString = Array.isArray(amenitiesValue)
    ? amenitiesValue.join(", ")
    : amenitiesValue || "";

  const isLoading = selectableOwnersQuery.isLoading || selectableBrokersQuery.isLoading;

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
          </TabsList>

          {/* Basic Tab */}
          <TabsContent value="basic" className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Beautiful 2BR Apartment in Marina" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PROPERTY_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
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
                name="purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purpose</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PROPERTY_PURPOSES.map((purpose) => (
                          <SelectItem key={purpose.value} value={purpose.value}>
                            {purpose.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PROPERTY_STATUSES.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
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
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="AED" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="50000"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priceFrequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <Select value={field.value || "yearly"} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PRICE_FREQUENCIES.map((freq) => (
                          <SelectItem key={freq.value} value={freq.value}>
                            {freq.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="ownerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner</FormLabel>
                    <Select value={field.value || ""} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select owner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Unassigned</SelectItem>
                        {(selectableOwnersQuery.data || []).map((owner: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                          <SelectItem key={owner.id} value={owner.id}>
                            {owner.name}
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
                name="assignedBroker"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Broker</FormLabel>
                    <Select value={field.value || ""} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select broker" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Unassigned</SelectItem>
                        {(selectableBrokersQuery.data || []).map((broker: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                          <SelectItem key={broker.id} value={broker.id}>
                            {broker.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          {/* Location Tab */}
          <TabsContent value="location" className="space-y-6">
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
              name="community"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Community</FormLabel>
                  <Select value={field.value || ""} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select or type community" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {COMMUNITIES.map((community) => (
                        <SelectItem key={community} value={community}>
                          {community}
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
              name="buildingName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Building Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., The Pinnacle" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Full property address"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel className="mb-4 block">Map Coordinates</FormLabel>
              <MapPicker
                latitude={form.watch("latitude")}
                longitude={form.watch("longitude")}
                onChange={(lat, lng) => {
                  form.setValue("latitude", lat);
                  form.setValue("longitude", lng);
                }}
              />
            </div>
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="bedrooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bedrooms</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="2"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bathrooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bathrooms</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="2"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="areaSqft"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Area (sqft)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="1500"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="amenities"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amenities (comma-separated)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Pool, Gym, Parking, Security"
                      value={amenitiesString}
                      onChange={(e) => {
                        const array = e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter((s) => s);
                        field.onChange(array);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="referenceNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference No</FormLabel>
                  <FormControl>
                    <Input placeholder="Auto-generated if left empty" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
          </TabsContent>

          {/* Photos Tab */}
          <TabsContent value="photos" className="space-y-6">
            <FileUpload
              value={photoUrls}
              onChange={setPhotoUrls}
              folder="properties"
              multiple
              maxFiles={10}
              label="Property Photos"
            />
          </TabsContent>
        </Tabs>

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
            disabled={
              createMutation.isPending ||
              updateMutation.isPending ||
              addPhotosMutation.isPending
            }
            className="bg-primary"
          >
            {createMutation.isPending ||
            updateMutation.isPending ||
            addPhotosMutation.isPending
              ? "Saving..."
              : mode === "create"
                ? "Create Property"
                : "Update Property"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
