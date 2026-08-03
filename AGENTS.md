# AGENTS.md

This file applies to the entire Slipwell repository.

## Product context

Slipwell is a capture-first personal operations app for creator-consultants, freelancers with retainers, and solo operators. It turns unstructured text or voice captures into organized records, then surfaces important work through Today and the Slipping engine.

The core promise is:

> Capture anything. Nothing important slips through.

The initial product is a responsive Next.js website/PWA. Native iOS and Android apps built with Expo are a later phase.

## Read before changing the product

For product or implementation work, read the relevant parts of these files first:

1. `PRD.md` — authoritative product scope, requirements, terminology, acceptance criteria, architecture, and roadmap.
2. `MVP-BUILD-TRACKER.md` — ordered implementation plan, current completion status, milestone exit gates, release blockers, and verification log. It is derived from the PRD and does not override it.
3. `product-strategy.md` — commercial reasoning, competition, positioning, and MVP rationale.
4. `idea-assessment.md` — initial viability assessment.
5. `youtube-script.md` — broad inspiration and long-term vision; it is not the MVP specification.

When these documents conflict, follow this order:

1. The user’s current explicit request.
2. `PRD.md`.
3. `MVP-BUILD-TRACKER.md` for build order and recorded implementation status only.
4. `product-strategy.md`.
5. `idea-assessment.md`.
6. `youtube-script.md`.

Do not interpret a feature in the transcript as authorization to add it to the MVP. The PRD’s priorities and non-goals control scope.

The PRD uses **Phase 0** for validation/prototyping and **P0** for requirements that are mandatory for the public MVP. Do not treat those terms as interchangeable. The commercial MVP is complete only when all required P0 work, the PRD acceptance journey, and the production-like release gates pass.

## Current repository state

The repository now contains an npm-based Phase 0 application scaffold and product documents:

- Next.js 16 App Router, React 19, strict TypeScript, and Tailwind CSS 4 under `src/`.
- Supabase SSR clients, public email/password and Google OAuth authentication, API routes, and version-controlled migrations under `supabase/migrations/`.
- A source-first text capture prototype, server-only OpenRouter proposal adapter, review/correction UI, retainer rollover lab, and Slipping lab.
- Vitest unit tests for proposal validation and basic retainer/Slipping behavior.
- `MVP-BUILD-TRACKER.md` records the audited state and the ordered path from this prototype to the commercial MVP.

This is still a validation prototype, not a complete Phase 1 beta or commercial MVP. In particular, the OpenRouter happy path has not been verified in the tested UI, the current records are prototype records rather than the canonical product model, and the repository does not yet include Today, the broader P0 entities, calendar sync, voice, durable jobs, billing, export/deletion, cross-user RLS integration tests, or end-to-end tests.

Before running or suggesting commands:

- Use **npm** and preserve `package-lock.json`; do not introduce a second package manager or lockfile.
- Use scripts defined in `package.json` instead of inventing parallel commands.
- Current commands are `npm run dev`, `npm run lint`, `npm test`, and `npm run build`.
- A dedicated format check, dedicated type-check script, integration-test script, and end-to-end-test script are still required by the MVP tracker.
- Never assume a prototype path is production-ready merely because its UI exists; consult the tracker status and exit gate.

## MVP tracker workflow

For every product or implementation change:

1. Identify the relevant PRD requirement IDs and tracker step before editing.
2. Work in the dependency order recorded in `MVP-BUILD-TRACKER.md` unless the user explicitly reprioritizes it.
3. Update the tracker in the same change when implementation status, setup, schema, a milestone gate, or verification evidence changes.
4. Mark `[x]` only after the item has appropriate implementation and test/manual evidence. Code presence alone is not completion.
5. Add a dated verification-log entry for a newly completed milestone or release-critical invariant.
6. Do not mark a step complete while its exit gate, authorization, recovery, mobile, accessibility, or required test work remains open.
7. Keep P1/P2 items parked unless they are dependencies for P0 or the user explicitly changes scope.

If the tracker and current code disagree, inspect the code and tests, correct the tracker, and mention the discrepancy in the handoff. Never weaken the PRD to make the completion percentage look better.

## MVP scope

Prioritize the P0 requirements in `PRD.md`. The first commercial product includes:

- Authentication and onboarding.
- Responsive web/PWA behavior.
- Text and browser voice capture.
- Durable preservation of original captures.
- AI cleanup, extraction, routing proposals, review, correction, and undo.
- Today, including Top Three, calendar context, tasks, routines, Slipping, and recent captures.
- Tasks and domains.
- Finite projects and checklist templates.
- Monthly retainers, cycle generation, carry-forward, and history.
- Slipping for tasks, projects, and retainers.
- Read-only Google Calendar synchronization.
- Simple routines kept separate from tasks.
- Lightweight people and notes.
- Global keyword search.
- In-app/email notifications and browser push where reliable.
- Free/Pro/trial entitlements and Stripe billing.
- Data export and account deletion.

