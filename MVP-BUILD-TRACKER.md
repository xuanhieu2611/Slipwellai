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
- 🟡 Review now displays and resolves every proposal from a multi-intent capture, and a repeated apply is blocked by a database constraint. Split, merge, and add-manual-record corrections remain open.
- 🟡 An accepted proposal now routes into the account's own domain, project, and person records through deterministic owner-scoped name matching, and its date and repeat are re-resolved server-side from the capture's own words. Retainer destinations, promise ambiguity, and a durable proposal job remain open.
- 🟡 A capture is acknowledged as soon as its source is stored; interpretation runs as a separate claimed request, not yet as a durable background job.
- 🟡 `prototype_records` is not the canonical task, note, project, person, or retainer data model.
- 🟡 Retainer and Slipping logic are interactive labs, not production-grade durable workflows.
- 🟡 A migration-backed working-prototype core for Today, manual tasks, domains, finite projects, routines, lightweight people/notes, recurring tasks, project checklists, account-scoped search, and People interactions is applied to the linked pilot project. Authenticated browser and database-integration verification remain open.
- 🟡 Browser voice recording and transient synchronous transcription exist as a Phase 0 slice. Recordings are never stored; a failed transcription is discarded and the user is directed to text capture.
- ⬜ There is no calendar sync, notification system, billing, account-deletion workflow, or production analytics/operations layer.
- ⬜ There are no cross-user RLS integration tests or browser end-to-end tests.
- 🟡 The app is installable: a generated web app manifest, icon set, capability-aware install guidance, and a shell-only service worker with an offline fallback exist. There is still no production deployment pipeline.
- 🟡 Continuous integration runs lint, type check, unit tests, and the production build; end-to-end tests and a format check are not in CI yet.
- ⬜ The product-validation interview and willingness-to-pay exit criteria have not been recorded as complete.

Current implementation evidence:

- Capture API and source-first insert: `src/app/api/captures/route.ts`, `src/lib/captures.ts`
- Capture pipeline states, interpretation claim, and multi-item outcomes: `src/lib/capture-pipeline.ts`, `src/app/api/captures/[captureId]/interpret/route.ts`, `src/app/api/captures/[captureId]/file/route.ts`, `supabase/migrations/20260805120000_capture_pipeline_and_multi_proposal.sql`
- Proposal provider and schema: `src/lib/proposals/provider.ts`, `src/lib/proposals/schema.ts`
- Structured destinations, deterministic matching, and owner-scoped validation: `src/lib/proposals/destinations.ts`, `src/lib/proposals/catalog.ts`, `src/app/api/proposals/[proposalId]/route.ts`
- Deterministic date, timezone, and recurrence resolution around model output: `src/lib/proposals/dates.ts`, `src/lib/proposals/schema.ts`, `src/app/api/proposals/[proposalId]/route.ts`, `src/app/api/captures/[captureId]/file/route.ts`
- Prototype review, retainer, and Slipping UI: `src/components/dashboard.tsx`
- Prototype retainer and Slipping rules: `src/lib/retainers.ts`
- Database schema and RLS: `supabase/migrations/20260802224924_phase0_foundation.sql`
- Current setup and commands: `README.md`, `.env.example`, `package.json`
- Working-prototype record model and surfaces: `supabase/migrations/20260803110000_working_prototype_core.sql`, `src/components/workspace.tsx`, `src/app/api/workspace/route.ts`
- Installability, shell caching, and offline fallback: `src/app/manifest.ts`, `public/sw.js`, `public/icons/`, `src/components/service-worker-registrar.tsx`, `src/components/install-guidance.tsx`, `src/app/offline/page.tsx`
- Continuous integration: `.github/workflows/ci.yml`

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
- [ ] Partial: `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:e2e`, and `npm run build` are canonical scripts; a format check and a separate integration-test script remain open.
- [ ] Partial: `.github/workflows/ci.yml` runs lint, type check, unit tests, and the production build on every push to `main` and every pull request; end-to-end tests and a format check are not in CI yet because they need a dedicated Supabase test project and fixture storage state.
- [x] Add a valid web app manifest, safe application-shell caching, install guidance, and browser capability fallbacks.
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
- [ ] Partial: filing a capture proves ownership of every submitted domain, project, and person before insert, and unit tests cover the reassignment attempt. The record foreign keys still do not constrain the owner, so this holds only where an application service enforces it; direct Supabase API attempts, guessed IDs elsewhere, and deleted-user access remain untested.

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
- [ ] Partial: queued, interpreting, needs-review, filed, failed, and discarded states exist and are visible; an explicit retrying state and a distinct manually-filed state remain open. Manual filing is currently recorded as a `manually_filed` activity event on a `filed` capture.
- [ ] Partial: text capture is reachable from every signed-in screen through the shell button and the mobile capture button; the `Cmd/Ctrl+J` handler exists but was not exercised in a browser this session.
- [ ] Partial: the capture request now returns as soon as the source is stored, measured at 177 ms warm against the linked pilot; a p95 measurement against a production-like environment remains open.
- [ ] Partial: interpretation no longer runs inside the capture request — it is a separately claimed request against the stored capture. A durable background-job system remains open in Step 11.
- [x] Allow manual filing when AI is disabled, unavailable, or unwanted. A manually filed record now chooses the same destinations as a proposed one and appears in `Recently filed`.
- [ ] Partial: an unsent draft and its idempotency key survive refresh and a failed submission through local storage, and the restored state is labelled; browser verification of the offline transition remains open.
- [ ] Preserve over-limit captures for manual handling rather than discarding them.
- [x] Prevent duplicate captures on double-click, request retry, refresh, and multiple tabs.
- [ ] Partial: processing, needs-review, and failed captures are each visible in the Inbox with their own recovery actions; explicit filter controls remain open.
- [ ] Partial: unit tests cover claim, stranded-capture, and multi-item resolution rules; migration-backed integration tests for the state transitions remain open.
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

- [ ] Partial: schema version 3 models record type, field changes, destination relationships, due/scheduled date semantics, limited recurrence, rationale, and confidence, and version 1 and 2 proposals are upgraded on read so nothing stored becomes unreviewable. Operation type remains open.
- [ ] Partial: store and render field-level confidence for record type, title, destination, and date; body, relationship, and recurrence confidence remain open.
- [ ] Partial: a proposal routes into task and note records with domain, project, and person relationships. Retainer destinations and note/capture relationships remain open.
- [x] Support one capture producing multiple proposed records.
- [ ] Partial: a destination the model names is matched only against records the user owns, and a date or repeat the model returns is re-read from the capture's own words; an unmatched or ambiguous name, an ambiguous date phrase, and an unsupported cadence are each reported in review and never filed on their own. Promise ambiguity remains open.
- [ ] Keep reflective notes as notes unless task intent is explicit.
- [x] Implement deterministic date, timezone, and recurrence parsing/validation around model output. The model returns the capture's date words plus its own reading; the server re-resolves the words against the account's local today and prefers its own result, and a phrase with two honest readings, no supporting words, or a cadence outside daily/weekly/monthly files no date or repeat at all.
- [ ] Reject unsupported fields, unexpected operations, prompt-injection artifacts, and invalid relationships.

