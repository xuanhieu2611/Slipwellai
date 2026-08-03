# Slipwellai
# Slipwell — Phase 0 pilot

Responsive Next.js + Tailwind prototype for capture → proposal → review, explainable Slipping, and safe monthly retainer rollover.

The ordered commercial-MVP plan, current implementation status, exit gates, and verification log live in [`MVP-BUILD-TRACKER.md`](MVP-BUILD-TRACKER.md). Update that tracker in the same change that completes an MVP item.

For the Phase 0 interview guide, manual acceptance script, alpha recruitment copy, and decision-memo template, use [`docs/phase-0-validation.md`](docs/phase-0-validation.md).

## Run locally

1. Use Node 24+ and `npm install`.
2. Complete `.env.local` with the server-only `OPENROUTER_API_KEY` and `OPENROUTER_MODEL`. Supabase URL and publishable key are already configured locally; never add a Supabase secret/service-role key.
3. Run `npm run dev`, then open http://localhost:3000.

## Authentication

Slipwell supports public email/password signup and Google OAuth. New email/password accounts go straight to onboarding; email confirmation and passwordless sign-in are intentionally not enabled.

Set `NEXT_PUBLIC_APP_URL` to the exact deployed application origin. In each hosted Supabase project, enable Email signup, leave email confirmation disabled, and allow only `<app-origin>/auth/callback` as the app redirect URL. For Google, create OAuth credentials in Google Cloud with Supabase’s provider callback (`https://<project-ref>.supabase.co/auth/v1/callback`), add the client ID and secret in Supabase Auth → Google, and enable the provider. Never commit the Google secret.

The checked-in local config leaves Google disabled until local credentials are supplied. Set `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID`, `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET`, and enable `[auth.external.google]` only in local development when testing that provider.

Use only low-sensitivity test captures during Phase 0. Capture text is sent only to the configured OpenRouter model with zero-data-retention and provider data collection denied. Its original text is stored before interpretation and no capture content is logged by application code.

## Checks

- `npm run lint`
- `npm test`
- `npm run build`

The database migration is versioned at `supabase/migrations/20260802224924_phase0_foundation.sql` and has been applied to Supabase project `slipwell-phase0` in US West. All pilot tables have RLS policies keyed to the authenticated owner.

The next migrations, `supabase/migrations/20260803090000_step1_onboarding_foundation.sql` and `supabase/migrations/20260803110000_working_prototype_core.sql`, add required-once onboarding plus the working-prototype domains, tasks, projects, routines, people, and notes tables. Apply them through the normal Supabase migration promotion process before deploying this app change; the latter migration is additive and preserves existing pilot records.

## Browser coverage

`npm run test:e2e` contains desktop and mobile browser coverage for the authenticated shell and onboarding. It intentionally skips authenticated scenarios unless local-Supabase fixture storage-state paths are supplied through `PLAYWRIGHT_AUTH_STORAGE_STATE` and `PLAYWRIGHT_INCOMPLETE_ONBOARDING_STORAGE_STATE`; never use a real account as either fixture.
