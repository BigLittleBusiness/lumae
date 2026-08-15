import { z } from "zod";

export const industryValues = [
  "financial_services",
  "healthcare",
  "professional_services",
  "retail",
  "saas_technology",
  "other",
] as const;

export const companySizeValues = ["1_10", "11_50", "51_200", "201_500", "501_plus"] as const;
export const surveyTypeValues = ["nps", "csat", "ces", "custom"] as const;
export const surveyStatusValues = ["draft", "published", "paused", "archived"] as const;

export const workspaceCreateSchema = z.object({
  name: z.string().trim().min(2, "Enter an organisation name").max(160),
  industry: z.enum(industryValues),
  companySize: z.enum(companySizeValues),
});

export const workspaceSettingsSchema = z.object({
  name: z.string().trim().min(2, "Enter an organisation name").max(160),
  brandName: z.string().trim().max(160).optional(),
  brandPrimaryColor: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Use a six-digit hex colour"),
  timezone: z.string().trim().min(3).max(64),
  deliveryChannels: z.array(z.enum(["email", "sms", "in_app", "qr"])).min(1, "Select at least one delivery channel").max(4),
  deliveryFrequencyGuardDays: z.number().int().min(1).max(365),
});

export const surveyDraftSchema = z.object({
  name: z.string().trim().min(2, "Enter a survey name").max(160),
  surveyType: z.enum(surveyTypeValues),
  questionText: z.string().trim().min(4, "Enter a question").max(500),
  introductionText: z.string().trim().max(500).optional(),
  thankYouText: z.string().trim().max(500).optional(),
});

export const journeyDraftSchema = z.object({
  surveyId: z.number().int().positive(),
  name: z.string().trim().min(2, "Enter a journey name").max(160),
  triggerType: z.enum(["manual", "api_event", "scheduled"]),
  channel: z.enum(["email", "sms", "in_app", "qr"]),
  audienceDescription: z.string().trim().max(500).optional(),
  frequencyGuardDays: z.number().int().min(1).max(365).default(30),
});

export const responseActionSchema = z.object({
  responseId: z.number().int().positive(),
  actionText: z.string().trim().min(4, "Describe the next step").max(1_000),
  dueAt: z.date().optional(),
});

export const responseStatusSchema = z.object({
  responseId: z.number().int().positive(),
  status: z.enum(["new", "in_progress", "closed"]),
});

export const actionStatusSchema = z.object({
  actionId: z.number().int().positive(),
  responseId: z.number().int().positive().optional(),
  status: z.enum(["open", "in_progress", "resolved"]),
  resolutionNote: z.string().trim().max(1_000).optional(),
});

export const memberRoleSchema = z.object({
  userId: z.number().int().positive(),
  role: z.enum(["admin", "manager", "analyst", "responder", "viewer"]),
});

export function slugifyWorkspaceName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72) || "lumae-workspace";
}

export function defaultQuestionFor(surveyType: (typeof surveyTypeValues)[number]) {
  switch (surveyType) {
    case "nps":
      return "How likely are you to recommend us to a colleague or friend?";
    case "csat":
      return "How satisfied were you with your experience today?";
    case "ces":
      return "How easy was it to get the help you needed today?";
    case "custom":
      return "What would you like us to understand about your experience?";
  }
}

export function scaleFor(surveyType: (typeof surveyTypeValues)[number]) {
  return surveyType === "nps" ? 11 : surveyType === "custom" ? 0 : 5;
}
