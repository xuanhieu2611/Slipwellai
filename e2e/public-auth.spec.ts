import { expect, test } from "@playwright/test";

test.describe("public authentication entry", () => {
  test("offers email/password signup and Google OAuth without passwordless copy", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto("/");
    await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
    await expect(page.getByLabel("Email address")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Create an account" })).toBeVisible();
    await expect(page.getByText(/one-time sign-in/i)).toHaveCount(0);

    await page.getByRole("button", { name: "Create an account" }).click();
    await expect(page.getByRole("heading", { name: "Give it a safe place to land." })).toBeVisible();
    await expect(page.getByRole("button", { name: "Create account" })).toBeVisible();

    await context.close();
  });
});
