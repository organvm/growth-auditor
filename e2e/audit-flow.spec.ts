import { test, expect } from "@playwright/test";

test.describe("Audit Flow", () => {
  test("shows error when API key is missing", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Initiate Alignment" }).click();

    await page.locator("#link").fill("https://example.com");
    await page.locator("#business").fill("Technology");
    await page.locator("#goals").fill("Increase conversions");

    await page.getByRole("button", { name: "Generate Strategic Audit" }).click();

    await expect(page.getByText("Please configure your AI key in Settings.")).toBeVisible();
  });

  test("redirects to results when API key is set", async ({ page }) => {
    await page.route("**/api/audit/stream", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/plain",
        body: [
          "# Test Audit",
          "",
          "## Scores",
          "communication: 80",
          "aesthetic: 75",
          "drive: 70",
          "structure: 85",
        ].join("\n"),
      });
    });

    // Set API key via localStorage
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem("gemini_api_key", "test-key-123");
    });
    await page.reload();
    await page.getByRole("button", { name: "Initiate Alignment" }).click();

    await page.locator("#link").fill("https://example.com");
    await page.locator("#business").fill("Technology");
    await page.locator("#goals").fill("Increase conversions");

    await page.getByRole("button", { name: "Generate Strategic Audit" }).click();

    // Should navigate to /results
    await expect(page).toHaveURL(/\/results/);
    await page.getByRole("button", { name: /Explore Submerged Strategic Data/ }).click();
    await expect(page.getByRole("heading", { name: "Test Audit" })).toBeVisible();
  });

  test("results page shows error when accessed directly", async ({ page }) => {
    await page.goto("/results");

    await expect(
      page.getByText("No audit data found. Please start from the home page.")
    ).toBeVisible();
  });

  test("history page shows empty state for unauthenticated user", async ({ page }) => {
    await page.goto("/history");

    await expect(page.getByText(/Your archive is empty/)).toBeVisible();
  });
});
