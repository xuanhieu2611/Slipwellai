import { redirect } from "next/navigation";
import { Onboarding } from "@/components/onboarding";
import { getOnboardingState } from "@/lib/onboarding-service";
import { createSupabaseOnboardingRepository } from "@/lib/supabase/onboarding-repository";
import { requireUser } from "@/lib/supabase/server";

export default async function OnboardingPage() {
  const { supabase, user } = await requireUser();
  if (!user) redirect("/");
  const state = await getOnboardingState(createSupabaseOnboardingRepository(supabase), user.id);
  if (state.completed) redirect("/today");
  return <Onboarding initialState={state} />;
}
