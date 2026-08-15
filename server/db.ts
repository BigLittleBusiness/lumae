import { and, count, desc, eq, gt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  auditLogs,
  earlyAccessSignups,
  InsertEarlyAccessSignup,
  InsertUser,
  journeys,
  organisationInvitations,
  organisationMembers,
  organisations,
  platformProviderConfigs,
  responseActions,
  surveyDeliveries,
  surveyQuestions,
  surveyResponses,
  surveys,
  users,
} from "../drizzle/schema";
import { actionStatusSchema, defaultQuestionFor, deliveryRequestSchema, invitationSchema, journeyDraftSchema, memberRoleSchema, providerConfigSchema, responseActionSchema, responseStatusSchema, scaleFor, slugifyWorkspaceName, surveyDraftSchema, tenantSecuritySchema, workspaceCreateSchema, workspaceSettingsSchema } from "./lumae";
import { ENV } from "./_core/env";
import { createInvitationToken, decryptSensitiveValue, encryptSensitiveValue, hashValue } from "./tenantSecurity";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");

  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;

  textFields.forEach(field => {
    if (user[field] !== undefined) {
      const normalized = user[field] ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    }
  });

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getEarlyAccessSignupByEmail(email: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.select().from(earlyAccessSignups).where(eq(earlyAccessSignups.email, email)).limit(1);
  return result[0];
}

export async function createEarlyAccessSignup(signup: InsertEarlyAccessSignup) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(earlyAccessSignups).values(signup);
}

export async function getWorkspaceForUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const user = (await db.select({ activeOrganisationId: users.activeOrganisationId }).from(users).where(eq(users.id, userId)).limit(1))[0];
  const rows = await db
    .select({ organisation: organisations, membership: organisationMembers })
    .from(organisationMembers)
    .innerJoin(organisations, eq(organisationMembers.organisationId, organisations.id))
    .where(and(eq(organisationMembers.userId, userId), user?.activeOrganisationId ? eq(organisationMembers.organisationId, user.activeOrganisationId) : undefined))
    .limit(1);
  return rows[0];
}

export async function listWorkspacesForUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db
    .select({ organisation: organisations, membership: organisationMembers })
    .from(organisationMembers)
    .innerJoin(organisations, eq(organisationMembers.organisationId, organisations.id))
    .where(eq(organisationMembers.userId, userId))
    .orderBy(organisations.name);
}

export async function createWorkspaceForUser(userId: number, input: unknown) {
  const values = workspaceCreateSchema.parse(input);
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  const baseSlug = slugifyWorkspaceName(values.name);
  let slug = baseSlug;
  for (let suffix = 2; suffix < 100; suffix += 1) {
    const existing = await db.select({ id: organisations.id }).from(organisations).where(eq(organisations.slug, slug)).limit(1);
    if (!existing[0]) break;
    slug = `${baseSlug}-${suffix}`;
  }

  const result = await db.insert(organisations).values({
    name: values.name,
    slug,
    industry: values.industry,
    companySize: values.companySize,
    brandName: values.name,
  });
  const organisationId = Number(result[0].insertId);
  await db.insert(organisationMembers).values({ organisationId, userId, role: "owner" });
  await db.update(users).set({ activeOrganisationId: organisationId }).where(eq(users.id, userId));

  return (await db.select().from(organisations).where(eq(organisations.id, organisationId)).limit(1))[0];
}

export async function switchActiveOrganisation(userId: number, organisationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const membership = (await db.select({ id: organisationMembers.id }).from(organisationMembers).where(and(eq(organisationMembers.userId, userId), eq(organisationMembers.organisationId, organisationId))).limit(1))[0];
  if (!membership) throw new Error("You are not a member of this organisation");
  await db.update(users).set({ activeOrganisationId: organisationId }).where(eq(users.id, userId));
  await writeAuditLog({ organisationId, actorUserId: userId, action: "organisation.switched", entityType: "organisation", entityId: String(organisationId) });
  return getWorkspaceForUser(userId);
}