### Review, correction, and recovery

- [x] Show the original capture next to the current basic proposal.
- [x] Provide basic accept, edit, change type/destination, discard, retry, and undo actions.
- [x] Display every proposal from a multi-intent capture, not only the first one.
- [ ] Partial: review shows the resolved destination and date, the rationale, and record-type/title/destination/date confidence, and states in words whatever the match or the date resolution could not settle. Bulk correction across items remains open.
- [ ] Partial: remove-one (`Not this one`) and manually-file-without-AI are implemented and recorded as outcomes; split, merge, and add-manual-record remain open.
- [ ] Partial: an ambiguous or unmatched person, project, or domain, an unsettled date, and an unsupported repeat are each left unselected and explained in review rather than filed, with the readings worth one click offered. Retainers and sensitive personal facts remain open.
- [ ] Partial: apply is idempotent — a unique `(proposal_id, item_index)` claim in `proposal_applications` makes a repeated or concurrent accept reconcile against the existing record instead of creating a second one. A single-transaction apply across the claim and the record insert remains open; a failed insert releases the claim.
- [ ] Record before/after structural diffs and correction outcomes in the audit history.
- [ ] Partial: undo releases the item's recorded outcome and returns just that item to review, leaving other decisions from the same capture intact; the point at which undo expires is not defined yet.
- [ ] Treat corrections as feedback signals without silently changing global user behavior.
- [ ] Add opt-in auto-file only after demonstrated successful review behavior.
- [x] Keep failed or invalid proposals as recoverable Inbox items.

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

- [ ] Partial: create the canonical task schema with owner, title, details, status, dates, priority, limited recurrence, primary relationships, provenance, archival fields, tags, and RLS. `20260806090000_task_tags_and_idempotency.sql` adds `tasks.tags text[]` (TSK-01) and `tasks.idempotency_key`; `20260806100000_task_recurrence_expansion.sql` and `20260806100001_task_recurrence_expansion_columns.sql` widen `recurrence_rule` to yearly/weekdays/custom and add `recurrence_interval`/`recurrence_unit`; all four are applied to the linked pilot. Reminders and a full database-test pass (beyond the recurrence coverage under Tests) remain open.
- [ ] Support one or more reminder times and route their delivery through the durable notification system.
- [x] Support fast manual task creation independent of AI in the working-prototype UI. Verified live in an authenticated browser against the linked pilot on 2026-08-06: a task with title and details was added, persisted, and appeared immediately with a success toast. The double-submit risk noted here previously is closed; see "New: guard manual task creation against duplicate submission" below.
- [x] Support editing an existing task's title, details, due date, scheduled date, priority, and domain/project/person after creation. Added a new `update_task` command (`src/lib/workspace.ts`, `src/app/api/workspace/route.ts`) that reuses `create_task`'s domain/project/person ownership verification (`verifyRelations`), and an inline edit-in-place form on each task card (`TaskEditForm` in `src/components/workspace.tsx`) rather than a separate detail page/route. Recurrence rule is not editable in this v1, as scoped. Verified live against the linked pilot on 2026-08-06: editing a test task's title, due date, priority, and person link persisted after a full page reload, and the same form renders usably at 360 px.
- [x] `complete_task`, `defer_task`, and `reopen_task` all work as intended now. **Defer** previously always sent `until: null` with no date input anywhere; it now opens an inline date picker with an explicit "Defer to date" or "Defer without a date" choice, and `taskDateLabel` reflects the result. Today's on-the-day filtering (`isTaskOnDay` in `src/lib/workspace.ts`) was also fixed to treat a set `deferred_until` as authoritative over `due_on`/`scheduled_for`, matching `taskDateLabel`'s own priority — previously a task deferred to a future date but still due today would incorrectly keep showing in Today. **Reopen** is now reachable through a new Completed section on the Tasks page (most recent 20 completed tasks) that feeds the existing `TaskList` component, whose Reopen button already worked once given a non-open task to render. Deferring records a `deferred` activity event unconditionally (`recordActivity` in the shared complete/reopen/defer branch), which the Slipping evaluator already reads as meaningful task attention — so deferment already counts as intentional attention per TSK-05, with or without a specific date. Verified live against the linked pilot on 2026-08-06: deferring a task to a future date changed its display label and removed it from Today's on-the-day list even though its due date was still today; deferring without a date cleared the deferred date (falling back to the due date) while a "Task deferred without a date" toast confirmed the activity was recorded; completing a task, finding it in Completed, and clicking Reopen returned it to Open work.

  **TSK-08 deletion is now implemented.** `cancel_task` sets `status = 'canceled'`, a state distinct from `completed_at`/`archived_at` so a canceled task remains a separate historical record rather than reusing completion; it stays visible in a new Canceled section instead of being hidden. `delete_task`/`restore_task` set/clear `tasks.archived_at`, the exact soft-delete flag every other entity in this schema already uses — since every read query already filters on `archived_at is null`, setting it is the entire deletion mechanism, and clearing it is the entire recovery mechanism. There is no permanent-purge path for tasks yet; per AGENTS.md's soft-delete rule this is an explicit, documented gap, out of scope until Step 12 (export/deletion), not an oversight. All three transitions record an activity event (`canceled`/`deleted`/`restored`) the same way `complete_task`/`defer_task`/`reopen_task` already do; this is safe against Slipping mis-reading a delete as attention because the evaluator (`src/app/api/slipping/evaluate/route.ts`) only ever queries `status = 'open'` tasks; a canceled or deleted task drops out of that query the moment the transition fires, so its activity events cannot inflate its own attention signal, and a `restored` task re-entering `open` work being counted as attention is intentional (the user just acted on it). `TaskList` (`src/components/workspace.tsx`) gained Cancel/Delete buttons for open tasks, Delete for completed/canceled tasks, and Restore for deleted ones, plus new Canceled and Deleted sections on the Tasks page (most recent 20 each, hidden when empty) so neither state is unreachable. `isTaskOnDay`/Today filtering needed no code change — confirmed by reading `openTasks`'s existing `status === "open"` filter in `src/components/workspace.tsx`, which now also excludes `archived_at`, so canceled/deleted tasks were already excluded from Today and Top Three. Verified live against the linked pilot on 2026-08-06: canceling a task moved it into a new Canceled section with its domain/person/tags intact; deleting it moved it into a new Deleted section and it disappeared from every other list; restoring it returned it to Canceled with all data intact; keyboard-only (Tab/Enter, no mouse) successfully triggered Cancel.
