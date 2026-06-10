export type Plan = "free" | "basic" | "pro" | "enterprise";

export const PLAN_LIMITS: Record<
  Plan,
  { properties: number; users: number; price: number }
> = {
  free: { properties: 10, users: 2, price: 0 },
  basic: { properties: 50, users: 5, price: 99 },
  pro: { properties: 250, users: 20, price: 299 },
  enterprise: { properties: 100000, users: 1000, price: 999 },
};

export function isWithinLimit(
  plan: Plan,
  kind: "properties" | "users",
  current: number,
): boolean {
  const limit = PLAN_LIMITS[plan][kind];
  return current < limit;
}

export function isExpired(expiresAt: Date | null | undefined): boolean {
  if (!expiresAt) return false;
  return new Date() > new Date(expiresAt);
}
