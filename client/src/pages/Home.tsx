import { FormEvent, useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  BellRing,
  Check,
  ChevronRight,
  CircleCheck,
  Filter,
  Layers3,
  LineChart,
  Mail,
  Menu,
  MessageSquareText,
  PanelTop,
  Send,
  ShieldCheck,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { calculateRoi, type RoiInputs } from "@/lib/roi";

const logoUrl = "/manus-storage/lumae-logo-mark_b397bb7a.png";

const defaultRoiInputs: RoiInputs = {
  monthlyTouchpoints: 1000,
  annualCustomerValue: 1200,
  responseRatePercent: 20,
  actionableRatePercent: 15,
  recoveryRatePercent: 25,
  annualPlatformCost: 2628,
};

const aud = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  maximumFractionDigits: 0,
});

const navItems = [
  ["Why Lumae", "#why-lumae"],
  ["Features", "/features"],
  ["Pricing", "#pricing"],
  ["Research", "#research"],
  ["Brand", "#brand"],
] as const;

const competitors = [
  { name: "Delighted", url: "https://delighted.com/", years: "2014 launch · 12 yrs", monthly: "Unavailable", annual: "Unavailable", note: "No longer available; redirected to Qualtrics." },
  { name: "SurveyMonkey CX", url: "https://www.surveymonkey.com/product/enterprise/", years: "1999 · 27 yrs", monthly: "SGD 49/user*", annual: "SGD 588/user*", note: "3-user minimum; annual billing. CX is sales-led." },
  { name: "Medallia", url: "https://www.medallia.com/", years: "2001 · 25 yrs", monthly: "Not disclosed", annual: "Custom annual tiers", note: "Experience Data Record model; unlimited users." },
  { name: "Qualtrics", url: "https://www.qualtrics.com/", years: "2002 · 24 yrs", monthly: "US$420", annual: "US$5,040", note: "Strategic Research self-serve; broader CX is quote-led." },
  { name: "AskNicely", url: "https://www.asknicely.com/", years: "2014 · 12 yrs", monthly: "Not published", annual: "Annual contract", note: "Response-volume based; pricing is sales-led." },
];

const marketSegments = [
  { code: "01", title: "Financial services", metric: "111,373", label: "AFCA complaints in 2025", copy: "Feedback and complaint data can become a single service-recovery view for customer, conduct-risk, and digital teams.", source: "https://www.afca.org.au/news/media-releases/afca-receives-record-number-of-complaints-in-2025-calendar-year" },
  { code: "02", title: "Healthcare", metric: "26.6%", label: "delayed or missed a needed GP visit", copy: "Measure care journeys after appointments, discharge, telehealth, or a complaint with a governance-ready feedback loop.", source: "https://www.abs.gov.au/statistics/health/health-services/patient-experiences/latest-release" },
  { code: "03", title: "Professional services", metric: "34%", label: "use ICT to improve customer responsiveness", copy: "Replace ad-hoc client check-ins with concise, privacy-conscious signals at meaningful relationship moments.", source: "https://www.abs.gov.au/statistics/industry/technology-and-innovation/characteristics-australian-business/latest-release" },
  { code: "04", title: "Retail", metric: "11.4%", label: "of Australian retail sales were online in 2024", copy: "Connect store, delivery, returns, support, and digital feedback before an omnichannel journey becomes fragmented.", source: "https://www.abs.gov.au/articles/retail-trade-journey-through-75-years-retail-statistics" },
  { code: "05", title: "SaaS & technology", metric: "38%", label: "AI use in information, media & telecom", copy: "Bring support CSAT, onboarding feedback, renewal NPS, and product insight into a single accountable workflow.", source: "https://www.abs.gov.au/statistics/industry/technology-and-innovation/characteristics-australian-business/latest-release" },
];

const capabilities = [
  { icon: MessageSquareText, title: "Survey studio", copy: "Build NPS, CSAT, CES, and custom feedback programmes with calm, mobile-first templates." },
  { icon: Send, title: "Reach customers", copy: "Automate email, SMS, in-app, and QR delivery while protecting your customers from survey fatigue." },
  { icon: LineChart, title: "See the signal", copy: "Watch response volume, score movement, themes, and follow-up work in a real-time dashboard." },
  { icon: Filter, title: "Find what matters", copy: "Filter feedback by account, journey, location, product, service team, and customer segment." },
  { icon: Layers3, title: "Keep context connected", copy: "Bring customer context in through CRM and helpdesk integrations, with an API path for your stack." },
  { icon: UsersRound, title: "Work with intent", copy: "Give people appropriate access, assign recovery work, and keep the customer’s next step visible." },
];

const blueprint = [
  ["01", "Collect", "Survey library, builder, template gallery, preview, distribution, and frequency safeguards."],
  ["02", "Understand", "Live response feed, score trend, qualitative themes, segments, and shared reporting views."],
  ["03", "Recover", "Detractor alerts, ownership, escalation, resolution notes, and service-recovery workflow."],
  ["04", "Improve", "Journey analysis, stakeholder exports, role-aware reporting, integrations, and actions."],
];

const trustPrinciples = [
  { icon: ShieldCheck, title: "Privacy-aware", copy: "Clear consent, retention, role, and access-control requirements are designed into the product blueprint." },
  { icon: Sparkles, title: "Action-led", copy: "A score is only the beginning; the platform keeps the relevant follow-up work visible." },
  { icon: PanelTop, title: "Service-ready", copy: "Templates and journeys are organised around real service moments, not surveys in isolation." },
];

const industryOptions = [
  ["financial_services", "Financial services"],
  ["healthcare", "Healthcare"],
  ["professional_services", "Professional services"],
  ["retail", "Retail"],
  ["saas_technology", "SaaS & technology"],
  ["other", "Other"],
] as const;

const companySizeOptions = [
  ["1_10", "1–10 people"],
  ["11_50", "11–50 people"],
  ["51_200", "51–200 people"],
  ["201_500", "201–500 people"],
  ["501_plus", "501+ people"],
] as const;

type IndustryValue = (typeof industryOptions)[number][0];
type CompanySizeValue = (typeof companySizeOptions)[number][0];

