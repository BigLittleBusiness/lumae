import crypto from "crypto";

const encryptionKey = crypto
  .createHash("sha256")
  .update(process.env.JWT_SECRET || "lumae-development-only-key")
  .digest();

export function createInvitationToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashValue(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function encryptSensitiveValue(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey, iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]).toString("base64");
}

export function decryptSensitiveValue(ciphertext: string) {
  const payload = Buffer.from(ciphertext, "base64");
  const iv = payload.subarray(0, 12);
  const authTag = payload.subarray(12, 28);
  const encrypted = payload.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}
