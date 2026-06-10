"use server";

import { db } from "@/server/db";
import { users, tenants } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/password";

function toKebab(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function randomSuffix() {
  return Math.random().toString(36).slice(2, 7);
}

export type RegisterResult = { ok: true } | { ok: false; error: string };

export async function registerAction(input: {
  companyName: string;
  adminName: string;
  email: string;
  password: string;
}): Promise<RegisterResult> {
  const { companyName, adminName, email, password } = input;

  // Check duplicate email
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0) {
    return { ok: false, error: "An account with this email already exists." };
  }

  // Generate unique slug
  let slug = toKebab(companyName);
  if (!slug) slug = "company";

  const slugExists = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .limit(1);

  if (slugExists.length > 0) {
    slug = `${slug}-${randomSuffix()}`;
  }

  const passwordHash = await hashPassword(password);

  // Insert tenant
  const [tenant] = await db
    .insert(tenants)
    .values({ name: companyName, slug })
    .returning({ id: tenants.id });

  if (!tenant) {
    return { ok: false, error: "Failed to create company record." };
  }

  // Insert admin user
  await db.insert(users).values({
    tenantId: tenant.id,
    email,
    name: adminName,
    passwordHash,
    role: "admin",
    isActive: true,
  });

  return { ok: true };
}
