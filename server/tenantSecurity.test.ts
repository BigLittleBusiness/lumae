import { describe, expect, it } from "vitest";
import { deliveryRequestSchema, invitationSchema, providerConfigSchema, tenantSecuritySchema } from "./lumae";
import { createInvitationToken, decryptSensitiveValue, encryptSensitiveValue, hashValue } from "./tenantSecurity";

describe("tenant security primitives", () => {
  it("creates non-guessable invitation tokens and stable hashes", () => {
    const token = createInvitationToken();
    expect(token.length).toBeGreaterThan(30);
    expect(hashValue(token)).toHaveLength(64);
    expect(hashValue(token)).toBe(hashValue(token));
  });

  it("encrypts provider secrets with a distinct ciphertext and restores them server-side", () => {
    const ciphertext = encryptSensitiveValue("sensitive-provider-secret");
    expect(ciphertext).not.toContain("sensitive-provider-secret");
    expect(decryptSensitiveValue(ciphertext)).toBe("sensitive-provider-secret");
  });

  it("rejects unsafe tenant and provider configuration", () => {
    expect(() => invitationSchema.parse({ email: "not-an-email", role: "admin" })).toThrow();
    expect(() => tenantSecuritySchema.parse({ retentionDays: 5, ssoProvider: null, ssoRequired: false })).toThrow();
    expect(() => providerConfigSchema.parse({ provider: "aws_ses", enabled: true, publicConfiguration: { region: "ap-southeast-2" }, secretConfiguration: { accessKeyId: "key" } })).not.toThrow();
  });

  it("requires a valid tenant-bound live-delivery request", () => {
    expect(() => deliveryRequestSchema.parse({ surveyId: 1, channel: "email", recipient: "person@example.com" })).not.toThrow();
    expect(() => deliveryRequestSchema.parse({ surveyId: 1, channel: "email", recipient: "" })).toThrow();
  });
});
