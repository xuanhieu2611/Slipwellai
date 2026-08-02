# Slipwell Product Requirements Document

**Version:** 1.0  
**Status:** Build-ready product definition  
**Last updated:** August 2, 2026  
**Initial platform:** Responsive website built with Next.js  
**Product name:** Slipwell  
**Document owner:** Founder / Product  

---

## 1. Executive summary

Slipwell is a capture-first personal operations app for independent professionals whose client work, content, projects, and personal commitments compete for the same attention.

Users quickly capture an unstructured thought by typing or speaking. Slipwell preserves the original input, interprets it, proposes the correct structured record, and puts it where it belongs. It then brings that information back through a focused Today view and a signature **Slipping** system that identifies commitments that are becoming stale before they become urgent problems.

Slipwell is not initially intended to be a universal productivity suite or a configurable Notion replacement. The first release is designed around a narrow, commercially valuable user:

> A creator-consultant, freelancer, or solo operator who manages recurring clients, finite projects, content, and personal commitments without a team operations department.

The initial product is a responsive Next.js website. Native iOS and Android applications built with Expo, mobile share extensions, widgets, and wearable capture are later phases. The web product must nevertheless work well in desktop and mobile browsers and be installable as a Progressive Web App where supported.

### Product promise

> **Capture anything. Nothing important slips through.**

### One-sentence description

> Slipwell turns quick thoughts into organized tasks, projects, client commitments, notes, and reminders—then shows what needs attention before it slips.

### Category language

- Primary: **AI command center for independent work and life**
- Secondary: **Capture-first personal operations app**
- Avoid leading with: “all-in-one productivity app,” “LifeOS,” or a long feature list

### Initial commercial hypothesis

Slipwell can earn a recurring subscription when it does at least two of the following for a user:

1. Replaces a capture or task tool.
2. Replaces manually maintained recurring-client checklists.
3. Prevents a meaningful commitment from being forgotten.
4. Reduces the time and mental load required for a weekly review.

---

## 2. Source of truth and decision hierarchy

This PRD synthesizes:

- `youtube-script.md`: the original product inspiration and full feature vision.
- `idea-assessment.md`: market and viability assessment.
- `product-strategy.md`: positioning, competitive analysis, MVP recommendation, pricing, risks, and validation thresholds.
- Founder clarifications from August 2, 2026.

When sources conflict, use this priority order:

1. Explicit decisions in this PRD.
2. Founder clarifications recorded in this PRD.
3. MVP recommendations in `product-strategy.md`.
4. The broader vision in `youtube-script.md`.

The original transcript is a vision source, not an instruction to build every demonstrated module in version one.

---

## 3. Key product decisions

| Decision | Selected direction | Why |
|---|---|---|
| Beachhead customer | Creator-consultants, freelancers with retainers, and solo operators | They experience the full problem intensely and have clearer willingness to pay than a general consumer audience. |
| Public-facing message | Broad, relatable outcome: capture what matters and prevent it from slipping | Enables viral demos without diluting the build scope. |
| Initial platform | Responsive Next.js website / PWA | Fastest path to validation and works across desktop and mobile browsers. |
| Native mobile | Expo app for iOS and Android after web retention is proven | Preserves future mobile capture quality without delaying validation. |
| Collaboration | Single-player only in initial releases | Team permissions and shared state would substantially increase complexity before individual retention is known. |
| Differentiating wedge | Trustworthy AI capture + native retainers + cross-object Slipping | This combination is more defensible than a broad module count. |
| Calendar | Google Calendar read sync in MVP | Calendar is context; Slipwell should not try to replace it initially. |
| Content workflow | Opinionated project template in MVP | Tests demand without creating a separate content subsystem too early. |
| Routines | Simple daily checklist in MVP | Preserves separation from tasks; advanced streak analytics come later. |
| People and notes | Lightweight linked records in MVP | Provides useful context without attempting full CRM or knowledge-management depth. |
| AI chat | Deferred until retrieval and source-linking are trustworthy | An ungrounded chat feature would create risk before enough user data exists. |
| Monetization | Free tier + automatic 14-day Pro trial + Pro subscription | Free capture encourages habit and sharing; paid workflows monetize professional value. |
| Initial Pro price | US$15 monthly or US$144 annually | Sits between basic task tools and more expensive AI planning suites. |

---

## 4. Vision, mission, and positioning

### 4.1 Vision

Create a trusted external operating layer that keeps a person’s commitments and context moving without forcing them to maintain a complicated productivity system.

### 4.2 Mission

Make capturing, organizing, and revisiting important information easier than carrying it in one’s head.

### 4.3 Positioning statement

For independent professionals balancing recurring clients, projects, content, and life, Slipwell is a capture-first command center that automatically organizes incoming thoughts and identifies neglected commitments. Unlike configurable workspaces or conventional task managers, Slipwell provides opinionated workflows for ongoing client work and attention risk without requiring the user to build a system first.

### 4.4 Brand messaging

**Recommended primary slogan**

> Nothing important slips through.

**Recommended action line**

> Capture it once. Slipwell keeps it moving.

**Supporting messages**

- Stop carrying every commitment in your head.
- Say it, type it, and get back to what you were doing.
- Know what needs attention before it becomes a problem.
- Recurring client work without rebuilding the same checklist every month.

### 4.5 Brand personality

Slipwell should feel calm, capable, private, and quietly proactive. It should not use shame, anxiety, or exaggerated “10x productivity” language. Slipping is an attention signal, not a judgment.

---

## 5. Problem definition

### 5.1 Core problem

Independent professionals manage work and life across disconnected systems. Capturing an item often requires deciding what it is, where it belongs, what date applies, which client or project it relates to, and whether it needs a reminder. That friction causes users to delay capture, scatter information, or abandon complex systems.

Even when an item is recorded, conventional tools primarily surface due dates. Work without a due date, long-running projects, recurring client obligations, relationships, and notes can quietly become stale.

### 5.2 Existing alternatives and their shortcomings

| Alternative | What works | Remaining problem for Slipwell’s target user |
|---|---|---|
| Apple Notes / voice memos | Extremely fast capture | Information remains unstructured and rarely resurfaces. |
| Todoist and similar task apps | Reliable task management | Weak context across retainers, notes, people, and attention cadence. |
| Notion | Flexible databases and templates | Requires setup, categorization, and ongoing system maintenance. |
| Team project tools | Strong collaboration and delivery workflows | Heavy for personal use and awkward for work/life context. |
| Calendar | Trusted time commitments | Not suitable for every task, note, follow-up, or stale project. |
| Personal CRM / habit / PKM apps | Strong specialist workflows | Fragment the user’s context across more tools. |

### 5.3 Jobs to be done

1. **When a thought or obligation occurs,** help me record it in seconds without deciding how to organize it.
2. **When I begin my day,** show me the few things that deserve attention alongside my real calendar.
3. **When I manage ongoing client work,** regenerate expected work without losing incomplete obligations or history.
4. **When something has received no attention,** warn me before it becomes a missed commitment.
5. **When I need context,** let me find the task, project, client, person, or note without remembering where it was filed.
6. **When AI acts on my information,** let me understand, correct, undo, and trust the action.

---

## 6. Goals, non-goals, and success definition

### 6.1 MVP goals

- Make text or voice capture usable in under eight seconds at the median.
- Achieve at least 85% acceptance of AI-proposed record structure among activated users.
- Give users one dependable Today screen for calendar context, top priorities, due work, simple routines, and Slipping items.
- Make recurring-client work materially easier than recurring-task workarounds.
- Demonstrate that Slipping causes useful actions, deferments, or intentional dismissals.
- Establish a daily or near-daily capture habit.
- Convert users who receive professional value to a sustainable subscription.
- Give every user export and deletion controls so the product is trusted with important data.

### 6.2 Business goals for the first 12 months after public launch

These are planning targets, not forecasts.

| Metric | Target |
|---|---:|
| Registered users | 10,000 |
| Activated users | 4,000 |
| Paying subscribers | 800+ |
| Monthly recurring revenue at target scale | US$10,000+ |
| Activated-to-paid conversion | 8% or higher |
| Annual-plan share of paying subscribers | 40% or higher |
| Six-week weekly retention among activated users | 40% or higher |
| Gross margin after AI/infrastructure costs | 80% or higher |

### 6.3 Non-goals for MVP