Do not pull these into the MVP unless the user explicitly changes scope:

- Native Expo applications or wearable clients.
- Collaboration, team workspaces, assignments, or permissions.
- Full content-management subsystem.
- Full personal CRM or contact sync.
- Deep library, journal, book, quote, or highlight features.
- Grounded AI chat across all user data.
- Automatic calendar scheduling or time blocking.
- Arbitrary custom databases or a Notion-like builder.
- Inventory management.
- Public social feeds or productivity rankings.

If a request introduces a future feature, identify its roadmap phase and preserve the existing MVP boundary unless the user explicitly reprioritizes it.

## Product principles

Apply these principles to product and engineering decisions:

1. Capture before categorization.
2. Preserve the original source.
3. AI proposes; the user remains in control.
4. Calm defaults are more important than feature density.
5. Routines are not tasks.
6. Stale is different from overdue.
7. Retainers are first-class records, not recurring-task workarounds.
8. Prefer opinionated defaults with progressive control.
9. Privacy and portability are product features.
10. Every automated decision must be explainable and recoverable.

Avoid shame-based language. A Slipping state is an attention signal, not a judgment or failure.

## Terminology

Use the PRD’s terms consistently:

- **Capture:** original unstructured text or audio submitted by a user.
- **Proposal:** structured AI interpretation of a capture.
- **Domain:** durable top-level responsibility area.
- **Project:** finite outcome with an intended completion state.
- **Retainer:** ongoing engagement composed of recurring cycles and preserved history.
- **Retainer cycle:** one period within a retainer, monthly in the MVP.
- **Routine:** repeated personal behavior stored separately from tasks.
- **Meaningful attention:** substantive progress, a decision, or intentional deferment.
- **Slipping:** a record has received less meaningful attention than expected.
- **Structural acceptance:** a proposal is accepted without changing record type, relationships, or date semantics.

Do not use “overdue” and “Slipping” interchangeably.

## Architecture boundaries

The recommended stack is Next.js, TypeScript, Supabase Postgres/Auth/Storage, a durable background-job system, Stripe, and Postgres full-text search. Follow the actual scaffold and dependencies once present.

Keep these boundaries:

- UI components render state and collect intent; they must not own canonical business rules.
- Server-side application services validate authorization, inputs, state transitions, and entitlements.
- Database constraints and row-level security enforce tenant isolation and important invariants.
- Background jobs handle AI, transcription, reminders, calendar sync, exports, notifications, and retainer-cycle generation.
- External providers sit behind small adapters so domain logic is not tied to one vendor.
- Canonical APIs and domain logic must remain usable by the future Expo clients.

Do not connect browser code directly to privileged operations merely because Supabase permits client access. Exposed client access requires narrowly scoped row-level policies.

## TypeScript and code conventions

- Enable TypeScript strict mode.
- Avoid `any`; use `unknown` and validate at system boundaries.
- Validate external input, AI output, webhook payloads, URL parameters, and persisted JSON with versioned schemas.
- Prefer small modules with explicit inputs and outputs.
- Keep business state transitions in named domain functions or services.
- Use exhaustive handling for statuses and discriminated unions.
- Store timestamps in UTC and convert for display using the user’s confirmed timezone.
- Treat money as integer minor units plus currency, never binary floating-point values.
- Keep provider-specific types inside adapters.
- Do not hide important failure states behind catch-all success responses.
- Add comments for non-obvious invariants and reasons, not line-by-line narration.

Follow the formatter and linter configuration in the repository. Do not reformat unrelated files.

## Data and migration rules

- Every user-owned table must include an owner/tenant key and enforce row-level isolation.
- Enable row-level security before exposing a table through Supabase APIs.
- Never trust a client-supplied user ID without server-side authorization.
- Use version-controlled database migrations; do not rely on undocumented manual dashboard changes.
- Prefer additive, backward-compatible migrations for deployed systems.
- Include a rollback or forward-recovery plan for destructive migrations.
- Preserve IDs and relationship integrity during imports, exports, and migrations.
- Soft-delete only where recovery is promised; document permanent deletion behavior.
- Propagate deletion to files, search/vector indexes, derived data, and caches.
- Never put private record contents in analytics events, routine application logs, or error metadata.

## AI and capture invariants

These rules are release-critical:

