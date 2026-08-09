import { expect, test } from "@playwright/test";

const authenticatedState = process.env.PLAYWRIGHT_AUTH_STORAGE_STATE;

/* Mirrors e2e/task-lifecycle.spec.ts's capture-to-review polling and title-pinning approach —
   see that file for why: interpretation is a real, fire-and-forget AI call, so this polls the
   Inbox rather than assuming fixed latency, and matches the review card by the capture's own
   original text (always rendered verbatim) rather than by whatever the model titled or
   classified it as.

   Unlike that spec, a proposal can only route into a project that already exists — creating one
   is deliberately out of a capture's reach (a project carries dates and an outcome a name alone
   can't supply, see src/lib/proposals/catalog.ts). So this test creates the destination project
   through the Work page first, then — rather than trusting the model to have named that project
   correctly in its own destination guess — pins the review card's own "Project" picker to it
   explicitly, the same way Record type and Title are pinned rather than trusted. */
test.describe("capture to project structure and activity", () => {
  test.skip(
    !authenticatedState,
    "Set PLAYWRIGHT_AUTH_STORAGE_STATE to an authenticated storage state for test@test.com.",
  );

  test("routes an accepted task into a project and records a meaningful progress event", async ({
    page,
  }) => {
    // Real AI interpretation latency (up to a 270s poll budget below) plus a project creation
    // round trip, several navigations, a progress event, and two cleanup deletions — more steps
    // than task-lifecycle.spec.ts's simpler flow, so this carries a larger buffer past the poll.
    test.setTimeout(360_000);
    const marker = `e2e-project-lifecycle-${Date.now()}`;
    const projectName = `Launch the ${marker} report`;
    const taskTitle = `Draft the outline for ${marker}`;

    // 1. Create the destination project first — proposals can only route into an existing one.
    await page.goto("/work");
    await page.getByRole("button", { name: "New project" }).click();
    await page.getByLabel("Outcome").fill(projectName);
    await page.getByRole("button", { name: "Create project" }).click();
    await expect(page.getByText("Project created.")).toBeVisible();
    // The template library on this same page reuses the ".project-card" class for its own
    // cards, so this scopes to the article that actually carries our project's own <h3> name
    // rather than any card whose text happens to contain it.
    const projectCard = page
      .locator("article.project-card")
      .filter({ has: page.getByRole("heading", { name: projectName, exact: true }) });
    await expect(projectCard).toBeVisible();

    // 2. Capture a task-shaped thought and let it reach the Inbox for review.
    await page.goto("/inbox");
    await page.getByRole("button", { name: "New capture" }).click();
    await page.getByRole("button", { name: "Type it instead" }).click();
    await page.getByLabel("Capture text").fill(`${taskTitle} today`);
    await page.getByRole("button", { name: "Capture it" }).click();
    await expect(page.getByText("Captured. Review it in your inbox.")).toBeVisible();
    // The dialog's onCaptured handler fires interpretation as a keepalive fetch right as the
    // dialog closes; give it a moment to actually leave the page before the first reload below,
    // or it can be marked stranded ("connection dropped") purely from the reload's own timing.
    await page.waitForTimeout(2_000);

    // Scoped to the blockquote specifically, not the whole card's text: every review card's own
    // "Project" picker lists *every* project in the catalog as an <option>, so a plain hasText
    // filter would also match other unrelated cards purely because our new project's name shows
    // up in their dropdowns too.
    const card = page
      .locator(".review-card")
      .filter({ has: page.locator("blockquote.review-source", { hasText: marker }) });
    const strandedRetry = page
      .locator("article")
      .filter({ has: page.locator("blockquote", { hasText: marker }) })
      .getByRole("button", { name: "Interpret it now" });
    // A capture that reaches "needs_review" but produced no usable proposal items (interpretation
    // ran and failed, as distinct from never having started) renders the same review card with a
    // "Not interpreted" panel and its own "Interpret again" retry instead of a Record type field —
    // so readiness is judged by that field appearing, not merely by the card itself being visible.
    const interpretAgain = card.getByRole("button", { name: "Interpret again" });
    const recordTypeField = card.getByLabel("Record type");
    // Both retries reclaim the capture and start a genuinely new interpretation attempt server
    // side; they do not cancel whichever attempt is already in flight. A capture's status is
    // "queued" for the brief window between being stored and the fire-and-forget interpret
    // request actually landing, and isStrandedCapture treats "queued" as stranded unconditionally
    // (unlike "interpreting", which gets a two-minute grace period) — so a reload that lands in
    // that window looks identical to a genuinely dropped connection. Racing a retry click against
    // that in-flight original request has been observed, on this account, to leave the capture
    // pointed at two independently-completed "ready" proposals instead of one. So the first poll
    // is a read-only grace period — long enough for the original request to have landed under
    // normal latency — before a retry is ever considered, and then clicked at most once total.
    let retried = false;
    let pollCount = 0;
    await expect(async () => {
      await page.reload();
      pollCount += 1;
      if (!retried && pollCount > 1) {
        if (await strandedRetry.isVisible().catch(() => false)) {
          retried = true;
          await strandedRetry.click();
        } else if (await interpretAgain.isVisible().catch(() => false)) {
          retried = true;
          await interpretAgain.click();
        }
      }
      await expect(recordTypeField).toBeVisible();
    }).toPass({ timeout: 270_000, intervals: [3_000] });

    // 3. Pin type, title, and destination before accepting — the model's own guesses for any of
    // these are not trusted, only reviewed.
    await card.getByLabel("Record type").selectOption("task");
    await card.getByLabel("Title").fill(taskTitle);
    await card.getByLabel("Project").selectOption({ label: projectName });
    await card.getByRole("button", { name: "Accept and file" }).first().click();
    // Accepting triggers a hard `window.location.reload()` (see Review's `done` prop in
    // inbox-page.tsx) rather than a router.refresh(), so a small margin beyond the default 5s
    // covers a slower-than-usual reload against a shared account under load from other agents'
    // own e2e runs on the same hosted Supabase project.
    await expect(card).toHaveCount(0, { timeout: 15_000 });

    // 4. The accepted task shows up on Tasks, carrying the project it was filed into — this is
    // the "project/task structure" half of the tracker line. Tasks defaults to the Week view,
    // which renders its own compact per-day markup rather than record-card articles, so List is
    // selected explicitly to reach the card structure that carries the project's name.
    await page.goto("/tasks");
    await page.getByRole("button", { name: "List" }).click();
    const taskCard = page.locator(".record-card").filter({ hasText: taskTitle });
    await expect(taskCard).toBeVisible();
    await expect(taskCard.getByText(projectName)).toBeVisible();

    // Delete the task now, while still on this page and view — a locator captured here would
    // otherwise point at an element that no longer exists once step 5 below navigates away.
    await taskCard.getByRole("button", { name: "More actions" }).click();
    await page.getByRole("menuitem", { name: "Delete" }).click();
    await expect(taskCard).toHaveCount(0);

    // 5. "Mark progress" is the product's own deliberate, explainable meaningful-attention event
    // (record_project_progress -> "progress_recorded"), independent of whether the task itself
    // is ever completed — proving the project's activity trail is real, not cosmetic.
    await page.goto("/work");
    const projectCardAgain = page
      .locator("article.project-card")
      .filter({ has: page.getByRole("heading", { name: projectName, exact: true }) });
    await expect(projectCardAgain).toBeVisible();
    await projectCardAgain.getByRole("button", { name: "Mark progress" }).click();
    await expect(page.getByText("Progress recorded.")).toBeVisible();

    const activity = projectCardAgain.locator(".project-activity");
    await activity.locator("summary").click();
    await expect(activity.getByText("Progress recorded")).toBeVisible();
    await expect(activity.getByText("Project created")).toBeVisible();

    // Leave the shared account clean: delete the project this test created too.
    await projectCardAgain.getByRole("button", { name: "More actions" }).click();
    await page.getByRole("menuitem", { name: "Delete" }).click();
    await expect(projectCardAgain).toHaveCount(0);
  });
});