- Replacing Google Calendar.
- Automatically scheduling every task into calendar time blocks.
- Team collaboration, assignments, or multi-user workspaces.
- Building an arbitrary database or view builder.
- Matching Notion, ClickUp, Motion, or Todoist feature-for-feature.
- A full content management database.
- A full personal CRM with contact sync.
- Deep journaling, books, Kindle highlights, quotes, or media library.
- AI chat over all user data.
- Inventory or household insurance management.
- Native iOS, Android, watchOS, or Wear OS clients.
- Public social feeds, follower graphs, or gamified productivity rankings.

---

## 7. Target users

### 7.1 Primary persona: creator-consultant

**Profile:** One person creates videos, articles, or newsletters while delivering recurring work for several clients. They also manage personal obligations in the same mental space.

**Current stack:** Calendar + notes + task manager + Notion or spreadsheets + voice memos.

**Pain:** Captures are scattered, monthly work must be recreated, and content or client work becomes stale without a hard deadline.

**Value trigger:** A spoken or typed sentence becomes the correct task or retainer item, and Slipwell later flags a neglected commitment.

**Likely willingness to pay:** US$12–$30 per month if the product replaces tools or prevents client mistakes.

### 7.2 Primary persona: freelancer with recurring clients

**Profile:** Designer, developer, marketer, writer, photographer, or consultant with a mix of finite projects and monthly obligations.

**Pain:** Conventional project tools model projects with an end, while retainers repeat indefinitely and contain unfinished carry-over work.

**Value trigger:** A recurring cycle resets correctly, preserves incomplete work, and shows progress and risk without manual duplication.

### 7.3 Secondary persona: solo founder or fractional executive

**Profile:** Works across several companies or responsibility areas and changes context frequently.

**Pain:** Commitments are made in conversations and meetings, but context is distributed across tools.

**Value trigger:** Fast capture, a calm daily view, and early warning about neglected initiatives.

### 7.4 Users not optimized for initially

- Large teams requiring approvals, permissions, reporting, or resource planning.
- Consumers seeking only a basic to-do list or habit tracker.
- Users who primarily want automatic calendar scheduling.
- Organizations requiring enterprise compliance commitments at launch.
- Knowledge-management enthusiasts who value unlimited customization over opinionated defaults.

### 7.5 Audience strategy for virality

The product is built for a narrow professional wedge but marketed through recognizable moments:

- “I said one sentence and it organized the whole commitment.”
- “This project had no overdue tasks, but it was still slipping.”
- “My monthly client checklist reset without losing unfinished work.”
- “I stopped rebuilding my productivity system.”

This permits broad social reach while ensuring the paid product solves a specific high-value problem.

---

## 8. Product principles

1. **Capture before categorization.** The user should record first and organize only when necessary.
2. **Preserve the source.** Never discard the original text, audio, timestamp, or routing history.
3. **AI proposes; the user remains in control.** Automated decisions must be visible, reversible, and correctable.
4. **Calm over comprehensive.** Show the smallest useful set of information by default.
5. **Routines are not tasks.** Repeated personal behaviors must not overwhelm actionable work.
6. **Stale is different from overdue.** Slipping measures neglected attention, not only deadlines.
7. **Retainers are first-class.** Ongoing work is not merely a project with recurring tasks.
8. **Opinionated defaults, progressive control.** A new user should receive value without configuring a database.
9. **Privacy is part of the interface.** Make sync, AI use, export, and deletion understandable.
10. **Portable by default.** A user must be able to leave with their data.

---

## 9. Core product loop

```text
Capture → Interpret → Review/Confirm → Structure → Surface → Act → Learn
```

1. The user types or records an unstructured capture.
2. Slipwell immediately stores the original capture.
3. The system transcribes when needed and proposes a structured result.
4. High-confidence results may be created automatically according to user settings; low-confidence results require review.
5. The user sees what was created and can correct or undo it.
6. Records appear in Today, projects, retainers, search, or Slipping when relevant.
7. User actions and corrections improve future routing preferences.

### Primary “aha” moments

- **Capture aha:** “I said one sentence and everything was connected correctly.”
- **Slipping aha:** “Slipwell reminded me before this became a problem.”
- **Retainer aha:** “The new cycle appeared without losing last month’s unfinished work.”

---

## 10. Scope and release priorities

Priority definitions:

- **P0:** Required for public MVP.
- **P1:** Required shortly after MVP or gated beta if time permits.
- **P2:** Future expansion after retention evidence.
- **Excluded:** Not planned without a deliberate strategy revision.

| Capability | Priority | Release treatment |
|---|---:|---|
| Authentication and onboarding | P0 | Email magic link and Google sign-in; guided setup. |
| Responsive web / PWA | P0 | Desktop and mobile browser support. |
| Text capture | P0 | Global capture control and keyboard shortcut. |
| Browser voice capture | P0 | Record, transcribe, preserve, and route. |
| AI cleanup and routing | P0 | Task, note, project update, and person update. |
| Capture review and audit trail | P0 | Prominent and reversible. |
| Today | P0 | Top three, calendar, tasks, routines, Slipping, recent captures. |
| Tasks | P0 | Dates, reminders, recurrence, priority, links, completion. |
| Domains / areas | P0 | Simple top-level work/life organization. |
| Finite projects | P0 | Milestones, tasks, checklist templates, activity. |
| Retainers | P0 | Cycles, recurring deliverables, roll-forward, history. |
| Slipping engine | P0 | Tasks, projects, and retainers. |
| Google Calendar read sync | P0 | One account and selected calendars initially. |
| Simple routines | P0 | Checklist separated by time of day. |
| People | P0-light | Facts, interactions, follow-up, links. |
| Notes | P0-light | Markdown/plain text, tags, links, review date. |
| Global keyword search | P0 | Cross-entity results and filters. |
| Notifications | P0 | In-app and email; browser push where reliable. |
| Import/export/deletion | P0 | CSV/Markdown/JSON export and account deletion. |
| Billing | P0 | Free, Pro trial, Pro monthly/annual. |
| Content workflow | P1 | Opinionated project template and filtered view. |
| Semantic search | P1 | After keyword search and data permissions are stable. |
| Grounded AI chat | P2 | Must cite supporting records. |
| Native Expo app | P2 | iOS and Android after web retention. |
| Full routines/streak analytics | P2 | Challenges, charts, historical streaks. |
| Full personal CRM | P2 | Contact sync, relationship cadence, richer views. |
| Deep personal library | P2 | Journal, books, quotes, highlights, resurfacing. |
| Collaboration | P2 / conditional | Only after individual retention and team demand. |
| Inventory | Excluded for foreseeable roadmap | Does not support the initial commercial wedge. |

---

## 11. Information architecture

### 11.1 Primary navigation

1. **Today**
2. **Inbox** — capture review and recent captures
3. **Tasks**
4. **Work** — projects, retainers, and domains
5. **People & Notes**
6. **Search**
7. **Settings**

The global capture button remains visible from every signed-in screen. On desktop, the default shortcut is `Command/Ctrl + J`. The shortcut must be discoverable and configurable if it conflicts with the browser or operating system.

### 11.2 Mobile-web navigation

- Bottom navigation for Today, Inbox, Tasks, Work, and Search.
- Floating or centered capture action reachable with one thumb.
- People & Notes and Settings available from a More menu.
- No desktop-only interaction may be required to complete a core workflow.

### 11.3 Core record page pattern

Every task, project, retainer, person, and note detail page should use a consistent pattern:

- Title and status.
- Key structured fields.
- Related records.
- Activity/history timeline.
- Source capture when applicable.
- Edit, archive, and delete actions.
- AI-created or AI-edited indicator where applicable.

---

## 12. Detailed functional requirements

### 12.1 Authentication and account lifecycle

**AUTH-01 — Sign up**  
Users can create an account with Google OAuth or an emailed magic link.

**AUTH-02 — Session management**  
Sessions work across supported browsers, expire securely, and can be revoked from Settings.

**AUTH-03 — Account recovery**  
Users can regain access through verified email without support intervention.

**AUTH-04 — Account deletion**  
Users can request permanent deletion. The interface must explain the deletion window, immediately revoke active sessions, and show confirmation by email.

**AUTH-05 — Data isolation**  
Every user-owned record is tenant-scoped and protected by database row-level security. No client-provided user ID is trusted without server-side authorization.

**Acceptance criteria**

