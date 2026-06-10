"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Building2, LayoutGrid, List, Plus } from "lucide-react";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable } from "@/components/data/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import {
  PROPERTY_TYPES,
  PROPERTY_STATUSES,
  PROPERTY_PURPOSES,
  PROPERTY_STATUS_VARIANT,
  labelOf,
  EMIRATES,
  COMMUNITIES,
} from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";

interface PropertyItem {
  id: string;
  title: string;
  type: string;
  community: string | null;
  emirate: string | null;
  price: string | number | null;
  priceFrequency: string | null;
  status: string;
  bedrooms: number | null;
  referenceNo: string | null;
  primaryPhoto: string | null;
}

export default function PropertiesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [type, setType] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [purpose, setPurpose] = useState<string | undefined>(undefined);
  const [community, setCommunity] = useState<string | undefined>(undefined);
  const [emirate, setEmirate] = useState<string | undefined>(undefined);

  const { data, isLoading } = trpc.property.list.useQuery(
    {
      page,
      pageSize: view === "grid" ? 12 : 20,
      search: debouncedSearch || undefined,
      type,
      status,
      purpose,
      community,
      emirate,
    },
    {
      placeholderData: (prev) => prev,
    }
  );

  const tableColumns: ColumnDef<PropertyItem>[] = [
    {
      accessorKey: "referenceNo",
      header: "Reference",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.referenceNo || "—"}</span>
          <span className="text-xs text-muted-foreground">{row.original.title}</span>
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => labelOf(PROPERTY_TYPES, row.original.type),
    },
    {
      accessorKey: "community",
      header: "Community",
      cell: ({ row }) => row.original.community || "—",
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => {
        const price = row.original.price;
        const freq = row.original.priceFrequency;
        return price
          ? `${formatCurrency(price)} ${freq ? `/ ${freq}` : ""}`
          : "—";
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge variant={PROPERTY_STATUS_VARIANT[row.original.status]}>
          {labelOf(PROPERTY_STATUSES, row.original.status)}
        </StatusBadge>
      ),
    },
    {
      accessorKey: "bedrooms",
      header: "BR",
      cell: ({ row }) => row.original.bedrooms ?? "—",
    },
  ];

  const handleReset = useCallback(() => {
    setSearch("");
    setType(undefined);
    setStatus(undefined);
    setPurpose(undefined);
    setCommunity(undefined);
    setEmirate(undefined);
    setPage(1);
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Properties">
        <Link href="/properties/new">
          <Button className="bg-primary">
            <Plus className="h-4 w-4 mr-2" />
            Add Property
          </Button>
        </Link>
      </PageHeader>

      {/* Filter Bar */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Input
            placeholder="Search title, reference..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full"
          />

          <Select value={type || ""} onValueChange={(v) => { setType(v || undefined); setPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              {PROPERTY_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={status || ""} onValueChange={(v) => { setStatus(v || undefined); setPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              {PROPERTY_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={purpose || ""} onValueChange={(v) => { setPurpose(v || undefined); setPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder="Purpose" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Purposes</SelectItem>
              {PROPERTY_PURPOSES.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Select value={emirate || ""} onValueChange={(v) => { setEmirate(v || undefined); setPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder="Emirate" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Emirates</SelectItem>
              {EMIRATES.map((e) => (
                <SelectItem key={e.value} value={e.value}>
                  {e.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={community || ""} onValueChange={(v) => { setCommunity(v || undefined); setPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder="Community" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Communities</SelectItem>
              {COMMUNITIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2 sm:col-span-2 lg:col-span-2">
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex-1"
            >
              Reset
            </Button>
            <div className="flex border border-border rounded-lg">
              <button
                onClick={() => setView("grid")}
                className={`flex-1 p-2 flex items-center justify-center transition-colors ${
                  view === "grid"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView("list")}
                className={`flex-1 p-2 flex items-center justify-center transition-colors border-l border-border ${
                  view === "list"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid View */}
      {view === "grid" && (
        <>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-border overflow-hidden">
                  <Skeleton className="aspect-video w-full" />
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : data?.items.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No properties found"
              description="Try adjusting your filters or create a new property"
            />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {(data?.items || []).map((property: PropertyItem) => (
                  <div
                    key={property.id}
                    className="rounded-lg border border-border overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
                    onClick={() => router.push(`/properties/${property.id}`)}
                  >
                    {property.primaryPhoto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={property.primaryPhoto}
                        alt={property.title}
                        className="w-full aspect-video object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full aspect-video bg-muted flex items-center justify-center">
                        <Building2 className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="p-4 space-y-2">
                      <h3 className="font-semibold truncate">{property.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        {property.community || property.emirate || "—"}
                      </p>
                      <div className="flex items-center justify-between pt-2">
                        <p className="font-semibold text-sm">
                          {formatCurrency(property.price)}
                        </p>
                        <StatusBadge
                          variant={PROPERTY_STATUS_VARIANT[property.status]}
                        >
                          {labelOf(PROPERTY_STATUSES, property.status)}
                        </StatusBadge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {data!.pageCount > 1 && (
                <div className="flex items-center justify-center gap-2 pt-6">
                  <Button
                    variant="outline"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {data!.pageCount}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage(Math.min(data!.pageCount, page + 1))}
                    disabled={page === data!.pageCount}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* List View */}
      {view === "list" && (
        <DataTable
          columns={tableColumns}
          data={data?.items || []}
          isLoading={isLoading}
          emptyState={
            <EmptyState
              icon={Building2}
              title="No properties found"
              description="Try adjusting your filters or create a new property"
            />
          }
          onRowClick={(property) => router.push(`/properties/${property.id}`)}
          pagination={{
            page,
            pageCount: data?.pageCount || 1,
            onPageChange: setPage,
          }}
        />
      )}
    </div>
  );
}
