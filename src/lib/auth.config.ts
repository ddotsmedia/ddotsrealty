import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

const PROTECTED_PATHS = [
  "/dashboard",
  "/superadmin",
  "/properties",
  "/tenants",
  "/owners",
  "/contracts",
  "/cheques",
  "/listings",
  "/leads",
  "/maintenance",
  "/documents",
  "/accounting",
  "/staff",
  "/settings",
  "/reports",
];

export default {
  trustHost: true,
  pages: { signIn: "/login" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;

      const isProtected = PROTECTED_PATHS.some(
        (p) => pathname === p || pathname.startsWith(p + "/"),
      );

      if (isProtected && !isLoggedIn) {
        return false;
      }

      if (isLoggedIn && (pathname === "/login" || pathname === "/register")) {
        return Response.redirect(new URL("/dashboard", request.nextUrl));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