- A new user reaches onboarding after authenticating in two or fewer screens.
- A logged-out user cannot retrieve any signed-in route or user-owned API record.
- Account deletion removes or irreversibly anonymizes user data and connected credentials according to the published retention policy.

### 12.2 Onboarding and activation

**ONB-01 — Outcome-led introduction**  
Explain Slipwell through the capture, retainer, and Slipping outcomes rather than a feature tour.

**ONB-02 — Basic profile**  
Collect display name, timezone, locale, work type, and optional company/brand name. Detect timezone but require confirmation.

**ONB-03 — Initial domains**  
Offer recommended domains such as Work, Personal, and Content. Users may rename or skip them.

**ONB-04 — Calendar connection**  
Offer Google Calendar connection but allow the user to skip. Explain that MVP sync is read-only.

**ONB-05 — Guided first capture**  
Prompt the user to enter a realistic thought. Show the interpreted structure and require a confirmation or correction.

**ONB-06 — First professional workflow**  
Ask whether the user manages ongoing client work. If yes, guide them through creating one retainer from a simple template.

**ONB-07 — Pro trial**  
Every new account receives 14 days of Pro without requiring payment details. Show the expiration date and what happens afterward.

**Activation definition**

A user is activated when, within seven days, they:

1. Complete at least three captures on two separate days.
2. Confirm or correct at least one AI-routed record.
3. Complete or intentionally defer one item from Today or Slipping.
4. Create a project/retainer or connect Google Calendar.

### 12.3 Universal web capture

**CAP-01 — Text capture**  
Users can open a capture composer from any signed-in page, enter free text, and submit without selecting a record type.

**CAP-02 — Voice capture**  
On supported browsers, users can record audio, preview or cancel it, and submit it for transcription.

**CAP-03 — Immediate preservation**  
Slipwell creates a capture record before downstream AI processing. A network interruption must not silently lose a submitted capture.

**CAP-04 — Processing state**  
The UI shows queued, transcribing, interpreting, needs review, filed, and failed states.

**CAP-05 — Original source**  
Store original text and, subject to the retention setting, original audio. The cleaned version never overwrites the source.

**CAP-06 — Supported intents in MVP**

- Create a task.
- Create a note.
- Add an update or task to an existing project/retainer.
- Add a fact, interaction, or follow-up to a person.
- Create multiple records from one capture when the user clearly requests multiple actions.

**CAP-07 — Natural-language fields**

The interpreter may propose:

- Record type.
- Clean title.
- Description/body.
- Due date and time.
- Reminder time.
- Recurrence.
- Priority.
- Domain.
- Project or retainer.
- Person.
- Tags.
- Confidence per material field.

**CAP-08 — Ambiguity handling**  
If a date, person, or project is ambiguous, preserve the capture and ask for the smallest necessary clarification in the review card. Never invent a specific identity or date.

**CAP-09 — Multi-intent preview**  
When one capture creates multiple records, show every proposed record before confirmation unless the user has enabled high-confidence auto-file.

**CAP-10 — Speed target**  
Median time from submitting a short text capture to a usable proposal is under five seconds; median short voice capture to proposal is under eight seconds, excluding the user’s recording duration.

**CAP-11 — Usage limits**  
Before a user reaches the plan limit, show remaining usage and explain alternatives. Never accept and then discard a capture because the AI quota is exhausted; retain it in the Inbox for manual filing.

**Acceptance examples**

| Input | Expected proposal |
|---|---|
| “Tomorrow at 2 remind me to replace the fridge filter at home.” | Task; Home; due tomorrow 2:00 PM; reminder based on user default. |
| “For Acme’s retainer, send July analytics by Friday and ask Dana about the missing ad spend.” | Task linked to Acme retainer plus person follow-up if Dana is confidently matched; otherwise review. |
| “Idea: a video about why recurring tasks fail freelancers.” | Note or content-template idea based on user preference; no invented due date. |
| “Lunch with Minh—his daughter starts university in September.” | Person interaction and fact if Minh is uniquely matched; private by default. |

### 12.4 Capture review and AI trust

**REV-01 — Review Inbox**  
The Inbox lists new, processing, failed, and needs-review captures, newest first.

**REV-02 — Explain routing**  
Every proposal shows the record type, destination, extracted fields, and a concise explanation such as “Filed under Acme because you mentioned the client name.”

**REV-03 — Confidence gate**  
Low-confidence material fields require review. Initial thresholds are configurable by the product team and may later adapt per user.

**REV-04 — User control**  
Users can confirm, edit, change type, change destination, split, merge, retry, or discard a proposal.

**REV-05 — Undo**  
Auto-filed records show a one-click undo action in the capture confirmation and recent-capture feed.

**REV-06 — Correction learning**  
Record corrections as feedback signals. Do not silently change global behavior based on one correction.

**REV-07 — Failure recovery**  
If transcription or interpretation fails, the source remains accessible and may be retried or manually filed.

**REV-08 — Audit history**  
Store who/what changed a record, the previous value, new value, timestamp, and originating capture.

**Trust metric**

Structural acceptance means the user accepts record type, target project/person/domain, and date without changing those fields. Copy edits to a title do not count as structural rejection.

### 12.5 Today

**TDY-01 — Date and timezone**  
Today is calculated in the user’s confirmed timezone and clearly handles travel or timezone changes.

**TDY-02 — Top Three**  
Users can select up to three open tasks as daily priorities, reorder them, replace them, and complete them inline.

**TDY-03 — Suggested priorities**  
Slipwell may suggest tasks based on due date, priority, calendar, and Slipping state, but the user explicitly chooses the final Top Three.

**TDY-04 — Calendar agenda**  
Show today’s synced Google Calendar events in chronological order with calendar color and source.

**TDY-05 — Task sections**  
Show overdue, due today, and optionally available unscheduled work without combining routines into the same list.

**TDY-06 — Routine section**  
Show today’s simple routines grouped by morning, afternoon, evening, or anytime.

**TDY-07 — Slipping summary**  
Show a prioritized subset of Slipping records with reason and one-tap action.

**TDY-08 — Recent captures**  
Show recent filed and needs-review captures so users can verify that capture worked.

**TDY-09 — Empty states**  
An empty Today screen should encourage one capture or one priority selection, not display an overwhelming setup checklist.

**TDY-10 — Daily reset**  
Top Three resets at the user’s local day boundary. Unfinished tasks remain open but are not silently carried into the next day’s Top Three.

### 12.6 Tasks

**TSK-01 — Task fields**

- Title.
- Description.
- Status: open, completed, canceled, archived.
- Due date and optional time.
- Reminder(s).
- Priority.
- Recurrence rule.
- Domain.
- Related project/retainer.
- Related person.
- Related note/content item.
- Tags.
- Created, updated, completed timestamps.

**TSK-02 — Fast manual creation**  
Users can create a task manually without AI and without filling optional fields.

**TSK-03 — Recurrence semantics**  
Support daily, weekly, monthly, yearly, weekdays, and a limited custom interval. The product must explicitly define whether the next occurrence is based on scheduled date or completion date.

**TSK-04 — Completion**  
Completing a recurring task generates or reveals the next occurrence idempotently.

**TSK-05 — Reschedule and defer**  
Users can choose a date or defer a task without a date. Deferment counts as intentional attention for Slipping calculations.

**TSK-06 — Filters**  
Filter by status, date, priority, domain, project/retainer, person, and Slipping state.

**TSK-07 — Bulk actions**  
P1: bulk reschedule, complete, archive, and change domain/project.

**TSK-08 — Deletion**  
Deletion is soft for a recovery period. Completion and cancellation remain distinct historical states.

### 12.7 Domains / areas

**DOM-01 — Definition**  
A domain is a durable top-level responsibility such as Work, Home, Content, Health, or a business brand. It is not expected to reach completion.

**DOM-02 — Fields**  
Name, description, color/icon, active/archived state, and optional default Slipping cadence.

**DOM-03 — Relationships**  
Projects, retainers, tasks, notes, people, and routines may link to one primary domain in MVP.

**DOM-04 — Defaults**  
Onboarding suggests a small domain set. Slipwell must not force users to design a complete life taxonomy.

### 12.8 Finite projects

**PRJ-01 — Definition**  
A project is a finite outcome with an intended completion state.

**PRJ-02 — Fields**

