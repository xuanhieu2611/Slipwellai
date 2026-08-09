import { expect, test } from "@playwright/test";

const authenticatedState = process.env.PLAYWRIGHT_AUTH_STORAGE_STATE;
const incompleteOnboardingState = process.env.PLAYWRIGHT_INCOMPLETE_ONBOARDING_STORAGE_STATE;

test.describe("authenticated shell", () => {
  test.skip(
    !authenticatedState,
    "Set PLAYWRIGHT_AUTH_STORAGE_STATE to an authenticated local-Supabase storage state.",
  );

  test("keeps Inbox reachable and makes the capture shortcut focus its composer", async ({
    page,
  }) => {
    await page.goto("/inbox");
    await expect(
      page.getByRole("heading", { name: "Nothing important slips through." }),
    ).toBeVisible();
    await page.keyboard.press("ControlOrMeta+J");
    await expect(page.locator("#capture")).toBeFocused();
  });

  test("routes transparent build-state pages from primary and More navigation", async ({
    page,
  }) => {
    await page.goto("/inbox");
    await page.getByRole("link", { name: "Today" }).click();
    await expect(
      page.getByRole("heading", { name: "A quieter daily view is taking shape." }),
    ).toBeVisible();
    await page.getByText("More", { exact: true }).first().click();
    await page.getByRole("link", { name: "People & Notes" }).first().click();
    await expect(
      page.getByRole("heading", { name: "Personal context comes later, on purpose." }),
    ).toBeVisible();
  });
});

test.describe("required-once onboarding", () => {
  test.skip(
    !incompleteOnboardingState,
    "Set PLAYWRIGHT_INCOMPLETE_ONBOARDING_STORAGE_STATE to a dedicated incomplete pilot account.",
  );

  test("saves a confirmed profile and directs the user to Today", async ({ browser }) => {
    const context = await browser.newContext({ storageState: incompleteOnboardingState });
    const page = await context.newPage();
    await page.goto("/onboarding");
    await page.getByRole("button", { name: "Set up my profile" }).click();
    await page.getByLabel("Display name").fill("Onboarding Fixture");
    await page.getByLabel("Timezone").fill("America/Vancouver");
    await page.getByLabel("Locale").fill("en-CA");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Finish setup" }).click();
    await expect(page).toHaveURL(/\/today$/);
    await context.close();
  });
});
