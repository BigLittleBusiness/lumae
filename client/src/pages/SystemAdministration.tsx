import { useAuth } from "@/_core/hooks/useAuth";
import { AppPageHeader } from "@/components/LumaeAppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, CircleAlert, KeyRound, LockKeyhole, ServerCog, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type ProviderKey = "stripe" | "aws_ses" | "twilio" | "hubspot" | "zendesk" | "oidc_google" | "oidc_microsoft";

type ProviderDefinition = {
  key: ProviderKey;
  name: string;
  description: string;
  publicFields: Array<{ key: string; label: string; placeholder: string }>;
  secretFields: Array<{ key: string; label: string; placeholder: string }>;
};

const providers: ProviderDefinition[] = [
  { key: "stripe", name: "Stripe subscriptions", description: "Tenant subscriptions, Checkout and verified billing webhooks.", publicFields: [{ key: "publishableKey", label: "Publishable key", placeholder: "pk_live_… or pk_test_…" }, { key: "signalPriceId", label: "Signal price ID", placeholder: "price_…" }, { key: "momentumPriceId", label: "Momentum price ID", placeholder: "price_…" }, { key: "clarityPriceId", label: "Clarity price ID", placeholder: "price_…" }], secretFields: [{ key: "secretKey", label: "Secret key", placeholder: "sk_…" }, { key: "webhookSecret", label: "Webhook signing secret", placeholder: "whsec_…" }] },
  { key: "aws_ses", name: "AWS SES email", description: "Transactional invitations and customer survey delivery from a verified sender.", publicFields: [{ key: "region", label: "AWS region", placeholder: "ap-southeast-2" }, { key: "fromEmail", label: "Verified from email", placeholder: "feedback@yourdomain.com" }, { key: "fromName", label: "From name", placeholder: "Your company" }], secretFields: [{ key: "accessKeyId", label: "Access key ID", placeholder: "AKIA…" }, { key: "secretAccessKey", label: "Secret access key", placeholder: "Enter secret access key" }] },
  { key: "twilio", name: "Twilio SMS", description: "SMS survey delivery through an approved messaging service or sending number.", publicFields: [{ key: "messagingServiceSid", label: "Messaging service SID", placeholder: "MG…" }, { key: "fromNumber", label: "Fallback sending number", placeholder: "+614…" }], secretFields: [{ key: "accountSid", label: "Account SID", placeholder: "AC…" }, { key: "authToken", label: "Auth token", placeholder: "Enter auth token" }] },
  { key: "hubspot", name: "HubSpot CRM", description: "Customer context and feedback follow-up mapping for connected HubSpot tenants.", publicFields: [{ key: "portalId", label: "Portal ID", placeholder: "123456" }], secretFields: [{ key: "privateAppToken", label: "Private app token", placeholder: "pat-…" }] },
  { key: "zendesk", name: "Zendesk helpdesk", description: "Recovery workflows and ticket references for connected Zendesk tenants.", publicFields: [{ key: "subdomain", label: "Zendesk subdomain", placeholder: "yourcompany" }], secretFields: [{ key: "apiToken", label: "API token", placeholder: "Enter API token" }] },
  { key: "oidc_google", name: "Google Workspace SSO", description: "OIDC sign-in for tenant workforces using Google Workspace.", publicFields: [{ key: "clientId", label: "OAuth client ID", placeholder: "…apps.googleusercontent.com" }, { key: "allowedDomains", label: "Allowed domains", placeholder: "example.com, subsidiary.com" }], secretFields: [{ key: "clientSecret", label: "OAuth client secret", placeholder: "Enter client secret" }] },
  { key: "oidc_microsoft", name: "Microsoft Entra ID SSO", description: "OIDC sign-in for tenant workforces using Microsoft Entra ID.", publicFields: [{ key: "tenantId", label: "Directory tenant ID", placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" }, { key: "clientId", label: "Application client ID", placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" }], secretFields: [{ key: "clientSecret", label: "Client secret", placeholder: "Enter client secret" }] },
];

