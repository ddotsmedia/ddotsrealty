"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Edit, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { formatDate, formatCurrency } from "@/lib/utils";

function maskValue(value: string): string {
  if (!value || value.length === 0) return "—";
  if (value.length <= 4) return "•".repeat(value.length);
  const dots = Math.min(value.length - 4, 8);
  return "•".repeat(dots) + value.slice(-4);
}

export default function OwnerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [revealEmiratesId, setRevealEmiratesId] = useState(false);
  const [revealPassportNo, setRevealPassportNo] = useState(false);

  // Statement form state
  const [statementFrom, setStatementFrom] = useState<string>(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return firstDay.toISOString().split("T")[0];
  });
  const [statementTo, setStatementTo] = useState<string>(() => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return lastDay.toISOString().split("T")[0];
  });

  const { data: owner, isLoading } = trpc.owner.getById.useQuery({ id });
  const deleteMutation = trpc.owner.delete.useMutation();

  // Query statement with current date range
  const { data: statement, isLoading: isStatementLoading } = trpc.owner.statement.useQuery({
    ownerId: id,
    from: new Date(statementFrom),
    to: new Date(statementTo),
  });

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Owner deleted successfully");
      router.push("/owners");
    } catch (error) {
      toast.error("Failed to delete owner");
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

  if (!owner) {
    return (
      <div className="space-y-6">
        <PageHeader title="Owner Not Found" />
        <EmptyState
          title="Owner not found"
          description="The owner you're looking for doesn't exist"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={owner.name}>
        <div className="flex gap-2">
          <Link href={`/owners/${id}/edit`}>
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
            title="Delete Owner"
            description="Are you sure you want to delete this owner? This action cannot be undone."
            confirmText="Delete"
            onConfirm={handleDelete}
            destructive
          />
        </div>
      </PageHeader>

      {/* Basic Information */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Name</p>
            <p className="font-semibold">{owner.name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Phone</p>
            <p className="font-semibold">{owner.phone || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Email</p>
            <p className="font-semibold">{owner.email || "—"}</p>
          </div>
          {owner.nationality && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Nationality</p>
              <p className="font-semibold">{owner.nationality}</p>
            </div>
          )}
        </div>
      </Card>

      {/* PII Information */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Personal Identification</h3>
        <p className="text-xs text-muted-foreground mb-4">Data encrypted at rest</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {owner.emiratesId && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-2">Emirates ID</p>
              <div className="flex items-center gap-2">
                <p className="font-semibold font-mono">
                  {revealEmiratesId ? owner.emiratesId : maskValue(owner.emiratesId)}
                </p>
                <button
                  onClick={() => setRevealEmiratesId(!revealEmiratesId)}
                  className="text-xs text-primary hover:underline"
                >
                  {revealEmiratesId ? "Hide" : "Reveal"}
                </button>
              </div>
            </div>
          )}
          {owner.passportNo && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-2">Passport No</p>
              <div className="flex items-center gap-2">
                <p className="font-semibold font-mono">
                  {revealPassportNo ? owner.passportNo : maskValue(owner.passportNo)}
                </p>
                <button
                  onClick={() => setRevealPassportNo(!revealPassportNo)}
                  className="text-xs text-primary hover:underline"
                >
                  {revealPassportNo ? "Hide" : "Reveal"}
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Address */}
      {owner.address && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Address</h3>
          <p className="text-muted-foreground whitespace-pre-wrap">{owner.address}</p>
        </Card>
      )}

      {/* Banking Information */}
      {(owner.bankName || owner.bankIban) && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Banking Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {owner.bankName && (
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Bank Name</p>
                <p className="font-semibold">{owner.bankName}</p>
              </div>
            )}
            {owner.bankIban && (
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">IBAN</p>
                <p className="font-semibold font-mono">{owner.bankIban}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Linked Properties */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Linked Properties</h3>
        <p className="text-lg font-semibold">{owner.linkedPropertiesCount} property/properties</p>
      </Card>

      {/* Notes */}
      {owner.notes && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Notes</h3>
          <p className="text-muted-foreground whitespace-pre-wrap">{owner.notes}</p>
        </Card>
      )}

      {/* Owner Statement */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Monthly Owner Statement</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="statement-from" className="text-xs text-muted-foreground font-medium mb-2 block">
                From Date
              </label>
              <input
                id="statement-from"
                type="date"
                value={statementFrom}
                onChange={(e) => setStatementFrom(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md text-sm"
              />
            </div>
            <div>
              <label htmlFor="statement-to" className="text-xs text-muted-foreground font-medium mb-2 block">
                To Date
              </label>
              <input
                id="statement-to"
                type="date"
                value={statementTo}
                onChange={(e) => setStatementTo(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md text-sm"
              />
            </div>
          </div>

          {isStatementLoading ? (
            <div className="space-y-3 pt-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : statement ? (
            <div className="pt-4 space-y-3 border-t">
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Rent Collected</span>
                <span className="font-semibold text-green-600">+ {formatCurrency(statement.totalRent)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Commission</span>
                <span className="font-semibold text-red-600">− {formatCurrency(statement.totalCommission)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Maintenance Costs</span>
                <span className="font-semibold text-red-600">− {formatCurrency(statement.totalMaintenance)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-t-2 border-primary pt-4">
                <span className="font-semibold">Net Payable</span>
                <span className="text-lg font-bold" style={{ color: statement.netPayable >= 0 ? "#10b981" : "#ef4444" }}>
                  {formatCurrency(statement.netPayable)}
                </span>
              </div>
            </div>
          ) : null}

          <div className="pt-4 flex gap-2">
            <a
              href={`/api/owners/${id}/statement?from=${statementFrom}&to=${statementTo}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="gap-2">
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
            </a>
          </div>
        </div>
      </Card>

      {/* Metadata */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Metadata</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-muted-foreground">
          <div>
            <p className="font-medium mb-1">Created</p>
            <p>{formatDate(owner.createdAt)}</p>
          </div>
          <div>
            <p className="font-medium mb-1">Last Updated</p>
            <p>{formatDate(owner.updatedAt)}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
