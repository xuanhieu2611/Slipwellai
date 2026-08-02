# Slipwellai
# Slipwell — Phase 0 pilot

Responsive Next.js + Tailwind prototype for capture → proposal → review, explainable Slipping, and safe monthly retainer rollover.

The ordered commercial-MVP plan, current implementation status, exit gates, and verification log live in [`MVP-BUILD-TRACKER.md`](MVP-BUILD-TRACKER.md). Update that tracker in the same change that completes an MVP item.

## Run locally

1. Use Node 24+ and `npm install`.
2. Complete `.env.local` with the server-only `OPENROUTER_API_KEY` and `OPENROUTER_MODEL`. Supabase URL and publishable key are already configured locally; never add a Supabase secret/service-role key.
3. Run `npm run dev`, then open http://localhost:3000.

## Pilot access

Pilot users must be pre-provisioned in the Supabase dashboard using an email invite. The sign-in form uses `shouldCreateUser: false`, so it cannot create public accounts. Configure the hosted Supabase Auth Site URL and redirect allow-list for `http://localhost:3000/auth/callback` before testing magic links.

Use only low-sensitivity test captures during Phase 0. Capture text is sent only to the configured OpenRouter model with zero-data-retention and provider data collection denied. Its original text is stored before interpretation and no capture content is logged by application code.

## Checks

- `npm run lint`
- `npm test`
- `npm run build`

The database migration is versioned at `supabase/migrations/20260802224924_phase0_foundation.sql` and has been applied to Supabase project `slipwell-phase0` in US West. All pilot tables have RLS policies keyed to the authenticated owner.
