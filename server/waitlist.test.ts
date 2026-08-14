import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  createEarlyAccessSignup: vi.fn(),
  getEarlyAccessSignupByEmail: vi.fn(),
}));

vi.mock("./db", () => dbMocks);

import { appRouter } from "./routers";
import { normalizeWaitlistInput } from "./waitlist";

function createPublicCaller() {
  return appRouter.createCaller({
    user: null,
    req: { protocol: "https", headers: {} },
    res: {},
  } as never);
}

describe("early-access waitlist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normalizes email and optional contact fields", () => {
    expect(
      normalizeWaitlistInput({
        email: "  Hello@Example.COM ",
        name: "  Aroha  ",
        company: "  Lumae Labs  ",
      })
    ).toEqual({ email: "hello@example.com", name: "Aroha", company: "Lumae Labs" });
  });

  it("persists a new signup and reports success", async () => {
    dbMocks.getEarlyAccessSignupByEmail.mockResolvedValue(undefined);
    dbMocks.createEarlyAccessSignup.mockResolvedValue(undefined);

    const result = await createPublicCaller().waitlist.join({
      email: "  hello@example.com ",
      name: "  Aroha  ",
      company: "  Lumae Labs  ",
    });

    expect(dbMocks.getEarlyAccessSignupByEmail).toHaveBeenCalledWith("hello@example.com");
    expect(dbMocks.createEarlyAccessSignup).toHaveBeenCalledWith({
      email: "hello@example.com",
      name: "Aroha",
      company: "Lumae Labs",
    });
    expect(result).toEqual({ status: "joined" });
  });

  it("does not create a duplicate signup", async () => {
    dbMocks.getEarlyAccessSignupByEmail.mockResolvedValue({ id: 7, email: "hello@example.com" });

    const result = await createPublicCaller().waitlist.join({ email: "hello@example.com" });

    expect(dbMocks.createEarlyAccessSignup).not.toHaveBeenCalled();
    expect(result).toEqual({ status: "already_joined" });
  });

  it("rejects an invalid email address", async () => {
    await expect(createPublicCaller().waitlist.join({ email: "not-an-email" })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });
});
