# Slipwell MVP Build Guide and Tracker

Last audited: 2026-08-02  
Source of truth: `PRD.md` v1.0  
Target: the complete commercial web MVP described by the PRD

This document converts the PRD into an ordered implementation plan and a living release tracker. It also records what exists in the repository today. Update it in the same change that completes a tracked item.

## How to use this tracker

Status meanings:

- ✅ **Verified** — implemented and supported by appropriate automated or manual evidence.
- 🟡 **Partial** — a prototype or part of the requirement exists, but the PRD acceptance criteria are not met.
- ⛔ **Blocked** — work cannot proceed until the stated dependency or decision is resolved.
- ⬜ **Not started** — no meaningful implementation exists yet.

Checkbox rules:

- `[x]` means the item is verified, not merely coded.
- `[ ]` means work remains. Add `Partial:` to the item when a useful subset already exists.
- A feature is not complete until authorization, failure recovery, mobile, accessibility, and relevant tests are covered.
- Add evidence to the [Verification log](#verification-log) whenever a milestone changes status.
- Never put credentials, private capture contents, or real customer data in this file.

## What “MVP” means in this PRD

The PRD uses **Phase** and **priority** for different concepts:

| Term | Meaning | Current assessment |
| --- | --- | --- |
| **Phase 0** | Product validation: interviews, willingness-to-pay testing, and an interactive prototype | 🟡 Partial |
| **P0** | A requirement priority: required for the public MVP | 🟡 Partial |
| **Phase 1** | Private web beta with the core product loop and approximately 50 beta users | 🟡 Early implementation |
| **Phase 2** | Public paid launch: billing, entitlements, push where reliable, hardening, and launch readiness; it also lists optional P1 growth work | ⬜ Not started |
| **Commercial MVP done** | All P0 requirements, the end-to-end acceptance journey, and production-like release gates pass | ⬜ Not done |

Therefore, the current Phase 0 prototype is useful validation infrastructure, but it is not the PRD’s complete MVP. The commercial MVP requires the Phase 1 core product plus the Phase 2 launch, billing, privacy, and operational requirements.

## Current repository baseline

The repository currently contains a Phase 0 prototype with these useful foundations:

- ✅ Next.js App Router, strict TypeScript, Tailwind CSS, and npm.
- ✅ A connected Supabase pilot project and version-controlled migrations.
- 🟡 Public email/password authentication and Google OAuth implementation; hosted-provider verification remains pending.
- ✅ Original text captures are inserted before the proposal provider is called.
- ✅ A server-only proposal provider boundary and an OpenRouter adapter.
- ✅ Basic versioned proposal validation, review, editing, discard, retry, accept, and undo paths.
- ✅ Prototype retainer cycle generation, carry-forward linkage, and a basic Slipping explanation/action flow.
- ✅ Row-level security is enabled on the current prototype tables.
- ✅ The current lint, unit-test, and production-build commands pass as of the audit date.

Important limitations:

- 🟡 The tested AI request currently falls back to “proposal service did not return a safe result”; the happy path is not verified.
- 🟡 Review displays only part of the supported multi-proposal output and does not provide the full PRD correction workflow.
- 🟡 `prototype_records` is not the canonical task, note, project, person, or retainer data model.
- 🟡 Retainer and Slipping logic are interactive labs, not production-grade durable workflows.
- 🟡 A migration-backed working-prototype core for Today, manual tasks, domains, finite projects, routines, lightweight people/notes, recurring tasks, project checklists, account-scoped search, and People interactions is applied to the linked pilot project. Authenticated browser and database-integration verification remain open.
- 🟡 Browser voice recording and transient synchronous transcription exist as a Phase 0 slice. By product-owner direction, recordings are never stored; a failed transcription is discarded and the user is directed to text capture. This intentionally does not meet CAP-05/REV-07’s original-audio preservation and recovery expectation.
- ⬜ There is no calendar sync, notification system, billing, account-deletion workflow, or production analytics/operations layer.
- ⬜ There are no cross-user RLS integration tests or browser end-to-end tests.
- ⬜ There is no installable PWA manifest/application-shell strategy or production deployment pipeline yet.
- ⬜ The product-validation interview and willingness-to-pay exit criteria have not been recorded as complete.

Current implementation evidence:

- Capture API and source-first insert: `src/app/api/captures/route.ts`, `src/lib/captures.ts`
- Proposal provider and schema: `src/lib/proposals/provider.ts`, `src/lib/proposals/schema.ts`
- Prototype review, retainer, and Slipping UI: `src/components/dashboard.tsx`
- Prototype retainer and Slipping rules: `src/lib/retainers.ts`
- Database schema and RLS: `supabase/migrations/20260802224924_phase0_foundation.sql`
- Current setup and commands: `README.md`, `.env.example`, `package.json`
- Working-prototype record model and surfaces: `supabase/migrations/20260803110000_working_prototype_core.sql`, `src/components/workspace.tsx`, `src/app/api/workspace/route.ts`

## Ordered MVP roadmap

Do these stages in order. A later stage may be explored, but it should not be called complete while its dependency gate is open.

| Step | Deliverable | Status | Depends on |
| ---: | --- | --- | --- |
| 0 | Validate the problem and stabilize the existing prototype | 🟡 Partial | — |
| 1 | Production foundation: auth, tenancy, environments, design system, audit | 🟡 Partial | Step 0 prototype learning |
| 2 | Canonical durable text capture without relying on AI | 🟡 Partial | Step 1 |
| 3 | Trustworthy AI proposal and review pipeline | 🟡 Partial | Steps 1–2 |
| 4 | Tasks, domains, relationships, and Today foundation | 🟡 Working-prototype slice | Steps 1–3 |
| 5 | Finite projects, templates, and meaningful activity | 🟡 Working-prototype slice | Step 4 |
| 6 | Production retainers, cycles, rollover, and history | 🟡 Prototype only | Steps 4–5 |
| 7 | Explainable Slipping engine and outcomes | 🟡 Prototype only | Steps 4–6 |
| 8 | Read-only Google Calendar synchronization | ⬜ Not started | Steps 1 and 4 |
| 9 | Routines, people, notes, and global search | 🟡 Working-prototype slice | Steps 1 and 4 |
| 10 | Browser voice capture and transcription | 🟡 Phase 0 slice | Steps 2–3 |
| 11 | Notifications, summaries, and durable processing recovery | ⬜ Not started | Steps 3, 7–10 |
| 12 | Export, deletion, privacy, and security hardening | ⬜ Not started | Stable canonical data model |
| 13 | Billing, trial, entitlements, quotas, and downgrade safety | ⬜ Not started | Steps 1–12 |
| 14 | Analytics, operations, performance, accessibility, and beta QA | ⬜ Not started | All core workflows |
| 15 | Public-launch readiness and measured release | ⬜ Not started | All previous gates |

---

## Step 0 — Validate the problem and stabilize Phase 0

**Outcome:** prove that the capture → proposal → review loop is understandable and that the retainer/Slipping wedge is valuable enough to justify the full build.

**PRD gate:** 25–40 interviews; qualified users understand the workflow; at least one-third of qualified interviewees show willingness to pay at least US$12/month; an initial alpha/beta cohort is recruited.

- [x] Build an interactive text capture and review prototype.
- [x] Provision the Supabase pilot project.
- [x] Preserve source text before attempting AI interpretation.
- [x] Diagnose the current OpenRouter failure without logging capture contents.
- [x] Verify a valid structured proposal succeeds with the configured model and ZDR route.
- [x] Verify invalid output, timeout, provider error, and retry remain recoverable.
- [x] Manually test the complete review path: accept, edit, change type/destination, discard, retry, and undo.
- [x] Manually test retainer creation, repeat cycle generation, carry-forward, history, and one Slipping outcome.
- [x] Test the core flow at 360 CSS pixels and with keyboard-only navigation.
- [ ] Conduct and record 25–40 target-user interviews.
- [ ] Record problem frequency, existing workaround, trust concerns, and perceived value without private client data.
- [ ] Test the capture, retainer, and Slipping positioning separately.
- [ ] Test willingness to pay at US$12–15/month.
- [ ] Confirm at least one-third of qualified interviewees are willing to pay at least US$12/month.
- [ ] Recruit a 10–15 person concierge alpha and a path to approximately 50 private-beta users.
- [ ] Write a short Phase 0 decision memo: proceed, narrow the wedge, or stop.

**Exit gate:** the AI happy path and failure recovery work reliably enough for testing, and the documented validation thresholds are met. This gate validates the direction; it does not make the commercial MVP complete.

## Step 1 — Build the production foundation

**Outcome:** every later feature uses a consistent authenticated, tenant-isolated, observable, accessible foundation.

**Covers:** AUTH-01–05, ONB-01–07, architecture and security foundations.

### Application and environments

- [x] Use Next.js App Router, strict TypeScript, Tailwind CSS, and npm.
- [x] Keep database changes in version-controlled Supabase migrations.
- [ ] Define local, test, staging, and production environment boundaries.
- [ ] Use separate Supabase projects for staging and production before launch.
- [ ] Select and configure a Next.js deployment platform that supports the chosen durable-job architecture.
- [ ] Document migration promotion, rollback/forward-recovery, and seed-fixture procedures.
- [ ] Add centrally managed feature flags and remotely configurable product defaults.
- [ ] Add safe secret management and automated secret scanning.
- [ ] Add canonical scripts for format check, lint, type check, unit/integration tests, end-to-end tests, and build.
- [ ] Add CI that runs the full required suite on every release candidate.
- [ ] Add a valid web app manifest, safe application-shell caching, install guidance, and browser capability fallbacks.
- [ ] Support current and previous major Chrome, Safari, Firefox, and Edge versions.
- [ ] Keep canonical APIs, validation, and domain services independent from React so future Expo clients can reuse them.

### Authentication and account lifecycle

- [ ] Partial: implement public email/password authentication, password recovery, Google OAuth, and session controls; hosted-provider verification remains pending.
- [x] Validate the session in server-side mutation handlers.
- [ ] Implement the user-directed email/password and Google OAuth sign-in options.
- [ ] Implement reliable session refresh, sign-out, session revocation, and account recovery.
- [ ] Configure public Supabase email/password and Google OAuth authentication consistently across local, staging, and production environments.
- [ ] Rate-limit authentication and protect redirect/callback handling.
- [ ] Add account deletion initiation and reauthentication hooks; finish the workflow in Step 12.
- [ ] Test expired links, replayed callbacks, invalid redirects, multiple tabs, and revoked sessions.

### Tenant isolation and data conventions

- [x] Give every current exposed prototype table an owner key and RLS policies.
- [ ] Define conventions for IDs, owner IDs, UTC timestamps, schema versions, archival, and optimistic concurrency.
- [ ] Ensure every future user-owned table has RLS before it becomes API-accessible.
- [ ] Keep privileged mutations in authenticated server application services.
- [ ] Create two-user RLS integration fixtures and prove cross-user read/write isolation for every user-owned table.
- [ ] Test direct Supabase API attempts, guessed IDs, relationship reassignment, and deleted-user access.

### Onboarding, navigation, and design system

- [x] Explain the product through capture, retainer, and Slipping outcomes rather than a feature tour.
- [x] Collect display name, locale, work type, and optional company/brand name.
- [x] Collect and confirm timezone; store timestamps in UTC and render in the confirmed timezone.
- [x] Add concise privacy, low-sensitivity pilot, AI-provider, and calendar-permission explanations.
- [ ] Suggest a small set of editable domains and allow the user to skip taxonomy setup.
- [ ] Offer optional read-only Google Calendar connection and allow it to be skipped; implement the connection in Step 8.
- [ ] Guide the first capture and first proposal review.
- [ ] Guide users who manage ongoing client work through an optional first retainer.
- [ ] Start every new account on the no-card 14-day Pro trial implemented in Step 13 and explain what happens afterward.
- [x] Define the six primary surfaces: Capture/Inbox, Today, Tasks, Projects/Retainers, People/Notes, and Search/Settings.
- [x] Keep global capture reachable on every signed-in screen.
- [x] Implement desktop navigation plus mobile bottom navigation for Today, Inbox, Tasks, Work, and Search, with More for People/Notes and Settings.
- [x] Create accessible primitives for buttons, fields, dialogs, status, errors, skeletons, and toasts.
- [x] Define calm typography, spacing, color, focus, touch-target, and responsive tokens.
- [ ] Implement empty, loading, partial, failure, offline, over-limit, archived, and deleted states.
- [ ] Meet WCAG 2.2 AA contrast/focus requirements and respect reduced motion.

### Activity, audit, and safe observability

- [x] Record basic prototype activity events.
- [ ] Separate append-only audit history from meaningful activity used by Slipping.
- [ ] Record actor, action, record type/ID, safe changed-field metadata, source, and UTC timestamp.
- [ ] Record AI model/version, latency, validation result, and cost estimate without private contents.
- [ ] Add error monitoring and structured logs with capture/note/person/calendar content redacted by default.
- [ ] Add request IDs and safe job IDs for debugging.
- [ ] Add rate limiting for capture, AI, search, export, and other abuse-sensitive operations.

**Exit gate:** a user can authenticate and onboard on mobile or desktop; every exposed record is tenant-isolated; cross-user tests pass; UI and server code share stable data and audit conventions; staging can be reproduced from migrations.

## Step 2 — Implement canonical durable text capture

**Outcome:** a capture is safe and recoverable even if AI, the network, or the browser fails.

**Covers:** CAP-01–03, CAP-05–06, CAP-08–11 and the capture invariants.

- [x] Insert original text before invoking the proposal provider.
- [x] Use an idempotency key for prototype text submission.
- [x] Never overwrite the original source with cleaned text.
- [ ] Replace the prototype capture shape with the canonical versioned capture model.
- [ ] Store source type, original text/media reference, processing state, timestamps, owner, and source metadata.
- [ ] Support explicit queued, processing, retrying, needs-review, filed, failed, and manually-filed states.
- [ ] Make text capture available globally with a visible button and `Cmd/Ctrl+J` shortcut.
- [ ] Acknowledge a successfully persisted capture within the PRD’s 500 ms target.
- [ ] Move downstream processing out of the browser request lifecycle.
- [ ] Allow manual filing when AI is disabled, unavailable, or unwanted.
- [ ] Preserve an unsent draft locally on network/offline failure and clearly show its state.
- [ ] Preserve over-limit captures for manual handling rather than discarding them.
- [ ] Prevent duplicate captures on double-click, request retry, refresh, and multiple tabs.
- [ ] Add Inbox filtering for processing, needs-review, and failed captures.
- [ ] Add unit/integration tests for state transitions and idempotency.
- [ ] Add an end-to-end test proving the source exists before the AI job starts.
- [ ] Add browser tests for refresh, tab close, offline recovery, and expired auth during submission.

**Exit gate:** manual text capture works without AI, acknowledges quickly, survives retries and browser failures, never silently loses the source, and is covered by idempotency and authorization tests.

## Step 3 — Build the trustworthy AI proposal and review pipeline

**Outcome:** AI proposes validated, explainable changes; the user can always correct or recover them.

**Covers:** CAP-04, CAP-07, REV-01–08, AI behavior and evaluation requirements.

### Provider and durable processing

- [x] Keep provider-specific code behind a server-only `ProposalProvider` boundary.
- [x] Configure OpenRouter models through environment variables.
- [x] Request ZDR and deny provider data collection.
- [x] Validate the current basic proposal payload with a versioned Zod schema.
- [ ] Fix and verify the current OpenRouter structured-output happy path.
- [ ] Return safe diagnostic categories to operators without exposing capture text.
- [ ] Run proposal generation as a durable idempotent job with retries, timeout, and dead-letter/review recovery.
- [ ] Record safe provider metadata, latency, validation result, retry count, and estimated cost.
- [ ] Support model fallback only when it preserves the same privacy and structured-output requirements.
- [ ] Add a provider contract test and a deterministic fake provider for integration/end-to-end tests.

### Canonical proposal schema

- [ ] Model operation, record type, field changes, destination/relationships, date semantics, rationale, and schema version.
- [ ] Store field-level confidence for every material extracted field.
- [ ] Support all MVP destinations: task, note, person, project, retainer, and relevant relationships.
- [ ] Support one capture producing multiple proposed records.
- [ ] Represent ambiguity explicitly rather than inventing identity, date, recurrence, promise, or relationship.
- [ ] Keep reflective notes as notes unless task intent is explicit.
- [ ] Implement deterministic date, timezone, and recurrence parsing/validation around model output.
- [ ] Reject unsupported fields, unexpected operations, prompt-injection artifacts, and invalid relationships.

### Review, correction, and recovery

- [x] Show the original capture next to the current basic proposal.
- [x] Provide basic accept, edit, change type/destination, discard, retry, and undo actions.
- [ ] Display every proposal from a multi-intent capture, not only the first one.
- [ ] Show destination, concise rationale, and field-level confidence without false precision.
- [ ] Support split, merge, remove-one, add-manual-record, and manually-file-without-AI actions.
- [ ] Require review for ambiguous dates, people, projects, retainers, recurrence, and sensitive personal facts.
- [ ] Make apply/accept atomic and idempotent; retries must not create duplicate records.
- [ ] Record before/after structural diffs and correction outcomes in the audit history.
- [ ] Make undo safe after edits and define when undo is no longer available.
- [ ] Treat corrections as feedback signals without silently changing global user behavior.
- [ ] Add opt-in auto-file only after demonstrated successful review behavior.
- [ ] Keep failed or invalid proposals as recoverable Inbox items.

### Evaluation and quality gates

- [ ] Create the PRD evaluation set: 200 text, 100 voice, 100 date/recurrence, 100 ambiguity, 50 multi-intent, 50 sensitive-note, and 50 adversarial cases.
- [ ] Measure type accuracy, relationship accuracy, date/recurrence accuracy, over-splitting, unsafe invention, structural acceptance, latency, and cost.
- [ ] Store only synthetic or explicitly approved/redacted evaluation fixtures.
- [ ] Add schema, invalid-output, timeout, fallback, injection, retry, duplicate-apply, and undo tests.
- [ ] Reach at least 85% structural acceptance on the defined beta evaluation/usage sample before public launch.
- [ ] Meet the PRD’s median interpretation latency target of under five seconds, excluding transcription.

**Exit gate:** source-first processing is durable, every accepted change derives from a validated proposal, failures remain recoverable, duplicate application is impossible, and the evaluation thresholds are met.

## Step 4 — Add tasks, domains, relationships, and Today

**Outcome:** accepted captures become useful operational records and surface in a calm daily view.

**Covers:** TSK-01–06, TSK-08, DOM-01–04, TDY-01–10. TSK-07 bulk actions are P1 and do not block this MVP.

### Tasks and relationships

- [ ] Partial: create the canonical task schema with owner, title, details, status, dates, priority, limited recurrence, primary relationships, provenance, archival fields, and RLS. The migrations are applied to the linked pilot; reminders/expanded recurrence and database tests remain open.
- [ ] Support one or more reminder times and route their delivery through the durable notification system.
- [ ] Partial: support fast manual task creation independent of AI in the working-prototype UI; authenticated browser/database verification remains open.
- [ ] Partial: implement complete, reopen, and defer behavior in the working-prototype UI; cancellation, archive, recovery, and integration coverage remain open.
- [ ] Partial: distinguish due, scheduled, defer/until, and limited recurrence semantics in storage and UI; timezone-boundary coverage remains open.
- [ ] Partial: implement daily, weekly, and monthly task recurrence separately from routines. A recurring task requires a schedule and always advances from its scheduled date; yearly, weekdays, and custom intervals remain open.
- [ ] Partial: use root/anchor uniqueness to prevent duplicate generated recurrence occurrences and unit-test short-month bounds; migration-backed retry, timezone, and DST coverage remain open.
- [ ] Link tasks to domains, projects, retainers, people, notes, and source captures where relevant.
- [ ] Add list/filter/sort views that remain usable at 360 px and by keyboard.

### Domains

- [ ] Partial: create durable top-level responsibility areas with active/archived states in the additive migration; migration promotion and archive UI remain open.
- [ ] Partial: support name, description, color, and an optional default Slipping cadence in the schema; icon support and verification remain open.
- [ ] Partial: tasks, projects, people, and notes can link to a domain in the working prototype; retainers and relationship tests remain open.
- [ ] Preserve records when a domain is archived or deleted; require an explicit resolution.
- [ ] Add domain views with relevant active work and recent meaningful activity.

### Today

- [ ] Partial: build a working-prototype Today in the confirmed user timezone; authenticated browser verification and midnight behavior remain open.
- [ ] Partial: add user-controlled Top Three selection up to three tasks; reordering and tests remain open.
- [ ] Add explainable Top Three suggestions without silently replacing user choices.
- [ ] Partial: show today’s due, scheduled, and deferred tasks in the working prototype.
- [ ] Partial: show routines, task/project Slipping, and recent captures in Today; calendar context remains open.
- [ ] Add recent-capture recovery and needs-review visibility.
- [ ] Define local-midnight rollover and behavior while the app remains open across midnight.
- [ ] Implement calm empty, loading, stale, partial, and error states.
- [ ] Instrument privacy-safe Today and Top Three events.

### Tests

- [ ] Partial: unit-test recurrence input validation and daily/weekly/monthly dates including short/leap-month behavior; task CRUD, migration-backed idempotency, deferment, authorization, and timezone tests remain open.
- [ ] Test domain archive/delete resolution and cross-user isolation.
- [ ] Test Today at timezone boundaries, DST changes, midnight rollover, empty state, partial data, and 360 px.
- [ ] End-to-end test capture → accepted task → Today visibility → completion/undo.

**Exit gate:** a user can capture or manually create a task, relate it to a domain, find it in Today, and safely complete/defer it with correct timezone behavior.

## Step 5 — Add finite projects, templates, and meaningful activity

**Outcome:** finite outcomes have inspectable plans and feed real progress—not cosmetic edits—into Slipping.

**Covers:** PRJ-01–06 and the activity-event model. PRJ-07 manual time logging is P1 and does not block this MVP.

- [ ] Partial: create a finite project schema and manual create/list UI with outcome, state, dates, domain, person, provenance, milestones, and checklist snapshots; migration promotion and validation remain open.
- [ ] Partial: add owner-scoped project milestones with ordered checkpoints, complete/reopen controls, and manually linked tasks; relationship/browser tests remain open.
- [ ] Partial: create saved project checklist templates and apply them to a project as immutable versioned snapshots; authenticated browser/database verification remains open.
- [ ] Partial: record template version and source template item on each generated checklist record; integration tests remain open.
- [ ] Partial: adding a template step creates a new version and affects future applications only; explicit current/both scope controls and template editing UI remain open.
- [ ] Partial: record task creation for a project, milestone changes, explicit progress, pause, completion, and Slipping resolution as append-only activity; decisions and richer activity updates remain open.
- [ ] Partial: task/project prototype Slipping reads append-only meaningful activity, not `updated_at`; integration verification remains open.
- [ ] Partial: add project create, pause, and guarded completion flows; editing, archiving, full history UI, and validation remain open.
- [ ] Partial: prevent project completion while linked open tasks remain; move/cancel resolution UI and archive behavior remain open.
- [ ] Partial: schema input test covers template application IDs, and database uniqueness makes repeat application reconcile by project/template/version and source item; migration-backed idempotency, template-edit, completion, and cross-user tests remain open.
- [ ] End-to-end test proposal → project/task structure → meaningful progress event.

**Exit gate:** projects represent finite outcomes, template-generated work is traceable, and meaningful activity is reliable enough to support Slipping.

## Step 6 — Build production-grade retainers

**Outcome:** monthly engagements generate reliable, inspectable cycles without duplicate or lost work.

**Covers:** RET-01–09 and retainer edge cases.

- [x] Create prototype retainer, template, cycle, and cycle-item tables.
- [x] Enforce a basic uniqueness constraint for prototype cycle generation.
- [x] Preserve a basic source-item link during prototype carry-forward.
- [x] Unit-test basic monthly cycle bounds.
- [ ] Replace/extend the prototype model with canonical retainer status, client/person/domain links, cadence, timezone, and archival fields.
- [ ] Version checklist templates and record source template/version on generated cycle items.
- [ ] Run cycle generation as a durable, transactional, idempotent job.
- [ ] Reconcile retries after partial failure without duplicates or missing items.
- [ ] Generate cycle boundaries correctly for short months, leap years, timezone changes, and DST.
- [ ] Provide current-cycle progress and inspectable prior-cycle history.
- [ ] Support default carry-forward, explicit close, and explicit leave-in-prior-cycle outcomes.
- [ ] Never silently delete incomplete work at rollover.
- [ ] Prevent repeated carry-forward chains from losing the original source/history.
- [ ] Scope mid-cycle template changes to current, future, or both.
- [ ] Support pause/resume without deleting current work or creating missed duplicates.
- [ ] Support ending a retainer while preserving history and requiring a decision for remaining open work.
- [ ] Link retainer tasks, notes, people/client, source captures, and meaningful activity.
- [ ] Add reconciliation tooling and safe operator visibility for failed generation.
- [ ] Test partial failure, repeated retries, repeated carry-forward, template edits, pause/resume, termination, short months, and DST/timezone cases.
- [ ] End-to-end test monthly creation → repeat generation → rollover → history inspection.

**Exit gate:** cycle generation and rollover are idempotent and reconcilable under failure; no open work or history can disappear silently.

## Step 7 — Build explainable Slipping

**Outcome:** tasks, projects, and retainers receive actionable attention signals based only on meaningful activity.

**Covers:** SLP-01–10.

- [x] Calculate a basic prototype signal for retainer cycle items using activity events.
- [x] Show a basic plain-language reason and prototype severity.
- [x] Record prototype mark-attention, defer, and dismiss outcomes.
- [ ] Partial: support prototype retainer cycle deliverables plus task/project signals in the additive generic-episode migration; browser/database verification remains open.
- [ ] Partial: calculate task/project cadence from append-only meaningful activity rather than generic `updated_at`.
- [ ] Define remotely configurable audited defaults by record type.
- [ ] Allow eligible users to override cadence without changing historical evidence.
- [ ] Partial: produce plain-language task/project explanations naming expected cadence and elapsed meaningful attention; retainer explanation remains its earlier prototype variant.
- [ ] Partial: derive task/project prototype severity from elapsed time, high priority, and due/target dates without shame-based language.
- [ ] Partial: support mark attention, defer, and dismiss for generic episodes; add-next-action, cadence change, and pause/archive from the signal remain open.
- [ ] Partial: record generic episode resolution as meaningful activity; outcome analytics and subsequent-action tracking remain open.
- [ ] Partial: use a partial unique index to avoid duplicate open task/project/retainer episodes; durable-job/notification behavior remains open.
- [ ] Bundle lower-severity signals into summaries.
- [ ] Test cosmetic edits, completion, deferment, dismissal, cadence changes, archive/pause, episode deduplication, and timezone boundaries.
- [ ] End-to-end test an explained signal and each primary resolution path.

**Exit gate:** every signal is explainable and actionable, cosmetic edits do not reset it, and unchanged signals do not repeatedly nag the user.

## Step 8 — Add read-only Google Calendar

**Outcome:** Today has trustworthy read-only calendar context with visible freshness and health.

**Covers:** CAL-01–08.

- [ ] Implement Google OAuth with the minimum read-only calendar scopes.
- [ ] Let the user select which calendars are included.
- [ ] Encrypt refresh tokens and restrict server-side access.
- [ ] Store provider event IDs and calendar IDs; never deduplicate by title/time alone.
- [ ] Implement initial sync, incremental sync tokens, provider push notifications, and periodic reconciliation.
- [ ] Process webhook and sync retries idempotently.
- [ ] Handle token expiry, revocation, deleted events, recurring events, all-day events, timezones, and DST.
- [ ] Show connection health, last successful sync, in-progress state, and actionable errors.
- [ ] Never present known-stale data as current.
- [ ] Show a read-only agenda/context section in Today.
- [ ] Keep full event descriptions out of AI requests unless an explicit action requires them.
- [ ] Add contract/integration tests with recorded synthetic provider fixtures.
- [ ] End-to-end test connect, sync, stale/error state, reconnect, and disconnect.

**Exit gate:** calendar context is useful, read-only, minimally scoped, recoverable, and visibly honest about freshness.

## Step 9 — Add routines, people, notes, and keyword search

**Outcome:** the remaining lightweight personal-operations records are useful without turning Slipwell into a generic database builder.

**Covers:** RTN-01–06, PPL-01–06, NTE-01–04, SRC-01–06. NTE-05 attachments are P1 and do not block this MVP.

### Routines

- [ ] Partial: store routines separately from tasks in the additive schema and working-prototype UI.
- [ ] Partial: support name, description, time-of-day group, active days, and active/archived state in the schema; reminder UI remains open.
- [ ] Partial: create or resolve one idempotent completion instance per selected local date via the unique routine/date key; database integration verification remains open.
- [ ] Partial: support Today completion and skip as distinct outcomes in the working-prototype UI; browser verification remains open.
- [ ] Avoid creating an unbounded history of recurring task instances.
- [ ] Show today plus a simple recent history; do not add streak/challenge analytics.
- [ ] Test timezone/DST behavior and confirm missed routines never enter global Slipping.

### People and notes

- [ ] Partial: add lightweight people records with name, optional pronouns, context, tags, default domain, and archive state in schema; working-prototype UI captures name/context/domain, while important dates remain open.
- [ ] Partial: store owner-scoped timestamped interaction summaries and optionally create a linked follow-up task in the working prototype; browser/database verification remains open.
- [ ] Store facts as discrete source-linked records; require review for sensitive AI-proposed facts.
- [ ] Relate people to tasks, projects, retainers, notes, and source captures.
- [ ] Suggest possible duplicate matches but never auto-merge people.
- [ ] Partial: add notes that preserve reflective content, review date, and domain/project/person/source relationships in schema; working-prototype UI supports manual title/body/links but browser/database verification remains open.
- [ ] Support note title, Markdown/plain-text body, tags, domain, review date, source, links, and archive state.
- [ ] Propose a linked task for an explicit action inside a note rather than silently converting the note.
- [ ] Partial: surface notes with a review date on or before Today in the working-prototype Today view; browser/database verification and review acknowledgement remain open.
- [ ] Keep sensitive facts review-first and avoid invented identities/relationships.
- [ ] Add archive/delete resolution and tenant-isolation tests.

### Search

- [ ] Partial: implement a unified, account-scoped working-prototype search across loaded tasks, projects, domains, people, notes, and captures. Postgres full-text indexing, retainers, filters, and performance verification remain open.
- [ ] Apply owner and archival filters before returning results.
- [ ] Show type, matching context, and destination without leaking unrelated private text.
- [ ] Keep global search keyboard and mobile accessible.
- [ ] Filter by record type, status, date range, domain, project/retainer, and person.
- [ ] Define indexing/reindexing for updates, deletion, export, and account deletion.
- [ ] Test authorization, special characters, large accounts, archived records, and latency.

**Exit gate:** routines remain distinct, people/notes stay lightweight, and authorized records can be found quickly through global keyword search.

## Step 10 — Add browser voice capture and transcription

**Outcome:** voice follows the same source-preserving review flow as text and always has a text alternative.

**Covers:** CAP-04 and voice-specific AI/non-functional requirements.

- [ ] Partial: detect browser/media capability and microphone permission before recording; supported-browser and denied-permission browser verification remain open.
- [ ] Partial: provide recording, paused, transcribing, and failed-to-text-capture states in the Phase 0 Inbox; interruption/tab-close recovery remains open.
- [ ] Partial: enforce supported MIME types, a five-minute duration, and a 25 MB size limit in the browser and route schema; server-side content inspection remains open.
- [ ] Product decision: do not store original audio in Supabase or retain it after sending it to the transcription provider. This is a user-requested exception to CAP-05 and means failed audio cannot be recovered.
- [ ] Not applicable under the transient-audio decision: no private-audio playback or signed URLs are created.
- [ ] Partial: use a stable voice-capture idempotency key for the submission. Transcription and proposal scheduling remain synchronous rather than durable jobs.
- [ ] Product decision: discard failed voice audio and direct the user to text capture rather than preserving a retryable Inbox item. This is a user-requested exception to REV-07.
- [ ] Partial: show the saved text transcript in review; direct transcript correction/re-interpretation remains open.
- [ ] Partial: send the submitted audio only to the server-only OpenAI transcription endpoint, then retain only the resulting text and model/latency metadata. Provider approval, cost estimation, and durable safe telemetry remain open.
- [x] Keep text capture available as an alternative.
- [ ] Test permission denial, interruption, unsupported browser, upload retry, tab close, duplicate request, and provider failure.
- [ ] End-to-end test record → transcribe → review → correct → file on supported browsers.

**Exit gate:** voice is optional, private, recoverable, capability-aware, and uses the same validated review path as text.

## Step 11 — Add notifications, summaries, and processing recovery

**Outcome:** users are informed about useful state changes without noise, and operators can safely recover failed work.

**Covers:** NTF-01–05 and durable-job requirements.

- [ ] Select and document the durable background-job system.
- [ ] Give every job a stable idempotency key, bounded retry policy, safe payload, and dead-letter/recovery state.
- [ ] Add in-app processing and failure notices for capture, transcription, calendar, retainer, export, and deletion jobs.
- [ ] Add email notifications/summaries with user controls.
- [ ] Add browser push only where reliable and permission-aware.
- [ ] Bundle low-severity Slipping items and suppress unchanged repeats.
- [ ] Add per-channel preferences, quiet controls, unsubscribe behavior, and timezone-aware scheduling.
- [ ] Deep-link every actionable notification to the correct authenticated record or review screen.
- [ ] Never put private record contents in provider metadata, logs, or analytics.
- [ ] Add safe operator retry/reconcile tooling with an audit trail.
- [ ] Test duplicate delivery, retry after partial failure, unsubscribe, revoked push, quiet periods, and no-state-change suppression.

**Exit gate:** retryable work is observable and recoverable, notification delivery is idempotent, and lower-value signals do not become noise.

## Step 12 — Complete export, deletion, privacy, and security

**Outcome:** users can leave safely, understand provider data flows, and trust tenant and private-media protections.

**Covers:** SET-01–08 plus security/privacy non-functional requirements.

- [ ] Partial: expose account security and a direct JSON export in Settings; profile, preferences, integrations, notifications, plan, and deletion remain open.
- [ ] Add capture preferences for auto-file threshold, original-audio retention, default domain, reminders, and confirmations.
- [ ] Partial: export the current prototype’s RLS-authorized canonical/pilot records, relationships, source data, and activity as documented JSON. CSV, Markdown notes, media manifests, completeness testing, and documented format support remain open.
- [ ] Partial: provide an authenticated direct download with `private, no-store` headers for normal-size prototype accounts. Durable idempotent jobs and expiring private downloads remain open.
- [ ] Partial: the current direct export is reachable for every signed-in prototype account; durable plan/entitlement verification remains open.
- [ ] Define a basic validated CSV/JSON import for supported canonical records, including preview, relationship handling, idempotency, and a clear error report; improved provider-specific imports remain later work.
- [ ] Implement reauthenticated account deletion with explicit confirmation and cancellation/grace behavior if promised.
- [ ] Propagate deletion to database rows, private files, search indexes, derived data, job payloads, caches, and provider-side data where applicable.
- [ ] Document backup/retention exceptions and permanent deletion behavior accurately.
- [ ] Add privacy policy, terms, AI-provider disclosure, calendar disclosure, and subprocessors/data-flow documentation.
- [ ] Add a support/feedback flow that requires explicit confirmation before private content is attached.
- [ ] Complete threat modeling for CSRF, XSS, injection, SSRF, IDOR, webhook forgery, auth abuse, private media, and service-role access.
- [ ] Add security headers, dependency scanning, upload validation, and least-privilege reviews.
- [ ] Verify monitoring/support diagnostics redact private content by default.
- [ ] Add export completeness, signed-URL expiry, deletion propagation, reauth, cancellation, and cross-user tests.

**Exit gate:** export and deletion pass end-to-end in production-like staging; private data is not exposed through logs, files, search, caches, or support diagnostics.

## Step 13 — Add billing, entitlements, trial, and downgrade safety

**Outcome:** the public MVP can charge safely without losing or hiding user-authored data.

**Covers:** BIL-01–07.

- [ ] Model configurable Free, Pro, trial, quota, and feature entitlements centrally.
- [ ] Implement the PRD’s 14-day trial and current pricing hypothesis without scattering hard-coded limits.
- [ ] Configure the current pricing hypothesis as US$15 monthly and US$144 annually; treat the optional US$99 first-year founding offer as a launch decision, not a permanent entitlement rule.
- [ ] Create Stripe Checkout/Portal flows and durable subscription state.
- [ ] Send accurate trial, payment-failure, cancellation, and downgrade lifecycle communication.
- [ ] Verify Stripe webhook signatures and process every event idempotently.
- [ ] Enforce entitlements server-side for every privileged action.
- [ ] Track account-level AI/infrastructure usage and cost without private contents.
- [ ] Preserve over-limit captures for manual handling and never introduce surprise usage charges.
- [ ] On downgrade/cancellation, keep user-authored data readable and exportable.
- [ ] Make excess projects/retainers inactive only through explicit, deterministic rules; never delete them.
- [ ] Keep export and account deletion available regardless of plan.
- [ ] Test checkout replay, out-of-order webhooks, duplicate events, trial expiry, payment failure, cancellation, resubscription, downgrade, and quota races.
- [ ] End-to-end test trial → Pro → cancellation/downgrade → retained readable/exportable data.

**Exit gate:** durable server-side entitlement state agrees with verified Stripe events, and no billing transition can destroy or silently hide user-authored data.

## Step 14 — Add analytics, operations, performance, accessibility, and beta QA

**Outcome:** the team can measure trust and reliability, operate failures safely, and verify the MVP across devices.

### Privacy-safe analytics

- [ ] Implement the exact PRD event taxonomy and metric definitions.
- [ ] Exclude capture text, note bodies, client/person names, calendar descriptions, and other private content.
- [ ] Track activation, structural acceptance, time-to-file, correction, undo, Slipping outcomes, retention, conversion, and acquisition source.
- [ ] Distinguish qualified target users and viral/unqualified signups in aggregate reporting.
- [ ] Maintain stable event schemas and document metric queries.

### Operations and reliability

- [ ] Create dashboards/alerts for auth, capture persistence, proposal jobs, transcription, cycle generation, calendar freshness, webhooks, notifications, export, and deletion.
- [ ] Add runbooks for each high-risk failure and define operator permissions.
- [ ] Verify backup, restore, migration recovery, and incident-response procedures.
- [ ] Measure AI and infrastructure unit cost by account/plan.
- [ ] Define service-level targets and error budgets around PRD reliability goals.

### Performance and accessibility

- [ ] Meet p75 under 2.5 seconds for a signed-in usable shell on typical broadband.
- [ ] Meet p95 under 500 ms for common mutation acknowledgement before async work.
- [ ] Meet median under 5 seconds for text proposal and under 8 seconds after a short voice recording ends.
- [ ] Show background processing state within 2 seconds.
- [ ] Meet keyword-search p95 under 1 second at 10,000 text records per account.
- [ ] Audit server/client component boundaries, bundle size, caching, and database query/index performance.
- [ ] Test full core flows at 360 px, tablet, and desktop widths.
- [ ] Test keyboard-only operation, visible focus, screen-reader labels/status, contrast, zoom, and reduced motion.
- [ ] Ensure at least 44×44 CSS-pixel touch targets where practical.
- [ ] Test slow network, offline transitions, partial data, and provider outage states.

### Complete quality suite

- [ ] Unit-test every business rule and schema boundary.
- [ ] Integration-test every server mutation and cross-user RLS boundary.
- [ ] Contract-test external providers and webhooks with synthetic fixtures.
- [ ] End-to-end test the full MVP acceptance journey.
- [ ] Run format check, lint, type check, unit/integration, end-to-end, and production build in CI.
- [ ] Complete an independent security/privacy review before public launch.
- [ ] Demonstrate 99.9% monthly availability readiness, daily backup/restore testing, capture loss below 0.5%, and unrecoverable duplicates below 0.5%.

**Exit gate:** production-like staging meets the PRD’s reliability, privacy, performance, accessibility, and metric-observability requirements with documented runbooks.

## Step 15 — Public-launch readiness

**Outcome:** release the focused paid product only after the core loop is reliable and useful.

- [ ] Complete every P0 requirement or record an explicit PRD change approved by the product owner.
- [ ] Pass every item in the [MVP acceptance journey](#mvp-acceptance-journey).
- [ ] Resolve every [release blocker](#release-blockers).
- [ ] Run a concierge alpha with 10–15 users and close data-loss/trust defects.
- [ ] Run a private beta toward approximately 50 users with no cross-user exposure or destructive rollover incidents.
- [ ] Confirm beta metrics are near the PRD’s go/no-go thresholds.
- [ ] Confirm support, incident response, provider outage, billing, refund, export, and deletion procedures.
- [ ] Publish focused landing/pricing/onboarding copy around capture trust, retainers, and Slipping.
- [ ] Decide which P1 content template, public-page/referral loop, or improved importer—if any—to run as a non-blocking launch experiment after the core is stable.
- [ ] Conduct a final production readiness review and record the launch decision.

**Exit gate:** the Definition of Done in the PRD is satisfied in a production-like environment and the launch decision is evidence-based.

---

## Requirement coverage summary

This table is a navigation aid, not a substitute for the detailed checklists above.

| PRD area | IDs | Status | Main step |
| --- | --- | --- | ---: |
| Authentication | AUTH-01–05 | 🟡 Partial | 1 |
| Onboarding | ONB-01–07 | ⬜ Not started | 1 |
| Capture | CAP-01–11 | 🟡 Partial | 2, 3, 10 |
| Review and correction | REV-01–08 | 🟡 Partial | 3 |
| Today | TDY-01–10 | 🟡 Working-prototype slice | 4 |
| Tasks | TSK-01–06 and TSK-08 P0; TSK-07 P1 | 🟡 Working-prototype slice | 4 |
| Domains | DOM-01–04 | 🟡 Working-prototype slice | 4 |
| Projects | PRJ-01–06 P0; PRJ-07 P1 | 🟡 Working-prototype slice | 5 |
| Retainers | RET-01–09 | 🟡 Prototype only | 6 |
| Slipping | SLP-01–10 | 🟡 Prototype only | 7 |
| Calendar | CAL-01–08 | ⬜ Not started | 8 |
| Routines | RTN-01–06 | 🟡 Working-prototype slice | 9 |
| People | PPL-01–06 | 🟡 Working-prototype slice | 9 |
| Notes | NTE-01–04 P0-light; NTE-05 P1 | 🟡 Working-prototype slice | 9 |
| Search | SRC-01–06 | 🟡 Working-prototype slice | 9 |
| Notifications | NTF-01–05 | ⬜ Not started | 11 |
| Billing | BIL-01–07 | ⬜ Not started | 13 |
| Settings, export, deletion | SET-01–08 | ⬜ Not started | 12 |
| Basic import | PRD §10 P0 scope; improved imports P1 | ⬜ Not started | 12 |
| Analytics and operations | PRD §§16, 23–24 | ⬜ Not started | 14 |

## MVP acceptance journey

The commercial MVP is not done until this journey passes end-to-end in production-like staging:

- [ ] 1. A new user signs up/signs in and confirms timezone and essential privacy/provider expectations.
- [ ] 2. The user submits a text or browser voice capture without choosing a type; dedicated tests separately verify both source types are durably preserved.
- [ ] 3. The user sees the original source, every structured proposal, destination, rationale, and confidence/review state.
- [ ] 4. The user corrects type, destination, relationships, and date semantics, then accepts and can undo.
- [ ] 5. The accepted result appears in the correct Today/project/domain/retainer context.
- [ ] 6. The user creates a finite project from a versioned checklist template.
- [ ] 7. The user creates a monthly retainer with a recurring deliverable template.
- [ ] 8. A cycle boundary generates exactly one cycle and carries incomplete work without loss, even after retry.
- [ ] 9. An explained Slipping signal appears from meaningful activity and the user records a useful outcome.
- [ ] 10. Google Calendar connects read-only, syncs, and shows honest health/freshness in Today.
- [ ] 11. A routine is created, appears in Today, and remains separate from tasks.
- [ ] 12. The user finds authorized tasks, projects, retainers, people, and notes through keyword search.
- [ ] 13. Trial, upgrade, cancellation/downgrade, and quota handling preserve readable/exportable user data.
- [ ] 14. The user exports their data and completes a verified account-deletion flow.

## Release blockers

Any one of these blocks a beta/public release:

- [ ] No known path to cross-user data access in application services, Supabase APIs, files, search, jobs, or exports.
- [ ] No silent capture or original-source loss under provider, network, browser, or quota failure.
- [ ] No duplicate accepted records, recurring instances, retainer cycles/items, webhook effects, or notifications on retry.
- [ ] No destructive billing downgrade, cancellation, retainer end, project completion, rollover, export, or deletion behavior.
- [ ] No known-stale calendar data presented as current.
- [ ] No unvalidated AI output can affect canonical records.
- [ ] Export and account deletion are available and verified.
- [ ] The core flow works at 360 px and with keyboard-only operation.
- [ ] Billing entitlements are verified server-side from durable state.
- [ ] Private record contents are absent from routine logs, analytics, monitoring metadata, and support diagnostics.

## Product and business validation gates

Track these beside engineering progress. Shipping more surface area does not compensate for weak trust or retention.

| Gate | PRD target | Result | Status |
| --- | --- | --- | --- |
| Qualified validation interviews | 25–40 | Not recorded | ⬜ |
| Willingness to pay | ≥30% at ≥ US$12/month; Phase 0 prose says at least one-third | Not recorded | ⬜ |
| Concierge alpha | 10–15 target users | Not recorded | ⬜ |
| Private beta | Approximately 50 users | Not recorded | ⬜ |
| Activation | 3 captures on 2 days + 1 reviewed route + 1 Today/Slipping action + project/retainer/calendar within 7 days | Not instrumented | ⬜ |
| AI structural acceptance | ≥85% proceed; <70% warning | Not instrumented | ⬜ |
| Activated-user six-week retention | ≥40% proceed; <25% warning | Not instrumented | ⬜ |
| Retained users replacing/reducing two tools | ≥25% proceed; <10% warning | Not instrumented | ⬜ |
| Monthly retainer rollover completion | ≥60% proceed; <35% warning | Not instrumented | ⬜ |
| Slipping intentional-action rate | ≥25% proceed; <10% warning | Not instrumented | ⬜ |
| Activated-to-paid conversion | ≥8% proceed; <3% warning | Not instrumented | ⬜ |
| Capture loss/unrecoverable duplicate rate | <0.5% proceed; >2% warning | Not instrumented | ⬜ |

## Verification log

Add a dated row when a milestone or important checkbox becomes verified. Link code, migrations, test output, screenshots, or decision notes where useful.

| Date | Scope | Evidence | Result | Verified by |
| --- | --- | --- | --- | --- |
| 2026-08-02 | Existing Phase 0 baseline | `npm run lint`, `npm test`, `npm run build` | Pass; four unit tests, no integration/E2E suite | Codex |
| 2026-08-02 | Repository audit | App routes/services, Supabase migrations, PRD v1.0, strategy and assessment documents | Prototype is partial; commercial MVP is not complete | Codex |
| 2026-08-02 | OpenRouter Phase 0 diagnosis | Harmless fixture sent to configured `google/gemini-3.1-flash-lite` with JSON mode, `data_collection: deny`, and `zdr: true` | Valid schema v1 proposal returned in approximately 1.5 seconds; no current provider-route failure reproduced. Found and corrected the recoverability gap: failed attempts had no addressable Retry state. | Codex |
| 2026-08-02 | Proposal failure recovery | `src/lib/proposals/provider.test.ts`, `src/lib/captures.test.ts`, `src/lib/dashboard.ts`, `npm test`, `npm run lint`, `npm run build` | Pass; timeouts, provider errors, and malformed output receive safe categories, preserve the source, create an addressable failed proposal for retry, and surface the newest retry state without storing provider response text. | Codex |
| 2026-08-02 | Retainer Phase 0 testability | `src/components/dashboard.tsx`, `src/lib/retainers.ts`, `src/lib/retainers.test.ts`, `npm test`, `npm run lint`, `npm run build` | Pass; the prototype now supports a selected calendar month or one-click next-cycle generation and renders preserved cycle history with accessible links to carry-forward sources. | Codex |
| 2026-08-02 | Authenticated Phase 0 manual acceptance | Founder manual verification with fictional low-sensitivity data: capture/review/undo/edit/discard/retry; retainer generation, idempotency, carry-forward, history, and Slipping action; 360 px and keyboard-only core flow | Pass, as reported by the founder. Browser name and defect IDs were not recorded. | Founder |
| 2026-08-02 | Initial problem interview | One qualified target-user interview, reported by the founder | Positive qualitative signal: participant liked the product and said they would pay. This is 1 of the required 25–40 interviews and cannot establish the PRD willingness-to-pay threshold. | Founder |
| 2026-08-02 | Step 1 onboarding and authenticated shell | `20260803090000_step1_onboarding_foundation.sql`, `src/lib/onboarding.test.ts`, `npm run lint`, `npm test`, `npm run build` | Pass: existing and future accounts receive an incomplete profile, authenticated setup stores validated profile/timezone/locale data before completion, and the responsive shell preserves Inbox while keeping unfinished surfaces transparent. Browser specs exist but were skipped without dedicated authenticated local-Supabase fixture states. | Codex |
| 2026-08-02 | Step 1 onboarding migration applied to `slipwell-phase0` | Remote migration history, schema/RLS/privilege verification query, Supabase security advisor | Pass: the profile backfill matches all auth users; onboarding columns, `user_preferences`, its RLS policy, and the auth-user trigger exist. The trigger function is not executable by `anon` or `authenticated`. The remaining advisor warning is unrelated leaked-password protection. | Codex |
| 2026-08-02 | Step 1 public authentication implementation | `src/components/sign-in.tsx`, `src/app/auth/callback/route.ts`, `src/proxy.ts`, `src/lib/auth.test.ts`, `e2e/public-auth.spec.ts`, `npm run lint`, `npm test`, `npm run test:e2e`, `npm run build`; founder manual Google sign-in | Partial: public email/password and Google entry, recovery UI, safe callback routing, SSR refresh, and session controls are implemented; 18 unit tests and 2 public-entry browser tests pass. Google sign-in was manually verified by the founder. Local Supabase integration, identity-linking, and session-revocation checks remain unverified because Docker/local Supabase is unavailable and no dedicated test identities were supplied. | Codex / Founder |
| 2026-08-02 | Working-prototype record surfaces | `20260803110000_working_prototype_core.sql`, `src/components/workspace.tsx`, `src/app/api/workspace/route.ts`, `src/lib/workspace.test.ts`, `npm run lint`, `npm test`, `npm run build` | Pass in static verification: 20 unit tests, lint, and production build. The source now has owner-scoped/RLS domains, tasks, projects, routines/completions, people, notes, Today/Top Three, manual record flows, and account-scoped prototype search. Supabase migration promotion and authenticated browser/database verification are pending; `supabase migration list` cannot run because this checkout is not linked to a project. | Codex |
| 2026-08-02 | Project progress and core Slipping prototype | `20260803120000_project_activity_and_core_slipping.sql`, `src/lib/slipping.ts`, `src/lib/slipping.test.ts`, `src/app/api/slipping/*`, `src/components/workspace.tsx`, `npm run lint`, `npm test`, `npm run build` | Pass in static verification: 22 unit tests, lint, and production build. Source now has owner-scoped ordered milestones, guarded project completion, append-only meaningful project activity, and one-open-episode task/project Slipping with explanations and resolutions in Today. Supabase migration promotion and authenticated browser/database verification remain pending. | Codex |
| 2026-08-02 | Recurring-task prototype | `20260803140000_task_recurrence.sql`, `src/lib/recurrence.ts`, `src/lib/recurrence.test.ts`, `src/app/api/workspace/route.ts`, `src/components/workspace.tsx`, `npm run lint`, `npm test`, `npm run build` | Pass in static verification: 25 unit tests, lint, and production build. Source supports daily/weekly/monthly task recurrence from an explicit scheduled-date anchor, short-month/leap-year bounds, and a root/anchor uniqueness guard against duplicate next occurrences. Supabase migration promotion and authenticated browser/database verification remain pending. | Codex |
| 2026-08-02 | Project checklist-template prototype | `20260803130000_project_checklist_templates.sql`, `src/app/api/workspace/route.ts`, `src/components/workspace.tsx`, `src/lib/workspace.test.ts`, `npm run lint`, `npm test`, `npm run build` | Pass in static verification: 23 unit tests, lint, and production build. Source now supports saved templates, item addition/version increments, project-local snapshot application, unique retry-safe instance/item constraints, and item completion with meaningful project activity. Supabase migration promotion and authenticated browser/database verification remain pending. | Codex |
| 2026-08-02 | Prototype JSON export | `src/app/api/export/route.ts`, `src/lib/export.test.ts`, `src/components/account-security.tsx`, `npm run lint`, `npm test`, `npm run build` | Pass in static verification: 27 unit tests, lint, and production build. A signed-in user can request a private/no-store JSON download of current RLS-authorized prototype and canonical records. Export-route authorization/completeness/browser-download tests, durable delivery, and deletion remain pending. | Codex |
| 2026-08-02 | People interactions and note review prototype | `20260803150000_people_interactions.sql`, `src/app/api/workspace/route.ts`, `src/components/workspace.tsx`, `src/lib/workspace.test.ts`, `npm run lint`, `npm test`, `npm run build` | Pass in static verification: 28 unit tests, lint, and production build. Source now supports owner-scoped interaction summaries, optional linked follow-up tasks, and Today visibility for due note reviews. Supabase migration promotion and authenticated browser/database verification remain pending. | Codex |
| 2026-08-02 | Linked pilot migration recovery and promotion | `npx supabase migration list`, `npx supabase migration repair`, `npx supabase db push` | Pass: the remote incorrectly marked the working-prototype migrations as applied while their tables were absent. Repaired only the false history entries, replayed the version-controlled working-prototype migrations, and verified every local migration through `20260803150000` now matches remote history. The linked pilot schema is ready for authenticated browser/database verification. | Codex |
| 2026-08-02 | Phase 0 browser voice-capture slice | `20260803160000_voice_capture_foundation.sql`, `npx supabase migration list`, `npx supabase db push`, `src/components/dashboard.tsx`, `src/app/api/voice-captures/*`, `src/lib/voice.test.ts`, `npm test`, `npm run lint`, `npm run test:e2e`, `npm run build` | Pass in static verification: 31 unit tests, lint, production build, and two public-entry browser tests (six authenticated specs skipped without dedicated fixture accounts). The migration was applied to the linked pilot. The source adds capability/permission-aware recording, preview/cancel/pause, private owner-foldered audio storage, bounded format/size/duration validation, signed playback, synchronous transcription with a recoverable retry state, and editable transcript re-interpretation. Authenticated supported/unsupported/denied-permission browser/database tests remain pending. | Codex |
| 2026-08-02 | Transient voice-audio revision | `20260803161000_remove_voice_audio_storage.sql`, `npx supabase db push`, `npx supabase migration list`, storage-bucket count query, `src/app/api/voice-captures/route.ts`, `src/components/dashboard.tsx`, `src/lib/voice.test.ts`, `npm test`, `npm run lint`, `npm run build`, fresh-production Playwright auth interaction | Pass: product owner directed removal of all Supabase voice storage. The migration was applied to the linked pilot, the `capture-audio` bucket count is zero, and the one unusable voice capture without a transcript was removed. New recordings are sent directly to OpenAI, and transcription failure directs the user to keyboard capture. This deliberately overrides CAP-05/REV-07 audio preservation/recovery expectations. | Codex |

Canonical quality commands still needed:

| Check | Command | Current state |
| --- | --- | --- |
| Format check | To be added to `package.json` | ⬜ Missing |
| Lint | `npm run lint` | ✅ Passing at baseline audit |
| Type check | To be added to `package.json` | ⬜ Missing as a dedicated check |
| Unit/integration | `npm test` | 🟡 Unit tests only |
| End-to-end | `npm run test:e2e` | 🟡 Fixture-gated browser coverage; not yet run against local-Supabase fixtures |
| Production build | `npm run build` | ✅ Passing at baseline audit |

## Immediate next milestones

These are the next three deliverables in practical order:

1. **Make Phase 0 trustworthy enough to validate.** Fix the OpenRouter happy path, preserve safe error categories, and manually verify capture/review/undo/retainer/Slipping at desktop and 360 px.
2. **Close the product-validation gap while building the foundation.** Run the interview/WTP program in parallel with canonical auth, tenant tests, environments, design primitives, and audit/activity conventions.
3. **Replace the synchronous prototype loop with the canonical source-first pipeline.** Complete durable text capture, an asynchronous idempotent proposal job, the full versioned schema, multi-proposal review, and an evaluation harness before building broad record surfaces.

## Explicitly out of scope for this MVP

Keep these parked unless the product owner explicitly changes the PRD:

- Native Expo apps, wearables, or desktop-native clients.
- Collaboration, teams, shared workspaces, assignments, or permission systems.
- Full content management, arbitrary custom databases, or a Notion-like builder.
- Full CRM/contact synchronization.
- Deep library, journal, book, quote, or highlight systems.
- Grounded AI chat across all user data.
- Automatic calendar scheduling or time blocking.
- P1 bulk task actions, manual project time entries, weekly/quarterly retainer cycles, expected retainer hours, note/file attachments, and people Slipping.
- Semantic/vector search, advanced/provider-specific imports, content workflow views, public templates, share cards, and referral mechanics.
- Inventory management.
- Public social feeds or productivity rankings.

## Completion declaration

Do not mark Slipwell’s commercial MVP complete until:

- every required P0 item is implemented or the PRD is explicitly revised;
- the acceptance journey passes in production-like staging;
- release blockers are closed;
- beta reliability and trust metrics are near the PRD thresholds;
- capture recovery, tenant isolation, retainer rollover, Slipping, calendar freshness, billing transitions, export, and deletion have dedicated automated coverage; and
- the privacy, security, accessibility, operational, and launch-readiness gates are signed off.
