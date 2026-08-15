import { boolean, index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const workspaceRoleValues = ["owner", "admin", "manager", "analyst", "responder", "viewer"] as const;
export const organisationPlanValues = ["signal", "momentum", "clarity"] as const;
export const surveyTypeValues = ["nps", "csat", "ces", "custom"] as const;
export const surveyStatusValues = ["draft", "published", "paused", "archived"] as const;
export const questionTypeValues = ["nps", "csat", "ces", "rating", "text", "multiple_choice"] as const;
export const journeyTriggerValues = ["manual", "api_event", "scheduled"] as const;
export const journeyChannelValues = ["email", "sms", "in_app", "qr"] as const;
export const responseStatusValues = ["new", "in_progress", "closed"] as const;
export const sentimentValues = ["unknown", "positive", "neutral", "negative"] as const;
export const actionStatusValues = ["open", "in_progress", "resolved"] as const;
export const invitationStatusValues = ["pending", "accepted", "revoked", "expired"] as const;
export const subscriptionStatusValues = ["inactive", "trialing", "active", "past_due", "cancelled"] as const;
export const providerKeyValues = ["stripe", "aws_ses", "twilio", "hubspot", "zendesk", "oidc_google", "oidc_microsoft"] as const;
export const deliveryStatusValues = ["queued", "sent", "failed", "suppressed"] as const;

/** Core user table backing the supplied OAuth flow. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  activeOrganisationId: int("activeOrganisationId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/** Public early-access requests submitted from the Lumae marketing website. */
export const earlyAccessSignups = mysqlTable("early_access_signups", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  name: varchar("name", { length: 120 }),
  company: varchar("company", { length: 160 }),
  industry: varchar("industry", { length: 80 }).notNull(),
  companySize: varchar("companySize", { length: 40 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const organisations = mysqlTable(
  "organisations",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    slug: varchar("slug", { length: 80 }).notNull(),
    industry: varchar("industry", { length: 80 }).notNull(),
    companySize: varchar("companySize", { length: 40 }).notNull(),
    plan: mysqlEnum("plan", organisationPlanValues).default("signal").notNull(),
    brandName: varchar("brandName", { length: 160 }),
    brandPrimaryColor: varchar("brandPrimaryColor", { length: 16 }).default("#0E867E").notNull(),
    timezone: varchar("timezone", { length: 64 }).default("Australia/Sydney").notNull(),
    deliveryChannels: varchar("deliveryChannels", { length: 80 }).default("email").notNull(),
    deliveryFrequencyGuardDays: int("deliveryFrequencyGuardDays").default(30).notNull(),
    retentionDays: int("retentionDays").default(730).notNull(),
    ssoProvider: varchar("ssoProvider", { length: 64 }),
    ssoRequired: boolean("ssoRequired").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    slugUnique: uniqueIndex("organisations_slug_unique").on(table.slug),
  })
);

export const organisationMembers = mysqlTable(
  "organisation_members",
  {
    id: int("id").autoincrement().primaryKey(),
    organisationId: int("organisationId").notNull().references(() => organisations.id),
    userId: int("userId").notNull().references(() => users.id),
    role: mysqlEnum("role", workspaceRoleValues).default("viewer").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    memberUnique: uniqueIndex("organisation_members_member_unique").on(table.organisationId, table.userId),
    userIndex: index("organisation_members_user_index").on(table.userId),
  })
);

export const surveys = mysqlTable(
  "surveys",
  {
    id: int("id").autoincrement().primaryKey(),
    organisationId: int("organisationId").notNull().references(() => organisations.id),
    name: varchar("name", { length: 160 }).notNull(),
    surveyType: mysqlEnum("surveyType", surveyTypeValues).notNull(),
    status: mysqlEnum("status", surveyStatusValues).default("draft").notNull(),
    introductionText: text("introductionText"),
    thankYouText: text("thankYouText"),
    createdByUserId: int("createdByUserId").notNull().references(() => users.id),
    publishedAt: timestamp("publishedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    organisationIndex: index("surveys_organisation_index").on(table.organisationId),
    statusIndex: index("surveys_status_index").on(table.organisationId, table.status),
  })
);

export const surveyQuestions = mysqlTable(
  "survey_questions",
  {
    id: int("id").autoincrement().primaryKey(),
    surveyId: int("surveyId").notNull().references(() => surveys.id),
    position: int("position").notNull(),
    questionType: mysqlEnum("questionType", questionTypeValues).notNull(),
    prompt: text("prompt").notNull(),
    scaleMax: int("scaleMax"),
    required: boolean("required").default(true).notNull(),
    configuration: text("configuration"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    surveyIndex: index("survey_questions_survey_index").on(table.surveyId, table.position),
  })
);

export const journeys = mysqlTable(
  "journeys",
  {
    id: int("id").autoincrement().primaryKey(),
    organisationId: int("organisationId").notNull().references(() => organisations.id),
    surveyId: int("surveyId").notNull().references(() => surveys.id),
    name: varchar("name", { length: 160 }).notNull(),
    triggerType: mysqlEnum("triggerType", journeyTriggerValues).default("manual").notNull(),
    channel: mysqlEnum("channel", journeyChannelValues).default("email").notNull(),
    audienceDescription: text("audienceDescription"),
    frequencyGuardDays: int("frequencyGuardDays").default(30).notNull(),
    status: mysqlEnum("status", surveyStatusValues).default("draft").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    organisationIndex: index("journeys_organisation_index").on(table.organisationId),
    surveyIndex: index("journeys_survey_index").on(table.surveyId),
  })
);

