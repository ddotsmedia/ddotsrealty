"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CHEQUE_STATUS_VARIANT } from "@/lib/constants";
import Link from "next/link";
import { Banknote } from "lucide-react";

interface ChequeItem {
  id: string;
  dueDate: string | Date;
  amount: string | number;
  status: string;
  propertyTitle?: string | null;
  tenantName?: string | null;
}

interface ChequeLookaheadProps {
  items: ChequeItem[];
  loading?: boolean;
}

export function ChequeLookahead({ items, loading }: ChequeLookaheadProps) {
  if (loading) {
    return (
      <Card className="p-6">
        <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
          <Banknote className="h-5 w-5" />
          Cheques — Next 7 Days
        </h3>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
        <Banknote className="h-5 w-5" />
        Cheques — Next 7 Days
      </h3>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No cheques due in the next 7 days
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-muted">
                <th className="text-left p-2 text-xs font-semibold text-muted-foreground">
                  Date
                </th>
                <th className="text-left p-2 text-xs font-semibold text-muted-foreground">
                  Tenant
                </th>
                <th className="text-left p-2 text-xs font-semibold text-muted-foreground">
                  Property
                </th>
                <th className="text-right p-2 text-xs font-semibold text-muted-foreground">
                  Amount
                </th>
                <th className="text-left p-2 text-xs font-semibold text-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-muted/50 hover:bg-muted/30 transition-colors"
                >
                  <td className="p-2 text-foreground">
                    <Link
                      href={`/cheques/${item.id}`}
                      className="hover:underline font-medium"
                    >
                      {formatDate(item.dueDate)}
                    </Link>
                  </td>
                  <td className="p-2 text-foreground text-xs">
                    {item.tenantName || "—"}
                  </td>
                  <td className="p-2 text-foreground text-xs">
                    {item.propertyTitle || "—"}
                  </td>
                  <td className="p-2 text-right font-semibold text-foreground">
                    {formatCurrency(Number(item.amount))}
                  </td>
                  <td className="p-2">
                    <StatusBadge
                      variant={CHEQUE_STATUS_VARIANT[item.status] || "default"}
                    >
                      {item.status}
                    </StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
