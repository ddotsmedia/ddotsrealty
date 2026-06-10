"use client";

import { FileText, Image, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DOC_TYPES, labelOf } from "@/lib/constants";
import { formatDate, daysUntil } from "@/lib/utils";

interface DocumentCardProps {
  doc: {
    id: string;
    name: string;
    docType: string;
    fileUrl: string;
    expiryDate?: string | Date | null;
    mimeType?: string | null;
  };
  onDelete?: (id: string) => void;
}

export function DocumentCard({ doc, onDelete }: DocumentCardProps) {
  const isImage = doc.mimeType?.startsWith("image");
  const daysLeft = daysUntil(doc.expiryDate);
  const isExpired = daysLeft !== null && daysLeft < 0;
  const isExpiringSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 30;

  let expiryVariant: "success" | "warning" | "danger" | "info" | "muted" | "default" = "muted";
  let expiryText = "";

  if (isExpired) {
    expiryVariant = "danger";
    expiryText = "Expired";
  } else if (isExpiringSoon && daysLeft !== null) {
    expiryVariant = "warning";
    expiryText = `Expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`;
  } else if (doc.expiryDate) {
    expiryVariant = "muted";
    expiryText = formatDate(doc.expiryDate);
  }

  return (
    <div className="border border-border rounded-lg p-4 space-y-3 bg-card hover:shadow-md transition-shadow">
      {/* Icon and Name */}
      <div className="flex items-start gap-3">
        <div className="p-2 bg-muted rounded">
          {isImage ? (
            <Image className="h-5 w-5 text-muted-foreground" />
          ) : (
            <FileText className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {doc.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {labelOf(DOC_TYPES, doc.docType)}
          </p>
        </div>
      </div>

      {/* Expiry Status */}
      {doc.expiryDate && (
        <div className="pt-2 border-t border-border">
          <StatusBadge variant={expiryVariant}>{expiryText}</StatusBadge>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button
          render={<a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" />}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          View
        </Button>

        {onDelete && (
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="ghost" size="sm" className="text-danger hover:text-danger"><X className="h-4 w-4" /></Button>} />
            <AlertDialogContent>
              <AlertDialogTitle>Delete Document</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{doc.name}"? This action cannot be undone.
              </AlertDialogDescription>
              <div className="flex gap-2 justify-end">
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(doc.id)}
                  className="bg-danger hover:bg-danger/90"
                >
                  Delete
                </AlertDialogAction>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}
