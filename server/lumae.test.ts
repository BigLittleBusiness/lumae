import { describe, expect, it } from "vitest";
import { actionStatusSchema, defaultQuestionFor, memberRoleSchema, responseActionSchema, scaleFor, slugifyWorkspaceName, surveyDraftSchema, workspaceCreateSchema, workspaceSettingsSchema } from "./lumae";

describe("Lumae application foundations", () => {
  it("creates predictable workspace slugs", () => {
    expect(slugifyWorkspaceName("Harbour & Co. Advisory")).toBe("harbour-co-advisory");
    expect(slugifyWorkspaceName("   ")).toBe("lumae-workspace");
  });

  it("uses the correct default measure scales", () => {
    expect(scaleFor("nps")).toBe(11);
    expect(scaleFor("csat")).toBe(5);
    expect(scaleFor("ces")).toBe(5);
    expect(scaleFor("custom")).toBe(0);
  });

  it("provides a distinct editable default question for every standard measure", () => {
    expect(defaultQuestionFor("nps")).toContain("recommend");
    expect(defaultQuestionFor("csat")).toContain("satisfied");
    expect(defaultQuestionFor("ces")).toContain("easy");
  });

  it("validates workspace and survey inputs", () => {
    expect(workspaceCreateSchema.safeParse({ name: "Lumae Health", industry: "healthcare", companySize: "11_50" }).success).toBe(true);
    expect(surveyDraftSchema.safeParse({ name: "Post visit", surveyType: "csat", questionText: "How satisfied were you?" }).success).toBe(true);
    expect(surveyDraftSchema.safeParse({ name: "X", surveyType: "csat", questionText: "No" }).success).toBe(false);
  });

  it("requires a meaningful owner action for a response", () => {
    expect(responseActionSchema.safeParse({ responseId: 2, actionText: "Call the customer" }).success).toBe(true);
    expect(responseActionSchema.safeParse({ responseId: 2, actionText: "No" }).success).toBe(false);
  });

  it("validates organisation branding controls", () => {
    expect(workspaceSettingsSchema.safeParse({ name: "Lumae Health", brandName: "Lumae Health", brandPrimaryColor: "#0E867E", timezone: "Australia/Sydney", deliveryChannels: ["email"], deliveryFrequencyGuardDays: 30 }).success).toBe(true);
    expect(workspaceSettingsSchema.safeParse({ name: "Lumae Health", brandPrimaryColor: "teal", timezone: "Australia/Sydney", deliveryChannels: [], deliveryFrequencyGuardDays: 0 }).success).toBe(false);
  });

  it("validates role changes and action lifecycle transitions", () => {
    expect(memberRoleSchema.safeParse({ userId: 8, role: "responder" }).success).toBe(true);
    expect(memberRoleSchema.safeParse({ userId: 8, role: "owner" }).success).toBe(false);
    expect(actionStatusSchema.safeParse({ actionId: 4, responseId: 6, status: "resolved", resolutionNote: "Customer received a follow-up" }).success).toBe(true);
  });
});
