import { AppPageHeader } from "@/components/LumaeAppShell";
import { trpc } from "@/lib/trpc";
import { ArrowRight, ClipboardList, MailCheck, ShieldCheck, UsersRound } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

const industries = [
  ["financial_services", "Financial services"], ["healthcare", "Healthcare"], ["professional_services", "Professional services"], ["retail", "Retail"], ["saas_technology", "SaaS & technology"], ["other", "Other"],
] as const;
const sizes = [["1_10", "1–10 people"], ["11_50", "11–50 people"], ["51_200", "51–200 people"], ["201_500", "201–500 people"], ["501_plus", "501+ people"]] as const;

function WorkspaceOnboarding() {
  const utils = trpc.useUtils();
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState<(typeof industries)[number][0]>("professional_services");
  const [companySize, setCompanySize] = useState<(typeof sizes)[number][0]>("11_50");
  const create = trpc.workspace.create.useMutation({
    onSuccess: async () => { await utils.workspace.me.invalidate(); await utils.workspace.dashboard.invalidate(); setLocation("/app"); },
  });

  return <section className="mx-auto max-w-2xl py-8 sm:py-16"><div className="rounded-[28px] border border-[#dce7e7] bg-white p-6 shadow-[0_22px_60px_rgba(16,40,59,0.08)] sm:p-10"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#0e867e]">Set up your workspace</p><h1 className="mt-3 text-3xl font-extrabold tracking-[-0.055em] text-[#10283b] sm:text-4xl">Give your feedback loop a home.</h1><p className="mt-4 max-w-xl text-[15px] leading-7 text-[#486170]">Start with your organisation details. You can add people, brands, and delivery settings as your programme grows.</p><form className="mt-8 grid gap-5" onSubmit={event => { event.preventDefault(); create.mutate({ name, industry, companySize }); }}><label className="grid gap-2 text-sm font-bold">Organisation name<input value={name} onChange={event => setName(event.target.value)} required minLength={2} placeholder="e.g. Harbour Advisory" className="h-12 rounded-xl border border-[#cfdcdd] bg-[#fbfaf7] px-4 font-normal outline-none transition focus:border-[#0e867e] focus:ring-4 focus:ring-[#0e867e]/10" /></label><div className="grid gap-5 sm:grid-cols-2"><label className="grid gap-2 text-sm font-bold">Industry<select value={industry} onChange={event => setIndustry(event.target.value as typeof industry)} className="h-12 rounded-xl border border-[#cfdcdd] bg-[#fbfaf7] px-4 font-normal outline-none focus:border-[#0e867e]">{industries.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="grid gap-2 text-sm font-bold">Team size<select value={companySize} onChange={event => setCompanySize(event.target.value as typeof companySize)} className="h-12 rounded-xl border border-[#cfdcdd] bg-[#fbfaf7] px-4 font-normal outline-none focus:border-[#0e867e]">{sizes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>{create.error && <p className="text-sm text-[#e96e59]">{create.error.message}</p>}<button disabled={create.isPending} className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0e867e] px-5 text-sm font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-60">{create.isPending ? "Creating workspace…" : "Create workspace"}<ArrowRight className="h-4 w-4" /></button></form></div></section>;
}

export default function AppWorkspace() {
  const workspace = trpc.workspace.me.useQuery();
  const dashboard = trpc.workspace.dashboard.useQuery(undefined, { enabled: Boolean(workspace.data) });
  const [, setLocation] = useLocation();
  if (workspace.isLoading) return <div className="h-64 animate-pulse rounded-[28px] bg-[#e9f0f0]" />;
  if (!workspace.data) return <WorkspaceOnboarding />;
  const metrics = dashboard.data?.metrics;
  const cards = [
    { label: "Published surveys", value: metrics?.publishedTotal ?? 0, hint: "Ready to collect feedback", icon: ClipboardList },
    { label: "Responses", value: metrics?.responseTotal ?? 0, hint: "Signals received", icon: MailCheck },
    { label: "Open actions", value: metrics?.openActionTotal ?? 0, hint: "Follow-up still owned", icon: UsersRound },
  ];
  return <div className="space-y-8"><AppPageHeader eyebrow={workspace.data.organisation.industry.replace(/_/g, " ")} title={`Welcome to ${workspace.data.organisation.name}`}><span className="rounded-full bg-[#e9f0f0] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#486170]">{workspace.data.membership.role}</span></AppPageHeader><section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]"><div className="rounded-[28px] bg-[#10283b] p-6 text-white sm:p-8"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#69d7ce]">Start with a useful signal</p><h2 className="mt-3 max-w-md text-3xl font-extrabold leading-[1.05] tracking-[-0.055em]">Build a survey around a moment your customers already experience.</h2><p className="mt-4 max-w-xl text-[15px] leading-7 text-white/68">Create an NPS, CSAT, CES, or custom survey. Publishing is deliberate—delivery channels are configured separately when you are ready.</p><button onClick={() => setLocation("/app/surveys/new")} className="mt-7 inline-flex h-11 items-center gap-2 rounded-xl bg-[#0e867e] px-4 text-sm font-bold text-white active:scale-[0.98]">Build your first survey<ArrowRight className="h-4 w-4" /></button></div><div className="rounded-[28px] border border-[#dce7e7] bg-white p-6"><ShieldCheck className="h-6 w-6 text-[#0e867e]" /><h2 className="mt-5 text-xl font-extrabold tracking-[-0.04em]">Designed for responsible follow-through.</h2><p className="mt-3 text-sm leading-6 text-[#486170]">Responses, actions, roles, and delivery safeguards start with a clear organisational boundary.</p></div></section><section className="grid gap-4 md:grid-cols-3">{cards.map(card => { const Icon = card.icon; return <div key={card.label} className="rounded-2xl border border-[#dce7e7] bg-white p-5"><Icon className="h-5 w-5 text-[#0e867e]" /><p className="mt-7 font-mono text-3xl font-medium tracking-[-0.06em] text-[#10283b]">{card.value}</p><p className="mt-2 text-sm font-bold">{card.label}</p><p className="mt-1 text-xs text-[#486170]">{card.hint}</p></div>; })}</section><section className="rounded-[28px] border border-[#dce7e7] bg-white"><div className="flex items-center justify-between border-b border-[#dce7e7] px-6 py-5"><div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#0e867e]">Survey library</p><h2 className="mt-1 text-xl font-extrabold tracking-[-0.04em]">Your latest work</h2></div><button onClick={() => setLocation("/app/surveys")} className="text-sm font-bold text-[#0e867e]">Open studio</button></div>{dashboard.data?.recentSurveys?.length ? <div className="divide-y divide-[#e9f0f0]">{dashboard.data.recentSurveys.map(survey => <button onClick={() => setLocation(`/app/surveys/${survey.id}`)} className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-[#fbfaf7]" key={survey.id}><div><p className="font-bold">{survey.name}</p><p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[#486170]">{survey.surveyType} · {survey.status}</p></div><ArrowRight className="h-4 w-4 text-[#0e867e]" /></button>)}</div> : <div className="px-6 py-10 text-center"><p className="text-sm font-bold">No surveys yet</p><p className="mt-2 text-sm text-[#486170]">When you create a survey, its current state will appear here.</p></div>}</section></div>;
}

export function RequireWorkspace({ children }: { children: React.ReactNode }) {
  const workspace = trpc.workspace.me.useQuery();
  if (workspace.isLoading) return <div className="h-64 animate-pulse rounded-[28px] bg-[#e9f0f0]" />;
  if (!workspace.data) return <WorkspaceOnboarding />;
  return <>{children}</>;
}
