import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("homepage loads with form", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Digital Alignment" })).toBeVisible();
    await page.getByRole("button", { name: "Initiate Alignment" }).click();
    await expect(page.locator("#link")).toBeVisible();
    await expect(page.locator("#business")).toBeVisible();
    await expect(page.locator("#goals")).toBeVisible();
    await expect(page.getByRole("button", { name: "Generate Strategic Audit" })).toBeVisible();
  });

  test("nav links work", async ({ page }) => {
    await page.goto("/");

    await page.click('a[href="/about"]');
    await expect(page.getByRole("heading", { name: "The Cosmic Pillars" })).toBeVisible();

    await page.click('a[href="/examples"]');
    await expect(page.getByText("Cosmic Growth in Action")).toBeVisible();

    await page.click('a[href="/settings"]');
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    await expect(page.locator("#apikey")).toBeVisible();
  });

  test("about page has all four pillars", async ({ page }) => {
    await page.goto("/about");
    for (const pillar of [
      ["Mercury", "Communication"],
      ["Venus", "Aesthetic"],
      ["Mars", "Drive"],
      ["Saturn", "Structure"],
    ]) {
      await expect(page.getByRole("heading", { name: pillar[0] })).toBeVisible();
      await expect(page.getByText(pillar[1], { exact: true })).toBeVisible();
    }
  });

  test("examples page shows case studies", async ({ page }) => {
    await page.goto("/examples");
    await expect(page.getByText("Acme Corp SaaS")).toBeVisible();
    await expect(page.getByText("Zenith Creatives")).toBeVisible();
  });
});
