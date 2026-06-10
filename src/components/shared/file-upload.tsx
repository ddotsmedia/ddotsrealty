"use client";

import { useCallback, useState, useRef } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FileUploadProps {
  value?: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  label?: string;
}

export function FileUpload({
  value = [],
  onChange,
  folder,
  accept = "image/*",
  multiple = true,
  maxFiles = 5,
  label = "Photos",
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files) return;

      const fileArray = Array.from(files);
      const remainingSlots = maxFiles - value.length;

      if (fileArray.length > remainingSlots) {
        toast.error(
          `Maximum ${maxFiles} files allowed. ${remainingSlots} slot(s) remaining.`
        );
        return;
      }

      setUploading(true);
      const newUrls: string[] = [];

      for (const file of fileArray) {
        const fileId = `${file.name}-${Date.now()}`;

        try {
          setProgress((p) => ({ ...p, [fileId]: 0 }));

          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              filename: file.name,
              contentType: file.type,
              folder,
            }),
          });

          if (!uploadRes.ok) {
            toast.error(`Failed to get upload URL for ${file.name}`);
            continue;
          }

          const uploadData = (await uploadRes.json()) as {
            configured: boolean;
            uploadUrl?: string;
            publicUrl?: string;
            key?: string;
          };

          let url: string;

          if (!uploadData.configured) {
            // R2 not configured - use local object URL
            url = URL.createObjectURL(file);
            toast.info(
              "Storage not configured — using local preview"
            );
          } else {
            // Upload to R2
            const putRes = await fetch(uploadData.uploadUrl!, {
              method: "PUT",
              body: file,
              headers: {
                "Content-Type": file.type,
              },
            });

            if (!putRes.ok) {
              toast.error(`Failed to upload ${file.name}`);
              continue;
            }

            url = uploadData.publicUrl!;
          }

          newUrls.push(url);
          setProgress((p) => {
            const { [fileId]: _, ...rest } = p;
            return rest;
          });
        } catch (error) {
          console.error("Upload error:", error);
          toast.error(`Error uploading ${file.name}`);
          setProgress((p) => {
            const { [fileId]: _, ...rest } = p;
            return rest;
          });
        }
      }

      setUploading(false);
      if (newUrls.length > 0) {
        onChange([...value, ...newUrls]);
      }

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [value, onChange, folder, maxFiles]
  );

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleRemove = (url: string) => {
    onChange(value.filter((v) => v !== url));
  };

  const isMaxReached = value.length >= maxFiles;

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-foreground">
        {label}
      </label>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          isMaxReached
            ? "border-border bg-muted/30 cursor-not-allowed"
            : "border-border hover:border-primary hover:bg-primary/5"
        )}
        onClick={() => !isMaxReached && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple && !isMaxReached}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          disabled={uploading || isMaxReached}
        />

        <div className="flex flex-col items-center gap-2">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            Drag files here or click to browse
          </p>
          {isMaxReached && (
            <p className="text-xs text-warning">
              Maximum {maxFiles} files reached
            </p>
          )}
        </div>
      </div>

      {value.length > 0 && (
        <div>
          <p className="text-sm font-medium text-foreground mb-3">
            {value.length} file{value.length !== 1 ? "s" : ""} selected
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {value.map((url) => (
              <div
                key={url}
                className="relative aspect-square rounded-lg border border-border overflow-hidden group"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt="Upload preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={() => handleRemove(url)}
                    className="p-2 bg-danger rounded-full hover:bg-danger/90 text-white"
                    type="button"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
