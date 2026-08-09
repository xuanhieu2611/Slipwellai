import { describe, expect, it } from "vitest";
import { onboardingProfileSchema } from "@/lib/onboarding";
import {
  completeOnboarding,
  getOnboardingState,
  saveOnboardingProfile,
  type OnboardingRepository,
} from "@/lib/onboarding-service";

function createRepository(): OnboardingRepository {
  let profile: {
    display_name: string | null;
    company_name: string | null;
    work_type:
      | "creator_consultant"
      | "freelancer_with_recurring_clients"
      | "solo_founder_or_fractional_leader"
      | "other_independent_professional"
      | null;
    onboarding_completed_at: string | null;
  } | null = null;
  let preferences: { timezone: string | null; locale: string | null } | null = null;

  return {
    async read() {
      return { profile, preferences };
    },
    async saveProfile(_ownerId, input) {
      profile = {
        display_name: input.displayName,
        company_name: input.companyName ?? null,
        work_type: input.workType,
        onboarding_completed_at: profile?.onboarding_completed_at ?? null,
      };
      preferences = { timezone: input.timezone, locale: input.locale };
    },
    async complete() {
      if (!profile) throw new Error("Profile missing");
      profile = { ...profile, onboarding_completed_at: "2026-08-02T00:00:00.000Z" };
    },
  };
}

const validProfile = () =>
  onboardingProfileSchema.parse({
    displayName: "Nora Chen",
    companyName: "Field Notes Studio",
    workType: "creator_consultant",
    timezone: "America/Vancouver",
    locale: "en-ca",
  });

describe("onboarding profile validation", () => {
  it("normalizes locale and preserves a valid IANA timezone", () => {
    expect(validProfile()).toMatchObject({ locale: "en-CA", timezone: "America/Vancouver" });
  });

  it("rejects malformed timezone and locale values", () => {
    expect(
      onboardingProfileSchema.safeParse({ ...validProfile(), timezone: "Mars/Olympus" }).success,
    ).toBe(false);
    expect(
      onboardingProfileSchema.safeParse({ ...validProfile(), locale: "not a locale" }).success,
    ).toBe(false);
  });
});

describe("onboarding service", () => {
  it("forces legacy accounts with no completed profile through setup", async () => {
    const state = await getOnboardingState(createRepository(), "legacy-user");
    expect(state.completed).toBe(false);
    await expect(completeOnboarding(createRepository(), "legacy-user")).rejects.toThrow(
      "Complete your profile",
    );
  });

  it("persists profile progress before it is marked complete", async () => {
    const repository = createRepository();
    const state = await saveOnboardingProfile(repository, "pilot-user", validProfile());
    expect(state).toMatchObject({
      completed: false,
      profile: { displayName: "Nora Chen", workType: "creator_consultant" },
      preferences: { timezone: "America/Vancouver", locale: "en-CA" },
    });
  });

  it("completes only after the required profile state is present", async () => {
    const repository = createRepository();
    await saveOnboardingProfile(repository, "pilot-user", validProfile());
    const state = await completeOnboarding(repository, "pilot-user");
    expect(state.completed).toBe(true);
  });
});