- Create and durably store the source text before downstream interpretation. Voice audio is transient and is sent only for user-initiated transcription.
- Preserve original text. Voice audio is transient: send it only to the approved transcription provider for a user-initiated request, retain only the resulting transcript, and never write the recording to Slipwell storage or the database.
- Cleaned text must never overwrite the original source.
- AI output must validate against a versioned structured schema before affecting canonical records.
- Store field-level confidence for material extracted fields.
- Require review for ambiguous dates, people, projects, retainers, recurrence, or sensitive personal facts.
- Never invent a specific identity, date, promise, or relationship.
- Never silently convert a reflective note into a task.
- A failed interpretation job must leave a recoverable Inbox item. A failed transcription discards the transient audio and must clearly direct the user to text capture.
- Auto-file is an explicit user preference after successful review behavior, not the default for a brand-new user.
- AI-created or AI-edited records retain links to their source capture and audit history.
- Corrections are feedback signals; one correction must not silently rewrite global behavior.
- Use the smallest reliable model and avoid sending unrelated account data.
- Record model/version, latency, validation result, and cost estimate without logging sensitive content.

Any AI chat added later must cite supporting records and explicitly admit when the available evidence is insufficient.

## Idempotency and asynchronous work

Use stable idempotency keys for:

- Capture submission.
- AI/transcription job scheduling.
- Retainer cycle generation.
- Recurring task/routine generation.
- Google Calendar webhook and incremental-sync processing.
- Stripe webhook processing.
- Notification delivery.
- Export and deletion jobs.

A retry must not create duplicate tasks, retainer cycles, checklist instances, subscriptions, or notifications.

Expose queued, processing, completed, retrying, needs-review, and failed states where users need to understand what happened. Do not require a browser request to remain open for long-running work.

## Retainer rules

Retainer behavior is a core differentiator and must be treated as high risk:

- A retainer is not a finite project with recurrence added.
- Each cycle is a versioned, inspectable record.
- Generated work records the template version and source template item.
- Cycle creation is idempotent and reconcilable.
- Incomplete work is never silently deleted at rollover.
- The default rollover behavior is carry-forward with a link to the original cycle.
- Template changes explicitly target the current cycle, future cycles, or both.
- Pausing prevents future generation without deleting current work.
- Ending a retainer preserves history and requires a decision for remaining open work.

Tests must cover short months, daylight-saving/timezone changes, retries after partial failure, template edits, repeated carry-forward, pause/resume, and mid-cycle termination.

## Slipping rules

- Slipping uses meaningful activity events, not a generic `updated_at` field.
- Cosmetic edits do not automatically reset attention cadence.
- Every signal explains why it exists and which cadence/rule produced it.
- Users can act, add a next action, defer, change cadence, pause/archive, or dismiss.
- Intentional deferment and dismissal are recorded outcomes.
- Avoid repeated notifications without a state change.
- Bundle lower-severity signals into summaries.
- Track whether signals lead to useful action; do not optimize only for clicks.

Changes to default Slipping rules should be remotely configurable, auditable, and evaluated against dismissal/noise rates.

## Calendar rules

- Google Calendar integration is read-only in the MVP.
- Request the minimum required OAuth scopes.
- Use provider event IDs; do not deduplicate by event title and time.
- Use incremental sync and provider push notifications where available, plus reconciliation.
- Make last successful sync and connection health visible.
- Never present known-stale calendar data as current.
- Keep refresh tokens encrypted and restrict access.
- Do not send full event descriptions to an AI provider unless an explicit user action requires them.

## Billing and entitlement rules

- Verify entitlements server-side from durable subscription state.
- Verify Stripe webhook signatures and process webhook events idempotently.
- Never delete or hide user-authored data because a trial expires or a subscription is canceled.
- A downgrade may make excess projects/retainers inactive but must keep them readable and exportable.
- Export and account deletion are available on Free and Pro.
- Do not introduce surprise usage charges. Preserve over-limit captures for manual handling.
- Track AI and infrastructure cost by account and plan without logging private content.

The initial pricing and quotas are hypotheses defined in `PRD.md`, not hard-coded constants. Entitlements should be centrally configurable.

## UI and UX standards

- Design for desktop and mobile web from the beginning; test down to 360 CSS pixels.
- A core workflow must not require hover, a mouse, or a desktop-only control.
- Keep global capture reachable from every signed-in screen.
- Use calm hierarchy and progressive disclosure instead of dense dashboards.
- Always design empty, loading, partial, failure, offline, over-limit, archived, and deleted states.
- Show the original capture beside or within reach of the proposal.
- Make AI changes, sync health, and processing states visible.
- Never rely on color alone for priority, status, or Slipping severity.
- Target WCAG 2.2 AA and full keyboard operation for core flows.
- Use at least 44-by-44 CSS-pixel touch targets where practical.
- Respect reduced-motion preferences.
- Voice capture must always have a text alternative.