- Name and description.
- Status: planned, active, paused, completed, canceled, archived.
- Domain.
- Optional client/person.
- Start and target dates.
- Slipping cadence.
- Milestones.
- Checklist instances.
- Linked tasks and notes.
- Activity log.

**PRJ-03 — Milestones**  
Users can create, reorder, complete, and reopen milestones. Progress is based on explicitly documented logic and never presented as more precise than the underlying data.

**PRJ-04 — Checklist templates**  
Users can create a project from a built-in or saved checklist template. Template changes do not silently mutate existing project instances.

**PRJ-05 — Activity**  
Task completion, milestone changes, notes, manual updates, and meaningful edits appear in the activity timeline.

**PRJ-06 — Project completion**  
Completing a project does not delete its tasks, notes, or history. Open tasks require a resolve, move, or cancel decision.

**PRJ-07 — Time logging**  
P1: manual time entries linked to project and optional task. Live timer is later.

### 12.9 Retainers and recurring-client work

**RET-01 — Definition**  
A retainer is an ongoing engagement composed of repeating cycles, recurring deliverables/checklists, optional one-off tasks, and preserved history.

**RET-02 — Fields**

- Name and description.
- Client/person and domain.
- Status: active, paused, ended, archived.
- Cycle frequency: monthly in MVP; weekly/quarterly in P1.
- Cycle start rule and timezone.
- Recurring deliverable templates.
- Recurring checklist templates.
- One-off linked tasks and notes.
- Slipping rules.
- Optional expected hours in P1.

**RET-03 — Cycle generation**  
Generate each cycle idempotently. Re-running a job must never duplicate a cycle or its recurring items.

**RET-04 — Roll-forward behavior**  
At cycle close, incomplete items are preserved. Each template defines whether an incomplete item carries forward, remains only in the old cycle as overdue, or is canceled. The default is **carry forward with a link to the original cycle**.

**RET-05 — History**  
Users can inspect every prior cycle, its expected work, completed work, unfinished work, and changes.

**RET-06 — Current-cycle view**  
Show progress, upcoming deliverables, open tasks, overdue/carry-over work, and recent activity.

**RET-07 — Mid-cycle edits**  
When a recurring template changes, ask whether the change applies to the current cycle, future cycles, or both.

**RET-08 — Pause/end**  
Pausing stops future cycle generation without deleting current work. Ending preserves all history and requires a choice for remaining open items.

**RET-09 — Slipping integration**  
Slipping may consider expected point in cycle, required deliverable status, and absence of activity—not only due dates.

**Required edge cases**

- A cycle starts on the 29th, 30th, or 31st in a shorter month.
- User changes timezone near cycle boundary.
- Generation job retries.
- User edits a template after a future cycle was pre-generated.
- An incomplete item already carried forward once.
- Retainer is paused, resumed, or ended mid-cycle.

### 12.10 Slipping engine

**SLP-01 — Definition**  
A record is Slipping when it has received less meaningful attention than expected for its type, state, and configured cadence.

**SLP-02 — Supported MVP entities**

- Tasks without useful recent attention.
- Active finite projects.
- Active retainers and current-cycle deliverables.

People, content stages, and review-marked notes are P1/P2.

**SLP-03 — Meaningful attention events**

- Completing or reopening a task/milestone.
- Creating a relevant task or note.
- Recording an activity update.
- Changing a project or retainer state.
- Intentionally deferring or dismissing a Slipping signal.
- Editing cosmetic fields does not automatically count as meaningful attention.

**SLP-04 — Default rules**

| Entity | Initial default |
|---|---|
| Unscheduled open task | Slipping after 14 days without meaningful attention. |
| Active finite project | Slipping after 7 days without meaningful attention. |
| Retainer deliverable | Slipping when not started by its configured or inferred expected point in the cycle. |
| Active retainer | Slipping after 7 days without activity while current-cycle work remains. |

Defaults must be remotely configurable and user-overridable on Pro.

**SLP-05 — Severity**  
Compute informational, attention, and urgent states. Severity considers duration, due-date proximity, priority, relationship to a client, and repeated dismissal.

**SLP-06 — Explainability**  
Every Slipping card states why it appeared, for example: “No meaningful activity for 9 days; your expected cadence is 7 days.”

**SLP-07 — Actions**

- Open the record.
- Add next action.
- Mark attention/update.
- Defer until a chosen date.
- Change cadence.
- Pause/archive the record.
- Dismiss this signal with optional reason.

**SLP-08 — Notification restraint**  
Slipping must not notify repeatedly without a state change or configured reminder. Bundle lower-severity signals into summaries.

**SLP-09 — Outcome tracking**  
Record whether a signal resulted in completion, new next action, deferment, cadence change, archive, or dismissal.

**SLP-10 — Future learning**  
P2 may recommend cadences based on observed behavior, but must explain and request approval before changing them.

### 12.11 Google Calendar integration

**CAL-01 — OAuth**  
Connect one Google account in MVP using the minimum required read scopes.

**CAL-02 — Calendar selection**  
Users select which calendars appear in Slipwell.

**CAL-03 — Read-only contract**  
Clearly label calendar data as read-only. Editing an event directs users to Google Calendar.

**CAL-04 — Sync**  
Use incremental synchronization and push change notifications where available, with a periodic reconciliation job.

**CAL-05 — Sync health**  
Settings shows connected account, selected calendars, last successful sync, current status, and reconnect/force-sync actions.

**CAL-06 — Duplicates and deletions**  
Calendar event identity is based on provider identifiers, not title/time matching. Provider deletions remove or mark the local mirror without affecting Slipwell records linked by the user.

**CAL-07 — Privacy**  
Respect private event visibility where provided and avoid sending full calendar descriptions to an AI model unless required for an explicit user action.

**CAL-08 — Failure state**  
Expired credentials or invalid sync tokens produce a visible reconnect state; they do not silently show stale data as current.

### 12.12 Simple routines

**RTN-01 — Separation**  
Routines are stored and displayed separately from tasks.

**RTN-02 — Fields**  
Name, optional description, time-of-day group, active days, optional reminder time, active/archived state.

**RTN-03 — Daily instance**  
Each scheduled day creates or resolves one idempotent completion instance.

**RTN-04 — Completion**  
Users can complete or skip today’s routine. Skipping is not the same as completing.

**RTN-05 — MVP reporting**  
Show today’s completion only plus a simple recent history. Do not build challenge configuration or advanced charts in MVP.

**RTN-06 — Slipping interaction**  
Missed routines do not appear in global Slipping in MVP; they remain in routine history to prevent noise.

### 12.13 Lightweight people records

**PPL-01 — Person fields**  
Name, pronouns optional, relationship/context, important dates, facts, tags, default domain, and archived state.

**PPL-02 — Interactions**  
Log timestamped text interactions with optional follow-up task.

**PPL-03 — Facts**  
Store facts as discrete records with source capture and optional date. AI-proposed sensitive facts always require review.

**PPL-04 — Relationships**  
Link people to projects, retainers, tasks, notes, and interactions.

**PPL-05 — Duplicate prevention**  
Suggest possible matches; never automatically merge people. Provide a reversible manual merge later.

**PPL-06 — Privacy**  
People records are private and excluded from public/shareable output by default.

### 12.14 Lightweight notes

**NTE-01 — Note fields**  
Title, Markdown/plain-text body, source, tags, domain, linked records, optional review date, and archive state.

**NTE-02 — Capture behavior**  
AI may clean transcription and propose a title but must preserve the original capture.

**NTE-03 — Action extraction**  
If a note clearly contains an action, propose a linked task rather than silently converting the note.

**NTE-04 — Review**  
Notes with an explicit review date appear in Today or Inbox. Deep resurfacing is later.

**NTE-05 — Attachments**  
P1: images and files with secure signed access. No rich media journal in MVP.

### 12.15 Search

**SRC-01 — Global search**  
Search tasks, projects, retainers, domains, people, notes, and capture source text from one interface.

**SRC-02 — MVP search method**  
Use Postgres full-text and normalized keyword search. Semantic/vector retrieval is P1.

**SRC-03 — Result presentation**  
Group or label results by type, highlight matching text, and show enough context to distinguish similar records.

**SRC-04 — Filters**  
Filter by record type, status, date range, domain, project/retainer, and person.

**SRC-05 — Permissions**  
Search results must enforce the same row-level access rules as direct record retrieval.

