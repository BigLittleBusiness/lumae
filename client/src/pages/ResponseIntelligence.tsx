import { AppPageHeader } from "@/components/LumaeAppShell";
import { trpc } from "@/lib/trpc";
import { BellRing, Check, ClipboardCheck, ClipboardList, Inbox, MailPlus, ShieldCheck, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";

const deliveryOptions = [
  ["email", "Email"],
  ["sms", "SMS"],
  ["in_app", "In-app"],
  ["qr", "QR"],
] as const;
type DeliveryChannel = (typeof deliveryOptions)[number][0];

export function ResponseIntelligence() {
  const responses = trpc.intelligence.responses.useQuery();
  const utils = trpc.useUtils();
  const [openResponse, setOpenResponse] = useState<number | null>(null);
  const [actionText, setActionText] = useState("");
  const action = trpc.intelligence.createAction.useMutation({
    onSuccess: async () => {
      setActionText("");
      setOpenResponse(null);
      await Promise.all([utils.intelligence.responses.invalidate(), utils.intelligence.actions.invalidate(), utils.workspace.dashboard.invalidate()]);
    },
  });
  const updateResponse = trpc.intelligence.updateResponseStatus.useMutation({
    onSuccess: async () => { await Promise.all([utils.intelligence.responses.invalidate(), utils.intelligence.actions.invalidate(), utils.workspace.dashboard.invalidate()]); },
  });

  return <div className="space-y-8">
    <AppPageHeader eyebrow="Response intelligence" title="See the signal with its context." />
    <section className="rounded-[28px] border border-[#dce7e7] bg-white">
      {responses.isLoading ? <div className="h-64 animate-pulse bg-[#e9f0f0]" /> : responses.data?.length ? <div className="divide-y divide-[#e9f0f0]">
        {responses.data.map(row => <div key={row.response.id} className="px-6 py-5">
          <div className="flex gap-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e9f0f0] font-mono text-sm text-[#0e867e]">{row.response.score ?? "—"}</span>
            <div className="min-w-0 flex-1">
              <p className="font-bold">{row.surveyName}</p>
              <p className="mt-1 text-sm text-[#486170]">{row.response.comment || "No written comment supplied"}</p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#486170]">{row.response.status} · {row.response.sentiment}</p>
              {row.actionId && <p className="mt-2 text-xs font-semibold text-[#0e867e]">Owner · {row.assigneeName || row.assigneeEmail || "Unassigned"} · {row.actionStatus}</p>}
            </div>
            <div className="flex shrink-0 flex-col gap-2"><select value={row.response.status} onChange={event => updateResponse.mutate({ responseId: row.response.id, status: event.target.value as "new" | "in_progress" | "closed" })} className="h-9 rounded-lg border border-[#cfdcdd] bg-white px-2 text-xs font-bold text-[#10283b]"><option value="new">New</option><option value="in_progress">In progress</option><option value="closed">Closed</option></select>{row.response.status !== "closed" && <button onClick={() => setOpenResponse(openResponse === row.response.id ? null : row.response.id)} className="h-9 rounded-lg border border-[#cfdcdd] px-3 text-xs font-bold text-[#10283b]">{openResponse === row.response.id ? "Close" : "Assign"}</button>}</div>
          </div>
          {openResponse === row.response.id && <form className="mt-4 flex gap-2 rounded-xl bg-[#e9f0f0] p-3" onSubmit={event => { event.preventDefault(); action.mutate({ responseId: row.response.id, actionText }); }}>
            <input value={actionText} onChange={event => setActionText(event.target.value)} placeholder="Describe the next customer step" className="h-10 min-w-0 flex-1 rounded-lg border border-[#cfdcdd] bg-white px-3 text-sm outline-none focus:border-[#0e867e]" />
            <button disabled={action.isPending} className="inline-flex h-10 items-center gap-1 rounded-lg bg-[#0e867e] px-3 text-xs font-bold text-white"><Check className="h-3.5 w-3.5" />Own it</button>
          </form>}
        </div>)}
      </div> : <EmptyState icon={Inbox} title="Your response feed is ready." body="Published surveys will place feedback here with score, comment, journey, and follow-up context. No customer responses have been created in this workspace yet." />}
    </section>
  </div>;
}

export function ActionQueue() {
  const actions = trpc.intelligence.actions.useQuery();
  const utils = trpc.useUtils();
  const updateResponse = trpc.intelligence.updateResponseStatus.useMutation();
  const updateAction = trpc.intelligence.updateActionStatus.useMutation({
    onSuccess: async (_, variables) => {
      if (variables.responseId) {
        const responseStatus = variables.status === "resolved" ? "closed" : variables.status === "in_progress" ? "in_progress" : "new";
        await updateResponse.mutateAsync({ responseId: variables.responseId, status: responseStatus });
      }
      await Promise.all([utils.intelligence.actions.invalidate(), utils.intelligence.responses.invalidate(), utils.workspace.dashboard.invalidate()]);
    },
  });

  return <div className="space-y-8">
    <AppPageHeader eyebrow="Recovery workflow" title="Keep the next step visible." />
    <section className="rounded-[28px] border border-[#dce7e7] bg-white">
      {actions.isLoading ? <div className="h-64 animate-pulse bg-[#e9f0f0]" /> : actions.data?.length ? <div className="divide-y divide-[#e9f0f0]">
        {actions.data.map(row => <div key={row.action.id} className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="font-bold">{row.action.actionText}</p><p className="mt-2 text-sm text-[#486170]">{row.surveyName} · response status: {row.response.status}</p><p className="mt-2 text-xs font-semibold text-[#0e867e]">Owner · {row.assigneeName || row.assigneeEmail || "Unassigned"}</p></div>
          <select disabled={updateAction.isPending} value={row.action.status} onChange={event => updateAction.mutate({ actionId: row.action.id, responseId: row.response.id, status: event.target.value as "open" | "in_progress" | "resolved" })} className="h-10 shrink-0 rounded-xl border border-[#cfdcdd] bg-white px-3 text-sm font-bold text-[#10283b] disabled:opacity-60"><option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option></select>
        </div>)}
      </div> : <EmptyState icon={ClipboardCheck} title="No customer action is waiting." body="When a response needs follow-up, assign an owner and record the next step here. The queue will show what remains open and what has changed." />}
    </section>
  </div>;
}

export function Reporting() {
  const dashboard = trpc.workspace.dashboard.useQuery();
  const data = dashboard.data?.metrics;
  const items = [{ label: "Published surveys", value: data?.publishedTotal ?? 0 }, { label: "Responses received", value: data?.responseTotal ?? 0 }, { label: "Open follow-ups", value: data?.openActionTotal ?? 0 }];
  return <div className="space-y-8"><AppPageHeader eyebrow="Analysis" title="Reporting begins with real signals." /><div className="grid gap-4 md:grid-cols-3">{items.map(item => <div key={item.label} className="rounded-2xl border border-[#dce7e7] bg-white p-6"><p className="font-mono text-3xl tracking-[-0.06em]">{item.value}</p><p className="mt-2 text-sm font-bold">{item.label}</p></div>)}</div><section className="rounded-[28px] bg-[#10283b] p-7 text-white"><BellRing className="h-6 w-6 text-[#69d7ce]" /><h2 className="mt-5 text-2xl font-extrabold tracking-[-0.045em]">No trend is better than an invented one.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-white/68">Score trends, segment comparisons, and recovery drivers will appear only after customer responses arrive. This workspace is ready to collect those real signals.</p></section></div>;
}

export function WorkspaceSettings() {
  const workspace = trpc.workspace.me.useQuery();
  const data = workspace.data;
  const utils = trpc.useUtils();
  const [name, setName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [brandPrimaryColor, setBrandPrimaryColor] = useState("#0E867E");
  const [timezone, setTimezone] = useState("Australia/Sydney");
  const [deliveryChannels, setDeliveryChannels] = useState<DeliveryChannel[]>(["email"]);
  const [deliveryFrequencyGuardDays, setDeliveryFrequencyGuardDays] = useState(30);
  const [retentionDays, setRetentionDays] = useState(730);
  const [ssoProvider, setSsoProvider] = useState<"oidc_google" | "oidc_microsoft" | "">("");
  const [ssoRequired, setSsoRequired] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "manager" | "analyst" | "responder" | "viewer">("viewer");
  const [createdInvitationLink, setCreatedInvitationLink] = useState<string | null>(null);

  useEffect(() => {
    if (!data?.organisation) return;
    setName(data.organisation.name);
    setBrandName(data.organisation.brandName || data.organisation.name);
    setBrandPrimaryColor(data.organisation.brandPrimaryColor);
    setTimezone(data.organisation.timezone);
    const savedChannels = data.organisation.deliveryChannels.split(",").filter((channel): channel is DeliveryChannel => deliveryOptions.some(([value]) => value === channel));
    setDeliveryChannels(savedChannels.length ? savedChannels : ["email"]);
    setDeliveryFrequencyGuardDays(data.organisation.deliveryFrequencyGuardDays);
    setRetentionDays(data.organisation.retentionDays);
    setSsoProvider((data.organisation.ssoProvider as "oidc_google" | "oidc_microsoft" | null) ?? "");
    setSsoRequired(data.organisation.ssoRequired);
  }, [data?.organisation]);

  const update = trpc.workspace.updateSettings.useMutation({ onSuccess: async () => { await utils.workspace.me.invalidate(); } });
  const members = trpc.workspace.members.useQuery();
  const updateRole = trpc.workspace.updateMemberRole.useMutation({ onSuccess: async () => { await members.refetch(); } });
  const canManage = data?.membership.role === "owner" || data?.membership.role === "admin";
  const isOwner = data?.membership.role === "owner";
  const invitations = trpc.workspace.invitations.useQuery(undefined, { enabled: canManage });
  const invite = trpc.workspace.invite.useMutation({ onSuccess: async invitation => { setInviteEmail(""); setCreatedInvitationLink(`${window.location.origin}/app/invite?token=${invitation.token}`); await invitations.refetch(); } });
  const updateSecurity = trpc.workspace.updateSecurity.useMutation({ onSuccess: async () => { await utils.workspace.me.invalidate(); } });
  const toggleChannel = (channel: DeliveryChannel) => setDeliveryChannels(current => current.includes(channel) ? (current.length === 1 ? current : current.filter(item => item !== channel)) : [...current, channel]);

  return <div className="space-y-8">
    <AppPageHeader eyebrow="Administration" title="Set the boundaries for useful feedback." />
    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-[28px] border border-[#dce7e7] bg-white p-7"><UsersRound className="h-6 w-6 text-[#0e867e]" /><h2 className="mt-5 text-xl font-extrabold tracking-[-0.045em]">Organisation, brand & delivery</h2>
        <form className="mt-6 grid gap-4" onSubmit={event => { event.preventDefault(); update.mutate({ name, brandName, brandPrimaryColor, timezone, deliveryChannels, deliveryFrequencyGuardDays }); }}>
          <label className="grid gap-2 text-sm font-bold">Organisation name<input disabled={!canManage} value={name} onChange={event => setName(event.target.value)} className="h-11 rounded-xl border border-[#cfdcdd] bg-[#fbfaf7] px-3 font-normal outline-none focus:border-[#0e867e] disabled:opacity-60" /></label>
          <label className="grid gap-2 text-sm font-bold">Survey brand name<input disabled={!canManage} value={brandName} onChange={event => setBrandName(event.target.value)} className="h-11 rounded-xl border border-[#cfdcdd] bg-[#fbfaf7] px-3 font-normal outline-none focus:border-[#0e867e] disabled:opacity-60" /></label>
          <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-bold">Primary colour<input disabled={!canManage} value={brandPrimaryColor} onChange={event => setBrandPrimaryColor(event.target.value)} className="h-11 rounded-xl border border-[#cfdcdd] bg-[#fbfaf7] px-3 font-mono text-sm font-normal outline-none focus:border-[#0e867e] disabled:opacity-60" /></label><label className="grid gap-2 text-sm font-bold">Timezone<input disabled={!canManage} value={timezone} onChange={event => setTimezone(event.target.value)} className="h-11 rounded-xl border border-[#cfdcdd] bg-[#fbfaf7] px-3 font-normal outline-none focus:border-[#0e867e] disabled:opacity-60" /></label></div>
          <fieldset disabled={!canManage} className="rounded-2xl border border-[#dce7e7] p-4"><legend className="px-1 text-sm font-bold">Delivery readiness</legend><p className="mt-1 text-xs leading-5 text-[#486170]">These channels are approved for future configuration. Enabling one here does not send any communication.</p><div className="mt-4 grid grid-cols-2 gap-2">{deliveryOptions.map(([value, label]) => <label key={value} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold"><input type="checkbox" checked={deliveryChannels.includes(value)} onChange={() => toggleChannel(value)} className="accent-[#0e867e]" />{label}</label>)}</div><label className="mt-4 grid max-w-xs gap-2 text-sm font-bold">Frequency safeguard (days)<input type="number" min={1} max={365} value={deliveryFrequencyGuardDays} onChange={event => setDeliveryFrequencyGuardDays(Number(event.target.value))} className="h-10 rounded-lg border border-[#cfdcdd] bg-[#fbfaf7] px-3 font-normal outline-none focus:border-[#0e867e]" /></label></fieldset>
          {update.error && <p className="text-sm text-[#e96e59]">{update.error.message}</p>}
          {canManage ? <button disabled={update.isPending} className="mt-2 h-11 rounded-xl bg-[#0e867e] px-4 text-sm font-bold text-white disabled:opacity-60">{update.isPending ? "Saving…" : "Save organisation settings"}</button> : <p className="mt-2 text-sm text-[#486170]">Your current role is view-only for organisation settings.</p>}
        </form>
      </section>
      <section className="rounded-[28px] bg-[#e9f0f0] p-7"><ClipboardList className="h-6 w-6 text-[#0e867e]" /><h2 className="mt-5 text-xl font-extrabold tracking-[-0.045em]">Built for a deliberate rollout</h2><p className="mt-3 text-sm leading-6 text-[#486170]">The workspace now records the organisation brand, approved channels, and frequency safeguard. Provider credentials, consent language, integrations, and retention controls are the next protected configuration steps.</p><dl className="mt-6 space-y-3 text-sm"><div className="flex justify-between gap-4"><dt className="text-[#486170]">Plan</dt><dd className="font-bold capitalize">{data?.organisation.plan || "Signal"}</dd></div><div className="flex justify-between gap-4"><dt className="text-[#486170]">Your role</dt><dd className="font-bold capitalize">{data?.membership.role || "—"}</dd></div></dl></section>
      <section className="rounded-[28px] border border-[#dce7e7] bg-white p-7 lg:col-span-2"><UsersRound className="h-6 w-6 text-[#0e867e]" /><h2 className="mt-5 text-xl font-extrabold tracking-[-0.045em]">People & access</h2><p className="mt-2 text-sm leading-6 text-[#486170]">Every person keeps a clear role. Invite a teammate securely, then Lumae checks the invitation against the account email at acceptance.</p><div className="mt-5 divide-y divide-[#e9f0f0] rounded-2xl border border-[#e9f0f0]">{members.isLoading ? <div className="h-16 animate-pulse bg-[#fbfaf7]" /> : members.data?.map(row => <div key={row.member.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-bold">{row.user.name || row.user.email || "Workspace member"}</p><p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[#486170]">{row.user.email || "Account email not available"}</p></div>{row.member.role === "owner" ? <span className="inline-flex h-9 items-center rounded-lg bg-[#e9f0f0] px-3 text-xs font-bold text-[#486170]">Owner</span> : <select disabled={!isOwner || updateRole.isPending} value={row.member.role} onChange={event => updateRole.mutate({ userId: row.member.userId, role: event.target.value as "admin" | "manager" | "analyst" | "responder" | "viewer" })} className="h-9 rounded-lg border border-[#cfdcdd] bg-[#fbfaf7] px-3 text-xs font-bold outline-none focus:border-[#0e867e] disabled:opacity-60"><option value="admin">Admin</option><option value="manager">Manager</option><option value="analyst">Analyst</option><option value="responder">Responder</option><option value="viewer">Viewer</option></select>}</div>)}</div>{!isOwner && <p className="mt-3 text-xs text-[#486170]">Only the workspace owner can change roles.</p>}
        {canManage && <form className="mt-6 grid gap-3 rounded-2xl bg-[#e9f0f0] p-4 sm:grid-cols-[1fr_150px_auto]" onSubmit={event => { event.preventDefault(); invite.mutate({ email: inviteEmail, role: inviteRole }); }}><label className="grid gap-1.5 text-xs font-bold">Teammate email<input required type="email" value={inviteEmail} onChange={event => setInviteEmail(event.target.value)} placeholder="name@company.com" className="h-10 rounded-lg border border-[#cfdcdd] bg-white px-3 text-sm font-normal outline-none focus:border-[#0e867e]" /></label><label className="grid gap-1.5 text-xs font-bold">Initial role<select value={inviteRole} onChange={event => setInviteRole(event.target.value as typeof inviteRole)} className="h-10 rounded-lg border border-[#cfdcdd] bg-white px-3 text-sm font-semibold outline-none focus:border-[#0e867e]"><option value="admin">Admin</option><option value="manager">Manager</option><option value="analyst">Analyst</option><option value="responder">Responder</option><option value="viewer">Viewer</option></select></label><button disabled={invite.isPending} className="mt-auto inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#10283b] px-4 text-sm font-bold text-white disabled:opacity-60"><MailPlus className="h-4 w-4" />{invite.isPending ? "Creating…" : "Create invitation"}</button></form>}
        {invite.error && <p className="mt-3 text-sm text-[#e96e59]">{invite.error.message}</p>}{createdInvitationLink && <div className="mt-4 rounded-2xl border border-[#c9e6e2] bg-[#f4fbfa] p-4"><p className="text-sm font-bold text-[#10283b]">Invitation link created</p><p className="mt-1 text-xs leading-5 text-[#486170]">Share this one-time, seven-day link securely with the invited email address.</p><div className="mt-3 flex gap-2"><input readOnly value={createdInvitationLink} className="h-9 min-w-0 flex-1 rounded-lg border border-[#cfdcdd] bg-white px-2 font-mono text-[10px]" /><button type="button" onClick={() => navigator.clipboard.writeText(createdInvitationLink)} className="rounded-lg bg-[#10283b] px-3 text-xs font-bold text-white">Copy</button></div></div>}{invitations.data?.filter(item => item.status === "pending").length ? <div className="mt-4 rounded-2xl border border-[#e9f0f0] p-4"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#0e867e]">Pending invitations</p>{invitations.data.filter(item => item.status === "pending").map(item => <div key={item.id} className="mt-3 flex items-center justify-between text-sm"><span>{item.email}</span><span className="rounded-full bg-[#f5f1ea] px-2 py-1 text-xs font-bold capitalize text-[#746754]">{item.role}</span></div>)}</div> : null}</section>
      <section className="rounded-[28px] border border-[#dce7e7] bg-white p-7 lg:col-span-2"><ShieldCheck className="h-6 w-6 text-[#0e867e]" /><h2 className="mt-5 text-xl font-extrabold tracking-[-0.045em]">Tenant security & retention</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#486170]">Set how long customer feedback remains in this workspace and whether a configured workforce identity provider must be used. Changes are recorded in the organisation audit trail.</p><form className="mt-6 grid gap-4 md:grid-cols-3" onSubmit={event => { event.preventDefault(); updateSecurity.mutate({ retentionDays, ssoProvider: ssoProvider || null, ssoRequired }); }}><label className="grid gap-2 text-sm font-bold">Feedback retention (days)<input disabled={!canManage} type="number" min={30} max={3650} value={retentionDays} onChange={event => setRetentionDays(Number(event.target.value))} className="h-11 rounded-xl border border-[#cfdcdd] bg-[#fbfaf7] px-3 font-normal outline-none focus:border-[#0e867e] disabled:opacity-60" /></label><label className="grid gap-2 text-sm font-bold">Workforce SSO provider<select disabled={!canManage} value={ssoProvider} onChange={event => setSsoProvider(event.target.value as typeof ssoProvider)} className="h-11 rounded-xl border border-[#cfdcdd] bg-[#fbfaf7] px-3 font-normal outline-none focus:border-[#0e867e] disabled:opacity-60"><option value="">No SSO requirement</option><option value="oidc_google">Google Workspace</option><option value="oidc_microsoft">Microsoft Entra ID</option></select></label><label className="flex items-end gap-3 pb-2 text-sm font-bold"><input disabled={!canManage || !ssoProvider} type="checkbox" checked={ssoRequired} onChange={event => setSsoRequired(event.target.checked)} className="h-4 w-4 accent-[#0e867e]" />Require SSO for this tenant</label><div className="md:col-span-3">{canManage ? <button disabled={updateSecurity.isPending} className="h-11 rounded-xl bg-[#0e867e] px-4 text-sm font-bold text-white disabled:opacity-60">{updateSecurity.isPending ? "Saving…" : "Save security settings"}</button> : null}{updateSecurity.error && <p className="mt-2 text-sm text-[#e96e59]">{updateSecurity.error.message}</p>}</div></form></section>
    </div>
  </div>;
}

function EmptyState({ icon: Icon, title, body }: { icon: typeof Inbox; title: string; body: string }) {
  return <div className="px-6 py-16 text-center"><Icon className="mx-auto h-7 w-7 text-[#0e867e]" /><h2 className="mt-4 text-xl font-extrabold tracking-[-0.04em]">{title}</h2><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#486170]">{body}</p></div>;
}