export async function updateWorkspaceSettings(organisationId: number, input: unknown) {
  const values = workspaceSettingsSchema.parse(input);
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db
    .update(organisations)
    .set({
      name: values.name,
      brandName: values.brandName || values.name,
      brandPrimaryColor: values.brandPrimaryColor,
      timezone: values.timezone,
      deliveryChannels: values.deliveryChannels.join(","),
      deliveryFrequencyGuardDays: values.deliveryFrequencyGuardDays,
    })
    .where(eq(organisations.id, organisationId));
  return (await db.select().from(organisations).where(eq(organisations.id, organisationId)).limit(1))[0];
}

export async function listOrganisationMembers(organisationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db
    .select({ member: organisationMembers, user: users })
    .from(organisationMembers)
    .innerJoin(users, eq(organisationMembers.userId, users.id))
    .where(eq(organisationMembers.organisationId, organisationId));
}

export async function updateOrganisationMemberRole(organisationId: number, input: unknown) {
  const values = memberRoleSchema.parse(input);
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db
    .update(organisationMembers)
    .set({ role: values.role })
    .where(and(eq(organisationMembers.organisationId, organisationId), eq(organisationMembers.userId, values.userId)));
}

export async function writeAuditLog(input: {
  organisationId?: number | null;
  actorUserId?: number | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(auditLogs).values({
    organisationId: input.organisationId ?? null,
    actorUserId: input.actorUserId ?? null,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    metadata: input.metadata ? JSON.stringify(input.metadata) : null,
  });
}

export async function createOrganisationInvitation(organisationId: number, invitedByUserId: number, input: unknown) {
  const values = invitationSchema.parse(input);
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const token = createInvitationToken();
  const tokenHash = hashValue(token);
  const email = values.email.toLowerCase();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const result = await db.insert(organisationInvitations).values({ organisationId, email, role: values.role, tokenHash, invitedByUserId, expiresAt });
  const invitationId = Number(result[0].insertId);
  await writeAuditLog({ organisationId, actorUserId: invitedByUserId, action: "invitation.created", entityType: "organisation_invitation", entityId: String(invitationId), metadata: { email, role: values.role } });
  return { invitationId, token, email, role: values.role, expiresAt };
}

export async function listOrganisationInvitations(organisationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.select().from(organisationInvitations).where(eq(organisationInvitations.organisationId, organisationId)).orderBy(desc(organisationInvitations.createdAt));
}

export async function acceptOrganisationInvitation(userId: number, userEmail: string | null, rawToken: string) {
  if (!userEmail) throw new Error("An email address is required to accept an invitation");
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const invitation = await db.select().from(organisationInvitations).where(and(eq(organisationInvitations.tokenHash, hashValue(rawToken)), eq(organisationInvitations.status, "pending"), gt(organisationInvitations.expiresAt, new Date()))).limit(1);
  const row = invitation[0];
  if (!row || row.email.toLowerCase() !== userEmail.toLowerCase()) throw new Error("This invitation is invalid, expired, or intended for a different account");
  await db.insert(organisationMembers).values({ organisationId: row.organisationId, userId, role: row.role }).onDuplicateKeyUpdate({ set: { role: row.role } });
  await db.update(organisationInvitations).set({ status: "accepted", acceptedAt: new Date() }).where(eq(organisationInvitations.id, row.id));
  await db.update(users).set({ activeOrganisationId: row.organisationId }).where(eq(users.id, userId));
  await writeAuditLog({ organisationId: row.organisationId, actorUserId: userId, action: "invitation.accepted", entityType: "organisation_invitation", entityId: String(row.id) });
  return getWorkspaceForUser(userId);
}

export async function updateTenantSecuritySettings(organisationId: number, input: unknown, actorUserId: number) {
  const values = tenantSecuritySchema.parse(input);
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(organisations).set(values).where(eq(organisations.id, organisationId));
  await writeAuditLog({ organisationId, actorUserId, action: "organisation.security.updated", entityType: "organisation", entityId: String(organisationId), metadata: values });
  return (await db.select().from(organisations).where(eq(organisations.id, organisationId)).limit(1))[0];
}

export async function listPlatformProviderConfigs() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.select({ provider: platformProviderConfigs.provider, enabled: platformProviderConfigs.enabled, publicConfiguration: platformProviderConfigs.publicConfiguration, lastTestStatus: platformProviderConfigs.lastTestStatus, lastTestedAt: platformProviderConfigs.lastTestedAt, updatedAt: platformProviderConfigs.updatedAt }).from(platformProviderConfigs);
}

