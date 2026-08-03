import {
  canCompleteOnboarding,
  type OnboardingProfileInput,
  type OnboardingState,
  type WorkType,
} from "@/lib/onboarding";

type ProfileRow = {
  display_name: string | null;
  company_name: string | null;
  work_type: WorkType | null;
  onboarding_completed_at: string | null;
};

type PreferencesRow = { timezone: string | null; locale: string | null };

export interface OnboardingRepository {
  read(ownerId: string): Promise<{ profile: ProfileRow | null; preferences: PreferencesRow | null }>;
  saveProfile(ownerId: string, profile: OnboardingProfileInput): Promise<void>;
  complete(ownerId: string): Promise<void>;
}

export const onboardingStateFromRows = (
  profile: ProfileRow | null,
  preferences: PreferencesRow | null,
): OnboardingState => ({
  completed: Boolean(profile?.onboarding_completed_at),
  profile: {
    displayName: profile?.display_name ?? null,
    companyName: profile?.company_name ?? null,
    workType: profile?.work_type ?? null,
  },
  preferences: {
    timezone: preferences?.timezone ?? null,
    locale: preferences?.locale ?? null,
  },
});

export async function getOnboardingState(repository: OnboardingRepository, ownerId: string) {
  const rows = await repository.read(ownerId);
  return onboardingStateFromRows(rows.profile, rows.preferences);
}

export async function saveOnboardingProfile(
  repository: OnboardingRepository,
  ownerId: string,
  profile: OnboardingProfileInput,
) {
  await repository.saveProfile(ownerId, profile);
  return getOnboardingState(repository, ownerId);
}

export async function completeOnboarding(repository: OnboardingRepository, ownerId: string) {
  const state = await getOnboardingState(repository, ownerId);
  if (!canCompleteOnboarding(state)) {
    throw new Error("Complete your profile before finishing setup.");
  }
  await repository.complete(ownerId);
  return getOnboardingState(repository, ownerId);
}
