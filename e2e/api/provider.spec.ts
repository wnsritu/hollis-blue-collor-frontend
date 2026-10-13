import { test, expect } from "../fixtures";

test.describe("API: Provider Endpoints", () => {
  test("GET /providers/me/profile: returns provider profile", async ({ providerApi }) => {
    const res = await providerApi.get("/providers/me/profile");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data?.business_name || body.provider?.business_name).toBeDefined();
  });

  test("GET /projects/provider/feed: provider can view open project feed", async ({ providerApi }) => {
    const res = await providerApi.get("/projects/provider/feed");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.projects || body.data)).toBe(true);
  });

  test("GET /providers/me/leads: provider can view leads", async ({ providerApi }) => {
    const res = await providerApi.get("/providers/me/leads");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test("List Provider Proposals: GET /proposals/provider/my", async ({ providerApi }) => {
    const res = await providerApi.get("/proposals/provider/my");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test("GET /subscriptions/plans: fetch active subscription plans", async ({ providerApi }) => {
    const res = await providerApi.get("/subscriptions/plans");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.plans || body.data)).toBe(true);
  });

  test("GET /subscriptions/current: provider can view current subscription", async ({ providerApi }) => {
    const res = await providerApi.get("/subscriptions/current");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test("Security Check: Provider token cannot access admin routes (403)", async ({ providerApi }) => {
    const res = await providerApi.get("/admin/dashboard");
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.message).toBeDefined();
  });

  test("Security Check: Guest cannot access provider bank info without token (401)", async ({ guestApi }) => {
    const res = await guestApi.get("/providers/99999/bank-info");
    expect(res.status()).toBe(401);
  });
});
