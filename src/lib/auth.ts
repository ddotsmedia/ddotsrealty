import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import authConfig from "@/lib/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    ...authConfig.providers,
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (creds) => {
        const email = creds?.email as string | undefined;
        const password = creds?.password as string | undefined;

        if (!email || !password) return null;

        const rows = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        const user = rows[0];
        if (!user || !user.passwordHash || !user.isActive) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
        } as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role; // eslint-disable-line @typescript-eslint/no-explicit-any
        token.tenantId = (user as any).tenantId; // eslint-disable-line @typescript-eslint/no-explicit-any
      } else if (token.email && !token.role) {
        // Google sign-in: look up existing user by email
        const rows = await db
          .select()
          .from(users)
          .where(eq(users.email, token.email))
          .limit(1);
        if (rows[0]) {
          token.id = rows[0].id;
          token.role = rows[0].role;
          token.tenantId = rows[0].tenantId;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role; // eslint-disable-line @typescript-eslint/no-explicit-any
        (session.user as any).tenantId = token.tenantId; // eslint-disable-line @typescript-eslint/no-explicit-any
      }
      return session;
    },
  },
});
