import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createEarlyAccessSignup,
  createJourneyForOrganisation,
  createResponseActionForOrganisation,
  createSurveyForOrganisation,
  createWorkspaceForUser,
  getEarlyAccessSignupByEmail,
  getSurveyForOrganisation,
  getWorkspaceDashboard,
  getWorkspaceForUser,
  listActionsForOrganisation,
  listOrganisationMembers,
  listJourneysForSurvey,
  listResponsesForOrganisation,
  listSurveysForOrganisation,
  publishSurveyForOrganisation,
  updateWorkspaceSettings,
  updateResponseStatusForOrganisation,
  updateOrganisationMemberRole,
  updateResponseActionStatusForOrganisation,
} from "./db";
import { actionStatusSchema, companySizeValues, industryValues, journeyDraftSchema, memberRoleSchema, responseActionSchema, responseStatusSchema, surveyDraftSchema, workspaceCreateSchema, workspaceSettingsSchema } from "./lumae";
import { normalizeWaitlistInput } from "./waitlist";

const organisationIdInput = z.object({ surveyId: z.number().int().positive() });

async function requireWorkspace(userId: number) {
  const workspace = await getWorkspaceForUser(userId);
  if (!workspace) throw new Error("Create a workspace before continuing");
  return workspace;
}

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
          industry: z.enum(industryValues),
          companySize: z.enum(companySizeValues),
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
  workspace: router({
    me: protectedProcedure.query(async ({ ctx }) => (await getWorkspaceForUser(ctx.user.id)) ?? null),
    create: protectedProcedure.input(workspaceCreateSchema).mutation(({ ctx, input }) => createWorkspaceForUser(ctx.user.id, input)),
    dashboard: protectedProcedure.query(async ({ ctx }) => {
      const workspace = await getWorkspaceForUser(ctx.user.id);
      if (!workspace) return null;
      return getWorkspaceDashboard(workspace.organisation.id);
    }),
    updateSettings: protectedProcedure.input(workspaceSettingsSchema).mutation(async ({ ctx, input }) => {
      const workspace = await requireWorkspace(ctx.user.id);
      if (workspace.membership.role !== "owner" && workspace.membership.role !== "admin") {
        throw new Error("Only workspace owners and administrators can update settings");
      }
      return updateWorkspaceSettings(workspace.organisation.id, input);
    }),
    members: protectedProcedure.query(async ({ ctx }) => {
      const workspace = await requireWorkspace(ctx.user.id);
      return listOrganisationMembers(workspace.organisation.id);
    }),
    updateMemberRole: protectedProcedure.input(memberRoleSchema).mutation(async ({ ctx, input }) => {
      const workspace = await requireWorkspace(ctx.user.id);
      if (workspace.membership.role !== "owner") throw new Error("Only workspace owners can change access roles");
      if (input.userId === ctx.user.id) throw new Error("The workspace owner role cannot be changed here");
      return updateOrganisationMemberRole(workspace.organisation.id, input);
    }),
  }),
  surveys: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const workspace = await getWorkspaceForUser(ctx.user.id);
      return workspace ? listSurveysForOrganisation(workspace.organisation.id) : [];
    }),
    create: protectedProcedure.input(surveyDraftSchema).mutation(async ({ ctx, input }) => {
      const workspace = await requireWorkspace(ctx.user.id);
      return createSurveyForOrganisation(workspace.organisation.id, ctx.user.id, input);
    }),
    detail: protectedProcedure.input(organisationIdInput).query(async ({ ctx, input }) => {
      const workspace = await requireWorkspace(ctx.user.id);
      return getSurveyForOrganisation(workspace.organisation.id, input.surveyId);
    }),
    publish: protectedProcedure.input(organisationIdInput).mutation(async ({ ctx, input }) => {
      const workspace = await requireWorkspace(ctx.user.id);
      return publishSurveyForOrganisation(workspace.organisation.id, input.surveyId);
    }),
  }),
  journeys: router({
    listForSurvey: protectedProcedure.input(organisationIdInput).query(async ({ ctx, input }) => {
      const workspace = await requireWorkspace(ctx.user.id);
      return listJourneysForSurvey(workspace.organisation.id, input.surveyId);
    }),
    create: protectedProcedure.input(journeyDraftSchema).mutation(async ({ ctx, input }) => {
      const workspace = await requireWorkspace(ctx.user.id);
      return createJourneyForOrganisation(workspace.organisation.id, input);
    }),
  }),
  intelligence: router({
    responses: protectedProcedure.query(async ({ ctx }) => {
      const workspace = await getWorkspaceForUser(ctx.user.id);
      return workspace ? listResponsesForOrganisation(workspace.organisation.id) : [];
    }),
    actions: protectedProcedure.query(async ({ ctx }) => {
      const workspace = await getWorkspaceForUser(ctx.user.id);
      return workspace ? listActionsForOrganisation(workspace.organisation.id) : [];
    }),
    createAction: protectedProcedure.input(responseActionSchema).mutation(async ({ ctx, input }) => {
      const workspace = await requireWorkspace(ctx.user.id);
      return createResponseActionForOrganisation(workspace.organisation.id, ctx.user.id, input);
    }),
    updateResponseStatus: protectedProcedure.input(responseStatusSchema).mutation(async ({ ctx, input }) => {
      const workspace = await requireWorkspace(ctx.user.id);
      return updateResponseStatusForOrganisation(workspace.organisation.id, input);
    }),
    updateActionStatus: protectedProcedure.input(actionStatusSchema).mutation(async ({ ctx, input }) => {
      const workspace = await requireWorkspace(ctx.user.id);
      return updateResponseActionStatusForOrganisation(workspace.organisation.id, input);
    }),
  }),
});

export type AppRouter = typeof appRouter;
