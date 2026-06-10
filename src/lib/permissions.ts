export type Role =
  | "super_admin"
  | "admin"
  | "manager"
  | "broker"
  | "accountant"
  | "viewer"

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  manager: "Manager",
  broker: "Broker",
  accountant: "Accountant",
  viewer: "Viewer",
}

export const ROLE_VARIANT: Record<
  Role,
  "success" | "warning" | "danger" | "info" | "muted" | "default"
> = {
  super_admin: "danger",
  admin: "info",
  manager: "info",
  broker: "default",
  accountant: "warning",
  viewer: "muted",
}

export function hasRole(
  role: Role | null | undefined,
  allowed: Role[]
): boolean {
  if (!role) return false
  return allowed.includes(role)
}

export function isAdmin(role: Role | null | undefined): boolean {
  return role === "admin" || role === "super_admin" || role === "manager"
}

export function canManageBilling(role: Role | null | undefined): boolean {
  return role === "admin" || role === "super_admin"
}

export function canAccessFinance(role: Role | null | undefined): boolean {
  return (
    role === "admin" ||
    role === "super_admin" ||
    role === "manager" ||
    role === "accountant"
  )
}