**SRC-06 — Performance**  
Return the first useful result set in under one second at p95 for an account with 10,000 text records, excluding network extremes.

### 12.16 Notifications

**NTF-01 — Channels**

- In-app notification center: P0.
- Email summaries and critical reminders: P0.
- Browser push: P0 when supported and reliable; graceful fallback otherwise.
- Native push: future Expo phase.

**NTF-02 — Types**

- Capture filed or needs review.
- Task reminder.
- Calendar reconnect/sync failure.
- Daily or weekly summary.
- Slipping digest.
- Trial and billing lifecycle.

**NTF-03 — Controls**  
Users control channel and category, set quiet hours, and turn off non-essential notifications.

**NTF-04 — Dedupe**  
Each logical notification has an idempotency key. Retries cannot create duplicates.

**NTF-05 — Deep links**  
Every actionable notification links directly to the relevant signed-in record or review screen.

### 12.17 Billing, plans, and entitlements

**BIL-01 — Plans**

| Capability | Free | Pro |
|---|---:|---:|
| Tasks and notes | Unlimited reasonable use | Unlimited reasonable use |
| Active domains | 3 | Unlimited |
| Active finite projects | 3 | Unlimited |
| Active retainers | 1 | Unlimited |
| Google accounts | 1 | 1 initially |
| AI captures | 50/month launch allowance | 500/month launch allowance |
| Voice minutes | 20/month launch allowance | 180/month launch allowance |
| Basic Slipping defaults | Yes | Yes |
| Custom Slipping rules | No | Yes |
| Routines | 3 | Unlimited |
| Search | Keyword | Keyword; semantic when released |
| Export and deletion | Yes | Yes |
| Activity history | 30 days in UI | Full available history |
| Support | Community/email | Priority email |

Allowances are launch hypotheses. Change them based on real usage cost and activation, with clear notice and without removing access to user-authored records.

**BIL-02 — Pricing**

- Pro monthly: **US$15/month**.
- Pro annual: **US$144/year** (US$12/month equivalent).
- New-user Pro trial: **14 days**, no payment method required.
- Optional launch offer: first 500 annual subscribers at **US$99 for the first year**, clearly described as non-lifetime pricing.

**BIL-03 — Trial end**  
At trial end, a non-paying account falls back to Free. Existing records remain readable and exportable. Users must choose which over-limit projects/retainers remain active; Slipwell must not delete them.

**BIL-04 — Upgrade moments**  
Present upgrade prompts when the user receives relevant value or reaches a clear limit, not on every login. Examples: creating a second retainer, customizing a Slipping rule, or reaching 80% of AI allowance.

**BIL-05 — Cost controls**  
Track transcription, model, embedding, storage, email, and job costs by account and plan. Target direct AI/infrastructure cost below 20% of realized subscription revenue and investigate accounts above 35%.

**BIL-06 — No surprise overages**  
Do not bill usage overages at launch. Pause paid AI processing at the limit while preserving captures for manual handling or next-month processing.

**BIL-07 — Billing provider**  
Use Stripe Checkout and Customer Portal unless implementation constraints justify another provider. Verify entitlements server-side from durable subscription state and webhook history.

### 12.18 Settings, portability, and support

**SET-01 — Profile**  
Name, timezone, locale, week start, date/time format, and default reminder behavior.

**SET-02 — Capture preferences**  
Auto-file threshold, audio retention, default domain, reminder defaults, and confirmation preferences.

**SET-03 — Connections**  
Google Calendar status, last sync, selected calendars, reconnect, force sync, and disconnect.

**SET-04 — Notification preferences**  
Per-channel and per-category controls plus quiet hours.

**SET-05 — Data export**  
Export structured JSON/CSV plus Markdown notes and a media manifest. Large exports are processed asynchronously and delivered through a time-limited link.

**SET-06 — Data deletion**  
Allow deletion of individual records and the full account, with clear recovery and permanent-deletion behavior.

**SET-07 — AI disclosure**  
Explain which features use AI, which data is sent, how providers may process it, and whether content is retained or used for training according to actual provider terms.

**SET-08 — Feedback/support**  
Users can report a bug or routing error with optional diagnostic context. Never attach private record content without explicit confirmation.

---

## 13. AI system requirements

### 13.1 AI responsibilities in MVP

- Speech-to-text transcription.
- Removal of filler words without changing meaning.
- Intent and entity extraction.
- Date/time and recurrence parsing.
- Record-type and relationship proposal.
- Concise titles and descriptions.
- Confidence scoring.
- Brief routing explanation.

### 13.2 AI must not

- Invent dates, people, project matches, promises, or facts.
- Silently delete source content.
- Treat a journal-like note as a task without evidence.
- Send notifications or external messages not explicitly supported by product rules.
- Modify calendar events in MVP.
- Merge people or projects automatically.
- Make high-impact account, billing, or deletion decisions.

### 13.3 Structured output contract

Every interpretation response must validate against a versioned server-side schema. At minimum it contains:

```json
{
  "schemaVersion": "1",
  "sourceCaptureId": "uuid",
  "proposals": [
    {
      "recordType": "task",
      "operation": "create",
      "fields": {},
      "relationships": {},
      "confidence": {},
      "needsReview": true,
      "reason": ""
    }
  ]
}
```

Invalid output is never written directly to canonical records. It is retried with bounded attempts, then routed to manual review.

### 13.4 Confidence policy

- Confidence is evaluated per material field, not only per response.
- Person/project match, date, recurrence, and destructive update require higher confidence than title cleanup.
- New users begin review-first.
- Auto-file becomes an explicit preference after the user demonstrates successful review behavior.
- Product operators can adjust thresholds without redeploying, with audit history.

### 13.5 Model architecture

- Use a provider abstraction so the data model is not tied to one model vendor.
- Use the smallest reliable model for classification/extraction.
- Use deterministic parsing for dates or recurrence where it performs better.
- Redact unnecessary sensitive fields before model calls.
- Do not include the user’s whole database in a capture prompt.
- Log model/version, latency, cost estimate, schema outcome, and user correction without exposing secrets.

### 13.6 Evaluation set

Before public beta, maintain a versioned test set containing at least:

- 200 short text captures.
- 100 voice transcriptions across accents and noisy conditions.
- 100 date/time/recurrence cases.
- 100 ambiguous person/project cases.
- 50 multi-intent captures.
- 50 sensitive personal-note cases.
- 50 adversarial or prompt-injection-like inputs.

Track field accuracy, structural acceptance, false confident matches, latency, and cost per capture on every material prompt/model change.

---

## 14. Data model

All user-owned entities include `id`, `user_id`, `created_at`, `updated_at`, optional `archived_at`, and a version or concurrency field.

### 14.1 Core entities

| Entity | Purpose | Important relationships |
|---|---|---|
| User | Identity and account | Preferences, subscription, connections |
| UserPreference | Locale, timezone, capture, notification defaults | User |
| Capture | Immutable source and processing state | Proposals, resulting records, media |
| CaptureProposal | Versioned AI interpretation | Capture, proposed/created records |
| Domain | Durable responsibility area | Projects, retainers, tasks, notes, people |
| Task | Actionable commitment | Domain, project/retainer, person, note, capture |
| RecurrenceRule | Versioned recurrence definition | Task or routine template |
| Project | Finite outcome | Domain, milestones, tasks, checklists, activity |
| Milestone | Project checkpoint | Project, tasks |
| ChecklistTemplate | Reusable process definition | Project/retainer templates |
| ChecklistInstance | Snapshot used in real work | Project or retainer cycle |
| Retainer | Ongoing engagement | Domain, client/person, cycles, templates |
| RetainerCycle | One period of a retainer | Retainer, generated tasks/checklists |
| Routine | Repeated personal behavior | Domain, daily instances |
| RoutineInstance | Scheduled completion state | Routine |
| Person | Lightweight personal/client record | Retainers, projects, facts, interactions, tasks |
| PersonFact | Discrete sourced fact | Person, capture |
| Interaction | Timestamped relationship context | Person, follow-up task, capture |
| Note | Contextual written record | Domain and any linkable entity |
| ActivityEvent | Append-only meaningful event | Actor, source, affected entity |
| SlippingRule | Expected-attention rule | Entity type or specific entity |
| SlippingSignal | Computed attention-risk episode | Entity, rule, outcome |
| CalendarConnection | OAuth and sync health | User, calendars |
| CalendarEventMirror | Read-only provider event | Calendar connection, optional linked records |
| Notification | Delivery and read state | User, source entity |
| Subscription | Billing and entitlement state | User, provider customer/subscription |
| UsageLedger | Metered AI/storage usage | User, subscription period |
| AuditEvent | Security and data-change history | User, actor, entity |

