/**
 * Flow: Subscription Lifecycle
 *
 * Journey:
 *  1. Provider fetches available plans
 *  2. Provider creates a subscription intent (payment)
 *  3. Provider retrieves current subscription
 *  4. Provider checks subscription status endpoint
 *  5. Provider views subscription history
 *  6. Provider cancels subscription
 */
import { test, expect } from "../fixtures";
import { getDbConnection } from "../fixtures/db.helper";

test.describe.serial("Flow: Subscription Lifecycle (Browse → Intent → Cancel)", () => {
  let planId: number = 1;

  test.beforeAll(async () => {
    const conn = await getDbConnection();
    try {
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

  test("Step 1 – Provider fetches available subscription plans", async ({ providerApi }) => {
    const res = await providerApi.get("/subscriptions/plans");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    const plans = body.plans || body.data || [];
    expect(plans.length).toBeGreaterThan(0);

    const activePlan = plans.find((p: any) => p.is_active !== false && p.status !== "inactive");
    if (activePlan) {
      planId = Number(activePlan.id || activePlan.plan_id);
    }
    expect(planId).toBeGreaterThan(0);
  });

  test("Step 2 – Provider creates a subscription payment intent", async ({ providerApi }) => {
    const res = await providerApi.post("/subscriptions/create-intent", {
      data: { plan_id: planId },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
  });

  test("Step 3 – Provider retrieves current subscription", async ({ providerApi }) => {
    const res = await providerApi.get("/subscriptions/current");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test("Step 4 – Provider checks subscription status endpoint", async ({ providerApi }) => {
    const res = await providerApi.get("/subscriptions/status");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test("Step 5 – Provider views subscription history", async ({ providerApi }) => {
    const res = await providerApi.get("/subscriptions/history");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    const history = body.data?.subscriptions || body.subscriptions || body.data || [];
    expect(Array.isArray(history)).toBe(true);
  });

  test("Step 6 – Provider cancels subscription", async ({ providerApi }) => {
    const res = await providerApi.post("/subscriptions/cancel", {
      data: { reason: "Testing subscription lifecycle flow cancellation" },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
