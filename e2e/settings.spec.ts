import { test, expect } from "@playwright/test";

test.describe("Settings", () => {
  test("saves and persists Gemini API key", async ({ page }) => {
    await page.goto("/settings");

    const input = page.locator("#apikey");
    await input.fill("AIzaSyTestKey123");
    await page.getByRole("button", { name: "Align AI Engine" }).click();

    // Verify success feedback
    await expect(page.getByRole("button", { name: /Alignment Saved!/i })).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem("gemini_api_key")))
      .toBe("AIzaSyTestKey123");

    // Reload and verify persistence
    await page.reload();
    await expect(input).toHaveValue("AIzaSyTestKey123");
  });
});