export async function getPlatformProviderRuntimeConfig(provider: "stripe" | "aws_ses" | "twilio" | "hubspot" | "zendesk" | "oidc_google" | "oidc_microsoft") {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const row = (await db.select().from(platformProviderConfigs).where(eq(platformProviderConfigs.provider, provider)).limit(1))[0];
  if (!row?.enabled || !row.secretConfigurationCiphertext) throw new Error(`${provider} is not enabled or configured`);
  return {
    publicConfiguration: row.publicConfiguration ? JSON.parse(row.publicConfiguration) as Record<string, string> : {},
    secretConfiguration: JSON.parse(decryptSensitiveValue(row.secretConfigurationCiphertext)) as Record<string, string>,
  };
}

export async function updatePlatformProviderConfig(actorUserId: number, input: unknown) {
  const values = providerConfigSchema.parse(input);
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const secretConfigurationCiphertext = Object.keys(values.secretConfiguration).length ? encryptSensitiveValue(JSON.stringify(values.secretConfiguration)) : undefined;
  const existing = await db.select().from(platformProviderConfigs).where(eq(platformProviderConfigs.provider, values.provider)).limit(1);
  const data = { enabled: values.enabled, publicConfiguration: JSON.stringify(values.publicConfiguration), ...(secretConfigurationCiphertext ? { secretConfigurationCiphertext } : {}), updatedByUserId: actorUserId };
  if (existing[0]) await db.update(platformProviderConfigs).set(data).where(eq(platformProviderConfigs.id, existing[0].id));
  else await db.insert(platformProviderConfigs).values({ provider: values.provider, ...data });
  await writeAuditLog({ actorUserId, action: "platform.provider.updated", entityType: "provider", entityId: values.provider, metadata: { enabled: values.enabled, publicKeys: Object.keys(values.publicConfiguration), secretKeys: Object.keys(values.secretConfiguration) } });
  return (await listPlatformProviderConfigs()).find(config => config.provider === values.provider);
}

export async function queueSurveyDelivery(organisationId: number, actorUserId: number, input: unknown) {
  const values = deliveryRequestSchema.parse(input);
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const survey = await getSurveyForOrganisation(organisationId, values.surveyId);
  if (!survey || survey.survey.status !== "published") throw new Error("Publish the survey before queueing delivery");
  if (values.journeyId) {
    const journey = (await db.select().from(journeys).where(and(eq(journeys.id, values.journeyId), eq(journeys.organisationId, organisationId))).limit(1))[0];
    if (!journey) throw new Error("Journey not found in this workspace");
  }
  const provider = values.channel === "email" ? "aws_ses" : values.channel === "sms" ? "twilio" : null;
  if (provider) {
    const configured = (await db.select().from(platformProviderConfigs).where(and(eq(platformProviderConfigs.provider, provider), eq(platformProviderConfigs.enabled, true))).limit(1))[0];
    if (!configured) throw new Error(`${provider === "aws_ses" ? "AWS SES" : "Twilio"} must be enabled by a system administrator before delivery can be queued`);
  }
  const result = await db.insert(surveyDeliveries).values({ organisationId, surveyId: values.surveyId, journeyId: values.journeyId ?? null, channel: values.channel, recipientHash: hashValue(values.recipient.trim().toLowerCase()), recipientCiphertext: encryptSensitiveValue(values.recipient.trim()) });
  const deliveryId = Number(result[0].insertId);
  await writeAuditLog({ organisationId, actorUserId, action: "survey.delivery.queued", entityType: "survey_delivery", entityId: String(deliveryId), metadata: { surveyId: values.surveyId, channel: values.channel } });
  return (await db.select().from(surveyDeliveries).where(eq(surveyDeliveries.id, deliveryId)).limit(1))[0];
}

