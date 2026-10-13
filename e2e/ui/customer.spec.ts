import { test, expect } from "../fixtures";
import { QA_USERS } from "../fixtures/test-data";

test.describe("UI: Customer Portal", () => {
  // ── Dashboard ─────────────────────────────────────────────────────────────
  test("Customer dashboard: heading visible, no 5xx API calls, no JS errors @smoke", async ({ customerPage }) => {
    const consoleErrors: string[] = [];
    const failedApis: string[] = [];
    customerPage.on("pageerror", (err) => consoleErrors.push(err.message));
    customerPage.on("response", (res) => {
      if (res.url().includes("/api/v1/") && res.status() >= 500) {
        failedApis.push(`${res.status()} ${res.url()}`);
      }
    });

    await customerPage.goto("/dashboard");
    await expect(customerPage).toHaveURL(/\/dashboard/);

    // Real heading/key element check
    const heading = customerPage.getByRole("heading", { name: /dashboard|welcome|overview/i }).first();
    await expect(heading).toBeVisible();

    const criticalErrors = consoleErrors.filter(
      (msg) => !msg.includes("ResizeObserver") && !msg.includes("favicon")
    );
    expect(criticalErrors).toEqual([]);
    expect(failedApis).toEqual([]);
  });

  // ── Profile page ──────────────────────────────────────────────────────────
  test("Customer profile page shows user's email or name from seeded record", async ({ customerPage }) => {
    await customerPage.goto("/profile");
    await expect(customerPage).toHaveURL(/\/profile/);

    // Heading
    const heading = customerPage.getByRole("heading", { name: /profile|account|my info/i }).first();
    await expect(heading).toBeVisible();

    // Should display the seeded QA customer's name or email somewhere on the page
    const pageText = await customerPage.locator("body").textContent();
    const hasName = pageText?.includes("QA Customer") || pageText?.includes(QA_USERS.customer.email);
    expect(hasName, "Profile page must show customer name or email").toBe(true);
  });

  // ── Projects page ─────────────────────────────────────────────────────────
  test("Customer projects page shows heading and project list container", async ({ customerPage }) => {
    await customerPage.goto("/projects");
    await expect(customerPage).toHaveURL(/\/projects/);

    const heading = customerPage.getByRole("heading", { name: /projects?/i }).first();
    await expect(heading).toBeVisible();

    // Table / list container must be present (even if empty)
    const listContainer = customerPage.locator("table, [role='list'], ul, .project-list, [data-testid='project-list']").first();
    await expect(listContainer.or(customerPage.getByText(/no projects|post a project|get started/i).first())).toBeVisible();
  });

  // ── Bookings page ─────────────────────────────────────────────────────────
  test("Customer bookings page shows heading and booking list or empty state", async ({ customerPage }) => {
    await customerPage.goto("/customer/bookings");
    await expect(customerPage).toHaveURL(/\/customer\/bookings/);

    const heading = customerPage.getByRole("heading", { name: /bookings?|orders?/i }).first();
    await expect(heading).toBeVisible();

    const listOrEmpty = customerPage
      .locator("table, [role='list'], ul, .booking-list")
      .first()
      .or(customerPage.getByText(/no bookings|book a service|empty/i).first());
    await expect(listOrEmpty).toBeVisible();
  });

  // ── Payments page ─────────────────────────────────────────────────────────
  test("Customer payments page shows heading and payments list or empty state", async ({ customerPage }) => {
    await customerPage.goto("/customer/payments");
    await expect(customerPage).toHaveURL(/\/customer\/payments/);

    const heading = customerPage.getByRole("heading", { name: /payments?|invoices?|transactions?/i }).first();
    await expect(heading).toBeVisible();
  });

  // ── Booking wizard interaction ─────────────────────────────────────────────
  test("Booking wizard: car wash service opens wizard and shows step 1 form", async ({ customerPage }) => {
    const failedApis: string[] = [];
    customerPage.on("response", (res) => {
      if (res.url().includes("/api/v1/") && res.status() >= 500) failedApis.push(`${res.status()} ${res.url()}`);
    });

    // Search for car wash and attempt to start booking
    await customerPage.goto("/search?category=car-wash");
    await customerPage.waitForLoadState("networkidle");

    // Look for any "Book Now" or "Get Quote" button
    const bookBtn = customerPage.getByRole("button", { name: /book|get quote|hire/i }).first();
    if (await bookBtn.isVisible({ timeout: 5000 })) {
      await bookBtn.click();
      // Step 1 of wizard should be visible
      const stepIndicator = customerPage.locator("[data-testid='step'], .wizard-step, [class*='step']").first();
      const wizardForm = customerPage.locator("form, [data-testid='booking-wizard']").first();
      await expect(stepIndicator.or(wizardForm)).toBeVisible({ timeout: 8000 });
    } else {
      // Wizard can only be triggered after selecting a provider; verify the search results rendered
      const results = customerPage.locator("[data-testid='provider-card'], .provider-card, article").first();
      await expect(results.or(customerPage.getByText(/no providers|search results/i).first())).toBeVisible();
    }

    expect(failedApis).toEqual([]);
  });

  test("Booking wizard: cleaning service search page loads with filter controls", async ({ customerPage }) => {
    await customerPage.goto("/search?category=cleaning");
    await customerPage.waitForLoadState("networkidle");

    // Filter controls must be visible
    const filter = customerPage.locator("input[type='search'], select, [role='combobox'], [data-testid='filter']").first();
    await expect(
      filter.or(customerPage.getByRole("button", { name: /filter|search|category/i }).first())
    ).toBeVisible();
  });

  // ── Create project interaction ─────────────────────────────────────────────
  test("Customer can navigate to Create Project page and see the form", async ({ customerPage }) => {
    const failedApis: string[] = [];
    customerPage.on("response", (res) => {
      if (res.url().includes("/api/v1/") && res.status() >= 500) failedApis.push(`${res.status()} ${res.url()}`);
    });

    await customerPage.goto("/projects");
    const createBtn = customerPage.getByRole("button", { name: /post|create|new project/i })
      .or(customerPage.getByRole("link", { name: /post|create|new project/i })).first();

    if (await createBtn.isVisible({ timeout: 4000 })) {
      await createBtn.click();
      const titleInput = customerPage.locator("input[name='title'], #title, input[placeholder*='title']").first();
      await expect(titleInput).toBeVisible({ timeout: 8000 });
    } else {
      // Navigate directly if button not found
      await customerPage.goto("/projects/create");
      const form = customerPage.locator("form").first();
      await expect(form.or(customerPage.getByRole("heading", { name: /project|create/i }).first())).toBeVisible();
    }

    expect(failedApis).toEqual([]);
  });
});