export const surveyResponses = mysqlTable(
  "survey_responses",
  {
    id: int("id").autoincrement().primaryKey(),
    organisationId: int("organisationId").notNull().references(() => organisations.id),
    surveyId: int("surveyId").notNull().references(() => surveys.id),
    journeyId: int("journeyId").references(() => journeys.id),
    score: int("score"),
    comment: text("comment"),
    sentiment: mysqlEnum("sentiment", sentimentValues).default("unknown").notNull(),
    status: mysqlEnum("status", responseStatusValues).default("new").notNull(),
    externalReference: varchar("externalReference", { length: 160 }),
    context: text("context"),
    receivedAt: timestamp("receivedAt").defaultNow().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    organisationIndex: index("survey_responses_organisation_index").on(table.organisationId, table.receivedAt),
    surveyIndex: index("survey_responses_survey_index").on(table.surveyId),
    statusIndex: index("survey_responses_status_index").on(table.organisationId, table.status),
  })
);

export const responseActions = mysqlTable(
  "response_actions",
  {
    id: int("id").autoincrement().primaryKey(),
    organisationId: int("organisationId").notNull().references(() => organisations.id),
    responseId: int("responseId").notNull().references(() => surveyResponses.id),
    assignedToUserId: int("assignedToUserId").references(() => users.id),
    status: mysqlEnum("status", actionStatusValues).default("open").notNull(),
    actionText: text("actionText").notNull(),
    resolutionNote: text("resolutionNote"),
    dueAt: timestamp("dueAt"),
    resolvedAt: timestamp("resolvedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    organisationIndex: index("response_actions_organisation_index").on(table.organisationId, table.status),
    responseIndex: index("response_actions_response_index").on(table.responseId),
    assigneeIndex: index("response_actions_assignee_index").on(table.assignedToUserId, table.status),
  })
);

/** Tenant-scoped invitations. Tokens are stored only as hashes. */
export const organisationInvitations = mysqlTable(
  "organisation_invitations",
  {
    id: int("id").autoincrement().primaryKey(),
    organisationId: int("organisationId").notNull().references(() => organisations.id),
    email: varchar("email", { length: 320 }).notNull(),
    role: mysqlEnum("role", workspaceRoleValues).default("viewer").notNull(),
    tokenHash: varchar("tokenHash", { length: 128 }).notNull().unique(),
    status: mysqlEnum("status", invitationStatusValues).default("pending").notNull(),
    invitedByUserId: int("invitedByUserId").notNull().references(() => users.id),
    expiresAt: timestamp("expiresAt").notNull(),
    acceptedAt: timestamp("acceptedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    organisationIndex: index("organisation_invitations_organisation_index").on(table.organisationId, table.status),
    emailIndex: index("organisation_invitations_email_index").on(table.email),
  })
);

