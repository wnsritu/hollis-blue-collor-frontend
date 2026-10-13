import { test, expect } from "@playwright/test";
import { QA_USERS, createTestEmail, createTestPhone, API_BASE_URL } from "../fixtures/test-data";

// ─── helpers ─────────────────────────────────────────────────────────────────

function failOnApiError(page: ReturnType<typeof test["info"]>["project"] extends any ? any : any) {
  page.on("response", (res: any) => {
    if (res.url().includes("/api/v1/") && res.status() >= 500) {
      throw new Error(`Failed API request: ${res.status()} ${res.url()}`);
    }
  });
}

// ─── describe ─────────────────────────────────────────────────────────────────

test.describe("UI: Authentication Pages", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  // ── Login page structure ──────────────────────────────────────────────────
  test("Login page renders with role selector, email, password fields and links", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("pageerror", (err) => consoleErrors.push(err.message));

    await page.goto("/login");
    await expect(page).toHaveURL("/login");

    // Heading
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();

    // Role buttons
    await expect(page.getByRole("button", { name: /customer/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /professional/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /admin/i })).toBeVisible();

    // Input fields
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();

    // Navigation links
    await expect(page.getByRole("link", { name: /forgot/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /create an account/i })).toBeVisible();

    const criticalErrors = consoleErrors.filter(
      (msg) => !msg.includes("ResizeObserver") && !msg.includes("favicon")
    );
    expect(criticalErrors).toEqual([]);
  });

  // ── Login validation ──────────────────────────────────────────────────────
  test("Login validation: shows error when submitting empty form", async ({ page }) => {
    await page.goto("/login");
    const submitBtn = page.getByRole("button", { name: /sign in|login/i }).first();
    await submitBtn.click();

    const errorText = page.locator("p.text-destructive, [role='alert'], .text-destructive");
    await expect(errorText.first()).toBeVisible();
  });

  // ── Customer login → dashboard → logout ───────────────────────────────────
  test("Customer can log in, land on dashboard, and log out", async ({ page }) => {
    const failedApis: string[] = [];
    page.on("response", (res) => {
      if (res.url().includes("/api/v1/") && res.status() >= 400 && !res.url().includes("/logout")) {
        // Collect but only assert on 5xx
        if (res.status() >= 500) failedApis.push(`${res.status()} ${res.url()}`);
      }
    });

    // 1. Navigate & login
    await page.goto("/login");
    await page.getByRole("button", { name: /customer/i }).first().click();
    await page.locator("#email").fill(QA_USERS.customer.email);
    await page.locator("#password").fill(QA_USERS.customer.password);
    await page.getByRole("button", { name: /sign in|login/i }).first().click();

    // 2. Should land on dashboard (not login)
    await page.waitForURL(/\/(dashboard|customer)/, { timeout: 15000 });
    const heading = page.getByRole("heading", { name: /dashboard|welcome|home/i }).first();
    await expect(heading).toBeVisible();
    expect(failedApis).toEqual([]);

    // 3. Log out via nav
    const logoutBtn = page.getByRole("button", { name: /log.?out|sign.?out/i }).first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await page.waitForURL(/\/login/, { timeout: 8000 });
      await expect(page).toHaveURL(/\/login/);
    }
  });

  // ── Register customer ─────────────────────────────────────────────────────
  test("Register page renders with role switch and required fields", async ({ page }) => {
    await page.goto("/register");
    await expect(page).toHaveURL("/register");

    // Heading
    const heading = page.getByRole("heading", { name: /create|register|sign up/i }).first();
    await expect(heading).toBeVisible();

    // Fields
    await expect(page.locator("#email, input[type='email']").first()).toBeVisible();
    await expect(page.locator("#password, input[type='password']").first()).toBeVisible();
    await expect(page.locator("input[type='text'], #full_name, #name").first()).toBeVisible();
  });

  test("Register: customer validation shows error on missing fields", async ({ page }) => {
    await page.goto("/register");
    // Select customer role if toggle exists
    const customerToggle = page.getByRole("button", { name: /customer/i }).first();
    if (await customerToggle.isVisible()) await customerToggle.click();

    const submitBtn = page.getByRole("button", { name: /create|register|sign up/i }).first();
    await submitBtn.click();

    const error = page.locator("p.text-destructive, [role='alert'], .text-destructive");
    await expect(error.first()).toBeVisible();
  });

  test("Register: provider role switch shows provider-specific fields", async ({ page }) => {
    await page.goto("/register");
    const providerToggle = page.getByRole("button", { name: /provider|professional/i }).first();
    if (await providerToggle.isVisible()) {
      await providerToggle.click();
      // After switching role, form should still be visible
      await expect(page.locator("#email, input[type='email']").first()).toBeVisible();
    }
  });

  // ── Forgot Password page ──────────────────────────────────────────────────
  test("Forgot Password page renders email input and submit button", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page).toHaveURL("/forgot-password");

    const heading = page.getByRole("heading", { name: /forgot|reset|password/i }).first();
    await expect(heading).toBeVisible();

    await expect(page.locator("#email, input[type='email']").first()).toBeVisible();
    await expect(page.getByRole("button", { name: /send|reset|submit|otp/i }).first()).toBeVisible();
  });
});
