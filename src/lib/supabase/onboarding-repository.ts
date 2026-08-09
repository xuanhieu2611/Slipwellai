import type { OnboardingRepository } from "@/lib/onboarding-service";

type SupabaseClient = Awaited<
  ReturnType<typeof import("@/lib/supabase/server").createSupabaseServerClient>
>;

const throwIfError = (error: { message: string } | null) => {
  if (error) throw new Error(error.message);
};

export function createSupabaseOnboardingRepository(supabase: SupabaseClient): OnboardingRepository {
  return {
    async read(ownerId) {
      const [profileResult, preferencesResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("display_name, company_name, work_type, onboarding_completed_at")
          .eq("id", ownerId)
          .maybeSingle(),
        supabase
          .from("user_preferences")
          .select("timezone, locale")
          .eq("owner_id", ownerId)
          .maybeSingle(),
      ]);
      throwIfError(profileResult.error);
      throwIfError(preferencesResult.error);
      return { profile: profileResult.data, preferences: preferencesResult.data };
    },
    async saveProfile(ownerId, profile) {
      const [profileResult, preferencesResult] = await Promise.all([
        supabase.from("profiles").upsert({
          id: ownerId,
          display_name: profile.displayName,
          company_name: profile.companyName ?? null,
          work_type: profile.workType,
          onboarding_version: 1,
          updated_at: new Date().toISOString(),
        }),
        supabase.from("user_preferences").upsert({
          owner_id: ownerId,
          timezone: profile.timezone,
          locale: profile.locale,
          updated_at: new Date().toISOString(),
        }),
      ]);
      throwIfError(profileResult.error);
      throwIfError(preferencesResult.error);
    },
    async complete(ownerId) {
      const result = await supabase
        .from("profiles")
        .update({
          onboarding_version: 1,
          onboarding_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", ownerId);
      throwIfError(result.error);
    },
  };
}
