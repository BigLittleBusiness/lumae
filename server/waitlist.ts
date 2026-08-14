export type WaitlistInput = {
  email: string;
  name?: string;
  company?: string;
};

function trimOrUndefined(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

export function normalizeWaitlistInput(input: WaitlistInput) {
  return {
    email: input.email.trim().toLowerCase(),
    name: trimOrUndefined(input.name),
    company: trimOrUndefined(input.company),
  };
}
