import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  BellRing,
  ChevronLeft,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Settings2,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

const logoUrl = "/manus-storage/lumae-logo-mark_b397bb7a.png";

const navigation = [
  { label: "Workspace", path: "/app", icon: LayoutDashboard },
  { label: "Survey studio", path: "/app/surveys", icon: ClipboardList },
  { label: "Response intelligence", path: "/app/responses", icon: BellRing },
  { label: "Action queue", path: "/app/actions", icon: UsersRound },
  { label: "Reporting", path: "/app/reports", icon: BarChart3 },
  { label: "Settings", path: "/app/settings", icon: Settings2 },
];

function BrandLockup({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e9f0f0]">
        <img src={logoUrl} alt="Lumae" className="h-6 w-6 object-contain" />
      </span>
      {!compact && <span className="font-extrabold tracking-[-0.055em] text-[22px] text-[#10283b]">lumae</span>}
    </div>
  );
}

export function AppPageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: React.ReactNode }) {
  return (
    <header className="flex flex-col gap-5 border-b border-[#dce7e7] pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#0e867e]">{eyebrow}</p>}
        <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.055em] text-[#10283b] sm:text-[34px]">{title}</h1>
      </div>
      {children && <div className="flex flex-wrap items-center gap-3">{children}</div>}
    </header>
  );
}

export default function LumaeAppShell({ children }: { children: React.ReactNode }) {
  const { loading, user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  if (loading) {
    return <div className="min-h-screen bg-[#fbfaf7]" aria-busy="true" />;
  }

  if (!user) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#10283b] px-5 py-10 text-white">
        <section className="w-full max-w-md rounded-[28px] border border-white/10 bg-white/[0.06] p-7 shadow-2xl backdrop-blur sm:p-10">
          <BrandLockup />
          <p className="mt-10 font-mono text-[10px] uppercase tracking-[0.2em] text-[#69d7ce]">Lumae workspace</p>
          <h1 className="mt-3 text-4xl font-extrabold leading-[1.04] tracking-[-0.06em]">Customer clarity starts here.</h1>
          <p className="mt-5 text-[15px] leading-7 text-white/70">Sign in to create a workspace, build your first survey, and keep every customer signal connected to the next action.</p>
          <button onClick={startLogin} className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#0e867e] px-5 text-sm font-bold text-white shadow-lg shadow-black/10 transition-transform active:scale-[0.98]">
            Sign in to Lumae
          </button>
        </section>
      </main>
    );
  }

  const activeItem = [...navigation].sort((a, b) => b.path.length - a.path.length).find(item => location === item.path || (item.path !== "/app" && location.startsWith(`${item.path}/`)));
  const initial = user.name?.slice(0, 1).toUpperCase() ?? "L";

  return (
    <div className="min-h-screen bg-[#fbfaf7] text-[#10283b]">
      <aside className={cn("fixed inset-y-0 left-0 z-50 hidden border-r border-[#dce7e7] bg-white px-3 py-4 transition-[width] duration-200 md:flex md:flex-col", collapsed ? "w-[84px]" : "w-[250px]")}>
        <div className="flex h-11 items-center justify-between px-2">
          <BrandLockup compact={collapsed} />
          {!collapsed && <button onClick={() => setCollapsed(true)} className="grid h-8 w-8 place-items-center rounded-lg text-[#486170] hover:bg-[#e9f0f0]" aria-label="Collapse navigation"><ChevronLeft className="h-4 w-4" /></button>}
        </div>
        {collapsed && <button onClick={() => setCollapsed(false)} className="mt-3 grid h-8 w-8 place-items-center self-center rounded-lg text-[#486170] hover:bg-[#e9f0f0]" aria-label="Expand navigation"><Menu className="h-4 w-4" /></button>}
        <nav className="mt-8 space-y-1">
          {navigation.map(item => {
            const Icon = item.icon;
            const isActive = activeItem?.path === item.path;
            return <button key={item.path} onClick={() => setLocation(item.path)} title={collapsed ? item.label : undefined} className={cn("flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition-colors", isActive ? "bg-[#10283b] text-white" : "text-[#486170] hover:bg-[#e9f0f0] hover:text-[#10283b]", collapsed && "justify-center px-0") }><Icon className="h-[18px] w-[18px] shrink-0" />{!collapsed && <span>{item.label}</span>}</button>;
          })}
        </nav>
        <div className="mt-auto rounded-2xl bg-[#e9f0f0] p-3 text-xs text-[#486170] group-data-[collapsed=true]:hidden">
          {!collapsed && <><p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#0e867e]">Your workspace</p><p className="mt-1.5 leading-5">Build the feedback loop one useful step at a time.</p></>}
        </div>
        <div className={cn("mt-4 flex items-center gap-3 rounded-xl px-2 py-2", collapsed && "justify-center px-0")}>
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#10283b] text-xs font-bold text-white">{initial}</span>
          {!collapsed && <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{user.name || "Lumae member"}</p><button onClick={logout} className="mt-0.5 inline-flex items-center gap-1 text-xs text-[#486170] hover:text-[#e96e59]"><LogOut className="h-3 w-3" />Sign out</button></div>}
        </div>
      </aside>

      <header className="sticky top-0 z-40 flex h-[68px] items-center justify-between border-b border-[#dce7e7] bg-[#fbfaf7]/95 px-5 backdrop-blur md:ml-[250px] md:px-8">
        <button className="grid h-10 w-10 place-items-center rounded-xl hover:bg-[#e9f0f0] md:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu className="h-5 w-5" /></button>
        <div className="hidden items-center gap-2 text-sm text-[#486170] md:flex"><Sparkles className="h-4 w-4 text-[#0e867e]" /><span>Collect. Understand. Recover. Improve.</span></div>
        <button onClick={() => setLocation("/app/surveys/new")} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#0e867e] px-4 text-sm font-bold text-white shadow-sm transition-transform active:scale-[0.98]"><Plus className="h-4 w-4" />New survey</button>
      </header>

      {mobileOpen && <div className="fixed inset-0 z-[60] bg-[#10283b]/40 md:hidden" onClick={() => setMobileOpen(false)}><aside className="h-full w-[280px] bg-white p-4 shadow-2xl" onClick={event => event.stopPropagation()}><div className="flex items-center justify-between"><BrandLockup /><button className="grid h-9 w-9 place-items-center rounded-lg hover:bg-[#e9f0f0]" onClick={() => setMobileOpen(false)}><ChevronLeft className="h-4 w-4" /></button></div><nav className="mt-8 space-y-1">{navigation.map(item => { const Icon = item.icon; const isActive = activeItem?.path === item.path; return <button key={item.path} onClick={() => { setLocation(item.path); setMobileOpen(false); }} className={cn("flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold", isActive ? "bg-[#10283b] text-white" : "text-[#486170]")}><Icon className="h-[18px] w-[18px]" />{item.label}</button>; })}</nav></aside></div>}

      <main className={cn("px-5 py-7 md:ml-[250px] md:px-8 md:py-9", collapsed && "md:ml-[84px]")}>
        <div className="mx-auto max-w-[1280px]">{children}</div>
      </main>
    </div>
  );
}