- [ ] Partial: distinguish due, scheduled, defer/until, and limited recurrence semantics in storage and UI, including from an accepted or manually filed capture; timezone-boundary integration coverage remains open. The defer/until half is now verified live (see above); recurrence-rule editing after creation remains out of v1 scope.
- [x] Implement daily, weekly, monthly, yearly, weekdays (Mon-Fri only, skipping weekends), and a limited custom interval (1-30 days or weeks) task recurrence, separately from routines. A recurring task requires a schedule and always advances from its scheduled date (`nextRecurrenceDate` in `src/lib/recurrence.ts`); a yearly anchor on Feb 29 clamps to Feb 28 the next non-leap year, mirroring the existing monthly short-month clamp, rather than rolling into March. All six cadences now have live verification evidence against the linked pilot on 2026-08-06 (weekly on 2026-08-06 in the prior pass; daily, monthly, yearly, weekdays, and custom in this pass) — each completed task generated exactly one correct next occurrence: daily 2026-08-06→08-07; monthly 2026-01-31→02-28 (short-month clamp); yearly 2026-08-06→2027-08-06; weekdays Fri 2026-08-07→Mon 2026-08-10 (skipped the weekend); custom (every 3 weeks) 2026-08-06→08-27.
- [x] Use root/anchor uniqueness to prevent duplicate generated recurrence occurrences and unit-test short-month/leap-day/weekday-skip/custom-interval bounds (`src/lib/recurrence.test.ts`). No duplicate occurrence was produced in any of the six live recurrence tests above, confirmed both in the UI and by querying `tasks` directly for each root's rows. Migration-backed coverage now proves the `recurrence_root_id`/`recurrence_anchor` unique index itself rejects a duplicate insert, not just that the application code avoids retrying one — see the new integration test under Tests. DST-specific coverage remains open (dates are computed as UTC calendar arithmetic, not local-clock arithmetic, so DST does not apply to this scheme, but that assumption itself is untested).
- [ ] Partial: a task or note created from a capture links to a domain, project, person, and its source capture, whether it was filed from a proposal or filed manually. Retainer and note-to-note links remain open.
- [x] New: show a task's linked domain, project, and person somewhere on the task itself. `TaskList` now looks up `domain_id`/`project_id`/`person_id` against `data.domains`/`data.projects`/`data.people` (already loaded into `WorkspaceData`) and renders the domain name with its color dot, project name, and person name on every task card across Tasks, Today's Top Three, and Today's On the day, since they all share the same component. Task tags (new `tasks.tags` column) render as pills on the same card, and a small "Related notes" line lists any note sharing the task's domain/project/person (notes have no direct task-linking field today, so this is the smaller-scope fallback the plan allows). Verified live against the linked pilot on 2026-08-06: a task created with a domain, project, and person showed all three plus its tags on its card in both Tasks and Today. Known gap: if a task's domain is later archived, the domain badge silently stops rendering (the domain drops out of `data.domains`, which already excludes archived rows) even though `domain_id` is still stored — the link is preserved, just not displayed; this is consistent with `archive_domain`'s block-first design below, which prevents that from happening to *open* work in normal use.
- [x] New: guard manual task creation against duplicate submission. `create_task` now takes a required `idempotencyKey` (client-generated via `crypto.randomUUID()`, same pattern as capture submission) backed by a new `unique (owner_id, idempotency_key)` constraint on `tasks`; a retried insert that hits the constraint looks up and returns the already-created task instead of erroring or duplicating it. `NewTaskForm` (`src/components/workspace.tsx`) disables its submit button while the request is in flight, mirroring capture submission's guard. Verified live against the linked pilot on 2026-08-06: firing three synchronous submits at the same form (a harder case than a real double-click, which the disabled-button state alone already prevents) produced exactly one task row — the open-task count went from 8 to 9, not 11, confirming the server-side idempotency key is what actually guarantees no duplicate, not just the UI guard.
- [x] Add list/filter/sort views that remain usable at 360 px and by keyboard (TSK-06). The Tasks page (`src/components/workspace.tsx`) replaced the four fixed Open/Completed/Canceled/Deleted sections with one filtered list governed by a `TaskFilters` bar: status (open/completed/canceled/deleted/any), date (any/has a date/no date), priority, domain, project, person, and Slipping (joined against `data.signals` by `entity_type === "task"` and `entity_id`, which turned out to be a clean join), plus sort by newest-first (default), due/scheduled date (undated last), or priority. All client-side over the already-loaded `data.tasks`, using the existing `field-base`/`button-base`/`form-grid` patterns rather than a new control style; `form-grid` already collapses to one column under the existing 360 px breakpoint. Verified live against the linked pilot on 2026-08-06: each filter individually and combined (e.g., person + priority narrowing 13 open tasks to 1) produced the correct set; sort by date and by priority both produced correct order; the Slipping filter correctly showed 0 while no signals were active; the filter bar and its "Reset filters" control render as a single stacked column at 360 px with no overflow. Keyboard operability of the underlying controls is by construction (plain native `<label>`-wrapped `<select>`/`<input>` elements, no custom key handling) rather than separately proven here — this session's headless browser automation could not reliably simulate native `<select>` keyboard interaction to demonstrate it directly (a known Playwright/headless-Chromium limitation with native dropdown pickers, not an app behavior), so a human keyboard pass is still worth a spot check.

### Domains

