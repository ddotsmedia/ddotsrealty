import type { DefaultSession } from "next-auth";
import type { JWT } from "next-auth/jwt";

type UserRole =
  | "super_admin"
  | "admin"
  | "manager"
  | "broker"
  | "accountant"
  | "viewer";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      tenantId: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole;
    tenantId?: string | null;
  }
}
