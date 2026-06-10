"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Breadcrumbs() {
  const pathname = usePathname();

  const segments = pathname.split("/").filter((s) => s && s !== "(dashboard)");

  const breadcrumbs = [
    { label: "Home", href: "/dashboard" },
    ...segments.map((segment, index) => {
      const href = "/dashboard/" + segments.slice(0, index + 1).join("/");
      const isUuid = segment.length > 20 || /\d/.test(segment);
      const label = isUuid
        ? "Details"
        : segment
            .replace(/-/g, " ")
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");

      return { label, href };
    }),
  ];

  return (
    <nav className="hidden sm:flex items-center gap-1 text-sm flex-1">
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.href} className="flex items-center gap-1">
          {index > 0 && (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          {index === breadcrumbs.length - 1 ? (
            <span className="text-foreground font-medium">{crumb.label}</span>
          ) : (
            <Link
              href={crumb.href}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
