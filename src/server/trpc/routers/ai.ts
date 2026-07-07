import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { aiConfigured } from "@/lib/ai";
import {
  generatePropertyDescription,
  generateLeadReply,
} from "@/server/services/ai.service";

export const aiRouter = createTRPCRouter({
  describeListing: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        type: z.string().optional(),
        bedrooms: z.coerce.number().nullish(),
        community: z.string().nullish(),
        price: z.coerce.number().nullish(),
      })
    )
    .mutation(async ({ input }) => {
      const text = await generatePropertyDescription({
        title: input.title,
        type: input.type || "",
        bedrooms: input.bedrooms ?? undefined,
        community: input.community ?? undefined,
        price: input.price ?? undefined,
      });
      return { text };
    }),

  suggestLeadReply: protectedProcedure
    .input(
      z.object({
        leadName: z.string(),
        enquiry: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const text = await generateLeadReply({
        leadName: input.leadName,
        enquiry: input.enquiry,
      });
      return { text };
    }),

  status: protectedProcedure.query(() => {
    return { configured: aiConfigured };
  }),
});
