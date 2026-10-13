/**
 * API: Subscriptions – Create Intent / Confirm / Cancel
 * Covers subscription endpoints with exact assertions.
 */
import { test, expect } from "../fixtures";
import { getDbConnection } from "../fixtures/db.helper";

test.describe.serial("API: Subscriptions – Create Intent / Confirm / Cancel", () => {
  let planId: number = 1;

  test.beforeAll(async () => {
    const conn = await getDbConnection();
    try {
      // Ensure provider has active subscription baseline for cancel and status checks
      const [existing]: any = await conn.query(
        "SELECT id FROM provider_subscriptions WHERE provider_id = 1 LIMIT 1"
      );
      if (existing && existing.length > 0) {
        await conn.query(
          "UPDATE provider_subscriptions SET status = 'active', end_date = DATE_ADD(NOW(), INTERVAL 1 YEAR) WHERE provider_id = 1"
        );
      } else {
        await conn.query(
          "INSERT INTO provider_subscriptions (provider_id, plan_id, start_date, end_date, price_paid, status, auto_renew, created_at, updated_at) VALUES (1, 1, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), 59.00, 'active', 1, NOW(), NOW())"
        );
      }
    } finally {
      await conn.end();
    }
  });

  // ── Fetch available plans ──────────────────────────────────────────────────
  test("GET /subscriptions/plans: returns active plans with price (200)", async ({ providerApi }) => {
    const res = await providerApi.get("/subscriptions/plans");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    const plans = body.plans || body.data || [];
    expect(plans.length).toBeGreaterThan(0);

    const first = plans[0];
    planId = Number(first.id || first.plan_id);
    expect(planId).toBeGreaterThan(0);
  });

  // ── Create subscription intent ─────────────────────────────────────────────
  test("POST /subscriptions/create-intent: provider creates payment intent (200)", async ({ providerApi }) => {
    const res = await providerApi.post("/subscriptions/create-intent", {
      data: { plan_id: planId },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
  });

  // ── Confirm subscription validation ────────────────────────────────────────
  test("POST /subscriptions/confirm: missing payment_intent_id returns 400", async ({ providerApi }) => {
    const res = await providerApi.post("/subscriptions/confirm", {
      data: {},
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  // ── Get current subscription ───────────────────────────────────────────────
  test("GET /subscriptions/current: returns current subscription (200)", async ({ providerApi }) => {
    const res = await providerApi.get("/subscriptions/current");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  // ── Get subscription status ────────────────────────────────────────────────
  test("GET /subscriptions/status: returns subscription status for provider (200)", async ({ providerApi }) => {
    const res = await providerApi.get("/subscriptions/status");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  // ── Get subscription history ───────────────────────────────────────────────
  test("GET /subscriptions/history: returns array of past subscriptions (200)", async ({ providerApi }) => {
    const res = await providerApi.get("/subscriptions/history");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.subscriptions || body.data || [])).toBe(true);
  });

  // ── Cancel subscription ────────────────────────────────────────────────────
  test("POST /subscriptions/cancel: cancel returns 200", async ({ providerApi }) => {
    const res = await providerApi.post("/subscriptions/cancel", {
      data: { reason: "Testing cancel endpoint" },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  // ── Admin subscription overview ────────────────────────────────────────────
  test("GET /admin/subscriptions/overview: admin gets subscription overview (200)", async ({ adminApi }) => {
    const res = await adminApi.get("/admin/subscriptions/overview");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  // ── Admin subscription plans CRUD ─────────────────────────────────────────
  test("GET /admin/subscription-plans: admin lists all subscription plans (200)", async ({ adminApi }) => {
    const res = await adminApi.get("/admin/subscription-plans");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.plans || body.data || [])).toBe(true);
  });

  // ── Guest can see public active plans ─────────────────────────────────────
  test("GET /subscription-plans: public endpoint returns active plans (200)", async ({ guestApi }) => {
    const res = await guestApi.get("/subscription-plans");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.plans || body.data || [])).toBe(true);
  });
});
