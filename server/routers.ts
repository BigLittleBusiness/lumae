import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { createEarlyAccessSignup, getEarlyAccessSignupByEmail } from "./db";
import { normalizeWaitlistInput } from "./waitlist";

const industries = ["financial_services", "healthcare", "professional_services", "retail", "saas_technology", "other"] as const;
const companySizes = ["1_10", "11_50", "51_200", "201_500", "501_plus"] as const;

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  waitlist: router({
    join: publicProcedure
      .input(
        z.object({
          email: z.string().trim().email().max(320),
          name: z.string().trim().max(120).optional(),
          company: z.string().trim().max(160).optional(),
          industry: z.enum(industries),
          companySize: z.enum(companySizes),
        })
      )
      .mutation(async ({ input }) => {
        const signup = normalizeWaitlistInput(input);
        const existing = await getEarlyAccessSignupByEmail(signup.email);
        if (existing) return { status: "already_joined" } as const;
        await createEarlyAccessSignup(signup);
        return { status: "joined" } as const;
      }),
  }),
});

export type AppRouter = typeof appRouter;