export async function getWorkspaceDashboard(organisationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  const [surveyTotal] = await db.select({ total: count() }).from(surveys).where(eq(surveys.organisationId, organisationId));
  const [publishedTotal] = await db
    .select({ total: count() })
    .from(surveys)
    .where(and(eq(surveys.organisationId, organisationId), eq(surveys.status, "published")));
  const [responseTotal] = await db.select({ total: count() }).from(surveyResponses).where(eq(surveyResponses.organisationId, organisationId));
  const [openActionTotal] = await db
    .select({ total: count() })
    .from(responseActions)
    .where(and(eq(responseActions.organisationId, organisationId), eq(responseActions.status, "open")));

  const recentSurveys = await db
    .select()
    .from(surveys)
    .where(eq(surveys.organisationId, organisationId))
    .orderBy(desc(surveys.updatedAt))
    .limit(4);

  return {
    metrics: {
      surveyTotal: Number(surveyTotal?.total ?? 0),
      publishedTotal: Number(publishedTotal?.total ?? 0),
      responseTotal: Number(responseTotal?.total ?? 0),
      openActionTotal: Number(openActionTotal?.total ?? 0),
    },
    recentSurveys,
  };
}

export async function listSurveysForOrganisation(organisationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.select().from(surveys).where(eq(surveys.organisationId, organisationId)).orderBy(desc(surveys.updatedAt));
}

export async function getSurveyForOrganisation(organisationId: number, surveyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const survey = await db
    .select()
    .from(surveys)
    .where(and(eq(surveys.organisationId, organisationId), eq(surveys.id, surveyId)))
    .limit(1);
  if (!survey[0]) return undefined;
  const questions = await db.select().from(surveyQuestions).where(eq(surveyQuestions.surveyId, surveyId));
  return { survey: survey[0], questions: questions.sort((a, b) => a.position - b.position) };
}

export async function createSurveyForOrganisation(organisationId: number, userId: number, input: unknown) {
  const values = surveyDraftSchema.parse(input);
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  const result = await db.insert(surveys).values({
    organisationId,
    name: values.name,
    surveyType: values.surveyType,
    introductionText: values.introductionText || null,
    thankYouText: values.thankYouText || null,
    createdByUserId: userId,
  });
  const surveyId = Number(result[0].insertId);
  await db.insert(surveyQuestions).values({
    surveyId,
    position: 1,
    questionType: values.surveyType === "custom" ? "text" : values.surveyType,
    prompt: values.questionText || defaultQuestionFor(values.surveyType),
    scaleMax: scaleFor(values.surveyType) || null,
  });
  return getSurveyForOrganisation(organisationId, surveyId);
}

export async function publishSurveyForOrganisation(organisationId: number, surveyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db
    .update(surveys)
    .set({ status: "published", publishedAt: new Date() })
    .where(and(eq(surveys.organisationId, organisationId), eq(surveys.id, surveyId)));
  return getSurveyForOrganisation(organisationId, surveyId);
}

export async function listJourneysForSurvey(organisationId: number, surveyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db
    .select()
    .from(journeys)
    .where(and(eq(journeys.organisationId, organisationId), eq(journeys.surveyId, surveyId)))
    .orderBy(desc(journeys.updatedAt));
}

