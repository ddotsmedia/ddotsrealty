"use client";

import { Image as ImageIcon, Star, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PhotoGalleryProps {
  photos: Array<{
    id?: string;
    url: string;
    isPrimary?: boolean;
  }>;
  onSetPrimary?: (url: string) => void;
  onRemove?: (url: string) => void;
}

export function PhotoGallery({
  photos,
  onSetPrimary,
  onRemove,
}: PhotoGalleryProps) {
  if (!photos || photos.length === 0) {
    return (
      <EmptyState
        icon={ImageIcon}
        title="No photos yet"
        description="Add photos to get started"
      />
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {photos.map((photo) => (
        <div
          key={photo.url}
          className={cn(
            "relative aspect-square rounded-lg border overflow-hidden group",
            photo.isPrimary ? "border-gold ring-2 ring-gold/30" : "border"
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.url}
            alt="Gallery photo"
            className="w-full h-full object-cover"
          />

          {photo.isPrimary && (
            <div className="absolute top-2 left-2 bg-gold text-black px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
              <Star className="h-3 w-3 fill-current" />
              Primary
            </div>
          )}

          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            {onSetPrimary && !photo.isPrimary && (
              <Button
                onClick={() => onSetPrimary(photo.url)}
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Star className="h-4 w-4 mr-1" />
                Primary
              </Button>
            )}
            {onRemove && (
              <Button
                onClick={() => onRemove(photo.url)}
                variant="outline"
                size="sm"
                className="bg-danger/20 border-danger text-danger hover:bg-danger/30"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