### 14.2 Relationship rules

- MVP records have one primary owner and are not shared.
- A task may link to at most one primary project or retainer in MVP.
- Notes may link to multiple records through a generic relation table.
- Retainer-cycle generated items store template version and source item IDs.
- AI proposals never become the sole history; original capture and final record remain linked.
- Hard deletion is delayed where recovery is promised and propagated to search/vector indexes.

### 14.3 Event model

Activity events should be append-only and include:

- Event type.
- Entity type and ID.
- User/actor.
- Source: user, AI proposal, system job, calendar sync, billing webhook.
- Timestamp.
- Material metadata.
- Idempotency key when generated asynchronously.

The Slipping engine consumes meaningful activity events rather than relying only on `updated_at`.

---

## 15. Technical architecture and constraints

### 15.1 Recommended stack

| Layer | Recommendation |
|---|---|
| Web application | Next.js with TypeScript and responsive/PWA support |
| UI | Accessible component system with a small Slipwell design-token layer |
| API | Next.js server routes/server actions with explicit schemas and authorization |
| Database/auth/storage | Supabase Postgres, Auth, and Storage |
| Validation | Shared versioned schemas, e.g. Zod |
| Background processing | Durable queue for AI, transcription, reminders, calendar sync, cycle generation, export |
| Search | Postgres full-text initially; pgvector later |
| Billing | Stripe Checkout, Billing, Customer Portal, and signed webhooks |
| Email | Transactional email provider with delivery events |
| Analytics | Privacy-conscious product analytics plus first-party event warehouse/table |
| Error monitoring | Server and client exception/performance monitoring with content redaction |
| Deployment | Vercel or equivalent Next.js-compatible platform; choose based on queue and background-job needs |

### 15.2 Architecture rules

- Do not expose privileged database credentials to the browser.
- Enable row-level security on every exposed user-data table.
- Validate authorization and input on the server for every mutation.
- Use idempotency keys for capture submission, webhook processing, retainer generation, notifications, and calendar sync.
- Long-running AI, transcription, export, and synchronization work must not depend on one browser request remaining open.
- Maintain separate development, staging, and production environments.
- Database migrations are version-controlled and tested against representative data.
- Feature flags protect unfinished or risky features.
- Secrets are stored only in managed server-side secret stores.

### 15.3 Web/PWA requirements

- Support current and previous major versions of Chrome, Safari, Firefox, and Edge.
- Responsive down to 360 CSS pixels.
- Provide a valid web app manifest and install guidance where supported.
- Cache the application shell where safe.
- P1: local draft/offline queue for captures. In P0, show an explicit failure and preserve the draft in browser storage when submission fails.
- Browser capability detection must provide graceful alternatives for microphone, push, and installation.

### 15.4 Future Expo compatibility

The API and domain logic should remain client-independent so the future Expo app can reuse:

- Authentication contracts.
- Capture and upload endpoints.
- Shared validation schemas where practical.
- Sync-friendly entity versioning.
- Notification deep-link identifiers.
- Entitlement and usage APIs.

Do not place canonical business rules only in React components or browser-only code.

---

## 16. Non-functional requirements

### 16.1 Performance

| Requirement | Target |
|---|---:|
| Signed-in route response / usable shell | p75 under 2.5 seconds on typical broadband |
| Common mutation acknowledgement | p95 under 500 ms before async work |
| Text capture proposal | median under 5 seconds |
| Short voice capture proposal | median under 8 seconds after recording ends |
| Keyword search | p95 under 1 second at 10,000 records/account |
| Background job visibility | processing state shown within 2 seconds |

### 16.2 Reliability

- Monthly availability target: 99.9% after public launch, excluding announced maintenance.
- Capture loss rate: below 0.5%; aspirationally below 0.1%.
- Unrecoverable duplicate capture/record rate: below 0.5%.
- Daily automated backups with documented restore testing.
- Dead-letter queue and operator visibility for failed background work.
- Calendar and billing webhooks are retried safely.
- Retainer cycle generation has reconciliation checks.

### 16.3 Security and privacy

- TLS in transit and managed encryption at rest.
- Row-level tenant isolation.
- Least-privilege OAuth scopes and service credentials.
- Encrypted provider refresh tokens with restricted access.
- Short-lived signed URLs for private files.
- Sensitive content removed from logs, analytics, error traces, and support attachments by default.
- Rate limits for authentication, capture, AI, export, and search endpoints.
- CSRF, XSS, injection, SSRF, file validation, and webhook-signature protections appropriate to the stack.
- Dependency and secret scanning in CI.
- Published privacy policy, terms, subprocessors, deletion behavior, and AI data handling before public launch.
- Security incident response and credential-revocation procedure before storing production calendar tokens.

### 16.4 Accessibility

- Target WCAG 2.2 AA for core flows.
- Full keyboard operation on desktop.
- Visible focus indicators.
- Semantic labels and screen-reader announcements for capture/processing state.
- Color is never the only indicator of priority, status, or Slipping severity.
- Respect reduced-motion settings.
- Touch targets are at least 44 by 44 CSS pixels where practical.
- Voice capture always has a text alternative.

### 16.5 Data portability and retention

- Export is available to Free and Pro users.
- User-authored records remain readable after downgrade.
- Document retention periods for original audio, soft-deleted records, logs, exports, and backups.
- Allow users to disable original-audio retention after transcription.
- Deletion propagates to search indexes, file storage, analytics identifiers where required, and AI caches.

---

## 17. Analytics and measurement

### 17.1 North-star metric

**Weekly Resolved Commitments (WRC):** the number of distinct tasks, project/retainer actions, review items, or Slipping signals that an active user meaningfully resolves in a week.

This measures delivered value better than time in app or raw records created.

### 17.2 Supporting product metrics

| Area | Metrics |
|---|---|
| Acquisition | Visitor-to-signup, source/UTM, landing-page conversion, referral conversion |
| Activation | First-capture completion, first accepted route, calendar/retainer setup, activation rate |
| Capture | Captures per active user, days captured/week, text vs voice, latency, failure/loss rate |
| AI trust | Structural acceptance, field correction rate, false confident match rate, undo rate |
| Today | Days opened/week, Top Three selection/completion, task actions from Today |
| Retainers | Retainers created, cycle generation success, rollover completion, carry-forward volume |
| Slipping | Signals shown, acted on, deferred, dismissed, muted, and time to resolution |
| Retention | D1, W1, W6, M3 active retention by persona and activation behavior |
| Revenue | Trial-to-paid, activated-to-paid, MRR, ARR, ARPU, churn, annual mix, refunds |
| Economics | AI cost/capture, infra cost/MAU, gross margin, cost by cohort and plan |
| Growth | Shared recap/template rate, referral invites, invite conversion, organic mentions |

### 17.3 Core event taxonomy

At minimum instrument:

- `account_created`
- `onboarding_completed`
- `calendar_connected`
- `capture_started`
- `capture_submitted`
- `capture_processing_completed`
- `capture_failed`
- `proposal_confirmed`
- `proposal_corrected`
- `proposal_undone`
- `task_completed`
- `top_three_selected`
- `project_created`
- `retainer_created`
- `retainer_cycle_generated`
- `retainer_cycle_reviewed`
- `slipping_signal_viewed`
- `slipping_signal_acted`
- `search_performed`
- `trial_started`
- `paywall_viewed`
- `subscription_started`
- `subscription_canceled`
- `export_requested`
- `account_deletion_requested`
- `referral_shared`

Analytics events must use record IDs and safe categorical metadata, not note bodies, capture transcripts, person facts, or other sensitive content.

### 17.4 Go/no-go thresholds

| Metric | Proceed | Warning |
|---|---:|---:|
| AI structural acceptance | ≥85% | <70% |
| Activated-user six-week weekly retention | ≥40% | <25% |
| Retained users reducing/replacing two tools | ≥25% | <10% |
| Retainer users completing monthly rollover | ≥60% | <35% |
| Slipping signals producing intentional action | ≥25% | <10% |
| Target interviews willing to pay ≥US$12/month | ≥30% | <15% |
| Activated-to-paid conversion | ≥8% | <3% |
| Capture loss/unrecoverable duplicate rate | <0.5% | >2% |