export async function createJourneyForOrganisation(organisationId: number, input: unknown) {
  const values = journeyDraftSchema.parse(input);
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const survey = await getSurveyForOrganisation(organisationId, values.surveyId);
  if (!survey) throw new Error("Survey not found in this workspace");

  const result = await db.insert(journeys).values({
    organisationId,
    surveyId: values.surveyId,
    name: values.name,
    triggerType: values.triggerType,
    channel: values.channel,
    audienceDescription: values.audienceDescription || null,
    frequencyGuardDays: values.frequencyGuardDays,
  });
  const id = Number(result[0].insertId);
  return (await db.select().from(journeys).where(eq(journeys.id, id)).limit(1))[0];
}

export async function listResponsesForOrganisation(organisationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db
    .select({ response: surveyResponses, surveyName: surveys.name, surveyType: surveys.surveyType, actionId: responseActions.id, actionStatus: responseActions.status, assigneeName: users.name, assigneeEmail: users.email })
    .from(surveyResponses)
    .innerJoin(surveys, eq(surveyResponses.surveyId, surveys.id))
    .leftJoin(responseActions, eq(responseActions.responseId, surveyResponses.id))
    .leftJoin(users, eq(responseActions.assignedToUserId, users.id))
    .where(eq(surveyResponses.organisationId, organisationId))
    .orderBy(desc(surveyResponses.receivedAt));
}

export async function createResponseActionForOrganisation(organisationId: number, assignedToUserId: number, input: unknown) {
  const values = responseActionSchema.parse(input);
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const response = await db
    .select({ id: surveyResponses.id })
    .from(surveyResponses)
    .where(and(eq(surveyResponses.id, values.responseId), eq(surveyResponses.organisationId, organisationId)))
    .limit(1);
  if (!response[0]) throw new Error("Response not found in this workspace");
  const result = await db.insert(responseActions).values({
    organisationId,
    responseId: values.responseId,
    assignedToUserId,
    actionText: values.actionText,
    dueAt: values.dueAt ?? null,
  });
  await db.update(surveyResponses).set({ status: "in_progress" }).where(eq(surveyResponses.id, values.responseId));
  const id = Number(result[0].insertId);
  return (await db.select().from(responseActions).where(eq(responseActions.id, id)).limit(1))[0];
}

export async function updateResponseStatusForOrganisation(organisationId: number, input: unknown) {
  const values = responseStatusSchema.parse(input);
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db
    .update(surveyResponses)
    .set({ status: values.status })
    .where(and(eq(surveyResponses.id, values.responseId), eq(surveyResponses.organisationId, organisationId)));
}

export async function updateResponseActionStatusForOrganisation(organisationId: number, input: unknown) {
  const values = actionStatusSchema.parse(input);
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const action = await db
    .select()
    .from(responseActions)
    .where(and(eq(responseActions.id, values.actionId), eq(responseActions.organisationId, organisationId)))
    .limit(1);
  if (!action[0]) throw new Error("Action not found in this workspace");
  await db
    .update(responseActions)
    .set({
      status: values.status,
      resolutionNote: values.resolutionNote ?? null,
      resolvedAt: values.status === "resolved" ? new Date() : null,
    })
    .where(eq(responseActions.id, values.actionId));
  return action[0];
}

export async function listActionsForOrganisation(organisationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db
    .select({ action: responseActions, response: surveyResponses, surveyName: surveys.name, assigneeName: users.name, assigneeEmail: users.email })
    .from(responseActions)
    .innerJoin(surveyResponses, eq(responseActions.responseId, surveyResponses.id))
    .innerJoin(surveys, eq(surveyResponses.surveyId, surveys.id))
    .leftJoin(users, eq(responseActions.assignedToUserId, users.id))
    .where(eq(responseActions.organisationId, organisationId))
    .orderBy(desc(responseActions.updatedAt));
}
