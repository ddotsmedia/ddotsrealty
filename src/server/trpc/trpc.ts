import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";

export async function createTRPCContext(opts?: { headers?: Headers }) {
  const session = await auth();
  return {
    db,
    session,
    userId: session?.user?.id ?? null,
    tenantId: (session?.user as any)?.tenantId ?? null, // eslint-disable-line @typescript-eslint/no-explicit-any
    role: (session?.user as any)?.role ?? null, // eslint-disable-line @typescript-eslint/no-explicit-any
    headers: opts?.headers,
  };
}

const t = initTRPC
  .context<Awaited<ReturnType<typeof createTRPCContext>>>()
  .create({
    transformer: superjson,
    errorFormatter({ shape, error }) {
      return {
        ...shape,
        data: {
          ...shape.data,
          zodError:
            error.cause instanceof ZodError ? error.cause.flatten() : null,
        },
      };
    },
  });

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const publicProcedure = t.procedure;

export const protectedProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.session?.user || !ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
      session: ctx.session,
    },
  });
});

export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (
    !(
      ctx.role === "admin" ||
      ctx.role === "super_admin" ||
      ctx.role === "manager"
    )
  ) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx });
});

export const superAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.role !== "super_admin") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx });
});

export const tenantProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!ctx.tenantId && ctx.role !== "super_admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "No tenant" });
  }
  return next({ ctx });
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function tenantWhere(
  ctx: { tenantId: string | null; role: string | null },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  column: any,
) {
  if (ctx.role === "super_admin") return undefined;
  return eq(column, ctx.tenantId);
}
