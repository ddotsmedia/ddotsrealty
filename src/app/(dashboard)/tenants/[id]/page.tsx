"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { formatDate, formatCurrency } from "@/lib/utils";
import {
  VISA_STATUSES,
  VISA_STATUS_VARIANT,
  SALARY_RANGES,
  SCREENING_STATUSES,
  SCREENING_STATUS_VARIANT,
  labelOf,
} from "@/lib/constants";

function maskValue(value: string): string {
  if (!value || value.length === 0) return "—";
  if (value.length <= 4) return "•".repeat(value.length);
  const dots = Math.min(value.length - 4, 8);
  return "•".repeat(dots) + value.slice(-4);
}

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [revealEmiratesId, setRevealEmiratesId] = useState(false);
  const [revealPassportNo, setRevealPassportNo] = useState(false);
  const [openBlacklist, setOpenBlacklist] = useState(false);
  const [blacklistReason, setBlacklistReason] = useState("");

  const { data: tenant, isLoading, refetch } = trpc.propertyTenant.getById.useQuery({ id });
  const { data: outstandingBalance } = trpc.propertyTenant.outstandingBalance.useQuery({ id });
  const deleteMutation = trpc.propertyTenant.delete.useMutation();
  const setBlacklistMutation = trpc.propertyTenant.setBlacklist.useMutation();
  const toast = require("sonner").toast;

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Tenant deleted successfully");
      router.push("/tenants");
    } catch (error) {
      toast.error("Failed to delete tenant");
      console.error(error);
    }
  };

  const handleToggleBlacklist = async () => {
    try {
      await setBlacklistMutation.mutateAsync({
        id,
        blacklisted: !tenant?.blacklisted,
        reason: blacklistReason || undefined,
      });
      toast.success(tenant?.blacklisted ? "Tenant unblacklisted" : "Tenant blacklisted");
      setOpenBlacklist(false);
      setBlacklistReason("");
      refetch();
    } catch (error) {
      toast.error("Failed to update blacklist status");
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

  if (!tenant) {
    return (
      <div className="space-y-6">
        <PageHeader title="Tenant Not Found" />
        <EmptyState
          title="Tenant not found"
          description="The tenant you're looking for doesn't exist"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={tenant.name}>
        <div className="flex gap-2">
          <Link href={`/tenants/${id}/edit`}>
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
            title="Delete Tenant"
            description="Are you sure you want to delete this tenant? This action cannot be undone."
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
            <p className="font-semibold">{tenant.name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Phone</p>
            <p className="font-semibold">{tenant.phone || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Email</p>
            <p className="font-semibold">{tenant.email || "—"}</p>
          </div>
          {tenant.companyName && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Company</p>
              <p className="font-semibold">{tenant.companyName}</p>
            </div>
          )}
          {tenant.nationality && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Nationality</p>
              <p className="font-semibold">{tenant.nationality}</p>
            </div>
          )}
        </div>
      </Card>

      {/* PII Information */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Personal Identification</h3>
        <p className="text-xs text-muted-foreground mb-4">Data encrypted at rest</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {tenant.emiratesId && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-2">Emirates ID</p>
              <div className="flex items-center gap-2">
                <p className="font-semibold font-mono">
                  {revealEmiratesId ? tenant.emiratesId : maskValue(tenant.emiratesId)}
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
          {tenant.passportNo && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-2">Passport No</p>
              <div className="flex items-center gap-2">
                <p className="font-semibold font-mono">
                  {revealPassportNo ? tenant.passportNo : maskValue(tenant.passportNo)}
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

      {/* Emergency Contact */}
      {tenant.emergencyContact && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Emergency Contact</h3>
          <p className="font-semibold">{tenant.emergencyContact}</p>
        </Card>
      )}

      {/* Screening Summary */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Screening & Employment</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Screening Status</p>
            <StatusBadge variant={SCREENING_STATUS_VARIANT[tenant.screeningStatus] || "default"}>
              {labelOf(SCREENING_STATUSES, tenant.screeningStatus)}
            </StatusBadge>
          </div>
          {tenant.visaStatus && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Visa Status</p>
              <div className="flex items-center gap-2">
                <StatusBadge variant={VISA_STATUS_VARIANT[tenant.visaStatus] || "default"}>
                  {labelOf(VISA_STATUSES, tenant.visaStatus)}
                </StatusBadge>
              </div>
              {tenant.visaExpiry && (
                <p className="text-xs text-muted-foreground mt-1">{formatDate(tenant.visaExpiry)}</p>
              )}
            </div>
          )}
          {tenant.salaryRange && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Salary Range</p>
              <p className="font-semibold">{labelOf(SALARY_RANGES, tenant.salaryRange)}</p>
            </div>
          )}
          {tenant.employerName && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Employer</p>
              <p className="font-semibold">{tenant.employerName}</p>
              {tenant.employerPhone && (
                <p className="text-xs text-muted-foreground">{tenant.employerPhone}</p>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Outstanding Balance */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Outstanding Balance</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Total Outstanding</p>
            <p className="font-semibold text-lg">{formatCurrency(outstandingBalance?.total ?? 0)}</p>
          </div>
          {(outstandingBalance?.overdue ?? 0) > 0 && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Overdue Amount</p>
              <p className="font-semibold text-lg text-danger">{formatCurrency(outstandingBalance?.overdue ?? 0)}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Blacklist Status */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold mb-2">Blacklist Status</h3>
            {tenant.blacklisted ? (
              <div>
                <StatusBadge variant="danger">Blacklisted</StatusBadge>
                {tenant.blacklistReason && (
                  <p className="text-sm text-muted-foreground mt-2">{tenant.blacklistReason}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Not blacklisted</p>
            )}
          </div>
          <Dialog open={openBlacklist} onOpenChange={setOpenBlacklist}>
            <DialogTrigger render={<Button
                variant={tenant.blacklisted ? "outline" : "outline"}
                className={tenant.blacklisted ? "text-danger hover:bg-danger/10" : ""}
              >
                {tenant.blacklisted ? "Unblacklist" : "Blacklist"}
              </Button>} />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{tenant.blacklisted ? "Unblacklist Tenant" : "Blacklist Tenant"}</DialogTitle>
                <DialogDescription>
                  {tenant.blacklisted
                    ? "Remove this tenant from the blacklist?"
                    : "Add this tenant to the blacklist and provide a reason."}
                </DialogDescription>
              </DialogHeader>
              {!tenant.blacklisted && (
                <Textarea
                  placeholder="Reason for blacklisting..."
                  value={blacklistReason}
                  onChange={(e) => setBlacklistReason(e.target.value)}
                  rows={3}
                />
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenBlacklist(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleToggleBlacklist}
                  disabled={setBlacklistMutation.isPending}
                  className={tenant.blacklisted ? "" : "bg-danger hover:bg-danger/90"}
                >
                  {setBlacklistMutation.isPending ? "Updating..." : tenant.blacklisted ? "Unblacklist" : "Blacklist"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </Card>

      {/* Notes */}
      {tenant.notes && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Notes</h3>
          <p className="text-muted-foreground whitespace-pre-wrap">{tenant.notes}</p>
        </Card>
      )}

      {/* Metadata */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Metadata</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-muted-foreground">
          <div>
            <p className="font-medium mb-1">Created</p>
            <p>{formatDate(tenant.createdAt)}</p>
          </div>
          <div>
            <p className="font-medium mb-1">Last Updated</p>
            <p>{formatDate(tenant.updatedAt)}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
