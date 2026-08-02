import { Dashboard } from "@/components/dashboard";
import { SignIn } from "@/components/sign-in";
import { getDashboardData } from "@/lib/dashboard";
import { requireUser } from "@/lib/supabase/server";

export default async function Home() {
  const state = await getHomeState();
  if (state.kind === "setup") {
    return <main className="mx-auto flex min-h-screen max-w-xl items-center px-5"><section className="rounded-3xl border border-[var(--line)] bg-white p-8"><p className="text-sm font-semibold text-[var(--moss)]">Slipwell Phase 0</p><h1 className="mt-3 text-3xl font-semibold">Finish secure local setup.</h1><p className="mt-3 leading-7 text-[var(--ink-muted)]">Copy <code>.env.example</code> to <code>.env.local</code>, then add the Supabase URL, publishable key, OpenRouter API key, and selected model.</p></section></main>;
  }
  if (state.kind === "signed-out") return <SignIn />;
  return <Dashboard data={state.data} email={state.email} />;
}

async function getHomeState(): Promise<
  | { kind: "setup" }
  | { kind: "signed-out" }
  | { kind: "signed-in"; data: Awaited<ReturnType<typeof getDashboardData>>; email: string }
> {
  try {
    const { user } = await requireUser();
    if (!user) return { kind: "signed-out" };
    const data = await getDashboardData();
    return { kind: "signed-in", data, email: user.email ?? "Invited tester" };
  } catch {
    return { kind: "setup" };
  }
}
