import { NextRequest, NextResponse } from "next/server";
import { badRequest, serverError, unauthorized } from "@/lib/http";
import { onboardingActionSchema } from "@/lib/onboarding";
import { completeOnboarding, saveOnboardingProfile } from "@/lib/onboarding-service";
import { createSupabaseOnboardingRepository } from "@/lib/supabase/onboarding-repository";
import { requireUser } from "@/lib/supabase/server";

export async function PATCH(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Send a valid onboarding update.");
  }

  const parsed = onboardingActionSchema.safeParse(body);
  if (!parsed.success) return badRequest("Check your profile details and try again.");

  const { supabase, user } = await requireUser();
  if (!user) return unauthorized();
  const repository = createSupabaseOnboardingRepository(supabase);

  try {
    const state =
      parsed.data.action === "save_profile"
        ? await saveOnboardingProfile(repository, user.id, parsed.data.profile)
        : await completeOnboarding(repository, user.id);
    return NextResponse.json({ state });
  } catch (error) {
    if (error instanceof Error && error.message === "Complete your profile before finishing setup.") {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return serverError("We couldn't save your setup yet. Try again.");
  }
}
