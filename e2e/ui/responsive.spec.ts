import { test, expect } from "@playwright/test";

test.describe("UI: Responsive Design & Viewports", () => {
  test("Mobile viewport (390x844) renders without horizontal overflow @mobile @smoke", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page).toHaveURL("/");

    // Verify main navigation or container fits viewport
    const body = page.locator("body");
    await expect(body).toBeVisible();

    // Check no horizontal scrollbar on body
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2); // allowing minor subpixel rounding
  });

  test("Desktop viewport (1440x900) displays full navigation bar", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await expect(page).toHaveURL("/");

    const header = page.locator("header, nav").first();
    await expect(header).toBeVisible();
  });
});