If a core metric remains in the warning zone for two measured cohorts, improve the core loop before adding P2 modules.

---

## 18. Monetization and growth strategy

### 18.1 Why freemium plus trial

Slipwell needs repeated capture before users trust it. A permanent Free plan removes the purchase barrier from social traffic, while an automatic Pro trial allows new users to experience retainer and advanced Slipping value immediately. The business does not depend on every user converting; it depends on converting people whose professional workflows receive measurable value.

### 18.2 Conversion principles

- Let the user experience at least one capture success and one Slipping/retainer outcome before aggressive upgrade messaging.
- Price professional value rather than generic AI access.
- Never hold user-authored data or export hostage.
- Prefer annual plans for cash flow, but show monthly pricing transparently.
- Use quotas to protect unit economics without making normal usage unpredictable.
- Test allowances, not the core promise, before testing radically different prices.

### 18.3 Built-in growth loops

**Growth features must never expose private productivity data by default.**

1. **Shareable workflow templates (P1)**
   - Public landing pages for a retainer checklist, content project, or weekly review setup.
   - Recipient previews the structure before signing up.
   - Import creates independent private copies, not shared data.

2. **Sanitized progress/recap cards (P1)**
   - User explicitly chooses which counts or labels appear.
   - Default cards contain aggregate outcomes, not task names, clients, people, or notes.
   - Optional subtle Slipwell attribution and referral link.

3. **Referral program (P1)**
   - Each verified referral that activates may grant both users limited Pro time or AI allowance.
   - Cap rewards and protect against self-referral/fraud.

4. **Founder-led demo loop**
   - Demonstrate one raw capture becoming connected records.
   - Demonstrate a non-overdue but neglected project appearing in Slipping.
   - Demonstrate retainer cycle rollover and carry-forward.
   - Turn common questions into short demos and landing pages.

5. **Use-case SEO and community pages**
   - Retainer task management.
   - Monthly client checklist.
   - Voice capture for freelancers.
   - Neglected project tracking.
   - Creator-consultant content workflow.

### 18.4 Channel approach

| Channel | Role | Content style |
|---|---|---|
| Twitter/X | Primary awareness and build-in-public feedback | Short demos, before/after workflows, product decisions, user outcomes |
| Reddit | Problem discovery, credibility, and targeted launch | Detailed useful posts, transparent founder participation, no spam or fake testimonials |
| TikTok / short video | Selective reach | Visually immediate voice-capture and Slipping moments |
| YouTube | Later durable acquisition | Full workflow walkthroughs and comparisons |
| Search | Durable high-intent acquisition | Workflow-specific guides and templates |

### 18.5 Launch sequence

1. Founder problem interviews and public build notes.
2. Waitlist with one interactive capture demo.
3. Concierge alpha with 10–15 target users.
4. Private beta with approximately 50 target users.
5. Paid founding-member release.
6. Public launch only after capture reliability and correction flow meet thresholds.

---

## 19. Roadmap and preserved future vision

This section intentionally records capabilities from the original vision so they are not forgotten. A future item is not an MVP commitment.

### Phase 0 — Validation and prototype (2–4 weeks)

- Interview 25–40 creator-consultants, freelancers with retainers, and solo operators.
- Test positioning and willingness to pay.
- Build interactive capture → proposal → review prototype.
- Manually review/verify AI routing behind the scenes if necessary.
- Prototype the retainer rollover and Slipping explanations.
- Recruit private-beta cohort.

**Exit criteria:** Users understand capture review and Slipping without extensive explanation; at least one-third of qualified interviewees express willingness to pay at least US$12/month.

### Phase 1 — Private web beta (8–12 weeks, subject to team capacity)

- Auth and onboarding.
- Responsive Next.js application.
- Text and browser voice capture.
- AI proposals, review Inbox, undo, and audit history.
- Today and Top Three.
- Tasks and domains.
- Finite projects and checklist templates.
- Monthly retainers and safe cycle generation.
- Google Calendar read sync.
- Initial Slipping engine.
- Simple routines.
- Lightweight people and notes.
- Keyword search.
- In-app/email notifications.
- Export and account deletion.
- Internal analytics and operational tools.

**Exit criteria:** Capture and routing reliability targets are met with approximately 50 beta users; no unresolved cross-user data exposure or destructive rollover bug.

### Phase 2 — Public paid web launch

- Free and Pro entitlements.
- 14-day Pro trial.
- Stripe billing and lifecycle communication.
- Browser push where supported.
- Improved imports and onboarding.
- Content project template.
- Public template pages.
- Referral and sanitized share cards.
- Performance, accessibility, and security hardening.

**Exit criteria:** Six-week retention and paid-conversion results are outside warning zones; support load and AI unit economics are sustainable.

### Phase 3 — Depth after product-market evidence

- Semantic search.
- People Slipping cadence and richer personal CRM.
- Content-specific pipeline stages, channels, URLs, publishing dates, outline, tasks, and checklists.
- Advanced routines, streaks, fixed-duration challenges, and trend charts.
- Time logging and optional timer.
- Note resurfacing and review queues.
- Improved importers from common task and note tools.
- Multiple calendar accounts and optional calendar write/time blocking.
- Grounded AI chat with citations to supporting records.

### Phase 4 — Native mobile

- Expo application for iOS and Android.
- Native quick capture.
- Share sheet / share intent.
- Offline capture queue and background sync.
- Native push notifications.
- Widgets and platform shortcuts.
- Camera/image capture.
- Evaluate Apple Watch and Wear OS capture after phone usage is proven.

### Phase 5 — Broader personal context

- Rich journal entries with photos and short video.
- Image-to-journal insight extraction with explicit review.
- Books, authors, reading status, ratings, and summaries.
- Kindle/Readwise-style highlight imports where legally and technically supported.
- Quotes with sources and evolving user reflections.
- Personalized resurfacing.
- Richer relationship interactions and important-date reminders.

### Conditional later opportunities

- Shared client spaces and small-agency collaboration.
- Roles, permissions, assignments, and audit history.
- Retainer reporting and client-facing summaries.
- Additional calendars and work integrations.
- User-created templates and limited custom fields.
- API and automation platform.

### Explicitly parked

- Household inventory, insurance records, and resale reminders.
- Fully arbitrary custom database builder.
- Enterprise administration and compliance.
- Public social network.

Parked items require a new business case; they should not be pulled into a sprint merely because they appeared in the original inspiration.

---

## 20. UX states and edge-case checklist

Every core surface must define and design:

- First-use empty state.
- Useful empty state after setup.
- Loading and optimistic state.
- Partial data state.
- Permission denied state.
- Offline or lost-connection state.
- Recoverable processing failure.
- Permanent failure requiring action.
- Downgraded/over-limit state.
- Archived and deleted state.
- Timezone and daylight-saving transition.
- Duplicate submission or webhook retry.
- Record changed in another tab.

### Particularly important product edge cases

- Voice capture permission denied or unavailable.
- User closes the tab during upload or AI processing.
- AI proposes an existing person/project with the same name.
- A capture contains both a private reflection and an actionable task.
- User says “tomorrow” while traveling across timezones.
- Reminder time is already in the past.
- Recurring task completed after its next occurrence date.
- Retainer cycle creation retries after a partial failure.
- Calendar token expires while Today is open.
- User downgrades with more than one active retainer.
- Account hits AI limit during an uploaded voice capture.
- A source capture is deleted after derived tasks were completed.
- A user asks export/delete while background jobs are in progress.

---

## 21. Operational and admin requirements

Internal tools should provide least-privilege visibility into:

- Background job status, retries, and dead-letter items.
- Capture processing latency and failure category without showing private content by default.
- Calendar connection and sync health.
- Retainer cycle generation and reconciliation.
- Notification delivery status.
- Subscription/webhook state.
- Feature flags and AI confidence thresholds.
- Usage/cost anomalies.
- User-requested export and deletion status.

Support impersonation is not permitted in MVP. If later introduced, it requires explicit user consent, strong audit logs, short duration, and restricted staff roles.

---

## 22. Testing and quality gates

### 22.1 Automated testing

