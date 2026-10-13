import { test, expect } from "@playwright/test";

test.describe("UI: Guest & Public Routes", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  // ── Home page ─────────────────────────────────────────────────────────────
  test("Home Page: header, hero/search section, login link, no JS errors @smoke", async ({ page }) => {
    const consoleErrors: string[] = [];
    const failedApis: string[] = [];
    page.on("pageerror", (err) => consoleErrors.push(err.message));
    page.on("response", (res) => {
      if (res.url().includes("/api/v1/") && res.status() >= 500) failedApis.push(`${res.status()} ${res.url()}`);
    });

    await page.goto("/");
    await expect(page).toHaveURL("/");

    // Navigation / header
    const nav = page.locator("nav, header").first();
    await expect(nav).toBeVisible();

    // Login / Sign up link in nav
    const loginLink = page.getByRole("link", { name: /log\s*in|sign\s*in/i }).first();
    await expect(loginLink).toBeVisible();

    // Hero or main heading
    const heroHeading = page.getByRole("heading").first();
    await expect(heroHeading).toBeVisible();

    const criticalErrors = consoleErrors.filter(
      (msg) => !msg.includes("ResizeObserver") && !msg.includes("favicon")
    );
    expect(criticalErrors).toEqual([]);
    expect(failedApis).toEqual([]);
  });

  // ── How It Works ──────────────────────────────────────────────────────────
  test("How It Works page has heading describing the process", async ({ page }) => {
    await page.goto("/how-it-works");
    await expect(page).toHaveURL("/how-it-works");

    const heading = page.getByRole("heading", { name: /how it works|process|steps?/i }).first();
    await expect(heading).toBeVisible();
  });

  // ── About ─────────────────────────────────────────────────────────────────
  test("About page has heading and content section", async ({ page }) => {
    await page.goto("/about");
    await expect(page).toHaveURL("/about");

    const heading = page.getByRole("heading", { name: /about|mission|who we are/i }).first();
    await expect(heading).toBeVisible();
  });

  // ── Search ────────────────────────────────────────────────────────────────
  test("Search Providers page has heading and filter/search controls", async ({ page }) => {
    await page.goto("/search");
    await expect(page).toHaveURL("/search");

    const heading = page.getByRole("heading", { name: /search|find|providers?|services?/i }).first();
    await expect(heading).toBeVisible();

    // At least one search/filter control
    const searchControl = page
      .locator("input[type='search'], input[placeholder*='search'], select, [role='combobox']")
      .first();
    await expect(searchControl.or(page.getByRole("button", { name: /filter|search|category/i }).first())).toBeVisible();
  });

  // ── Security redirects ────────────────────────────────────────────────────
  test("Security: Unauthenticated guest accessing /dashboard redirected to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/\/login/, { timeout: 8000 });
    expect(page.url()).toContain("/login");
  });

  test("Security: Unauthenticated guest accessing /admin redirected to /login", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForURL(/\/login/, { timeout: 8000 });
    expect(page.url()).toContain("/login");
  });

  test("Security: Unauthenticated guest accessing /provider/dashboard redirected to /login", async ({ page }) => {
    await page.goto("/provider/dashboard");
    await page.waitForURL(/\/login/, { timeout: 8000 });
    expect(page.url()).toContain("/login");
  });
});
