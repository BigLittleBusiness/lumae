import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";

export default function AcceptInvitation() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const token = new URLSearchParams(window.location.search).get("token");
  const accept = trpc.workspace.acceptInvitation.useMutation({ onSuccess: () => setLocation("/app") });
  if (loading) return <main className="min-h-screen bg-[#fbfaf7]" />;
  if (!user) return <main className="grid min-h-screen place-items-center bg-[#10283b] p-6 text-white"><section className="max-w-md rounded-3xl bg-white/10 p-8"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#69d7ce]">Lumae invitation</p><h1 className="mt-3 text-3xl font-extrabold">Sign in to join your workspace.</h1><button onClick={startLogin} className="mt-7 h-11 rounded-xl bg-[#0e867e] px-5 text-sm font-bold">Sign in to accept</button></section></main>;
  return <main className="grid min-h-screen place-items-center bg-[#fbfaf7] p-6"><section className="max-w-md rounded-3xl border border-[#dce7e7] bg-white p-8 text-center"><CheckCircle2 className="mx-auto h-8 w-8 text-[#0e867e]" /><h1 className="mt-4 text-2xl font-extrabold text-[#10283b]">Join this Lumae workspace</h1><p className="mt-2 text-sm leading-6 text-[#486170]">Your account email must match the address that received this invitation.</p><button disabled={!token || accept.isPending} onClick={() => token && accept.mutate({ token })} className="mt-6 h-11 rounded-xl bg-[#0e867e] px-5 text-sm font-bold text-white disabled:opacity-60">{accept.isPending ? "Joining…" : "Accept invitation"}</button>{accept.error && <p className="mt-3 text-sm text-[#e96e59]">{accept.error.message}</p>}</section></main>;
}
