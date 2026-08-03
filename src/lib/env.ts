const required = (name: string, value: string | undefined): string => {
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
};

export const env = {
  // NEXT_PUBLIC_* must use literal process.env keys so Next can inline them for the browser.
  supabaseUrl: () => required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabasePublishableKey: () =>
    required("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
  openRouterApiKey: () => required("OPENROUTER_API_KEY", process.env.OPENROUTER_API_KEY),
  openRouterModel: () => required("OPENROUTER_MODEL", process.env.OPENROUTER_MODEL),
  openRouterFallbackModels: () =>
    (process.env.OPENROUTER_FALLBACK_MODELS ?? "")
      .split(",")
      .map((model) => model.trim())
      .filter(Boolean),
  openAiApiKey: () => required("OPENAI_API_KEY", process.env.OPENAI_API_KEY),
  openAiTranscriptionModel: () => process.env.OPENAI_TRANSCRIPTION_MODEL ?? "gpt-4o-mini-transcribe",
};
