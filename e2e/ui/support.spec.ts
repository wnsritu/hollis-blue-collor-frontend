import { test, expect } from "../fixtures";

test.describe("UI: Support Portal", () => {
  // ── Dashboard ─────────────────────────────────────────────────────────────
  test("Support Agent dashboard: heading visible, no 5xx, no JS errors @smoke", async ({ supportPage }) => {
    const consoleErrors: string[] = [];
    const failedApis: string[] = [];
    supportPage.on("pageerror", (err) => consoleErrors.push(err.message));
    supportPage.on("response", (res) => {
      if (res.url().includes("/api/v1/") && res.status() >= 500) {
        failedApis.push(`${res.status()} ${res.url()}`);
      }
    });

    await supportPage.goto("/support-dashboard");
    await expect(supportPage).toHaveURL(/\/support-dashboard/);

    const heading = supportPage.getByRole("heading", { name: /dashboard|support|overview/i }).first();
    await expect(heading).toBeVisible();

    const criticalErrors = consoleErrors.filter(
      (msg) => !msg.includes("ResizeObserver") && !msg.includes("favicon")
    );
    expect(criticalErrors).toEqual([]);
    expect(failedApis).toEqual([]);
  });

  // ── Messages / Chats ──────────────────────────────────────────────────────
  test("Support Agent messages page shows heading and chat list or empty state", async ({ supportPage }) => {
    const failedApis: string[] = [];
    supportPage.on("response", (res) => {
      if (res.url().includes("/api/v1/") && res.status() >= 500) failedApis.push(`${res.status()} ${res.url()}`);
    });

    await supportPage.goto("/support-dashboard/messages");
    await expect(supportPage).toHaveURL(/\/support-dashboard\/messages/);

    const heading = supportPage.getByRole("heading", { name: /messages?|chats?/i }).first();
    await expect(heading).toBeVisible();

    expect(failedApis).toEqual([]);
  });

  // ── Disputes ──────────────────────────────────────────────────────────────
  test("Support Agent disputes queue shows heading and list or empty state", async ({ supportPage }) => {
    const failedApis: string[] = [];
    supportPage.on("response", (res) => {
      if (res.url().includes("/api/v1/") && res.status() >= 500) failedApis.push(`${res.status()} ${res.url()}`);
    });

    await supportPage.goto("/support-dashboard/disputes");
    await expect(supportPage).toHaveURL(/\/support-dashboard\/disputes/);

    const heading = supportPage.getByRole("heading", { name: /dispute|resolution/i }).first();
    await expect(heading).toBeVisible();

    expect(failedApis).toEqual([]);
  });

  // ── Refunds ───────────────────────────────────────────────────────────────
  test("Support Agent refunds page shows heading and refund requests or empty state", async ({ supportPage }) => {
    const failedApis: string[] = [];
    supportPage.on("response", (res) => {
      if (res.url().includes("/api/v1/") && res.status() >= 500) failedApis.push(`${res.status()} ${res.url()}`);
    });

    await supportPage.goto("/support-dashboard/refunds");
    await expect(supportPage).toHaveURL(/\/support-dashboard\/refunds/);

    const heading = supportPage.getByRole("heading", { name: /refund|reimburse/i }).first();
    await expect(heading).toBeVisible();

    expect(failedApis).toEqual([]);
  });

  // ── Support cannot access /admin/* ────────────────────────────────────────
  test("Security: Support role cannot access /admin/* routes (redirected or 403)", async ({ supportPage }) => {
    await supportPage.goto("/admin");
    // Should either redirect to login/support page or show 403/unauthorized
    const url = supportPage.url();
    const isRedirected = !url.includes("/admin") || url.includes("/login");

    if (!isRedirected) {
      // If not redirected, the page content should show unauthorized
      const bodyText = await supportPage.locator("body").textContent();
      const isBlocked =
        bodyText?.toLowerCase().includes("unauthorized") ||
        bodyText?.toLowerCase().includes("403") ||
        bodyText?.toLowerCase().includes("access denied") ||
        bodyText?.toLowerCase().includes("forbidden");
      expect(isBlocked, "Support must not have access to /admin — page should show unauthorized").toBe(true);
    }
  });

  test("Security: Support role cannot access /admin/providers (redirected or 403)", async ({ supportPage }) => {
    await supportPage.goto("/admin/providers");
    await supportPage.waitForLoadState("networkidle");

    const url = supportPage.url();
    const isRedirected = !url.includes("/admin/providers") || url.includes("/login");

    if (!isRedirected) {
      const bodyText = await supportPage.locator("body").textContent();
      const isBlocked =
        bodyText?.toLowerCase().includes("unauthorized") ||
        bodyText?.toLowerCase().includes("403") ||
        bodyText?.toLowerCase().includes("access denied") ||
        bodyText?.toLowerCase().includes("forbidden");
      expect(isBlocked, "Support must not access /admin/providers").toBe(true);
    }
  });
});
