import { expect, test } from "@playwright/test";

const authenticatedState = process.env.PLAYWRIGHT_AUTH_STORAGE_STATE;

/* Interpretation is a real AI call (fire-and-forget from the capture dialog), so this polls the
   Inbox rather than assuming a fixed latency. The original capture text always renders verbatim
   in the review card's blockquote regardless of how the model titles the proposal, so that text
   — not the AI-chosen title — is what locates the right card among whatever else this shared
   account's inbox already has in it. */
test.describe("capture to task lifecycle", () => {
  test.skip(
    !authenticatedState,
    "Set PLAYWRIGHT_AUTH_STORAGE_STATE to an authenticated storage state for test@test.com.",
  );

  test("captures a task, accepts its proposal, shows it in Today, completes it, and reopens it", async ({
    page,
  }) => {
    test.setTimeout(300_000); // real AI interpretation latency plus several navigations
    const marker = `e2e-task-lifecycle-${Date.now()}`;
    const taskTitle = `Call the plumber about the kitchen sink ${marker}`;

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

    const card = page.locator(".review-card").filter({ hasText: marker });
    const strandedRetry = page
      .locator("article")
      .filter({ hasText: marker })
      .getByRole("button", { name: "Interpret it now" });
    await expect(async () => {
      await page.reload();
      if (await strandedRetry.isVisible().catch(() => false)) await strandedRetry.click();
      await expect(card).toBeVisible();
    }).toPass({ timeout: 270_000, intervals: [3_000] });

    // The AI may title or classify the proposal differently than the raw capture text, so the
    // title is pinned to a known value before accepting rather than trusting its choice.
    await card.getByLabel("Record type").selectOption("task");
    await card.getByLabel("Title").fill(taskTitle);
    await card.getByRole("button", { name: "Accept and file" }).first().click();
    await expect(card).toHaveCount(0);

    await page.goto("/tasks");
    const taskCard = page.locator(".record-card").filter({ hasText: taskTitle });
    await expect(taskCard).toBeVisible();
    // Top Three is a deterministic user action, unlike whether the model's date phrase happened
    // to resolve to a due-today date — this is the reliable way to land the task in Today.
    await taskCard.getByRole("button", { name: "Make priority" }).click();

    await page.goto("/today");
    const todayCard = page.locator(".record-card").filter({ hasText: taskTitle });
    await expect(todayCard).toBeVisible();
    await todayCard.getByRole("button", { name: "Complete" }).click();
    await expect(todayCard).toHaveCount(0);

    await page.goto("/tasks");
    await page.getByLabel("Status").selectOption("completed");
    const completedCard = page.locator(".record-card").filter({ hasText: taskTitle });
    await expect(completedCard).toBeVisible();
    await completedCard.getByRole("button", { name: "Reopen" }).click();

    await page.getByLabel("Status").selectOption("open");
    const reopenedCard = page.locator(".record-card").filter({ hasText: taskTitle });
    await expect(reopenedCard).toBeVisible();
    await expect(reopenedCard.getByRole("button", { name: "Complete" })).toBeVisible();

    // Leave the shared account clean: delete the task this test created, and wait for the
    // request to actually land before the test (and its browser context) ends.
    await reopenedCard.getByRole("button", { name: "Delete" }).click();
    await expect(reopenedCard).toHaveCount(0);
  });
});