/** Platform-level provider configuration. Secret fields are encrypted before persistence. */
export const platformProviderConfigs = mysqlTable(
  "platform_provider_configs",
  {
    id: int("id").autoincrement().primaryKey(),
    provider: mysqlEnum("provider", providerKeyValues).notNull().unique(),
    enabled: boolean("enabled").default(false).notNull(),
    publicConfiguration: text("publicConfiguration"),
    secretConfigurationCiphertext: text("secretConfigurationCiphertext"),
    lastTestStatus: varchar("lastTestStatus", { length: 32 }),
    lastTestedAt: timestamp("lastTestedAt"),
    updatedByUserId: int("updatedByUserId").references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  }
);

/** Minimal Stripe identifiers only; financial status remains the Stripe source of truth. */
export const organisationSubscriptions = mysqlTable(
  "organisation_subscriptions",
  {
    id: int("id").autoincrement().primaryKey(),
    organisationId: int("organisationId").notNull().references(() => organisations.id).unique(),
    stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
    stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
    stripePriceId: varchar("stripePriceId", { length: 255 }),
    status: mysqlEnum("status", subscriptionStatusValues).default("inactive").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({ customerIndex: index("organisation_subscriptions_customer_index").on(table.stripeCustomerId) })
);

/** Immutable audit history for platform and tenant-bound security events. */
export const auditLogs = mysqlTable(
  "audit_logs",
  {
    id: int("id").autoincrement().primaryKey(),
    organisationId: int("organisationId").references(() => organisations.id),
    actorUserId: int("actorUserId").references(() => users.id),
    action: varchar("action", { length: 120 }).notNull(),
    entityType: varchar("entityType", { length: 80 }).notNull(),
    entityId: varchar("entityId", { length: 120 }),
    metadata: text("metadata"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    organisationIndex: index("audit_logs_organisation_index").on(table.organisationId, table.createdAt),
    actorIndex: index("audit_logs_actor_index").on(table.actorUserId, table.createdAt),
  })
);

/** Encrypted recipient records and provider-neutral delivery state for survey distribution. */
export const surveyDeliveries = mysqlTable(
  "survey_deliveries",
  {
    id: int("id").autoincrement().primaryKey(),
    organisationId: int("organisationId").notNull().references(() => organisations.id),
    surveyId: int("surveyId").notNull().references(() => surveys.id),
    journeyId: int("journeyId").references(() => journeys.id),
    channel: mysqlEnum("channel", journeyChannelValues).notNull(),
    recipientHash: varchar("recipientHash", { length: 128 }).notNull(),
    recipientCiphertext: text("recipientCiphertext").notNull(),
    status: mysqlEnum("status", deliveryStatusValues).default("queued").notNull(),
    providerMessageId: varchar("providerMessageId", { length: 255 }),
    scheduledAt: timestamp("scheduledAt").defaultNow().notNull(),
    sentAt: timestamp("sentAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    organisationIndex: index("survey_deliveries_organisation_index").on(table.organisationId, table.status),
    recipientIndex: index("survey_deliveries_recipient_index").on(table.organisationId, table.recipientHash, table.createdAt),
  })
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type EarlyAccessSignup = typeof earlyAccessSignups.$inferSelect;
export type InsertEarlyAccessSignup = typeof earlyAccessSignups.$inferInsert;
export type Organisation = typeof organisations.$inferSelect;
export type OrganisationMember = typeof organisationMembers.$inferSelect;
export type Survey = typeof surveys.$inferSelect;
export type SurveyQuestion = typeof surveyQuestions.$inferSelect;
export type Journey = typeof journeys.$inferSelect;
export type SurveyResponse = typeof surveyResponses.$inferSelect;
export type ResponseAction = typeof responseActions.$inferSelect;
export type OrganisationInvitation = typeof organisationInvitations.$inferSelect;
export type PlatformProviderConfig = typeof platformProviderConfigs.$inferSelect;
export type OrganisationSubscription = typeof organisationSubscriptions.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type SurveyDelivery = typeof surveyDeliveries.$inferSelect;
