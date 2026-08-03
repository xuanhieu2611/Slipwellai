# Phase 0 validation kit

Use this kit for Step 0 of `MVP-BUILD-TRACKER.md`. Do not record capture text, client names, or other private information. Use a participant ID such as `P-001` and report only aggregate results in the tracker and decision memo.

## Who qualifies

Recruit creator-consultants, freelancers with recurring clients, or solo operators who personally manage a mix of client work, finite projects, and personal commitments. They should currently use at least two tools for capture, task management, calendar, notes, or recurring client work.

Exclude people who only need a basic task list, require team permissions, or do not own their own workflow.

## 30-minute interview and prototype session

1. Start with current behavior, before showing Slipwell.
   - Tell me about the last thing you nearly forgot or had to reconstruct.
   - How often does that happen in a typical week or month?
   - What do you do today? What is frustrating or costly about that workaround?
2. Show the short capture → proposal → review loop. Ask the participant to narrate what they think will happen before each step.
3. Show a monthly retainer cycle that carries one open item into the next cycle. Ask whether it matches their recurring-client workflow.
4. Show a Slipping signal, its explanation, and an intentional outcome. Ask what it means and whether it would be useful or noisy.
5. Test three messages separately: capture trust, retainer rollover, and Slipping. Randomize their order across participants.
6. Ask: “If this reliably solved the parts of your workflow we discussed, would you pay US$12–15 per month?” Follow with: “What would need to be true for that to be an easy yes?”
7. Close with: “What would make you distrust or stop using this?” Ask permission to invite qualified people to the concierge alpha.

Do not lead participants toward an answer. Ask them to explain the workflow back in their own words before clarifying it.

## Per-participant record

Store this in a private founder-controlled spreadsheet or research tool—not in the application database.

| Field | Allowed values / notes |
| --- | --- |
| Participant ID | `P-001` format; no name or client name in aggregate notes |
| Date and interviewer | Date and first name/initial only |
| Segment | Creator-consultant, freelancer with retainers, or solo operator |
| Qualified | Yes/no and brief non-sensitive reason |
| Problem frequency | Daily, weekly, monthly, rare |
| Existing workaround | Safe category only, such as “calendar + notes” |
| Workflow understanding | Unprompted, after one clarification, or not understood |
| Capture trust concern | None, routing accuracy, source privacy, review burden, other safe category |
| Retainer value | High, medium, low, none |
| Slipping value | High, medium, low, none |
| Message tested | Capture, retainer, or Slipping |
| WTP at US$12+ | Yes, maybe, no |
| Reason | Short non-sensitive summary; never quote client details |
| Alpha interest | Yes/no/maybe |
| Follow-up | Consent status and safe contact reference held outside the research export |

## Manual prototype acceptance script

Use only fictional, low-sensitivity test data. Record pass/fail, date, browser, viewport, and any defect ID.

1. Capture “Create a task titled Pilot review.” Confirm original text remains visible and a review proposal appears.
2. Accept it, then use Undo. Confirm the accepted prototype record disappears and the capture returns to review.
3. Create another proposal; change its title, type, and optional destination, then accept. Confirm the edited values are filed.
4. Discard one proposal. Confirm it no longer appears in the review inbox.
5. Trigger a failed interpretation using the approved test method; confirm the source remains visible and Retry produces a new proposal or another safe failed state.
6. Create a retainer with one fictional deliverable. Generate the current cycle twice; confirm it stays a single cycle with no duplicate template item.
7. Choose the next calendar month in the cycle control, or select **Generate next**. While the first item is open, confirm the carried item links to its source and the earlier cycle remains in history.
8. With an overdue open fictional item, run the Slipping check and record one intentional outcome (mark attention, defer, or dismiss).
9. Repeat the core capture/review flow at a 360 CSS-pixel viewport and using only keyboard navigation. Check visible focus, reachable controls, usable labels, and no horizontal scrolling.

## Alpha recruitment message

> I’m testing Slipwell, a private capture-first workspace for solo operators who juggle client work, projects, and personal commitments. You can type a thought, review the proposed task/note, and see recurring client work or neglected commitments before they slip. This is an early concierge alpha: I’ll personally help with setup and ask for candid feedback. It is not ready for sensitive client data. Would you be open to a 30-minute session and, if it fits, a small private pilot?

## Phase 0 decision memo template

**Decision date:**

**Recommendation:** Proceed / narrow the wedge / stop

**Sample:** Number interviewed, number qualified, segment mix, and number who completed a prototype session.

**Key results:**

- Workflow understanding: `__ / __` qualified participants understood capture review and Slipping without extensive explanation.
- Willingness to pay: `__ / __` qualified participants said yes at US$12+ (`__%`).
- Capture position: outcome and strongest trust concern.
- Retainer position: outcome and strongest value statement.
- Slipping position: outcome and strongest usefulness/noise concern.
- Alpha: number recruited toward 10–15; beta path toward approximately 50.

**Decision rationale:** What was learned, which evidence changes the roadmap (if any), and why.

**Risks and next actions:** Include specific reliability, trust, or positioning issues; assign an owner and date. Do not include private participant or client details.
