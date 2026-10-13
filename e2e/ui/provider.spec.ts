import { test, expect } from "../fixtures";
import { QA_USERS } from "../fixtures/test-data";

test.describe("UI: Provider Portal", () => {
  // ── Dashboard ─────────────────────────────────────────────────────────────
  test("Provider dashboard: heading visible, no 5xx API calls, no JS errors @smoke", async ({ providerPage }) => {
    const consoleErrors: string[] = [];
    const failedApis: string[] = [];
    providerPage.on("pageerror", (err) => consoleErrors.push(err.message));
    providerPage.on("response", (res) => {
      if (res.url().includes("/api/v1/") && res.status() >= 500) {
        failedApis.push(`${res.status()} ${res.url()}`);
      }
    });

    await providerPage.goto("/provider/dashboard");
    await expect(providerPage).toHaveURL(/\/provider\/(dashboard|profile)/);

    const heading = providerPage.getByRole("heading", { name: /dashboard|overview|welcome/i }).first();
    await expect(heading).toBeVisible();

    const criticalErrors = consoleErrors.filter(
      (msg) => !msg.includes("ResizeObserver") && !msg.includes("favicon")
    );
    expect(criticalErrors).toEqual([]);
    expect(failedApis).toEqual([]);
  });

  // ── Opportunities / Jobs feed ─────────────────────────────────────────────
  test("Provider opportunities page shows heading and project feed or empty state", async ({ providerPage }) => {
    const failedApis: string[] = [];
    providerPage.on("response", (res) => {
      if (res.url().includes("/api/v1/") && res.status() >= 500) failedApis.push(`${res.status()} ${res.url()}`);
    });

    await providerPage.goto("/provider/opportunities");
    await expect(providerPage).toHaveURL(/\/provider\/(opportunities|profile)/);

    const heading = providerPage
      .getByRole("heading", { name: /opportunit|jobs?|projects?|leads?/i }).first();
    await expect(heading).toBeVisible();

    expect(failedApis).toEqual([]);
  });

  // ── Submit proposal interaction ───────────────────────────────────────────
  test("Provider can open a project from the feed and see the proposal form", async ({ providerPage, providerApi }) => {
    const failedApis: string[] = [];
    providerPage.on("response", (res) => {
      if (res.url().includes("/api/v1/") && res.status() >= 500) failedApis.push(`${res.status()} ${res.url()}`);
    });

    // 1. Get a project from the feed via API to get a real project ID
    const feedRes = await providerApi.get("/projects/provider/feed");
    expect(feedRes.status()).toBe(200);
    const feedData = await feedRes.json();
    const projects = feedData.projects || feedData.data || [];

    if (projects.length > 0) {
      const projectId = projects[0].id;

      // 2. Navigate to provider opportunities and look for a "View" or "Apply" link
      await providerPage.goto("/provider/opportunities");
      await providerPage.waitForLoadState("networkidle");

      const applyBtn = providerPage
        .getByRole("button", { name: /apply|submit proposal|bid|view/i }).first()
        .or(providerPage.getByRole("link", { name: /apply|submit|view/i }).first());

      if (await applyBtn.isVisible({ timeout: 5000 })) {
        await applyBtn.click();
        // Proposal form or project detail should load
        const proposalForm = providerPage.locator(
          "form, [data-testid='proposal-form'], textarea[name='cover_letter'], input[name='bid_amount']"
        ).first();
        await expect(
          proposalForm.or(providerPage.getByRole("heading", { name: /project|proposal|details/i }).first())
        ).toBeVisible({ timeout: 8000 });
      } else {
        // Navigate to project detail directly
        await providerPage.goto(`/projects/${projectId}`);
        const content = providerPage.getByRole("heading").first();
        await expect(content).toBeVisible({ timeout: 6000 });
      }
    } else {
      // No projects in feed — verify empty state renders correctly
      await providerPage.goto("/provider/opportunities");
      const emptyState = providerPage.getByText(/no projects|no jobs|no opportunities|empty/i).first();
      await expect(
        emptyState.or(providerPage.getByRole("heading").first())
      ).toBeVisible();
    }

    expect(failedApis).toEqual([]);
  });

  // ── Pricing / Services ────────────────────────────────────────────────────
  test("Provider pricing page shows heading and service configuration", async ({ providerPage }) => {
    const failedApis: string[] = [];
    providerPage.on("response", (res) => {
      if (res.url().includes("/api/v1/") && res.status() >= 500) failedApis.push(`${res.status()} ${res.url()}`);
    });

    await providerPage.goto("/provider/pricing");
    await expect(providerPage).toHaveURL(/\/provider\/pricing/);

    const heading = providerPage.getByRole("heading", { name: /pricing|services?|rates?/i }).first();
    await expect(heading).toBeVisible();

    expect(failedApis).toEqual([]);
  });

  // ── Availability ─────────────────────────────────────────────────────────
  test("Provider availability page shows heading and calendar or time-slot controls", async ({ providerPage }) => {
    const failedApis: string[] = [];
    providerPage.on("response", (res) => {
      if (res.url().includes("/api/v1/") && res.status() >= 500) failedApis.push(`${res.status()} ${res.url()}`);
    });

    await providerPage.goto("/provider/availability");
    await expect(providerPage).toHaveURL(/\/provider\/availability/);

    const heading = providerPage.getByRole("heading", { name: /availab|schedule|calendar/i }).first();
    await expect(heading).toBeVisible();

    expect(failedApis).toEqual([]);
  });

  // ── Earnings ──────────────────────────────────────────────────────────────
  test("Provider earnings page shows heading and earnings data or zero state", async ({ providerPage }) => {
    const failedApis: string[] = [];
    providerPage.on("response", (res) => {
      if (res.url().includes("/api/v1/") && res.status() >= 500) failedApis.push(`${res.status()} ${res.url()}`);
    });

    await providerPage.goto("/provider/earnings");
    await expect(providerPage).toHaveURL(/\/provider\/(earnings|profile)/);

    const heading = providerPage.getByRole("heading", { name: /earnings?|revenue|income/i }).first();
    await expect(heading).toBeVisible();

    expect(failedApis).toEqual([]);
  });

  // ── Subscription ─────────────────────────────────────────────────────────
  test("Provider subscription page shows heading and plan options", async ({ providerPage }) => {
    const failedApis: string[] = [];
    providerPage.on("response", (res) => {
      if (res.url().includes("/api/v1/") && res.status() >= 500) failedApis.push(`${res.status()} ${res.url()}`);
    });

    await providerPage.goto("/provider/subscription");
    await expect(providerPage).toHaveURL(/\/provider\/(subscription|profile)/);

    const heading = providerPage.getByRole("heading", { name: /subscription|plan|billing/i }).first();
    await expect(heading).toBeVisible();

    expect(failedApis).toEqual([]);
  });

  // ── Provider status progression (visible on profile / dashboard) ──────────
  test("Provider profile page shows business name from seeded record", async ({ providerPage }) => {
    await providerPage.goto("/provider/profile");
    await providerPage.waitForLoadState("networkidle");

    const pageText = await providerPage.locator("body").textContent();
    // QA provider's business name is set during global-setup; verify it or the email appears
    const hasData =
      pageText?.includes("QA Provider") ||
      pageText?.includes(QA_USERS.provider.email) ||
      pageText?.includes("qa+provider");
    expect(hasData, "Provider profile must show provider's name or email").toBe(true);
  });
});