function SurveyBuilderPreview() {
  const [question, setQuestion] = useState("How was your support experience today?");
  const [channel, setChannel] = useState("Email");
  const [score, setScore] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  return (
    <section id="survey-preview" className="mt-20 overflow-hidden rounded-[30px] border border-[#10283B]/12 bg-[#10283B] p-4 text-white shadow-[0_24px_54px_rgba(16,40,59,0.14)] sm:mt-24 sm:p-6" aria-labelledby="builder-heading">
      <div className="grid gap-7 lg:grid-cols-[0.86fr_1.14fr] lg:items-stretch">
        <div className="rounded-[23px] bg-white p-5 text-[#10283B] sm:p-7">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#0E867E]">Interactive preview</p>
          <h3 id="builder-heading" className="mt-4 text-3xl font-extrabold leading-[1.02] tracking-[-0.06em]">Build a customer moment in under a minute.</h3>
          <p className="mt-4 text-sm leading-6 text-[#486170]">Try the controls. This is a marketing preview of the future survey studio, not a live survey.</p>
          <label className="mt-7 block text-xs font-bold">Question
            <textarea value={question} onChange={event => { setQuestion(event.target.value); setSaved(false); }} maxLength={140} className="mt-2 min-h-[90px] w-full resize-none rounded-xl border border-[#10283B]/15 bg-[#FBFAF7] px-3 py-3 text-sm font-medium outline-none transition-colors focus:border-[#0E867E]" />
          </label>
          <label className="mt-4 block text-xs font-bold">Delivery channel
            <select value={channel} onChange={event => { setChannel(event.target.value); setSaved(false); }} className="mt-2 w-full rounded-xl border border-[#10283B]/15 bg-[#FBFAF7] px-3 py-3 text-sm font-semibold outline-none focus:border-[#0E867E]">
              <option>Email</option><option>SMS</option><option>In-app</option>
            </select>
          </label>
          <button onClick={() => setSaved(true)} className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#0E867E] px-5 py-3 text-sm font-extrabold text-white transition-all hover:-translate-y-0.5 hover:bg-[#0a746d]">{saved ? "Preview saved" : "Save preview"}<Check size={16} /></button>
          {saved && <p className="mt-3 text-xs font-semibold text-[#0E867E]" role="status">This survey is ready to send to a test audience.</p>}
        </div>
        <div className="relative overflow-hidden rounded-[23px] border border-white/15 bg-[#E9F0F0] p-5 sm:p-8">
          <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full border-[22px] border-[#0E867E]/15" />
          <div className="relative mx-auto max-w-md rounded-[22px] border border-[#10283B]/12 bg-white p-5 shadow-[0_16px_34px_rgba(16,40,59,0.12)] sm:p-7">
            <div className="flex items-center justify-between"><BrandLockup /><span className="rounded-full bg-[#e4f4f1] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[#0E867E]">{channel}</span></div>
            <div className="mt-9"><p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#486170]">Support follow-up</p><h4 className="mt-3 text-pretty text-2xl font-extrabold leading-tight tracking-[-0.045em] text-[#10283B]">{question || "Add your feedback question"}</h4><p className="mt-3 text-sm leading-6 text-[#486170]">Your response helps us improve the experience for everyone.</p></div>
            <div className="mt-8 grid grid-cols-5 gap-2">{[1, 2, 3, 4, 5].map(value => <button key={value} onClick={() => setScore(value)} className={`grid aspect-square place-items-center rounded-xl border text-lg font-extrabold transition-all ${score === value ? "border-[#0E867E] bg-[#0E867E] text-white shadow-[0_8px_16px_rgba(14,134,126,0.2)]" : "border-[#10283B]/12 bg-[#FBFAF7] text-[#10283B] hover:border-[#0E867E]"}`} aria-label={`Rate ${value} out of 5`}>{value}</button>)}</div>
            <div className="mt-3 flex justify-between font-mono text-[9px] uppercase tracking-[0.1em] text-[#486170]"><span>Not satisfied</span><span>Very satisfied</span></div>
            <button className="mt-7 w-full rounded-xl bg-[#10283B] py-3 text-sm font-extrabold text-white">Continue</button>
          </div>
          <div className="relative mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#10283B]/10 bg-white/70 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[#486170]"><span>Question type · CSAT scale</span><span className="text-[#0E867E]">Preview active</span></div>
        </div>
      </div>
    </section>
  );
}

function RoiCalculator() {
  const [inputs, setInputs] = useState<RoiInputs>(defaultRoiInputs);
  const result = calculateRoi(inputs);
  const updateInput = (field: keyof RoiInputs, value: string) => {
    const parsed = Number(value);
    setInputs(previous => ({ ...previous, [field]: Number.isFinite(parsed) ? parsed : 0 }));
  };

  const numberField = (
    label: string,
    field: keyof RoiInputs,
    suffix: string,
    min: number,
    step: number,
  ) => (
    <label className="block rounded-xl border border-[#10283B]/10 bg-white px-3 py-3 text-xs font-bold text-[#10283B]">
      <span className="block leading-4 text-[#486170]">{label}</span>
      <span className="mt-2 flex items-center gap-1">
        <input
          type="number"
          min={min}
          step={step}
          value={inputs[field]}
          onChange={event => updateInput(field, event.target.value)}
          className="min-w-0 flex-1 bg-transparent font-mono text-base font-semibold outline-none focus:text-[#0E867E]"
          aria-label={label}
        />
        <span className="font-mono text-[10px] text-[#486170]">{suffix}</span>
      </span>
    </label>
  );

  return (
    <section id="roi-calculator" className="border-y border-[#10283B]/8 bg-white py-20 sm:py-28" aria-labelledby="roi-heading">
      <div className="mx-auto grid max-w-[1280px] gap-10 px-5 sm:px-8 lg:grid-cols-[0.86fr_1.14fr] lg:items-start lg:gap-16">
        <div>
          <TinyTag>Interactive ROI scenario</TinyTag>
          <h2 id="roi-heading" className="mt-6 text-balance text-4xl font-extrabold leading-[1.02] tracking-[-0.065em] sm:text-5xl">Make the value conversation concrete.</h2>
          <p className="mt-6 max-w-lg text-lg leading-8 text-[#486170]">Use your own assumptions to explore the potential annual customer value of responding to feedback earlier. Every field is editable.</p>
          <div className="mt-7 rounded-2xl border border-[#0E867E]/20 bg-[#e4f4f1] p-5 text-sm leading-6 text-[#486170]">
            <p className="font-bold text-[#10283B]">How this estimate works</p>
            <p className="mt-2">Monthly customer touchpoints × response rate × actionable share × recovery rate × annual customer value × 12.</p>
          </div>
        </div>

        <div className="rounded-[30px] border border-[#10283B]/12 bg-[#FBFAF7] p-4 shadow-[0_20px_45px_rgba(16,40,59,0.08)] sm:p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {numberField("Customer touchpoints", "monthlyTouchpoints", "/ month", 0, 50)}
            {numberField("Average customer value", "annualCustomerValue", "A$ / year", 0, 100)}
            {numberField("Expected response rate", "responseRatePercent", "%", 0, 1)}
            {numberField("Feedback that needs action", "actionableRatePercent", "%", 0, 1)}
            {numberField("Issues you could recover", "recoveryRatePercent", "%", 0, 1)}
            {numberField("Annual platform investment", "annualPlatformCost", "A$", 0, 100)}
          </div>

          <div className="mt-5 rounded-2xl bg-[#10283B] p-5 text-white sm:p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/55">Illustrative annual customer value retained</p>
            <p className="mt-3 text-4xl font-extrabold tracking-[-0.07em] sm:text-5xl">{aud.format(result.annualRetainedValue)}</p>
            <div className="mt-6 grid gap-3 border-t border-white/12 pt-5 sm:grid-cols-3">
              <div><p className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/55">Actionable responses</p><p className="mt-2 text-xl font-extrabold">{Math.round(result.actionableResponses).toLocaleString("en-AU")}</p></div>
              <div><p className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/55">Potential recoveries</p><p className="mt-2 text-xl font-extrabold">{Math.round(result.recoveredOutcomes).toLocaleString("en-AU")}</p></div>
              <div><p className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/55">Value multiple</p><p className="mt-2 text-xl font-extrabold">{result.valueMultiple > 0 ? `${result.valueMultiple.toFixed(1)}×` : "—"}</p></div>
            </div>
            <p className="mt-6 border-t border-white/12 pt-4 text-xs leading-5 text-white/62">Net of the editable annual platform investment: <span className="font-bold text-white">{aud.format(result.netIllustrativeValue)}</span>. This is an illustrative scenario, not a forecast or a guarantee of outcomes.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

const plans = [
  { name: "Signal", audience: "For small teams establishing a feedback cadence.", monthly: 89, annual: 79, annualTotal: "A$948", response: "1,000 responses/month", seats: "3 full seats", accent: false, items: ["NPS, CSAT, CES & custom surveys", "Email distribution", "Live dashboard & CSV exports", "Basic segments & filters"] },
  { name: "Momentum", audience: "For service teams turning feedback into an operating rhythm.", monthly: 249, annual: 219, annualTotal: "A$2,628", response: "5,000 responses/month", seats: "10 full seats", accent: true, items: ["Everything in Signal", "SMS & in-app distribution", "Automations & recovery alerts", "CRM/helpdesk integrations", "Scheduled reports"] },
  { name: "Clarity", audience: "For medium businesses across locations, brands, and journeys.", monthly: 549, annual: 479, annualTotal: "A$5,748", response: "20,000 responses/month", seats: "25 full seats", accent: false, items: ["Everything in Momentum", "White-label & multi-brand surveys", "Advanced roles & API access", "Priority onboarding & reporting"] },
];

function BrandLockup({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex items-center gap-2.5" aria-label="Lumae">
      <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-xl bg-white shadow-[0_2px_12px_rgba(16,40,59,0.12)]">
        <img src={logoUrl} alt="" className="h-7 w-7 object-contain" />
      </span>
      <span className={`text-[1.35rem] font-extrabold tracking-[-0.075em] ${dark ? "text-white" : "text-[#10283B]"}`}>lumae</span>
    </div>
  );
}

function TinyTag({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center gap-1.5 rounded-full border border-[#10283B]/10 bg-white/70 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#486170]">{children}</span>;
}

function ScrollNavigation({ visible }: { visible: boolean }) {
  return <div className="scroll-nav fixed left-0 right-0 top-3 z-[70] px-3 sm:px-5" data-visible={visible} aria-hidden={!visible}><div className="mx-auto flex h-14 max-w-[970px] items-center justify-between rounded-2xl border border-[#10283B]/10 bg-[#FBFAF7]/95 px-3 shadow-[0_14px_34px_rgba(16,40,59,0.14)] backdrop-blur-xl sm:px-4"><a href="#top" aria-label="Lumae home"><BrandLockup /></a><nav className="hidden items-center gap-5 md:flex" aria-label="Quick navigation"><a href="#platform" className="text-xs font-bold text-[#486170] hover:text-[#10283B]">Platform</a><a href="#pricing" className="text-xs font-bold text-[#486170] hover:text-[#10283B]">Pricing</a><a href="#research" className="text-xs font-bold text-[#486170] hover:text-[#10283B]">Research</a></nav><a href="#waitlist" className="rounded-full bg-[#0E867E] px-4 py-2.5 text-xs font-extrabold text-white shadow-sm transition-colors hover:bg-[#0a746d]">Early access</a></div></div>;
}

export default function Home() {
  const [annual, setAnnual] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showScrollNav, setShowScrollNav] = useState(false);
  const [form, setForm] = useState({ email: "", name: "", company: "", industry: "" as "" | IndustryValue, companySize: "" as "" | CompanySizeValue });
  const [formMessage, setFormMessage] = useState("");
  const joinWaitlist = trpc.waitlist.join.useMutation({
    onSuccess: data => {
      setFormMessage(data.status === "joined" ? "You’re on the early-access list. We’ll be in touch." : "You’re already on the early-access list.");
      if (data.status === "joined") setForm({ email: "", name: "", company: "", industry: "", companySize: "" });
    },
    onError: () => setFormMessage("Please enter a valid email address and try again."),
  });

  useEffect(() => {
    const updateScrollNavigation = () => setShowScrollNav(window.scrollY > 140);
    updateScrollNavigation();
    window.addEventListener("scroll", updateScrollNavigation, { passive: true });
    return () => window.removeEventListener("scroll", updateScrollNavigation);
  }, []);

  function submitWaitlist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormMessage("");
    if (!form.industry || !form.companySize) {
      setFormMessage("Please select your industry and company size.");
      return;
    }
    joinWaitlist.mutate({ ...form, industry: form.industry, companySize: form.companySize });
  }

  return (
    <main className="lumae-landing min-h-screen overflow-x-hidden bg-[#FBFAF7] text-[#10283B]">
      <ScrollNavigation visible={showScrollNav} />
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-[#10283B] focus:px-4 focus:py-3 focus:text-white">Skip to content</a>

      <header className="relative z-50 border-b border-[#10283B]/8 bg-[#FBFAF7]/92 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-[1280px] items-center justify-between px-5 sm:px-8">
          <a href="#top" aria-label="Lumae home"><BrandLockup /></a>
          <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary navigation">
            {navItems.map(([label, href]) => <a key={href} href={href} className="text-sm font-semibold text-[#486170] transition-colors hover:text-[#10283B]">{label}</a>)}
          </nav>
          <div className="hidden items-center gap-2 sm:flex">
            <a href="#waitlist" className="rounded-full px-4 py-2.5 text-sm font-bold text-[#10283B] transition-colors hover:bg-[#E9F0F0]">Book a Demo</a>
            <a href="#waitlist" className="rounded-full bg-[#10283B] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#0E867E]">Start Free Trial</a>
          </div>
          <button className="grid h-10 w-10 place-items-center rounded-lg text-[#10283B] sm:hidden" onClick={() => setMenuOpen(open => !open)} aria-expanded={menuOpen} aria-label="Open navigation">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {menuOpen && <div className="border-t border-[#10283B]/8 bg-[#FBFAF7] px-5 py-4 sm:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
            {navItems.map(([label, href]) => <a key={href} href={href} onClick={() => setMenuOpen(false)} className="rounded-xl px-3 py-3 font-semibold text-[#10283B] hover:bg-[#E9F0F0]">{label}</a>)}
            <a href="#waitlist" onClick={() => setMenuOpen(false)} className="mt-2 rounded-xl bg-[#10283B] px-3 py-3 text-center font-bold text-white">Start Free Trial</a>
          </nav>
        </div>}
      </header>

      <div id="top" />
      <section id="main-content" className="grain relative border-b border-[#10283B]/8" aria-labelledby="hero-heading">
        <div className="mx-auto grid max-w-[1280px] gap-14 px-5 pb-16 pt-16 sm:px-8 sm:pb-24 sm:pt-24 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-10 lg:pb-28 lg:pt-28">
          <div className="relative z-10 max-w-2xl">
            <div className="hero-intro hero-intro-1"><TinyTag><span className="h-1.5 w-1.5 rounded-full bg-[#0E867E]" /> ANZ customer intelligence</TinyTag></div>
            <h1 id="hero-heading" className="hero-intro hero-intro-2 mt-7 max-w-[710px] text-balance text-[3.1rem] font-extrabold leading-[0.98] tracking-[-0.075em] text-[#10283B] sm:text-[4.45rem] lg:text-[5.1rem]">Customer clarity,<br /><span className="text-[#0E867E]">in action.</span></h1>
            <p className="hero-intro hero-intro-3 mt-7 max-w-xl text-pretty text-lg leading-8 text-[#486170] sm:text-xl">Lumae helps ANZ businesses turn NPS and CSAT feedback into focused conversations, accountable recovery, and better customer decisions.</p>
            <div className="hero-intro hero-intro-4 mt-9 flex flex-col gap-3 sm:flex-row">
              <a href="#waitlist" className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#0E867E] px-6 py-4 text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(14,134,126,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[#0a746d]">Start Free Trial <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" /></a>
              <a href="#waitlist" className="inline-flex items-center justify-center gap-2 rounded-full border border-[#10283B]/15 bg-white px-6 py-4 text-sm font-extrabold text-[#10283B] transition-colors hover:border-[#10283B]/30 hover:bg-[#E9F0F0]">Book a Demo <ArrowDownRight size={17} /></a>
            </div>
            <div className="hero-intro hero-intro-5 mt-10 flex flex-wrap gap-x-5 gap-y-3 text-sm font-medium text-[#486170]">
              <span className="inline-flex items-center gap-2"><CircleCheck size={17} className="text-[#0E867E]" />Built for service-led teams</span>
              <span className="inline-flex items-center gap-2"><CircleCheck size={17} className="text-[#0E867E]" />Local currency, global ambition</span>
            </div>
          </div>

          <div className="hero-visual hero-intro hero-intro-3 relative mx-auto w-full max-w-[580px] pb-16 lg:mr-0">
            <div className="absolute inset-8 rounded-[42px] border border-dashed border-[#0E867E]/30" />
            <div className="hero-orbit absolute left-[8%] top-[12%] h-[78%] w-[78%] rounded-full border border-[#0E867E]/15" />
            <div className="relative overflow-hidden rounded-[30px] border border-white/80 bg-[#10283B] p-4 shadow-[0_28px_65px_rgba(16,40,59,0.22)] sm:p-5">
              <div className="rounded-[20px] bg-[#FBFAF7] p-5 sm:p-6">
                <div className="flex items-start justify-between border-b border-[#10283B]/10 pb-5">
                  <div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#486170]">Customer pulse</p><h2 className="mt-1 text-xl font-extrabold tracking-[-0.04em]">This week’s signal</h2></div>
                  <span className="rounded-full bg-[#dff4ef] px-3 py-1.5 font-mono text-[10px] font-medium text-[#0E867E]">LIVE</span>
                </div>
                <div className="mt-6 grid grid-cols-[1fr_auto] gap-5">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.12em] text-[#486170]">Relationship NPS</p>
                    <div className="mt-1 flex items-end gap-3"><span className="text-5xl font-extrabold tracking-[-0.08em] text-[#10283B]">+42</span><span className="mb-1 rounded-full bg-[#dff4ef] px-2 py-1 font-mono text-[10px] text-[#0E867E]">+6.4</span></div>
                  </div>
                  <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#E9F0F0]"><LineChart size={28} className="text-[#0E867E]" /></div>
                </div>
                <div className="mt-7 flex h-28 items-end gap-2" aria-hidden="true">
                  {[32, 40, 36, 55, 46, 72, 58, 82, 68, 90, 79, 94].map((height, index) => <span key={index} className={`flex-1 rounded-t-sm ${index > 8 ? "bg-[#0E867E]" : "bg-[#b8cfcc]"}`} style={{ height: `${height}%` }} />)}
                </div>
                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[#10283B]/8 bg-white p-4"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#486170]">At risk</p><p className="mt-1 text-2xl font-extrabold tracking-[-0.06em]">14 <span className="text-sm font-semibold text-[#E96E59]">need a reply</span></p></div>
                  <div className="rounded-2xl border border-[#10283B]/8 bg-white p-4"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#486170]">Response rate</p><p className="mt-1 text-2xl font-extrabold tracking-[-0.06em]">28.6<span className="text-sm">%</span></p></div>
                </div>
              </div>
            </div>
            <div className="float-soft absolute bottom-0 left-3 rounded-2xl border border-[#10283B]/8 bg-white px-3 py-2.5 shadow-[0_16px_32px_rgba(16,40,59,0.13)] sm:left-5 sm:px-4 sm:py-3"><div className="flex items-center gap-2 sm:gap-3"><span className="grid h-7 w-7 place-items-center rounded-lg bg-[#fbe0da] sm:h-9 sm:w-9 sm:rounded-xl"><BellRing size={15} className="text-[#E96E59] sm:hidden" /><BellRing size={17} className="hidden text-[#E96E59] sm:block" /></span><div><p className="text-[11px] font-extrabold sm:text-xs"><span className="sm:hidden">Action needed</span><span className="hidden sm:inline">A signal needs care</span></p><p className="mt-0.5 hidden text-[11px] text-[#486170] sm:block">Owner assigned · 2 min ago</p></div></div></div>
            <div className="float-delayed absolute right-2 top-8 rounded-xl border border-white/30 bg-[#0E867E] px-2.5 py-2 text-white shadow-[0_16px_32px_rgba(14,134,126,0.25)] sm:right-5 sm:top-12 sm:rounded-2xl sm:px-4 sm:py-3"><p className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/70 sm:text-[10px]">CSAT</p><p className="mt-0.5 text-xl font-extrabold tracking-[-0.06em] sm:mt-1 sm:text-2xl">94.2%</p></div>
          </div>
        </div>
      </section>

      <section id="why-lumae" className="border-b border-[#10283B]/8 bg-white py-9" aria-label="Market evidence">
        <div className="mx-auto grid max-w-[1280px] gap-8 px-5 sm:grid-cols-3 sm:px-8">
          <a href="https://www.afca.org.au/news/media-releases/afca-receives-record-number-of-complaints-in-2025-calendar-year" target="_blank" rel="noreferrer" className="group flex items-center gap-4"><span className="font-mono text-2xl font-medium tracking-[-0.08em] text-[#0E867E]">111,373</span><span className="border-l border-[#10283B]/12 pl-4 text-xs leading-5 text-[#486170] group-hover:text-[#10283B]">Financial-services complaints received by AFCA in 2025</span></a>
          <a href="https://www.abs.gov.au/statistics/health/health-services/patient-experiences/latest-release" target="_blank" rel="noreferrer" className="group flex items-center gap-4"><span className="font-mono text-2xl font-medium tracking-[-0.08em] text-[#0E867E]">26.6%</span><span className="border-l border-[#10283B]/12 pl-4 text-xs leading-5 text-[#486170] group-hover:text-[#10283B]">Delayed or missed a needed GP visit in Australia, 2024–25</span></a>
          <a href="https://www.abs.gov.au/articles/retail-trade-journey-through-75-years-retail-statistics" target="_blank" rel="noreferrer" className="group flex items-center gap-4"><span className="font-mono text-2xl font-medium tracking-[-0.08em] text-[#0E867E]">11.4%</span><span className="border-l border-[#10283B]/12 pl-4 text-xs leading-5 text-[#486170] group-hover:text-[#10283B]">Australia’s retail sales that were online in 2024</span></a>
        </div>
      </section>

      <section id="research" className="mx-auto max-w-[1280px] px-5 py-20 sm:px-8 sm:py-28" aria-labelledby="market-heading">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20"><div><TinyTag>Research-led focus</TinyTag><h2 id="market-heading" className="mt-6 text-balance text-4xl font-extrabold leading-[1.02] tracking-[-0.065em] sm:text-5xl">The opportunity is closer than a score.</h2><p className="mt-6 max-w-md text-lg leading-8 text-[#486170]">The strongest ANZ use cases combine high-stakes service, recurring customer journeys, and a clear owner who can act on feedback.</p><div className="mt-8 rounded-2xl border border-[#0E867E]/20 bg-[#e4f4f1] p-5"><p className="text-sm font-bold">Start where action is already a priority.</p><p className="mt-2 text-sm leading-6 text-[#486170]">This is an evidence-led launch hypothesis, not a market-size claim. Validate it with buyer interviews and paid pilots.</p></div></div>
          <div className="divide-y divide-[#10283B]/10 border-y border-[#10283B]/10">
            {marketSegments.map(item => <a key={item.code} href={item.source} target="_blank" rel="noreferrer" className="group grid gap-4 py-6 sm:grid-cols-[56px_1fr_auto] sm:items-start"><span className="font-mono text-xs text-[#0E867E]">{item.code}</span><div><h3 className="text-lg font-extrabold tracking-[-0.035em]">{item.title}</h3><p className="mt-2 max-w-xl text-sm leading-6 text-[#486170]">{item.copy}</p></div><div className="flex items-center gap-3 sm:justify-end"><div className="text-left sm:text-right"><p className="font-mono text-2xl font-medium tracking-[-0.07em] text-[#10283B]">{item.metric}</p><p className="max-w-[155px] text-[10px] leading-4 text-[#486170] sm:ml-auto">{item.label}</p></div><ChevronRight size={18} className="text-[#0E867E] transition-transform group-hover:translate-x-1" /></div></a>)}
          </div>
        </div>
      </section>

      <section className="bg-[#10283B] py-20 text-white sm:py-28" aria-labelledby="competitor-heading">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8"><div className="flex flex-col justify-between gap-8 md:flex-row md:items-end"><div><TinyTag><span className="h-1.5 w-1.5 rounded-full bg-[#0E867E]" />Market context</TinyTag><h2 id="competitor-heading" className="mt-6 max-w-2xl text-balance text-4xl font-extrabold leading-[1.02] tracking-[-0.065em] sm:text-5xl">A mature category with an opening for clarity.</h2></div><p className="max-w-sm text-sm leading-6 text-white/65">Public pricing varies widely across the named platforms. Where a provider sells by quote or does not publish a dollar amount, we say so.</p></div>
          <div className="mt-12 overflow-x-auto rounded-2xl border border-white/12"><table className="min-w-[860px] w-full text-left"><thead className="bg-white/6 font-mono text-[10px] uppercase tracking-[0.13em] text-white/55"><tr><th className="px-5 py-4">Platform</th><th className="px-5 py-4">Years active</th><th className="px-5 py-4">Public monthly</th><th className="px-5 py-4">Public annual</th><th className="px-5 py-4">Context</th></tr></thead><tbody className="divide-y divide-white/10">{competitors.map(row => <tr key={row.name} className="transition-colors hover:bg-white/[0.035]"><td className="px-5 py-5"><a href={row.url} target="_blank" rel="noreferrer" className="font-bold underline decoration-white/25 underline-offset-4 hover:decoration-[#0E867E]">{row.name}</a></td><td className="px-5 py-5 text-sm text-white/70">{row.years}</td><td className="px-5 py-5 font-mono text-sm text-white">{row.monthly}</td><td className="px-5 py-5 font-mono text-sm text-white">{row.annual}</td><td className="px-5 py-5 text-sm text-white/62">{row.note}</td></tr>)}</tbody></table></div>
          <p className="mt-4 text-xs leading-5 text-white/48">* SurveyMonkey pricing was displayed in SGD on its location-served public pricing page on 14 August 2026; the annual equivalent is calculated from the published SGD 49 per-user monthly rate and annual billing. No currency conversion has been applied. Sources: official product and pricing pages linked above.</p>
        </div>
      </section>

      <section id="platform" className="mx-auto max-w-[1280px] px-5 py-20 sm:px-8 sm:py-28" aria-labelledby="features-heading">
        <div className="max-w-2xl"><TinyTag>One system, clear next steps</TinyTag><h2 id="features-heading" className="mt-6 text-balance text-4xl font-extrabold leading-[1.02] tracking-[-0.065em] sm:text-5xl">Every feedback programme needs a better follow-through.</h2><p className="mt-6 text-lg leading-8 text-[#486170]">Lumae is shaped around the practical work behind a score: capture the context, understand the trend, send the right signal to the right person, and show what changed.</p></div>
        <div className="mt-14 grid gap-x-8 gap-y-0 md:grid-cols-2 lg:grid-cols-3">{capabilities.map(({ icon: Icon, title, copy }, index) => <article key={title} className="feature-card rounded-2xl border-t border-[#10283B]/12 p-5 py-7"><span className="feature-icon grid h-11 w-11 place-items-center rounded-xl bg-[#E9F0F0] text-[#0E867E] transition-colors duration-150"><Icon size={21} /></span><p className="feature-eyebrow mt-6 font-mono text-[10px] uppercase tracking-[0.15em] text-[#486170]">0{index + 1}</p><h3 className="feature-title mt-2 text-xl font-extrabold tracking-[-0.045em] transition-colors duration-150">{title}</h3><p className="mt-3 max-w-sm text-sm leading-6 text-[#486170]">{copy}</p></article>)}</div>
      </section>

      <section className="mx-auto max-w-[1280px] px-5 pb-20 sm:px-8 sm:pb-28">
        <SurveyBuilderPreview />
      </section>

      <RoiCalculator />

      <section className="border-y border-[#10283B]/8 bg-[#E9F0F0] py-20 sm:py-28" aria-labelledby="blueprint-heading">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8"><div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]"><div><TinyTag>Future platform structure</TinyTag><h2 id="blueprint-heading" className="mt-6 text-balance text-4xl font-extrabold leading-[1.02] tracking-[-0.065em] sm:text-5xl">A platform built around the customer loop.</h2><p className="mt-6 max-w-md text-lg leading-8 text-[#486170]">The future app has four clear spaces: collect the right feedback, understand it in context, recover with ownership, and improve the journey.</p></div><div className="grid gap-4 sm:grid-cols-2">{blueprint.map(([number, title, copy]) => <article key={number} className="rounded-3xl bg-white p-6 shadow-[0_10px_30px_rgba(16,40,59,0.06)]"><p className="font-mono text-xs text-[#0E867E]">{number}</p><h3 className="mt-8 text-2xl font-extrabold tracking-[-0.055em]">{title}</h3><p className="mt-3 text-sm leading-6 text-[#486170]">{copy}</p><div className="mt-8 h-px w-full bg-[#10283B]/10" /><span className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#10283B]">Explore the structure <ArrowRight size={14} /></span></article>)}</div></div></div>
      </section>

      <section id="pricing" className="mx-auto max-w-[1280px] px-5 py-20 sm:px-8 sm:py-28" aria-labelledby="pricing-heading">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end"><div className="max-w-2xl"><TinyTag>Transparent by design</TinyTag><h2 id="pricing-heading" className="mt-6 text-balance text-4xl font-extrabold leading-[1.02] tracking-[-0.065em] sm:text-5xl">Start simple. Grow with the signal.</h2><p className="mt-5 text-lg leading-8 text-[#486170]">AUD pricing designed for small to medium ANZ businesses. Annual billing includes two months at no additional charge.</p></div><div className="inline-flex w-fit rounded-full border border-[#10283B]/10 bg-white p-1.5" role="group" aria-label="Billing frequency"><button onClick={() => setAnnual(false)} className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${!annual ? "bg-[#10283B] text-white" : "text-[#486170]"}`}>Monthly</button><button onClick={() => setAnnual(true)} className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${annual ? "bg-[#10283B] text-white" : "text-[#486170]"}`}>Annual <span className="ml-1 text-xs text-[#0E867E]">save 11%</span></button></div></div>
        <div className="mt-12 grid gap-5 lg:grid-cols-3">{plans.map(plan => <article key={plan.name} className={`relative flex flex-col rounded-[28px] border p-7 ${plan.accent ? "border-[#0E867E] bg-[#10283B] text-white shadow-[0_24px_48px_rgba(16,40,59,0.16)]" : "border-[#10283B]/12 bg-white"}`}>
          {plan.accent && <span className="absolute -top-3 left-7 rounded-full bg-[#0E867E] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.11em] text-white">Most practical</span>}
          <p className={`font-mono text-[10px] uppercase tracking-[0.15em] ${plan.accent ? "text-white/60" : "text-[#486170]"}`}>{plan.audience}</p><h3 className="mt-5 text-3xl font-extrabold tracking-[-0.06em]">{plan.name}</h3><div className="mt-7 flex items-end gap-1"><span className="text-5xl font-extrabold tracking-[-0.08em]">A${annual ? plan.annual : plan.monthly}</span><span className={`mb-1 text-sm ${plan.accent ? "text-white/60" : "text-[#486170]"}`}>/month</span></div><p className={`mt-2 text-xs ${plan.accent ? "text-white/60" : "text-[#486170]"}`}>{annual ? `${plan.annualTotal} billed annually` : "Billed month to month"}</p><div className={`my-7 h-px ${plan.accent ? "bg-white/15" : "bg-[#10283B]/10"}`} /><div className="space-y-3">{[plan.response, plan.seats, ...plan.items].map(item => <div key={item} className="flex gap-2.5 text-sm leading-5"><Check size={16} className={`mt-0.5 shrink-0 ${plan.accent ? "text-[#69d7ce]" : "text-[#0E867E]"}`} /><span className={plan.accent ? "text-white/82" : "text-[#486170]"}>{item}</span></div>)}</div><a href="#waitlist" className={`mt-8 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-extrabold transition-all hover:-translate-y-0.5 ${plan.accent ? "bg-[#0E867E] text-white hover:bg-[#0a746d]" : "bg-[#E9F0F0] text-[#10283B] hover:bg-[#d8e5e4]"}`}>{plan.name === "Clarity" ? "Book a Demo" : "Start Free Trial"}<ArrowRight size={16} /></a>
        </article>)}</div>
        <div className="mt-10 overflow-x-auto rounded-2xl border border-[#10283B]/10 bg-white"><table className="min-w-[720px] w-full text-left"><thead className="bg-[#E9F0F0] text-xs"><tr><th className="px-5 py-4 font-bold">Included capability</th><th className="px-5 py-4 font-bold">Signal</th><th className="px-5 py-4 font-bold">Momentum</th><th className="px-5 py-4 font-bold">Clarity</th></tr></thead><tbody className="divide-y divide-[#10283B]/8 text-sm text-[#486170]">{[["NPS, CSAT, CES & custom surveys", "Included", "Included", "Included"], ["Email distribution", "Included", "Included", "Included"], ["SMS & in-app distribution", "—", "Included", "Included"], ["Automations & recovery alerts", "—", "Included", "Included"], ["CRM/helpdesk integrations", "—", "Included", "Included"], ["White-label & multi-brand", "—", "—", "Included"], ["Advanced roles, API & priority onboarding", "—", "—", "Included"]].map(row => <tr key={row[0]}>{row.map((cell, index) => <td key={cell} className={`px-5 py-4 ${index === 0 ? "font-semibold text-[#10283B]" : ""}`}>{cell}</td>)}</tr>)}</tbody></table></div>
      </section>

      <section id="brand" className="border-y border-[#10283B]/8 bg-white py-20 sm:py-28" aria-labelledby="brand-heading">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8"><div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]"><div><TinyTag>Brand identity</TinyTag><h2 id="brand-heading" className="mt-6 text-balance text-4xl font-extrabold leading-[1.02] tracking-[-0.065em] sm:text-5xl">A quiet confidence that leaves room for the customer.</h2><p className="mt-6 max-w-md text-lg leading-8 text-[#486170]">Lumae is designed for teams who need their feedback data to be trustworthy, legible, and human. The identity is grounded in original ANZ B2B SaaS visual-language research, not a generic software template.</p><a href="#waitlist" className="mt-8 inline-flex items-center gap-2 text-sm font-extrabold text-[#0E867E] underline decoration-[#0E867E]/30 underline-offset-4">Request the brand pack <ArrowRight size={16} /></a></div>
          <div className="rounded-[30px] bg-[#FBFAF7] p-5 sm:p-8"><div className="grid gap-5 sm:grid-cols-[0.8fr_1.2fr]"><div className="grid min-h-[240px] place-items-center rounded-3xl bg-[#10283B]"><img src={logoUrl} alt="Lumae signal mark" className="h-28 w-28 object-contain" /></div><div className="rounded-3xl border border-[#10283B]/10 bg-white p-6"><p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#486170]">Wordmark</p><p className="mt-6 text-5xl font-extrabold tracking-[-0.085em] text-[#10283B]">lumae</p><p className="mt-5 text-sm leading-6 text-[#486170]">An open signal mark with an editorial, lower-case wordmark. Clear enough for a 16px icon; composed enough for a boardroom.</p></div></div>
            <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-5">{[["Harbour Ink", "#10283B", "bg-[#10283B]"], ["Tidal Teal", "#0E867E", "bg-[#0E867E]"], ["Signal Coral", "#E96E59", "bg-[#E96E59]"], ["Salt Paper", "#FBFAF7", "bg-[#FBFAF7]"], ["Mist", "#E9F0F0", "bg-[#E9F0F0]"]].map(([name, hex, colour]) => <div key={name} className="rounded-2xl border border-[#10283B]/10 bg-white p-3"><span className={`block h-12 rounded-xl ${colour} border border-[#10283B]/8`} /><p className="mt-3 text-[10px] font-bold leading-4 text-[#10283B]">{name}</p><p className="font-mono text-[10px] text-[#486170]">{hex}</p></div>)}</div>
            <div className="mt-5 grid gap-4 rounded-3xl bg-[#E9F0F0] p-6 sm:grid-cols-2"><div><p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#486170]">Manrope · interface</p><p className="mt-3 text-3xl font-extrabold leading-none tracking-[-0.06em]">Signal.<br />Action.<br />Clarity.</p></div><div><p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#486170]">DM Mono · detail</p><p className="mt-4 font-mono text-sm text-[#0E867E]">NPS +42 / 28.6% RESP.</p><p className="mt-3 text-sm leading-6 text-[#486170]">Calm, precise type that separates operational insight from the surrounding story.</p></div></div>
          </div>
        </div></div>
      </section>

      <section className="bg-[#10283B] py-20 text-white sm:py-28" aria-labelledby="trust-heading">
          <div className="mx-auto max-w-[1280px] px-5 sm:px-8"><div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr]"><div><TinyTag><span className="h-1.5 w-1.5 rounded-full bg-[#0E867E]" />Designed with intent</TinyTag><h2 id="trust-heading" className="mt-6 text-balance text-4xl font-extrabold leading-[1.02] tracking-[-0.065em] sm:text-5xl">Built for ANZ businesses</h2><p className="mt-6 max-w-lg text-lg leading-8 text-white/68">From local-currency pricing to a practical emphasis on privacy, consent, roles, and accountable service recovery, Lumae is being shaped for the way ANZ teams operate.</p></div><div className="grid gap-4 sm:grid-cols-3">{trustPrinciples.map(({ icon: Icon, title, copy }) => <div key={title} className="rounded-2xl border border-white/12 bg-white/[0.045] p-5"><Icon size={22} className="text-[#69d7ce]" /><h3 className="mt-8 font-extrabold">{title}</h3><p className="mt-3 text-sm leading-6 text-white/60">{copy}</p></div>)}</div></div>
          <p className="mt-10 border-t border-white/12 pt-5 text-xs leading-5 text-white/45">Pre-launch note: customer testimonials, ratings, performance claims, and customer/partner logos are not shown until Lumae has documented approval to use them.</p>
        </div>
      </section>

      <section id="waitlist" className="bg-[#0E867E] py-20 sm:py-28" aria-labelledby="waitlist-heading">
        <div className="mx-auto grid max-w-[1040px] gap-10 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center"><div className="text-white"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/65">Early access</p><h2 id="waitlist-heading" className="mt-5 text-balance text-4xl font-extrabold leading-[1.02] tracking-[-0.065em] sm:text-5xl">Make feedback easier to act on.</h2><p className="mt-5 max-w-md text-lg leading-8 text-white/78">Join the early-access list. Tell us where you need more customer clarity and we’ll share the right next conversation.</p></div>
          <form onSubmit={submitWaitlist} className="rounded-[26px] bg-white p-5 shadow-[0_22px_44px_rgba(6,80,75,0.22)] sm:p-7"><div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold text-[#10283B]">Name <input value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} maxLength={120} className="mt-2 w-full rounded-xl border border-[#10283B]/15 bg-[#FBFAF7] px-4 py-3 text-sm outline-none transition-colors focus:border-[#0E867E]" placeholder="Your name" /></label><label className="text-xs font-bold text-[#10283B]">Company <input value={form.company} onChange={event => setForm(current => ({ ...current, company: event.target.value }))} maxLength={160} className="mt-2 w-full rounded-xl border border-[#10283B]/15 bg-[#FBFAF7] px-4 py-3 text-sm outline-none transition-colors focus:border-[#0E867E]" placeholder="Your company" /></label></div><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold text-[#10283B]">Industry <select required value={form.industry} onChange={event => setForm(current => ({ ...current, industry: event.target.value as IndustryValue }))} className="mt-2 w-full rounded-xl border border-[#10283B]/15 bg-[#FBFAF7] px-4 py-3 text-sm outline-none transition-colors focus:border-[#0E867E]"><option value="" disabled>Select industry</option>{industryOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="text-xs font-bold text-[#10283B]">Company size <select required value={form.companySize} onChange={event => setForm(current => ({ ...current, companySize: event.target.value as CompanySizeValue }))} className="mt-2 w-full rounded-xl border border-[#10283B]/15 bg-[#FBFAF7] px-4 py-3 text-sm outline-none transition-colors focus:border-[#0E867E]"><option value="" disabled>Select size</option>{companySizeOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div><label className="mt-4 block text-xs font-bold text-[#10283B]">Work email <input required type="email" value={form.email} onChange={event => setForm(current => ({ ...current, email: event.target.value }))} maxLength={320} className="mt-2 w-full rounded-xl border border-[#10283B]/15 bg-[#FBFAF7] px-4 py-3 text-sm outline-none transition-colors focus:border-[#0E867E]" placeholder="you@company.com" /></label><button disabled={joinWaitlist.isPending} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#10283B] px-5 py-3.5 text-sm font-extrabold text-white transition-colors hover:bg-[#0b5f63] disabled:cursor-wait disabled:opacity-70">{joinWaitlist.isPending ? "Saving your place…" : "Request early access"}<ArrowRight size={16} /></button>{formMessage && <p className="mt-4 text-center text-sm font-semibold text-[#0E867E]" role="status">{formMessage}</p>}<p className="mt-4 text-center text-[11px] leading-5 text-[#486170]">By joining, you agree to hear from Lumae about early access. No spam, no fabricated promises.</p></form>
        </div>
      </section>

      <footer className="bg-[#FBFAF7] py-10"><div className="mx-auto flex max-w-[1280px] flex-col justify-between gap-8 px-5 sm:px-8 md:flex-row md:items-end"><div><BrandLockup /><p className="mt-4 max-w-sm text-sm leading-6 text-[#486170]">A working concept for a clear, accountable customer-feedback platform for Australia and New Zealand.</p></div><div className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm font-semibold text-[#486170] sm:grid-cols-3"><a href="#platform" className="hover:text-[#0E867E]">Platform</a><a href="#pricing" className="hover:text-[#0E867E]">Pricing</a><a href="#research" className="hover:text-[#0E867E]">Research</a><a href="#brand" className="hover:text-[#0E867E]">Brand</a><a href="#waitlist" className="hover:text-[#0E867E]">Early access</a><a href="mailto:hello@lumae.com.au" className="hover:text-[#0E867E]">Contact</a></div></div><div className="mx-auto mt-9 flex max-w-[1280px] flex-col gap-2 border-t border-[#10283B]/10 px-5 pt-5 text-[11px] text-[#486170] sm:px-8 md:flex-row md:justify-between"><p>© 2026 Lumae concept. Name and domain remain subject to clearance.</p><p>Source links appear in the market and competitor sections.</p></div></footer>
    </main>
  );
}
