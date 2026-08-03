import { z } from "zod";

export const workTypes = [
  "creator_consultant",
  "freelancer_with_recurring_clients",
  "solo_founder_or_fractional_leader",
  "other_independent_professional",
] as const;

export type WorkType = (typeof workTypes)[number];

export const workTypeLabels: Record<WorkType, string> = {
  creator_consultant: "Creator-consultant",
  freelancer_with_recurring_clients: "Freelancer with recurring clients",
  solo_founder_or_fractional_leader: "Solo founder or fractional leader",
  other_independent_professional: "Other independent professional",
};

const trimmed = (maximum: number) =>
  z.string().trim().min(1).max(maximum);

const optionalTrimmed = (maximum: number) =>
  z
    .string()
    .trim()
    .max(maximum)
    .transform((value) => value || undefined)
    .optional();

export const isValidTimeZone = (value: string) => {
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
};

export const canonicalTimeZone = (value: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: value }).resolvedOptions().timeZone;

export const isValidLocale = (value: string) => {
  try {
    return Intl.getCanonicalLocales(value).length === 1;
  } catch {
    return false;
  }
};

export const canonicalLocale = (value: string) => Intl.getCanonicalLocales(value)[0];

export const onboardingProfileSchema = z.object({
  displayName: trimmed(80),
  companyName: optionalTrimmed(160),
  workType: z.enum(workTypes),
  timezone: trimmed(80)
    .refine(isValidTimeZone, "Choose a valid timezone.")
    .transform(canonicalTimeZone),
  locale: trimmed(64)
    .refine(isValidLocale, "Choose a valid locale, such as en-CA.")
    .transform(canonicalLocale),
});

export type OnboardingProfileInput = z.output<typeof onboardingProfileSchema>;

export const onboardingActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("save_profile"), profile: onboardingProfileSchema }),
  z.object({ action: z.literal("complete") }),
]);

export type OnboardingAction = z.output<typeof onboardingActionSchema>;

export type OnboardingState = {
  completed: boolean;
  profile: {
    displayName: string | null;
    companyName: string | null;
    workType: WorkType | null;
  };
  preferences: {
    timezone: string | null;
    locale: string | null;
  };
};

export const canCompleteOnboarding = (state: OnboardingState) =>
  onboardingProfileSchema.safeParse({
    displayName: state.profile.displayName ?? "",
    companyName: state.profile.companyName ?? undefined,
    workType: state.profile.workType ?? undefined,
    timezone: state.preferences.timezone ?? "",
    locale: state.preferences.locale ?? "",
  }).success;
