import { redirect } from "next/navigation";
import { authErrorMessages, type AuthCallbackError } from "@/lib/auth";
import { SignIn } from "@/components/sign-in";
import { getOnboardingState } from "@/lib/onboarding-service";
import { createSupabaseOnboardingRepository } from "@/lib/supabase/onboarding-repository";
import { requireUser } from "@/lib/supabase/server";

export default async function Home({ searchParams }: { searchParams: Promise<{ auth?: string }> }) {
  const auth = (await searchParams).auth;
  const state = await getHomeState();
  if (state.kind === "setup") return <SetupRequired />;
  if (state.kind === "signed-out") return <SignIn initialError={auth && auth in authErrorMessages ? authErrorMessages[auth as AuthCallbackError] : undefined} />;
  redirect(state.completed ? "/inbox" : "/onboarding");
}

async function getHomeState(): Promise<
  | { kind: "setup" }
  | { kind: "signed-out" }
  | { kind: "signed-in"; completed: boolean }
> {
  try {
    const { supabase, user } = await requireUser();
    if (!user) return { kind: "signed-out" };
    const state = await getOnboardingState(createSupabaseOnboardingRepository(supabase), user.id);
    return { kind: "signed-in", completed: state.completed };
  } catch {
    return { kind: "setup" };
  }
}

function SetupRequired() {
  return <main className="mx-auto flex min-h-dvh max-w-xl items-center px-5"><section className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-8"><p className="eyebrow">Slipwell setup</p><h1 className="mt-3 text-3xl font-semibold tracking-tight">Finish secure local setup.</h1><p className="mt-3 leading-7 text-[var(--ink-muted)]">Copy <code>.env.example</code> to <code>.env.local</code>, then add the Supabase URL, publishable key, OpenRouter API key, and selected model.</p></section></main>;
}
