import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";

export const healthRouter = createTRPCRouter({
  ping: publicProcedure.query(() => ({ ok: true, ts: "static" })),
  me: protectedProcedure.query(({ ctx }) => ({
    userId: ctx.userId,
    role: ctx.role,
    tenantId: ctx.tenantId,
  })),
});