function ProviderCard({ provider, existing }: { provider: ProviderDefinition; existing?: { enabled: boolean; publicConfiguration: string | null; lastTestStatus: string | null } }) {
  const utils = trpc.useUtils();
  const parsedPublic = useMemo(() => {
    try { return existing?.publicConfiguration ? JSON.parse(existing.publicConfiguration) as Record<string, string> : {}; } catch { return {}; }
  }, [existing?.publicConfiguration]);
  const [enabled, setEnabled] = useState(existing?.enabled ?? false);
  const [publicValues, setPublicValues] = useState<Record<string, string>>(parsedPublic);
  const [secretValues, setSecretValues] = useState<Record<string, string>>({});
  const save = trpc.platform.updateProviderConfig.useMutation({
    onSuccess: () => { toast.success(`${provider.name} configuration saved`); setSecretValues({}); utils.platform.providerConfigs.invalidate(); },
    onError: error => toast.error(error.message),
  });
  const configured = Boolean(existing?.enabled);

  return <article className="rounded-3xl border border-[#dce7e7] bg-white p-5 shadow-[0_12px_35px_rgba(16,40,59,0.05)] sm:p-6">
    <div className="flex gap-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#e9f0f0] text-[#0e867e]"><ServerCog className="h-5 w-5" /></span>
      <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-extrabold tracking-[-0.04em] text-[#10283b]">{provider.name}</h2><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.13em] ${configured ? "bg-[#e4f7f5] text-[#08756e]" : "bg-[#f5f1ea] text-[#746754]"}`}>{configured ? <CheckCircle2 className="h-3 w-3" /> : <CircleAlert className="h-3 w-3" />}{configured ? "Configured" : "Not connected"}</span></div><p className="mt-1.5 text-sm leading-6 text-[#486170]">{provider.description}</p></div>
    </div>
    <div className="mt-5 grid gap-4 sm:grid-cols-2">{provider.publicFields.map(field => <div key={field.key} className="grid gap-2"><Label htmlFor={`${provider.key}-${field.key}`}>{field.label}</Label><Input id={`${provider.key}-${field.key}`} placeholder={field.placeholder} value={publicValues[field.key] ?? ""} onChange={event => setPublicValues(values => ({ ...values, [field.key]: event.target.value }))} /></div>)}{provider.secretFields.map(field => <div key={field.key} className="grid gap-2"><Label htmlFor={`${provider.key}-${field.key}`} className="flex items-center gap-1.5"><LockKeyhole className="h-3.5 w-3.5 text-[#0e867e]" />{field.label}</Label><Input id={`${provider.key}-${field.key}`} type="password" autoComplete="new-password" placeholder={existing ? "Leave blank to retain the saved secret" : field.placeholder} value={secretValues[field.key] ?? ""} onChange={event => setSecretValues(values => ({ ...values, [field.key]: event.target.value }))} /></div>)}</div>
    <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-[#e9f0f0] pt-4"><div className="flex items-center gap-3"><Switch checked={enabled} onCheckedChange={setEnabled} id={`${provider.key}-enabled`} /><Label htmlFor={`${provider.key}-enabled`} className="text-sm font-semibold">Enable after saving configuration</Label></div><Button disabled={save.isPending} onClick={() => save.mutate({ provider: provider.key, enabled, publicConfiguration: publicValues, secretConfiguration: secretValues })}>{save.isPending ? "Saving…" : "Save connection"}</Button></div>
  </article>;
}

export default function SystemAdministration() {
  const { user } = useAuth();
  const configs = trpc.platform.providerConfigs.useQuery(undefined, { enabled: user?.role === "admin" });
  if (user?.role !== "admin") return <section className="rounded-3xl border border-[#f0d8d2] bg-[#fffaf8] p-8 text-center"><ShieldCheck className="mx-auto h-8 w-8 text-[#e96e59]" /><h1 className="mt-4 text-2xl font-extrabold tracking-[-0.045em] text-[#10283b]">System administrator access required</h1><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#486170]">Provider credentials and global security controls are available only to Lumae system administrators.</p></section>;
  const byProvider = new Map(configs.data?.map(config => [config.provider, config]) ?? []);
  return <section className="space-y-8"><AppPageHeader eyebrow="System administration" title="Platform connections"><p className="max-w-2xl text-sm leading-6 text-[#486170]">Configure shared Lumae providers once. Secrets are encrypted before storage and are never returned to this interface after saving.</p></AppPageHeader><div className="rounded-3xl border border-[#d5ece9] bg-[#f4fbfa] p-5 text-sm leading-6 text-[#31535c]"><div className="flex gap-3"><KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-[#0e867e]" /><p><strong className="text-[#10283b]">Activation safety.</strong> Enabling a provider only allows Lumae to use that connection. Tenant delivery remains governed by workspace roles, delivery channels, frequency safeguards, and tenant consent.</p></div></div><div className="grid gap-5 lg:grid-cols-2">{providers.map(provider => <ProviderCard key={provider.key} provider={provider} existing={byProvider.get(provider.key)} />)}</div></section>;
}
