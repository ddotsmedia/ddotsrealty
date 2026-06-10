"use client";

import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MobileNav } from "./mobile-nav";
import { Breadcrumbs } from "./breadcrumbs";
import { initials } from "@/lib/utils";
import { ROLE_LABELS, isAdmin } from "@/lib/permissions";
import type { Role } from "@/lib/permissions";
import Link from "next/link";
import { signOut } from "next-auth/react";

interface HeaderProps {
  userName: string;
  role: Role | null;
  tenantName?: string | null;
}

export function Header({ userName, role, tenantName }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 h-16 border-b border-border bg-card px-4 flex items-center justify-between">
      {/* Left: Mobile Nav + Breadcrumbs */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <MobileNav role={role} />
        <Breadcrumbs />
      </div>

      {/* Right: Notifications + User Menu */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-gold rounded-full" />
        </Button>

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button
              variant="ghost"
              className="gap-3 hidden sm:flex"
              size="default"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs font-medium">
                  {initials(userName)}
                </AvatarFallback>
              </Avatar>
              <div className="text-left text-sm">
                <p className="font-medium text-foreground">{userName}</p>
                <p className="text-xs text-muted-foreground">
                  {role ? ROLE_LABELS[role] : "User"}
                </p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {tenantName && (
              <>
                <div className="px-2 py-1.5">
                  <p className="text-xs text-muted-foreground">Organization</p>
                  <p className="text-sm font-medium text-foreground">
                    {tenantName}
                  </p>
                </div>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem>
              <Link href="/settings" className="w-full">
                Profile
              </Link>
            </DropdownMenuItem>
            {isAdmin(role) && (
              <DropdownMenuItem>
                <Link href="/settings" className="w-full">
                  Settings
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ redirectTo: "/login" })}
              className="text-danger cursor-pointer"
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Mobile Avatar Only */}
        <Avatar className="sm:hidden h-8 w-8">
          <AvatarFallback className="text-xs font-medium">
            {initials(userName)}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