- [x] Create durable top-level responsibility areas with active/archived states in the additive migration, and an archive control in the domain list UI (`archive_domain` command, `src/app/api/workspace/route.ts`/`src/components/workspace.tsx`). Migration promotion was already done; archive UI is the part this batch closed. Verified live against the linked pilot on 2026-08-06 (see below).
- [ ] Partial: support name, description, color, and an optional default Slipping cadence in the schema; icon support and verification remain open.
- [ ] Partial: tasks, projects, people, and notes can link to a domain in the working prototype; retainers and relationship tests remain open.
- [ ] Partial: preserve records when a domain is archived or deleted; require an explicit resolution. `archive_domain` counts non-archived open tasks, active projects, people, and notes still linked to the domain and blocks archiving with a specific-count message (e.g. "This domain still has 1 open task. Reassign or resolve them before archiving.") rather than archiving silently or orphaning them — the "block with a clear count" v1 the plan allows, not a full reassignment UI. This gives a real resolution path for tasks (edit the task's domain, or cancel/delete it) and projects (complete/pause it), but **not** for people or notes: neither has an archive, delete, or domain-reassignment command yet, so a domain whose only remaining links are a person or a note currently has no UI path to resolution short of removing that link at the database level. This is a known gap, not a silent one — flagging it here rather than overclaiming. Verified live against the linked pilot on 2026-08-06: archiving a domain with one open task blocked with the exact count message and left the domain unarchived; deleting that task and retrying archived it successfully; archiving a domain with nothing linked archived immediately and disappeared from every domain picker.
- [ ] Partial: add domain views with relevant active work and recent meaningful activity. The domain list now shows a live open-task and active-project count per domain (computed client-side from already-loaded `WorkspaceData`) so a user has enough visibility to use the resolution above without a dedicated domain page. A fuller domain view (recent meaningful activity, not just counts) remains the later Step 4 domain-view scope, intentionally out of this batch.

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

- [x] Unit-test recurrence input validation and daily/weekly/monthly/yearly/weekdays/custom dates, including short-month, leap-day, weekend-skip, and interval-arithmetic behavior (`src/lib/recurrence.test.ts`), plus schema acceptance/rejection for the new rules and the custom-interval refine (`src/lib/workspace.test.ts`). `update_task`'s schema shape and its domain/project/person relation fields, and `isTaskOnDay`'s deferred-over-due/scheduled priority, were already covered. Migration-backed idempotency, cross-user authorization, and a timezone-boundary case now exist too: `src/lib/workspace.integration.test.ts`, run via `npm run test:integration` (a new script; separate `vitest.integration.config.mts` so `npm test`/CI, which only has placeholder Supabase values, never touches the hosted pilot). It runs against the real hosted pilot project rather than a local Postgres instance — this sandbox has no Docker for `supabase start` — using the standing `test@test.com` account plus a second throwaway `test2@test.com` account created for cross-user checks, and cleans up every row it creates. Coverage: (1) idempotency — a retried `create_task`-shaped insert with the same `(owner_id, idempotency_key)` hits the real unique-constraint violation (`23505`) rather than just being avoided by application logic, and the same is proven for a duplicate `(recurrence_root_id, recurrence_anchor)` occurrence; (2) cross-user authorization — a second account's select/update/delete against the first account's task id all affect zero rows under RLS, and the original task is confirmed unchanged afterward; (3) timezone boundary — `localDate` against a real `user_preferences.timezone` value resolves the correct local calendar day on either side of a UTC midnight boundary for `America/Vancouver`, and a task due on that local day is confirmed via `isTaskOnDay`. What this does not cover: it exercises the database/RLS layer directly via `supabase-js`, not the Next.js API route handlers over HTTP, so route-level bugs outside the constraint/RLS layer itself would not be caught here; and the timezone case covers one instant pair in one timezone, not DST transitions or a full midnight-rollover sweep.
- [ ] Test domain archive/delete resolution and cross-user isolation.
- [ ] Test Today at timezone boundaries, DST changes, midnight rollover, empty state, partial data, and 360 px.
- [x] End-to-end test capture → accepted task → Today visibility → completion/undo (`e2e/task-lifecycle.spec.ts`, gated behind `PLAYWRIGHT_AUTH_STORAGE_STATE` like the existing specs). Captures a task-shaped text with an unambiguous due phrase ("today"), polls the Inbox for its review card (matched by the capture's own original text, which always renders verbatim regardless of how the model titles the proposal — not by the AI-chosen title), pins the title to a known value before accepting (the model may title or classify differently than expected, e.g. it read the test's random marker as a candidate project name once), adds the resulting task to Today's Top Three (a deterministic user action, used instead of depending on whether the model's date phrase happened to resolve to a due-today date), completes it there, then reopens it — read as "undo the completion" per the existing product vocabulary, since this app's "Undo" is a distinct, differently-scoped action on proposals — from the Tasks page's Completed filter, and deletes it. Passes reliably run alone (confirmed three consecutive runs); running desktop and mobile projects concurrently against this same shared account can race the real AI interpretation call and strand one of the two captures beyond a generous poll budget — a shared-test-account/AI-latency contention risk to know about, not a defect in this change. Also fixed while building this: `page.reload()` shortly after closing the capture dialog can outrun the dialog's fire-and-forget `keepalive` interpret request and mark the capture stranded ("connection dropped") purely from that timing — the test now waits briefly and clicks "Interpret it now" if it sees that state, and this is worth knowing about for anyone driving the same flow by hand quickly. Also discovered, unrelated to this change and left unfixed as out of scope: `e2e/onboarding.spec.ts`'s "authenticated shell" tests expect copy ("Nothing important slips through.", "A quieter daily view is taking shape.") that Inbox/Today no longer show, having moved on since those tests were written; this only surfaces when a real `PLAYWRIGHT_AUTH_STORAGE_STATE` is supplied, which is not the default CI condition, so it has apparently gone uncaught until this session's verification pass.

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

**Outcome:** voice becomes a text transcript for the same review flow as typed capture; audio remains transient and text capture is always available.

**Covers:** CAP-04 and voice-specific AI/non-functional requirements.

- [ ] Partial: detect browser/media capability and microphone permission before recording; supported-browser and denied-permission browser verification remain open.
- [ ] Partial: provide recording, paused, transcribing, and failed-to-text-capture states in the Phase 0 Inbox; interruption/tab-close recovery remains open.
- [ ] Partial: enforce supported MIME types, a five-minute duration, and a 25 MB size limit in the browser and route schema; server-side content inspection remains open.
- [ ] Do not store original audio in Supabase or retain it after sending it to the transcription provider; only a successful transcript becomes a capture source.
- [ ] Not applicable under the transient-audio decision: no private-audio playback or signed URLs are created.
- [ ] Partial: use a stable voice-capture idempotency key for the submission. Transcription remains synchronous inside the upload request; interpretation now runs as a separate claimed request, like typed capture, rather than a durable job.
- [ ] Discard failed voice audio and direct the user to text capture rather than preserving a retryable Inbox item.
- [ ] Partial: show the saved text transcript in review; direct transcript correction/re-interpretation remains open.
- [ ] Partial: send the submitted audio only to the server-only OpenRouter transcription endpoint using an OpenAI transcription model, then retain only the resulting text and model/latency metadata. Provider approval, cost estimation, and durable safe telemetry remain open.
- [x] Keep text capture available as an alternative.
- [ ] Test permission denial, interruption, unsupported browser, upload retry, tab close, duplicate request, and provider failure.
- [ ] End-to-end test record → transcribe → review → correct → file on supported browsers.

