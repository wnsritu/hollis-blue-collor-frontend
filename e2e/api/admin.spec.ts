import { test, expect } from "../fixtures";

test.describe("API: Admin Endpoints", () => {
  test("GET /admin/dashboard: admin access allowed", async ({ adminApi }) => {
    const res = await adminApi.get("/admin/dashboard");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test("GET /admin/audit-logs: list audit logs", async ({ adminApi }) => {
    const res = await adminApi.get("/admin/audit-logs");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test("GET /admin/providers: list providers with statuses", async ({ adminApi }) => {
    const res = await adminApi.get("/admin/providers");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.providers || body.data)).toBe(true);
  });

  test("GET /admin/customers: list customers", async ({ adminApi }) => {
    const res = await adminApi.get("/admin/customers");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.customers || body.data)).toBe(true);
  });

  test("GET /admin/platform-settings: fetch platform settings", async ({ adminApi }) => {
    const res = await adminApi.get("/admin/platform-settings");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test("GET /admin/subscription-plans: list all subscription plans", async ({ adminApi }) => {
    const res = await adminApi.get("/admin/subscription-plans");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test("GET /admin/payouts: list payouts with hold status", async ({ adminApi }) => {
    const res = await adminApi.get("/admin/payouts");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
