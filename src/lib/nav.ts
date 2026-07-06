import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Building2,
  Users,
  UserCircle,
  FileText,
  Banknote,
  Tag,
  Target,
  Wrench,
  FolderOpen,
  Calculator,
  UsersRound,
  BarChart3,
  Settings,
  ClipboardCheck,
  KeyRound,
  Zap,
  Car,
  ShieldCheck,
  DoorOpen,
  MessageSquare,
  Megaphone,
} from "lucide-react";
import type { Role } from "@/lib/permissions";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles?: Role[];
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Operations",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        label: "Properties",
        href: "/properties",
        icon: Building2,
      },
      {
        label: "Tenants",
        href: "/tenants",
        icon: Users,
      },
      {
        label: "Owners",
        href: "/owners",
        icon: UserCircle,
      },
      {
        label: "Contracts",
        href: "/contracts",
        icon: FileText,
      },
      {
        label: "Cheques",
        href: "/cheques",
        icon: Banknote,
      },
    ],
  },
  {
    title: "Sales",
    items: [
      {
        label: "Listings",
        href: "/listings",
        icon: Tag,
      },
      {
        label: "Leads",
        href: "/leads",
        icon: Target,
      },
    ],
  },
  {
    title: "Operations & Docs",
    items: [
      {
        label: "Maintenance",
        href: "/maintenance",
        icon: Wrench,
      },
      {
        label: "Documents",
        href: "/documents",
        icon: FolderOpen,
      },
    ],
  },
  {
    title: "Tenant Operations",
    items: [
      { label: "Inspections", href: "/inspections", icon: ClipboardCheck },
      { label: "Key Handovers", href: "/key-handovers", icon: KeyRound },
      { label: "Utilities", href: "/utilities", icon: Zap },
      { label: "Parking", href: "/parking", icon: Car },
      { label: "NOC Requests", href: "/noc-requests", icon: ShieldCheck },
      { label: "Clearances", href: "/clearances", icon: DoorOpen },
    ],
  },
  {
    title: "Engagement",
    items: [
      { label: "Communications", href: "/communications", icon: MessageSquare },
      {
        label: "Announcements",
        href: "/announcements",
        icon: Megaphone,
        roles: ["super_admin", "admin", "manager"],
      },
    ],
  },
  {
    title: "Finance",
    items: [
      {
        label: "Accounting",
        href: "/accounting",
        icon: Calculator,
        roles: ["super_admin", "admin", "manager", "accountant"],
      },
    ],
  },
  {
    title: "Administration",
    items: [
      {
        label: "Staff",
        href: "/staff",
        icon: UsersRound,
        roles: ["super_admin", "admin", "manager"],
      },
      {
        label: "Reports",
        href: "/reports",
        icon: BarChart3,
        roles: ["super_admin", "admin", "manager"],
      },
      {
        label: "Settings",
        href: "/settings",
        icon: Settings,
        roles: ["super_admin", "admin", "manager"],
      },
    ],
  },
];

export function visibleNav(role: Role | null | undefined): NavGroup[] {
  const isSuperAdmin = role === "super_admin";

  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      if (!item.roles) return true;
      if (isSuperAdmin) return true;
      return item.roles.includes(role as Role);
    }),
  })).filter((group) => group.items.length > 0);
}
