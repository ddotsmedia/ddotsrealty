"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, Plus } from "lucide-react";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { DataTable } from "@/components/data/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import type { ColumnDef } from "@tanstack/react-table";

interface OwnerItem {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  nationality: string | null;
  createdAt: Date;
}

export default function OwnersPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = trpc.owner.list.useQuery(
    {
      page,
      pageSize: 20,
      search: debouncedSearch || undefined,
    },
    {
      placeholderData: (prev) => prev,
    }
  );

  const tableColumns: ColumnDef<OwnerItem>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => row.original.phone || "—",
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => row.original.email || "—",
    },
    {
      accessorKey: "nationality",
      header: "Nationality",
      cell: ({ row }) => row.original.nationality || "—",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Owners">
        <Link href="/owners/new">
          <Button className="bg-primary">
            <Plus className="h-4 w-4 mr-2" />
            Add Owner
          </Button>
        </Link>
      </PageHeader>

      {/* Search Bar */}
      <div className="bg-card border border-border rounded-lg p-4">
        <Input
          placeholder="Search by name, phone, or email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full"
        />
      </div>

      {/* Table */}
      <DataTable
        columns={tableColumns}
        data={data?.items || []}
        isLoading={isLoading}
        emptyState={
          <EmptyState
            icon={Users}
            title="No owners found"
            description="Try adjusting your search or create a new owner"
          />
        }
        onRowClick={(owner) => router.push(`/owners/${owner.id}`)}
        pagination={{
          page,
          pageCount: data?.pageCount || 1,
          onPageChange: setPage,
        }}
      />
    </div>
  );
}
