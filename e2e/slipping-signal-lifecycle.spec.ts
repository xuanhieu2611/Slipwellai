import { expect, test } from "@playwright/test";

const authenticatedState = process.env.PLAYWRIGHT_AUTH_STORAGE_STATE;

/* coreSlippingExplanation (src/lib/slipping.ts) fires a signal whenever a task/project is
   overdue OR its elapsed-since-attention exceeds its cadence — overdue alone is sufficient
   regardless of cadence or how recently the record was created (see the `!overdue` half of its
   early-return guard). Setting a due/target date in the past is therefore the fastest
   deterministic way to force a signal on demand, via the "Refresh attention" button (which calls
   POST /api/slipping/evaluate {scope:"core"}), without waiting on real elapsed time or faking the
   system clock.

   SlippingSignalCard renders only the signal's reason text and actions — never the underlying
   task/project's own title — so on this shared test account (other e2e specs and manual sessions
   run against the same account) a card can't be located by title the way task/project cards can
   elsewhere. Each due/target date below is instead picked from a wide, timestamp-seeded range far
   in the past (~3-11 years), so the "It was due <date>" clause in the rendered reason is,
   practically speaking, a unique marker per run — the same disambiguation role a title marker
   plays in the other lifecycle specs. */
function isoDateDaysAgo(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

test.describe("Slipping: explain a signal and resolve it", () => {
  test.skip(
    !authenticatedState,
    "Set PLAYWRIGHT_AUTH_STORAGE_STATE to an authenticated storage state for test@test.com.",
  );

  test("shows a plain-language reason for an overdue task and project, then resolves each through a distinct action", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    const marker = `e2e-slipping-${Date.now()}`;
    const taskTitle = `Follow up on ${marker}`;
    const projectName = `Deliver the ${marker} report`;
    const taskDueOn = isoDateDaysAgo(1000 + (Date.now() % 3000));
    const projectTargetOn = isoDateDaysAgo(1000 + ((Date.now() + 1_234_567) % 3000));

    // 1. Create a task whose due date is already in the past.
    await page.goto("/tasks");
    await page.getByRole("button", { name: "New task" }).click();
    // Several page-level regions carry an aria-label containing "task" (e.g. "Task view", "Task
    // week view"), so an exact match is required to reach the New Task dialog's own title field.
    await page.getByLabel("Task", { exact: true }).fill(taskTitle);
    await page.getByLabel("Due date", { exact: true }).fill(taskDueOn);
    await page.getByRole("button", { name: "Add task" }).click();
    await expect(page.getByText("Task added.")).toBeVisible();
    // Creating a task issues a command() call whose success path calls router.refresh() — an
    // in-flight Next.js data refresh for the current route, which on a slower (e.g. mobile
    // emulation) run can still be resolving when the very next line navigates elsewhere,
    // producing a spurious "navigation interrupted" error. Let it settle first.
    await page.waitForLoadState("networkidle");

    // 2. Create a project whose target date is already in the past.
    await page.goto("/work");
    await page.getByRole("button", { name: "New project" }).click();
    await page.getByLabel("Outcome").fill(projectName);
    await page.getByLabel("Target date").fill(projectTargetOn);
    await page.getByRole("button", { name: "Create project" }).click();
    await expect(page.getByText("Project created.")).toBeVisible();
    await page.waitForLoadState("networkidle");

    // 3. Refresh attention on Today — the explicit, user-initiated evaluate call.
    await page.goto("/today");
    await page.getByRole("button", { name: "Refresh attention" }).click();
    await expect(page.getByText("Attention signals refreshed.")).toBeVisible();

    const signalCard = page.locator(".record-card.slipping-signal-enter");
    const taskSignal = signalCard.filter({ hasText: taskDueOn });
    const projectSignal = signalCard.filter({ hasText: projectTargetOn });

    // 4. The signal is explained in plain language — naming the cadence and the reason, not just
    // a severity badge — and severity is "urgent" because both are actually overdue.
    await expect(taskSignal).toBeVisible();
    await expect(taskSignal).toContainText("No meaningful attention for");
    await expect(taskSignal).toContainText("expected cadence for this task is 14 days");
    await expect(taskSignal).toContainText(`It was due ${taskDueOn}.`);
    await expect(taskSignal.locator(".tag--attention")).toHaveText("urgent");

    await expect(projectSignal).toBeVisible();
    await expect(projectSignal).toContainText("expected cadence for this project is 7 days");
    await expect(projectSignal).toContainText(`It was due ${projectTargetOn}.`);
    await expect(projectSignal.locator(".tag--attention")).toHaveText("urgent");

    // 5. Resolution path one: mark attention on the task's signal. This is recorded as a real
    // outcome (slipping_signals.outcome = "marked_attention", plus a slipping_marked_attention
    // activity event per src/app/api/slipping/[signalId]/route.ts) — visible here as the signal
    // leaving the open-signals list once the page re-fetches.
    // Exact match: the card's own "Add & mark attention" (next-action) button otherwise also
    // matches a partial "Mark attention" name.
    await taskSignal.getByRole("button", { name: "Mark attention", exact: true }).click();
    await expect(page.getByText("Signal resolved.")).toBeVisible();
    await expect(taskSignal).toHaveCount(0);

    // 6. Resolution path two: change cadence on the project's signal — a distinct outcome
    // (slipping_signals.outcome = "cadence_changed") that also mutates the project's own
    // slipping_cadence_days before resolving (see the [signalId] route). Verified below by
    // reloading the persisted value from the project's own edit form, not just the toast.
    await projectSignal.getByLabel("Attention cadence (days)").fill("45");
    await projectSignal.getByRole("button", { name: "Save cadence" }).click();
    await expect(page.getByText("Cadence updated.")).toBeVisible();
    await expect(projectSignal).toHaveCount(0);
    await page.waitForLoadState("networkidle");

    // 7. A plain reload of Today (no new "Refresh attention" click, i.e. no new evaluate call)
    // must not resurrect either resolved signal — matching AGENTS.md's "avoid repeated
    // notifications without a state change." loadSignals only selects outcome = "open".
    await page.goto("/today");
    await expect(signalCard.filter({ hasText: taskDueOn })).toHaveCount(0);
    await expect(signalCard.filter({ hasText: projectTargetOn })).toHaveCount(0);

    // 8. Confirm the cadence change actually persisted on the project record, not just that the
    // signal card disappeared.
    await page.goto("/work");
    const projectCard = page
      .locator("article.project-card")
      .filter({ has: page.getByRole("heading", { name: projectName, exact: true }) });
    await expect(projectCard).toBeVisible();
    await projectCard.getByRole("button", { name: "More actions" }).click();
    await page.getByRole("menuitem", { name: "Edit" }).click();
    await expect(page.getByLabel("Attention cadence (days)")).toHaveValue("45");
    await page.getByRole("button", { name: "Cancel" }).click();

    // Leave the shared account clean: delete the project and task this test created.
    await projectCard.getByRole("button", { name: "More actions" }).click();
    await page.getByRole("menuitem", { name: "Delete" }).click();
    await expect(projectCard).toHaveCount(0);
    await page.waitForLoadState("networkidle");

    await page.goto("/tasks");
    await page.getByRole("button", { name: "List" }).click();
    const taskCard = page.locator(".record-card").filter({ hasText: taskTitle });
    await expect(taskCard).toBeVisible();
    await taskCard.getByRole("button", { name: "More actions" }).click();
    await page.getByRole("menuitem", { name: "Delete" }).click();
    await expect(taskCard).toHaveCount(0);
  });
});
