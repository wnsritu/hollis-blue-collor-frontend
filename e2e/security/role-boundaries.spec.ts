import { test, expect } from "../fixtures";

test.describe("Security: Role Access Boundaries & Privilege Escalation", () => {
  test("Guest is rejected with 401 from all protected admin endpoints", async ({ guestApi }) => {
    const res1 = await guestApi.get("/admin/dashboard");
    expect(res1.status()).toBe(401);

    const res2 = await guestApi.get("/admin/customers");
    expect(res2.status()).toBe(401);

    const res3 = await guestApi.get("/admin/providers");
    expect(res3.status()).toBe(401);
  });

  test("Customer token cannot access admin endpoints (403)", async ({ customerApi }) => {
    const res1 = await customerApi.get("/admin/dashboard");
    expect(res1.status()).toBe(403);

    const res2 = await customerApi.get("/admin/platform-settings");
    expect(res2.status()).toBe(403);

    const res3 = await customerApi.get("/admin/audit-logs");
    expect(res3.status()).toBe(403);
  });

  test("Provider token cannot access admin endpoints (403)", async ({ providerApi }) => {
    const res1 = await providerApi.get("/admin/dashboard");
    expect(res1.status()).toBe(403);

    const res2 = await providerApi.get("/admin/payouts");
    expect(res2.status()).toBe(403);
  });

  test("Customer token cannot access provider dashboard check route (403)", async ({ customerApi }) => {
    const res = await customerApi.get("/provider-dashboard");
    expect(res.status()).toBe(403);
  });
});
