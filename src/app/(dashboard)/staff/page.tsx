"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, Plus } from "lucide-react";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable } from "@/components/data/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { ROLE_LABELS, ROLE_VARIANT } from "@/lib/permissions";
import type { ColumnDef } from "@tanstack/react-table";

interface StaffItem {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone: string | null;
  role: "super_admin" | "admin" | "manager" | "broker" | "accountant" | "viewer";
  isActive: boolean;
  createdAt: Date;
  reraBrn: string | null;
  avatarUrl: string | null;
  lastLogin: Date | null;
  updatedAt: Date;
}

export default function StaffPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = trpc.staff.list.useQuery(
    {
      page,
      pageSize: 20,
      search: debouncedSearch || undefined,
    },
    {
      placeholderData: (prev) => prev,
    }
  );

  const tableColumns: ColumnDef<StaffItem>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => row.original.email,
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => (
        <StatusBadge variant={ROLE_VARIANT[row.original.role]}>
          {ROLE_LABELS[row.original.role]}
        </StatusBadge>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge variant={row.original.isActive ? "success" : "muted"}>
          {row.original.isActive ? "Active" : "Inactive"}
        </StatusBadge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Staff">
        <Link href="/staff/new">
          <Button className="bg-primary">
            <Plus className="h-4 w-4 mr-2" />
            Add Staff
          </Button>
        </Link>
      </PageHeader>

      {/* Search Bar */}
      <div className="bg-card border border-border rounded-lg p-4">
        <Input
          placeholder="Search by name or email..."
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
            title="No staff found"
            description="Create a new staff member to get started"
          />
        }
        pagination={{
          page,
          pageCount: data?.pageCount || 1,
          onPageChange: setPage,
        }}
      />
    </div>
  );
}