Do not add decorative complexity that slows capture or makes Today feel like an analytics dashboard.

## Security and privacy

Treat security and privacy as product requirements because Slipwell may contain client details, personal relationships, calendars, and private notes.

- Never commit `.env` files, credentials, tokens, service-role keys, or production data.
- Provide a safe `.env.example` containing names and explanations only.
- Keep privileged secrets server-side.
- Use least-privilege service accounts and OAuth scopes.
- Validate uploads by type, size, and content where applicable.
- Protect against CSRF, XSS, injection, SSRF, insecure direct-object access, and webhook forgery.
- Use short-lived signed URLs for private media.
- Redact content from monitoring and support diagnostics by default.
- Rate-limit authentication, capture, AI, search, export, and other abuse-sensitive endpoints.
- Require explicit confirmation before attaching private content to a support request.
- Review data flow and provider terms before adding an AI or analytics vendor.

Never weaken tenant isolation or privacy controls to accelerate a demo.

## Testing expectations

Match tests to the risk of the change.

### Always test

- New or changed business rules with unit tests.
- API and schema boundaries with validation tests.
- Authorization and row-level isolation for user-data access.
- Retryable jobs for idempotency.
- User-visible bug fixes with regression tests where practical.
- Core interactive behavior across desktop and mobile viewports.

### High-risk areas requiring deeper coverage

- Capture preservation and AI proposal application.
- Cross-user data isolation.
- Retainer cycle generation and rollover.
- Recurrence and timezone behavior.
- Slipping calculation and meaningful-attention events.
- Calendar synchronization and token failure.
- Billing webhooks, trial expiry, cancellation, and downgrade.
- Export and account deletion.

### Quality commands

Current runnable checks are:

- `npm run lint`
- `npm test`
- `npm run build`

Before the commercial MVP can be declared complete, add and keep canonical `package.json` commands for at least:

- Formatting check.
- Lint.
- Type check.
- Unit/integration tests.
- End-to-end tests.
- Production build.

Run the smallest relevant checks during iteration and the complete required suite before declaring a risky change finished. If a check cannot run, report why and what remains unverified.

### Manual and browser-driven testing against the dev server

`npm run dev` points at a real hosted Supabase project (see `.env.local`), not a local instance. Email/password sign-up requires confirming a magic link, which blocks non-interactive testing; email confirmation has been turned off for this project so password sign-up works immediately.

A standing test account exists for manual QA and Playwright/E2E-style checks: `test@test.com` / `testtest`. Use it to sign in at `http://localhost:3000` rather than creating new throwaway accounts.

## Analytics rules

- Use the event names and metric definitions in `PRD.md`.
- Never include capture text, note bodies, person facts, client names, or calendar descriptions in analytics.
- Prefer stable record IDs and safe categorical metadata.
- Maintain the exact definition of activation and structural acceptance.
- Measure useful Slipping outcomes, not just impressions or clicks.
- Instrument acquisition source so viral signups can be distinguished from retained target users.

## Working practices

- Inspect existing code and local instructions before editing.
- Preserve unrelated user changes in a dirty worktree.
- Keep changes narrowly scoped to the request.
- Avoid speculative abstractions and unrelated refactors.
- Update documentation when behavior, setup, schema, or decisions change.
- Use migrations and seed fixtures for reproducible database changes.
- Prefer realistic fixtures that contain no real personal or client data.
- Do not claim a feature is complete when a required failure, mobile, accessibility, or authorization state is missing.

When a proposed shortcut conflicts with a PRD invariant, flag the tradeoff rather than silently weakening the requirement.

## Definition of done for implementation work

A change is complete when, as applicable:

- It satisfies the relevant PRD requirement IDs and acceptance criteria.
- Authorization and tenant isolation are enforced server-side and in the database.
- Loading, empty, success, error, retry, and mobile states are handled.
- AI or background work is recoverable, observable, and idempotent.
- Tests cover the main behavior and important failure paths.
- Lint, type checks, relevant tests, and build pass.
- Analytics are added without sensitive contents.
- Accessibility and responsive behavior are verified.
- Documentation and environment examples are updated.
- `MVP-BUILD-TRACKER.md` reflects the resulting status and includes new release-critical verification evidence when applicable.
- No unrelated files or user changes were overwritten.

In the final handoff, summarize the user-visible outcome, list verification performed, identify any remaining risk, and link the most relevant files and tracker step.
