"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
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
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { FileUpload } from "@/components/shared/file-upload";
import { DocumentCard } from "@/components/shared/document-card";
import { trpc } from "@/lib/trpc";
import { DOC_TYPES, labelOf } from "@/lib/constants";
import { documentCreateSchema } from "@/lib/validators/document";
import type { DocumentCreate } from "@/lib/validators/document";
import { FileText } from "lucide-react";

export default function DocumentsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [entityTypeFilter, setEntityTypeFilter] = useState<string | undefined>(
    undefined
  );
  const [docTypeFilter, setDocTypeFilter] = useState<string | undefined>(
    undefined
  );
  const [searchFilter, setSearchFilter] = useState("");

  const { data: grouped, isLoading: isLoadingGrouped, refetch } = trpc.document.grouped.useQuery();
  const createMutation = trpc.document.create.useMutation();
  const deleteMutation = trpc.document.delete.useMutation();

  const form = useForm<DocumentCreate>({
    resolver: zodResolver(documentCreateSchema) as never, // eslint-disable-line @typescript-eslint/no-explicit-any
    defaultValues: {
      entityType: "property",
      docType: "other",
      entityId: "00000000-0000-0000-0000-000000000000",
      name: "",
      fileUrl: "",
      expiryDate: undefined,
    },
  });

  const handleFileUpload = useCallback(
    (urls: string[]) => {
      if (urls.length > 0) {
        form.setValue("fileUrl", urls[0]);
        // Extract filename for name if it's a URL
        const url = urls[0];
        const filename = url.split("/").pop()?.split("?")[0] || "";
        if (filename) {
          form.setValue("name", filename);
        }
      }
    },
    [form]
  );

  const onSubmit = async (data: DocumentCreate) => {
    try {
      await createMutation.mutateAsync(data);
      toast.success("Document uploaded successfully");
      form.reset();
      setIsDialogOpen(false);
      refetch();
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload document");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Document deleted");
      refetch();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete document");
    }
  };

  // Filter the grouped data based on entityTypeFilter
  const filteredGrouped = (grouped ?? []).filter((group) => {
    if (entityTypeFilter && group.entityType !== entityTypeFilter) {
      return false;
    }
    return true;
  });

  // Filter documents within each group
  const filterDocInGroup = (
    docs: Array<{ id: string; name: string; docType: string; fileUrl: string; expiryDate?: string | Date | null; mimeType?: string | null }>
  ) => {
    return docs.filter((doc: { id: string; name: string; docType: string; fileUrl: string; expiryDate?: string | Date | null; mimeType?: string | null }) => {
      if (docTypeFilter && doc.docType !== docTypeFilter) {
        return false;
      }
      if (searchFilter && !doc.name.toLowerCase().includes(searchFilter.toLowerCase())) {
        return false;
      }
      return true;
    });
  };

  const hasAnyDocs = filteredGrouped?.some(
    (group) => filterDocInGroup(group.docs).length > 0
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Documents">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button className="bg-primary"><Plus className="h-4 w-4 mr-2" />Upload Document</Button>} />
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* File Upload */}
                <FormField
                  control={form.control}
                  name="fileUrl"
                  render={() => (
                    <FormItem>
                      <FormLabel>File</FormLabel>
                      <FormControl>
                        <FileUpload
                          value={
                            form.getValues("fileUrl")
                              ? [form.getValues("fileUrl")]
                              : []
                          }
                          onChange={handleFileUpload}
                          folder="documents"
                          multiple={false}
                          accept="*"
                          label="Select a document to upload"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Document Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Trade License 2025"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Entity Type */}
                <FormField
                  control={form.control}
                  name="entityType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document For</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="property">Property</SelectItem>
                          <SelectItem value="contract">Contract</SelectItem>
                          <SelectItem value="owner">Owner</SelectItem>
                          <SelectItem value="tenant">Tenant</SelectItem>
                          <SelectItem value="broker">Broker</SelectItem>
                          <SelectItem value="company">Company</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Doc Type */}
                <FormField
                  control={form.control}
                  name="docType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Type</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DOC_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Entity ID */}
                <FormField
                  control={form.control}
                  name="entityId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Link to Record (UUID)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Leave blank or enter entity UUID"
                          {...field}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground mt-1">
                        Optional: UUID of the property, contract, owner, etc.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Expiry Date */}
                <FormField
                  control={form.control}
                  name="expiryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={
                            field.value
                              ? new Date(field.value)
                                  .toISOString()
                                  .split("T")[0]
                              : ""
                          }
                          onChange={(e) => {
                            field.onChange(
                              e.target.value
                                ? new Date(e.target.value)
                                : undefined
                            );
                          }}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground mt-1">
                        Optional: Date when this document expires
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={
                    createMutation.isPending ||
                    !form.getValues("fileUrl")
                  }
                  className="w-full"
                >
                  {createMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Upload Document
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Filter Bar */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Input
            placeholder="Search documents..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full"
          />

          <Select
            value={entityTypeFilter || ""}
            onValueChange={(v) => setEntityTypeFilter(v || undefined)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Document Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Document For</SelectItem>
              <SelectItem value="property">Property</SelectItem>
              <SelectItem value="contract">Contract</SelectItem>
              <SelectItem value="owner">Owner</SelectItem>
              <SelectItem value="tenant">Tenant</SelectItem>
              <SelectItem value="broker">Broker</SelectItem>
              <SelectItem value="company">Company</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={docTypeFilter || ""}
            onValueChange={(v) => setDocTypeFilter(v || undefined)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              {DOC_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => {
              setSearchFilter("");
              setEntityTypeFilter(undefined);
              setDocTypeFilter(undefined);
            }}
          >
            Reset Filters
          </Button>
        </div>
      </div>

      {/* Documents Grid */}
      {isLoadingGrouped ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-40 rounded-lg border border-border bg-muted animate-pulse" />
          ))}
        </div>
      ) : !hasAnyDocs ? (
        <EmptyState
          icon={FileText}
          title="No documents found"
          description="Upload your first document to get started"
        />
      ) : (
        <div className="space-y-8">
          {filteredGrouped.map((group) => {
            const filteredDocs = filterDocInGroup(group.docs);
            if (filteredDocs.length === 0) return null;

            return (
              <div key={group.entityType}>
                <h2 className="text-lg font-semibold mb-4 capitalize">
                  {group.entityType}s
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredDocs.map((doc: { id: string; name: string; docType: string; fileUrl: string; expiryDate?: string | Date | null; mimeType?: string | null }) => (
                    <DocumentCard
                      key={doc.id}
                      doc={doc}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