**Exit gate:** voice is optional, transient, capability-aware, and uses the same validated review path as text after transcription succeeds; text remains the clear fallback on failure.

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
- [ ] Add capture preferences for auto-file threshold, default domain, reminders, and confirmations. Audio retention is intentionally absent because voice recordings are never stored.
- [ ] Partial: export the current prototype’s RLS-authorized canonical/pilot records, relationships, source data, review outcomes, and activity as documented JSON. CSV, Markdown notes, media manifests, completeness testing, and documented format support remain open.
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
| 2026-08-02 | Superseded Phase 0 browser voice-capture slice | `20260803160000_voice_capture_foundation.sql`, `npx supabase migration list`, `npx supabase db push`, `src/components/dashboard.tsx`, `src/app/api/voice-captures/*`, `src/lib/voice.test.ts`, `npm test`, `npm run lint`, `npm run test:e2e`, `npm run build` | Historical record: the initial slice stored private audio. It was superseded the same day by the transient-audio implementation below and must not be used as current product guidance. | Codex |
| 2026-08-02 | Transient voice-audio revision | `20260803161000_remove_voice_audio_storage.sql`, `npx supabase db push`, `npx supabase migration list`, storage-bucket count query, `src/app/api/voice-captures/route.ts`, `src/components/dashboard.tsx`, `src/lib/voice.test.ts`, `npm test`, `npm run lint`, `npm run build`, fresh-production Playwright auth interaction | Pass: the migration was applied to the linked pilot, the `capture-audio` bucket count is zero, and the one unusable voice capture without a transcript was removed. New recordings are sent directly to OpenRouter with an OpenAI transcription model, and transcription failure directs the user to keyboard capture, consistent with the updated CAP-05 and REV-07. | Codex |
| 2026-08-02 | OpenRouter voice-transcription adapter | `src/lib/transcription.ts`, `src/lib/transcription.test.ts`, `.env.example`, `README.md`, `supabase/config.toml`, `npm test -- src/lib/transcription.test.ts`, `npm run lint`, `npm run build` | Pass: transient browser audio is submitted as multipart data to OpenRouter's transcription endpoint with the configured `openai/gpt-4o-transcribe` default. The adapter accepts only a non-empty transcript and uses `OPENROUTER_API_KEY`; the app and local Supabase configuration no longer require `OPENAI_API_KEY`. | Codex |
| 2026-08-03 | Visual identity rebuild | `src/app/globals.css`, `src/app/layout.tsx`, `src/components/theme-toggle.tsx`, `src/components/app-shell.tsx`, `src/components/sign-in.tsx`, `src/components/build-state-page.tsx`, `src/components/ui/primitives.tsx`, `npm run lint`, `npm test`, `npm run test:e2e`, `npm run build`; desktop/mobile screenshots in both themes | Pass: 33 unit tests, lint, build, and both public-auth browser tests (desktop and mobile). The moss/warm-paper brand was replaced, at the user's explicit direction, with a cobalt-on-graphite identity: rebuilt CSS-variable token layer, first dark mode (system preference plus a persisted manual toggle), one documented three-step radius scale, Space Grotesk/Instrument Sans/JetBrains Mono, and a Phosphor icon set. Contrast was measured for twelve foreground/background token pairs in both themes; all pass WCAG AA (lowest 5.16:1). Reduced-motion and reduced-transparency fallbacks are in place. WCAG 2.2 AA remains unchecked: target size, focus appearance, and keyboard-navigation conformance were not audited. Authenticated surfaces were verified against the linked pilot in a browser; the six onboarding browser tests stayed skipped for lack of an authenticated storage-state fixture. | Claude |
| 2026-08-03 | Inbox review card rebuild and capture discard | `src/components/dashboard.tsx`, `src/app/globals.css`, `src/components/ui/primitives.tsx`, `src/lib/dashboard.ts`, `src/app/(authenticated)/[surface]/page.tsx`, `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build`; authenticated browser verification against the linked pilot at 1280 px and 360 px in both themes | Pass: 33 unit tests, lint, type check, and build. The Inbox now uses the shared design system instead of ad-hoc styles, and each review card reads source → proposal → decision. Fixed in the process: a wrapped confidence chip, a clipped due-time input, proposal fields that carried no visible labels, and a controlled-input bug where clearing the title silently restored the model's value. A failed interpretation is now recoverable in two directions — `Interpret again` or `Discard`, with a two-step in-card confirmation — where the only prior action was retry; the failure explanation is now taken from the stored `failure_code`. Discard still routes through the existing proposal action, so a capture without any proposal row cannot be discarded from the Inbox. | Claude |
| 2026-08-03 | Workspace command validation fix and toast feedback | `src/lib/workspace.ts`, `src/app/api/workspace/route.ts`, `src/lib/workspace.test.ts`, `src/components/ui/toast.tsx`, `src/components/ui/primitives.tsx`, `src/components/app-shell.tsx`, `src/components/workspace.tsx`, `src/app/globals.css`, `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` | Pass in static verification: 36 unit tests, lint, type check, and build. Fixed a release-blocking defect: every manual creation form (domain, project, task, person, note, checklist template, person interaction) was rejected with "That workspace change was not valid" whenever an optional text field was left blank, because the forms post `null` for a cleared field while `optionalText` accepted only `undefined`. The prior tests omitted those fields entirely and so never exercised the payload the browser actually sends; a regression test now asserts the real shape. Validation failures also name the offending field instead of failing anonymously. Workspace feedback moved from a page-top inline banner to a shared toast stack mounted in the app shell, with success confirmations that did not previously exist and mobile positioning clear of the tab bar and capture button. Authenticated browser verification against the linked pilot is pending — it needs a signed-in session that was not available in this environment. | Claude |
| 2026-08-05 | Installable app shell, offline fallback, and CI | `src/app/manifest.ts`, `public/sw.js`, `public/icons/`, `src/components/service-worker-registrar.tsx`, `src/components/install-guidance.tsx`, `src/app/offline/page.tsx`, `src/lib/pwa.ts`, `src/lib/pwa.test.ts`, `src/lib/service-worker.test.ts`, `src/proxy.ts`, `.github/workflows/ci.yml`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`; authenticated browser verification of a production build against the linked pilot at 1280 px and 360 px | Pass: 52 unit tests, lint, type check, and build. Chrome fetched the generated manifest, offered its install prompt on Settings, and activated the service worker; the precache contained exactly `/offline` and the three icons. After signing in and browsing Inbox and Settings, the cache held only content-hashed `/_next/static/` assets plus those four public files — no API response, no `/auth/*` response, and no authenticated HTML — and an offline navigation to `/today` rendered the offline shell instead of stale data. Install guidance is unit-tested for the prompt, installed, iOS, macOS Safari, Firefox, and generic branches; only the Chromium prompt branch was exercised in a real browser. CI is not yet proven on GitHub because this is the first commit containing the workflow, and it does not yet run end-to-end tests or a format check. | Claude |

| 2026-08-05 | Multi-intent review and out-of-request interpretation | `20260805120000_capture_pipeline_and_multi_proposal.sql`, `src/lib/capture-pipeline.ts`, `src/lib/capture-pipeline.test.ts`, `src/lib/captures.ts`, `src/lib/captures.test.ts`, `src/app/api/captures/route.ts`, `src/app/api/captures/[captureId]/interpret/route.ts`, `src/app/api/captures/[captureId]/file/route.ts`, `src/app/api/proposals/[proposalId]/route.ts`, `src/app/api/voice-captures/route.ts`, `src/app/api/export/route.ts`, `src/components/dashboard.tsx`, `src/components/capture-dialog.tsx`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:e2e`, `npm run build`; authenticated browser verification against the linked pilot at 1280 px and 360 px | Pass: 63 unit tests, lint, type check, production build, and both public-auth browser tests. Two release-critical defects were closed. (1) A multi-intent capture silently lost intents: review read only `proposals[0]`, accepting it marked the whole capture filed, and `tasks.proposal_id`/`notes.proposal_id` were unique so a second record could not have been filed anyway. Every proposed item is now shown and resolved independently, the capture stays in review until each has an outcome, and undo releases one item without disturbing the others. Verified live: a two-intent capture filed record 1, kept record 2 reviewable at `1 of 2 to decide`, and closed only after record 2 was dismissed. (2) Interpretation ran inside the capture request, so a closed tab left an invisible capture stuck in `interpreting`. Capture now acknowledges on persist (177 ms warm, versus 2.8 s for the interpretation it no longer waits for), interpretation is a separately claimed request, and stored-but-uninterpreted captures appear in the Inbox with `Interpret it now` and `File it myself`. Idempotency was verified against the pilot: two concurrent accepts of the same item produced one task and an `alreadyApplied` response; two concurrent interpret calls produced one proposal; a resubmitted idempotency key returned the same capture. Remaining risk: interpretation is still a browser-initiated request rather than a durable job, apply spans a claim plus an insert instead of one transaction, offline draft recovery was not exercised in a browser, and manually filed records do not appear in the Inbox's `Recently filed` list because that list only reads proposal-linked records. | Claude |

| 2026-08-05 | Structured destination routing for proposals | `src/lib/proposals/schema.ts`, `src/lib/proposals/destinations.ts`, `src/lib/proposals/destinations.test.ts`, `src/lib/proposals/catalog.ts`, `src/lib/proposals/catalog.test.ts`, `src/lib/proposals/schema.test.ts`, `src/lib/proposals/provider.ts`, `src/lib/captures.ts`, `src/lib/captures.test.ts`, `src/lib/dashboard.ts`, `src/lib/dashboard.test.ts`, `src/app/api/proposals/[proposalId]/route.ts`, `src/app/api/captures/[captureId]/file/route.ts`, `src/components/dashboard.tsx`, `src/app/globals.css`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`; authenticated browser verification against the linked pilot at 1280 px and 360 px in both themes | Pass: 102 unit tests, lint, type check, and build. Accepting a proposal previously produced a task or note with `domain_id`, `project_id`, and `person_id` all null — the model's only destination output was a free-text name that was dropped for both record types — so every AI-filed record landed unfiled. Proposal schema version 2 replaces that name with a structured destination, and version 1 proposals are upgraded on read so nothing already stored became unreviewable (verified live: a two-day-old version 1 capture still opened in review). The model is given the account's existing domain, project, and person names and returns names only, never identifiers; matching them to records happens server-side against owner-scoped rows, and an unmatched or ambiguous name is stated in review rather than resolved. Verified live end to end: a capture naming "Meridian" showed `No person called "Meridian" yet`, filing it with the explicit create option produced one person and a task linked to it, and a later capture naming Meridian was routed by the model into that existing person and arrived in review preselected — with no duplicate person created. Security: `applyDestinationSelection` proves ownership of every submitted identifier before insert, because the `tasks` and `notes` foreign keys do not constrain the owner of the row they point at and RLS on the insert only proves the task is the caller's — without it a crafted request could attach one account's task to another account's project. Also fixed: manually filed records were absent from `Recently filed` because the list read only proposal-linked rows. Remaining risk: the ownership check is application-level only, so a future write path that skips it reopens the gap; no migration-backed cross-user integration test exists yet; matching is exact after casefolding, so a near-miss name reads as unmatched; and a retainer is still not a proposal destination. | Claude |

| 2026-08-05 | Deterministic dates and recurrence around model output | `src/lib/proposals/dates.ts`, `src/lib/proposals/dates.test.ts`, `src/lib/proposals/schema.ts`, `src/lib/proposals/schema.test.ts`, `src/lib/proposals/provider.ts`, `src/app/api/proposals/[proposalId]/route.ts`, `src/app/api/captures/[captureId]/file/route.ts`, `src/lib/dashboard.ts`, `src/components/dashboard.tsx`, `src/app/globals.css`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`; authenticated browser verification against the linked pilot at 1280 px and 360 px | Pass: 144 unit tests, lint, type check, and build. A proposed date was previously filed exactly as the model resolved it, with nothing checking it — the least verifiable field in a proposal, and the one whose errors are invisible afterwards. Proposal schema version 3 asks the model for the capture's own date words alongside its reading of them; `resolveProposalDate` re-reads the words against the account's local today and prefers its own result. A phrase with two honest readings (`next Friday`, `3/4`, a weekday naming today), one the grammar does not cover, one that resolves into the past, or a date with no words behind it at all files no date and says why in review, offering each reading as one click. A repeat is validated the same way: the phrase must support the rule, and `every other Tuesday`, `biweekly`, and `quarterly` are named as cadences this MVP cannot express rather than rounded to weekly. Filing now writes `due_on` versus `scheduled_for` by the proposed date semantics, plus `due_time`, `recurrence_rule`, and `recurrence_anchor`; a note's date becomes its `review_on`. An accept with no edits re-resolves server-side rather than trusting the stored model date. Verified live end to end: a two-intent capture produced a weekly Monday task scheduled 2026-08-10 at 09:00 (read from “every Monday”) and a `by next Friday` task with an empty date, a disabled repeat, and both readings offered; choosing Fri 14 Aug filed `Due 2026-08-14`, and completing the recurring task generated its next occurrence on 2026-08-17. A version 2 proposal stored two days earlier opened with its stale date held back — “Tue 4 Aug has already passed” — instead of filing it. Remaining risk: the grammar is deliberately bounded, so an uncovered phrase costs the user one click even when the model was right; timezone and DST behaviour is unit-tested through `localToday` and date-only arithmetic rather than by integration test; and the model is still trusted to copy the capture's words into `datePhrase` accurately, which no evaluation set measures yet. | Claude |

| 2026-08-06 | Authenticated Tasks (Step 4) QA pass, no code changes | Playwright against the running `npm run dev` server and the linked pilot, signed in as `test@test.com` per `AGENTS.md` | Manual creation, capture-to-task filing (including live date resolution to 2026-08-11 from "next Tuesday" and unmatched-person handling for "accountant"), weekly recurrence generation (single next occurrence, no duplicate), task completion, keyboard-only completion, and the 360 px layout all passed. Two release-relevant defects found and confirmed by reading `src/components/workspace.tsx` and `src/app/api/workspace/route.ts`: Defer always submits `until: null` with no date input anywhere, so it is a no-op; and completed tasks are permanently invisible because every task list in the app filters to `status === "open"`, leaving `reopen_task` unreachable despite existing server-side. Also confirmed no task edit path exists at all (no `update_task` command), a task's domain/project/person link is never displayed once set, and manual task creation has no duplicate-submission guard. Tracker items above were corrected to reflect this. See `docs/task-crud-completion-plan.md` for the fix plan. Test artifacts left under `test@test.com`: one completed task, one recurring task (next occurrence 2026-08-13), one AI-filed task ("Call the accountant about Q3 taxes"). | Claude |
| 2026-08-06 | Task CRUD completion: editing, working Defer, and a reachable Completed/Reopen surface | `src/lib/workspace.ts`, `src/lib/workspace.test.ts`, `src/lib/workspace-data.ts`, `src/app/api/workspace/route.ts`, `src/components/workspace.tsx`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`; authenticated Playwright verification against the linked pilot at 1280 px and 360 px, signed in as `test@test.com` | Pass: 147 unit tests, lint, type check, and build. Closed the three defects from the prior QA pass. (1) Added an `update_task` command reusing `create_task`'s domain/project/person ownership check, and an inline edit-in-place form (`TaskEditForm`) on each task card covering title, details, due date, scheduled date, priority, domain, project, and person; recurrence rule stays out of v1 as scoped. (2) Defer now opens an inline date picker with an explicit "Defer to date" or "Defer without a date" choice instead of always sending `until: null`; fixed Today's on-the-day filtering (`isTaskOnDay`) to treat a set `deferred_until` as authoritative over `due_on`/`scheduled_for`, matching `taskDateLabel`'s own display priority — a task deferred to a future date no longer leaks back into Today just because its due date is also today. Deferring records a `deferred` activity event unconditionally, which the Slipping evaluator already reads as meaningful task attention, so deferment counts as intentional attention with or without a specific date. (3) Added a Completed section to the Tasks page (most recent 20 by `completed_at`, hidden when empty) feeding the existing `TaskList`, making `reopen_task` reachable for the first time. Verified live: edited a test task's title/due date/priority/person and confirmed it persisted after a full reload; deferred it to a future date and confirmed both its label and its absence from Today's on-the-day list, including while its `due_on` was still today; used "Defer without a date" and confirmed the label fell back to the due date with a distinct confirmation toast; completed a task, found it in Completed, and reopened it back into Open work; the edit form and defer control both render usably at 360 px. Remaining risk: no migration-backed idempotency/authorization/timezone integration tests for `update_task` or `defer_task`; a task's domain/project/person link is still not displayed on its card; and manual task creation still has no duplicate-submission guard — both tracked as separate open items above, unchanged by this pass. | Claude |
| 2026-08-06 | Task Plan 1: cancel/delete/restore, domain archive resolution, task relationships/tags, create_task idempotency | `supabase/migrations/20260806090000_task_tags_and_idempotency.sql`, `src/lib/workspace.ts`, `src/lib/workspace.test.ts`, `src/lib/workspace-data.ts`, `src/app/api/workspace/route.ts`, `src/components/workspace.tsx`, `src/app/globals.css`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npx supabase db push`; authenticated Playwright verification against the linked pilot at 1280 px and 360 px, signed in as `test@test.com` | Pass: 151 unit tests, lint, type check, and build; migration applied to the linked pilot (`npx supabase migration list` confirms `20260806090000` now matches remote). Closed the batch scoped in `docs/task-plan-1-lifecycle-relationships.md`: (A) added `cancel_task`/`delete_task`/`restore_task` — cancel sets a distinct `status = 'canceled'` (not reusing `completed_at`) and delete/restore toggle the existing `tasks.archived_at`, the same soft-delete flag every other entity here already uses, with permanent purge explicitly out of scope until Step 12; new Canceled and Deleted sections on the Tasks page make both states reachable and recoverable, and `openTasks` now also excludes `archived_at` so deleted tasks can never reappear in Today/Top Three. (B) added `archive_domain`, which blocks archiving with a specific linked-record count (open tasks, active projects, people, notes) rather than silently archiving or orphaning them, plus a live open-task/active-project count shown per domain in the Work UI. Known gap, documented rather than hidden: people and notes have no archive/reassignment UI yet, so a domain whose only remaining links are a person or note has no in-app resolution path. (C) `TaskList` now renders a task's linked domain (name + color dot), project, and person, its tags, and a small "related notes" line (notes have no direct task link today, so this falls back to domain/project/person overlap); added `tasks.tags text[]` via migration plus tag inputs on create/edit. (D) `create_task` requires a client-generated `idempotencyKey` backed by a new `unique (owner_id, idempotency_key)` constraint, and `NewTaskForm` disables its submit button while in flight. Verified live end to end: created a tagged task linked to a domain, project, and person and confirmed all of it rendered on the card in both Tasks and Today; canceled it into the new Canceled section, deleted it into the new Deleted section (disappeared everywhere else), and restored it with domain/person/tags intact; keyboard-only Tab+Enter triggered Cancel with no mouse; firing three synchronous submits at the New Task form produced exactly one task (open count 8→9, not 11), confirming the server-side key — not just the disabled button — is what prevents duplicates; archiving a domain with one open task blocked with "This domain still has 1 open task. Reassign or resolve them before archiving." and archiving the same domain after resolving it succeeded; archiving an empty domain succeeded immediately and disappeared from every domain picker. One defect found and fixed during this pass: the new three-part domain row (name, count, Archive button) overflowed off-screen at 360 px because `.compact-row` had no `flex-wrap`; added `flex-wrap: wrap` to `.compact-row` and grouped the count/button into a new `.compact-row-actions` wrapper so they wrap together, then re-verified at 360 px and re-ran the full quality suite. Remaining risk: no migration-backed integration tests for the new commands' authorization/idempotency-under-concurrency; the people/notes domain-resolution gap noted above; and a task's domain badge silently stops rendering if its domain is later archived (the link is preserved in `domain_id`, just not looked up, since archived domains are excluded from `data.domains`). | Claude |

| 2026-08-06 | Task Plan 2: recurrence breadth (TSK-03), filters/sort (TSK-06), and migration-backed/end-to-end test coverage | `supabase/migrations/20260806100000_task_recurrence_expansion.sql`, `supabase/migrations/20260806100001_task_recurrence_expansion_columns.sql`, `src/lib/recurrence.ts`, `src/lib/recurrence.test.ts`, `src/lib/workspace.ts`, `src/lib/workspace.test.ts`, `src/lib/workspace-data.ts`, `src/app/api/workspace/route.ts`, `src/components/workspace.tsx`, `src/lib/workspace.integration.test.ts`, `vitest.integration.config.mts`, `vitest.config.mts`, `e2e/task-lifecycle.spec.ts`, `package.json`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:integration`, `npm run test:e2e`, `npm run build`, `npx supabase db push`; authenticated Playwright verification against the linked pilot at 1280 px and 360 px, signed in as `test@test.com` | Pass: 156 unit tests (5 new), lint, type check, and build; both new migrations applied to the linked pilot (split into two files because Postgres rejects a same-transaction `CHECK` constraint referencing an enum value added earlier in that same transaction). Recurrence now covers daily, weekly, monthly, yearly, weekdays (Mon-Fri only), and a custom 1-30 day/week interval; `nextRecurrenceDate` takes an optional `{interval, unit}` argument for the custom case, and a yearly Feb 29 anchor clamps to Feb 28 the next non-leap year, mirroring the existing monthly short-month clamp rather than rolling into March. The Tasks page's Repeat select gained the three new options plus interval/unit inputs shown only for Custom, and a `recurrenceLabel` helper renders a sensible tag ("Every 3 weeks") on task cards. Filters/sort landed as one `TaskFilters` bar over a unified, no-longer-four-separate-sections task list: status, date (any/has/none), priority, domain, project, person, and Slipping (a clean join against `data.signals` by `entity_type`/`entity_id`), plus sort by date, priority, or the newest-first default — reusing `field-base`/`button-base`/`form-grid` rather than a new control style. Added a first migration-backed integration-test slice (`npm run test:integration`, gated out of `npm test`/CI by a separate Vitest config) proving, against the real hosted pilot rather than a local Postgres instance (no Docker in this sandbox), that create_task idempotency and recurrence-occurrence uniqueness are real database constraints (not just avoided-in-application-code), that a second account cannot read/update/delete a first account's task under RLS, and that a real confirmed timezone resolves the correct local day on either side of a UTC midnight boundary — using `test@test.com` plus a new throwaway `test2@test.com` account, with every created row cleaned up. Added the first end-to-end test past the existing public-entry/onboarding specs: `e2e/task-lifecycle.spec.ts` drives capture → accept → Today (via Top Three, a deterministic action rather than depending on AI date-phrase resolution) → complete → reopen, confirmed passing on repeated solo runs. Live-verified all six recurrence cadences end to end (see the Tasks-and-relationships bullets above for exact dates) and every filter individually and combined, sort by date and priority, the Slipping-filter empty state, and the 360 px filter-bar layout — all against real data on the linked pilot, with all test rows cleaned up afterward. Two things found along the way, unrelated to this batch's own correctness and left as documented, out-of-scope gaps: `e2e/onboarding.spec.ts`'s "authenticated shell" tests expect Inbox/Today copy that no longer exists (copy drift, not something this session touched, that had apparently gone uncaught because it only surfaces with real auth-fixture credentials supplied); and a `next dev` server silently fails to hydrate any client interactivity when accessed via `127.0.0.1` specifically, due to Next's dev-origin protection — `next start` (production) is unaffected, and the tracker's existing E2E note above already carried a related caution, now extended with this specific mechanism. Keyboard operability of the new filter controls rests on them being plain native `<select>`/`<input>` elements rather than on a keyboard-specific browser test, since headless Chromium's native `<select>` popup could not be reliably driven by this session's automation (a tooling limitation, not app behavior) — worth a quick human spot check. Remaining risk: the integration-test harness covers only the tasks table's idempotency/RLS/timezone behavior, not a general-purpose harness for other tables; DST-specific recurrence behavior is architecturally moot (UTC calendar-date arithmetic, not local-clock arithmetic) but that assumption itself is untested; and the e2e spec has not been run under CI. | Claude |

Canonical quality commands still needed:

| Check | Command | Current state |
| --- | --- | --- |
| Format check | To be added to `package.json` | ⬜ Missing |
| Lint | `npm run lint` | ✅ Passing; runs in CI |
| Type check | `npm run typecheck` | ✅ Passing; runs in CI |
| Unit | `npm test` | ✅ Passing; runs in CI |
| Integration | `npm run test:integration` | 🟡 New (2026-08-06): a first slice exists (`src/lib/workspace.integration.test.ts`) and passes against the hosted pilot with real credentials; not run in CI (needs real Supabase credentials CI does not have) and covers only tasks-table idempotency/RLS/timezone, not the full project. |
| End-to-end | `npm run test:e2e` | 🟡 Fixture-gated browser coverage; the task-lifecycle spec (2026-08-06) is confirmed passing against the hosted pilot with real credentials, the others remain unrun against local-Supabase fixtures. Run it with port 3000 free — `reuseExistingServer` will otherwise attach to a running `npm run dev`, where clicks can land before hydration and fail spuriously; also avoid `127.0.0.1` against a `next dev` server specifically — its dev-origin protection silently blocks enough of the client bundle's dev-only wiring that nothing hydrates, with no clear console error. Neither issue reproduces against a `next start` production server, which is what this script builds. |
| Production build | `npm run build` | ✅ Passing; runs in CI |

## Immediate next milestones

These are the next three deliverables in practical order:

1. **Make Phase 0 trustworthy enough to validate.** Fix the OpenRouter happy path, preserve safe error categories, and manually verify capture/review/undo/retainer/Slipping at desktop and 360 px.
2. **Close the product-validation gap while building the foundation.** Run the interview/WTP program in parallel with canonical auth, tenant tests, environments, design primitives, and audit/activity conventions.
3. **Replace the synchronous prototype loop with the canonical source-first pipeline.** Multi-proposal review, idempotent apply, and structured destination routing into real domain/project/person records are done, and interpretation has left the capture request. Deterministic date, timezone, and recurrence resolution now sits between the model and every filed record. Still open before broad record surfaces: the canonical versioned capture model, a durable idempotent proposal job in place of the browser-initiated interpret request, retainer destinations in the proposal schema, and an evaluation harness.

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
