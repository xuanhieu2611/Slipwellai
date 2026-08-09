import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getOnboardingState } from "@/lib/onboarding-service";
import { createSupabaseOnboardingRepository } from "@/lib/supabase/onboarding-repository";
import { requireUser } from "@/lib/supabase/server";

export default async function AuthenticatedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { supabase, user } = await requireUser();
  if (!user) redirect("/");
  const state = await getOnboardingState(createSupabaseOnboardingRepository(supabase), user.id);
  if (!state.completed) redirect("/onboarding");
  return <AppShell email={user.email ?? "Signed-in account"}>{children}</AppShell>;
}
