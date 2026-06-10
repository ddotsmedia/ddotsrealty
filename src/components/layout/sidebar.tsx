"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { visibleNav } from "@/lib/nav";
import type { Role } from "@/lib/permissions";

interface SidebarProps {
  role: Role | null;
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const navGroups = visibleNav(role);

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="hidden lg:flex flex-col w-64 h-screen bg-sidebar text-sidebar-foreground border-r border-border sticky top-0">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gold">
            <span className="font-display font-bold text-navy text-lg">D</span>
          </div>
          <span className="font-display font-semibold text-base text-sidebar-foreground">
            DdotsRealty
          </span>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <nav className="flex flex-col gap-1 p-3">
          {navGroups.map((group) => (
            <div key={group.title}>
              <p className="text-[11px] uppercase tracking-wider text-sidebar-foreground/50 px-3 mt-4 mb-2">
                {group.title}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                        active
                          ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                          : "text-sidebar-foreground hover:bg-sidebar-accent"
                      )}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>
    </div>
  );
}