- Unit tests for date parsing, recurrence, Slipping rules, entitlement logic, and rollover decisions.
- Property/idempotency tests for retainer cycle generation and webhook processing.
- Integration tests for authorization and row-level isolation.
- Contract tests for AI structured outputs.
- End-to-end tests for sign-up, first capture, review, Today, task completion, retainer creation, downgrade, export, and deletion.
- Calendar synchronization tests for initial sync, incremental sync, invalid token, deletion, and duplicate delivery.
- Accessibility tests plus manual screen-reader and keyboard review of core flows.
- Cross-browser tests for capture, microphone permission, PWA, and responsive navigation.

### 22.2 Release-blocking conditions

Do not publicly launch with:

- A known path to cross-user data access.
- Silent capture loss.
- Unbounded duplicate task or retainer-cycle creation.
- Destructive downgrade behavior.
- Calendar data shown as current when connection is known to be invalid.
- AI output written without schema validation.
- Missing export or account-deletion path.
- Core flows unusable by keyboard or on a 360-pixel-wide viewport.
- Billing entitlements based only on client state.

### 22.3 MVP acceptance journey

A release candidate passes when a new user can:

1. Sign up and confirm timezone.
2. Complete a text or voice capture without choosing a type.
3. Review the original input and AI proposal.
4. Correct a destination and see the correction preserved.
5. Find the resulting record in Today or its related project.
6. Create a finite project from a checklist template.
7. Create a monthly retainer with recurring work.
8. Simulate or reach a cycle boundary without duplicates or lost incomplete work.
9. See an explained Slipping signal and take an intentional action.
10. Connect Google Calendar and see accurate read-only events and sync status.
11. Complete a routine separately from tasks.
12. Search across tasks, work, people, notes, and source captures.
13. Start, convert, cancel, and downgrade a Pro subscription without data loss.
14. Export their data and request account deletion.

---

## 23. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Product becomes a shallow all-in-one suite | Weak differentiation and slow delivery | Enforce P0/P1 boundaries and lead with retainers + Slipping + capture. |
| AI routes important information incorrectly | Users abandon capture | Preserve source, review-first onboarding, confidence gates, undo, evaluation set. |
| Slipping becomes noisy or judgmental | Notifications are ignored or disabled | Explain signals, bundle alerts, allow cadence changes and intentional dismissal. |
| Retainer rollover corrupts or duplicates work | Professional trust failure | Idempotent jobs, versioned templates, reconciliation, extensive edge-case tests. |
| Sensitive data concentration | High breach and reputation impact | RLS, least privilege, redacted logs, transparent AI use, export/deletion, security review. |
| Calendar sync becomes stale | Today loses credibility | Incremental sync, push updates, reconciliation, visible health and reconnect states. |
| Free users create high AI cost | Poor unit economics | Quotas, smaller models, asynchronous processing, usage ledger, no unlimited promise. |
| Free tier does not convert | Revenue failure | Reserve professional scale and controls for Pro; test upgrade moments and annual offer. |
| Paywall prevents viral adoption | Weak acquisition loop | Preserve useful Free core, no-card trial, public templates, referrals, share-safe outputs. |
| Social launch attracts the wrong audience | High signups but low retention | Segment onboarding and measure retention by persona/source, not aggregate signups. |
| Competitors copy visible features | Differentiation erodes | Build accumulated trust, workflow quality, retainer history, and attention data—not feature count. |

---

## 24. Open product questions to validate, not block the MVP specification

These questions should be answered through interviews and beta behavior rather than founder preference alone:

1. Do users naturally describe the problem as “things slipping,” “mental load,” “capture friction,” or “recurring client work”?
2. Which initial capture intent is most common and most valuable?
3. Does voice materially improve retention on the web, or mainly improve demo appeal until native mobile exists?
4. Is one free retainer enough to demonstrate value without satisfying all professional usage?
5. Are 50 Free and 500 Pro AI captures reasonable allowances relative to real behavior and cost?
6. Should the default task reminder be automatic, and if so how far before the due time?
7. How often should Slipping appear in Today versus a digest?
8. Should project/retainer cadence be configured directly or inferred through a short setup question?
9. Does the content template materially improve activation for creator-consultants?
10. Which import path most increases successful migration: Todoist, Notion, Apple Notes, CSV, or another source?
11. Does “AI command center” or “personal operations app” produce better qualified acquisition?
12. Which annual founding offer generates conversion without anchoring the long-term price too low?

---

## 25. Recommended build order

The order below minimizes rework and proves risk in the right sequence.

1. Authentication, tenant isolation, base design system, and event/audit foundation.
2. Canonical capture storage and manual text capture without AI.
3. AI proposal schema, review Inbox, correction, undo, and evaluation harness.
4. Tasks, domains, relationships, and Today foundation.
5. Finite projects, checklist templates, and meaningful activity events.
6. Retainers, cycle generation, rollover, reconciliation, and history.
7. Slipping calculation, explanations, actions, and outcome tracking.
8. Google Calendar OAuth, sync, health, and Today agenda.
9. Simple routines, people, notes, and keyword search.
10. Voice upload/transcription and browser capability handling.
11. Notifications, summaries, and processing/failure recovery.
12. Export, deletion, privacy disclosures, and security hardening.
13. Billing, plan entitlements, trial, downgrade, and usage controls.
14. Analytics, operational tooling, performance, accessibility, and beta QA.
15. P1 content template and growth loops after the core beta is stable.

---

## 26. Definition of done

Slipwell MVP is done when:

- Every P0 requirement has an implemented, reviewed, and tested state.
- The full MVP acceptance journey passes in production-like staging.
- Private beta metrics meet or approach the proceed thresholds with no unresolved trust or data-isolation issue.
- Capture failures are recoverable and visible.
- Retainer rollover is idempotent and preserves history.
- Every Slipping signal is explainable and actionable.
- Calendar freshness is visible.
- Free/Pro/trial/downgrade behavior is tested without data loss.
- Export, deletion, privacy policy, terms, and AI disclosures are live.
- Product analytics exclude sensitive record contents.
- Support and incident procedures exist.
- The public landing message communicates one promise rather than the complete future feature list.

At that point, Slipwell is a focused commercial product—not yet the complete life-management vision. Expansion should be earned through retained-user demand and evidence that the core loop is trusted.

---

## Appendix A — Competitive price context as of August 2026

Public pricing changes over time and should be rechecked before launch. At the time this PRD was written:

- [Todoist Pro](https://www.todoist.com/pricing) was listed around US$5/month when billed annually.
- [Routine Professional](https://routine.co/pricing) was listed around US$10/month.
- [Motion Pro AI](https://www.usemotion.com/pricing) was listed around US$19/month annually.
- [Superlist Super](https://www.superlist.com/pricing) was listed around US$21/month annually.

This supports testing Slipwell at US$15 monthly / US$144 annually: higher than a basic task manager, lower than several AI-heavy suites, and justified by professional retainer and attention-risk workflows. Price remains a testable hypothesis.

## Appendix B — Concise landing-page brief

**Hero eyebrow:** Your work-and-life capture system  
**Headline:** Nothing important slips through.  
**Subheadline:** Slipwell turns quick thoughts into organized tasks, projects, client commitments, notes, and reminders—then shows what needs attention before it becomes a problem.  
**Primary CTA:** Start free  
**Secondary CTA:** Watch one capture organize itself  

**Three proof points:**

1. Capture by text or voice without choosing where it belongs.
2. Run one-time projects and recurring client work in the same calm system.
3. See neglected commitments before they become overdue.

**Primary demo:** A raw spoken thought becomes a task linked to the correct retainer, person, date, and reminder; the user can see and correct every decision.

## Appendix C — Glossary

| Term | Meaning |
|---|---|
| Capture | Original unstructured text or audio submitted by a user. |
| Proposal | Structured interpretation suggested by Slipwell before or during filing. |
| Domain | Durable top-level area of responsibility. |
| Project | Finite outcome with an intended completion state. |
| Retainer | Ongoing engagement composed of recurring cycles and preserved history. |
| Retainer cycle | One recurring period, initially one month, within a retainer. |
| Routine | Repeated personal behavior intentionally separated from tasks. |
| Meaningful attention | An event indicating substantive progress, decision, or intentional deferment. |
| Slipping | State in which a record has received less meaningful attention than expected. |
| Structural acceptance | AI proposal accepted without changing its record type, destination/relationships, or date semantics. |
| Activated user | User satisfying the defined early behaviors that indicate experience of core value. |
