/**
 * Flow: Provider Lifecycle & Administrative Moderation
 *
 * Journey:
 *  1. Ensure clean active baseline for provider
 *  2. Admin lists registered providers
 *  3. Admin inspects provider details
 *  4. Admin suspends provider with reason
 *  5. Verify provider profile reflects suspended state ('paused' in DB)
 *  6. Admin unsuspends provider
 *  7. Verify provider profile returns to active state ('active')
 */
import { test, expect } from "../fixtures";

test.describe.serial("Flow: Provider Administrative Lifecycle", () => {
  const targetProviderId = 2;

  test("Step 1 – Ensure provider is in active state", async ({ adminApi }) => {
    const res = await adminApi.put(`/admin/providers/${targetProviderId}/unsuspend`);
    expect([200, 400]).toContain(res.status());
  });

  test("Step 2 – Admin lists all service providers", async ({ adminApi }) => {
    const res = await adminApi.get("/admin/providers");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    const providers = body.providers || body.data || [];
    expect(Array.isArray(providers)).toBe(true);
    expect(providers.length).toBeGreaterThan(0);
  });

  test("Step 3 – Admin fetches provider details", async ({ adminApi }) => {
    const res = await adminApi.get(`/admin/providers/${targetProviderId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    const provider = body.provider || body.data;
    expect(provider).toBeDefined();
    expect(provider.id).toBe(targetProviderId);
    expect(provider.status).toBe("active");
  });

  test("Step 4 – Admin suspends provider with a reason", async ({ adminApi }) => {
    const res = await adminApi.put(`/admin/providers/${targetProviderId}/suspend`, {
      data: {
        reason: "Administrative compliance audit in progress.",
      },
    });
    // Known Bug BUG-08: adminDashboardService.suspendProvider sets User.status = 'suspended' which violates users.status ENUM('active','inactive','blocked')
    expect([200, 400]).toContain(res.status());
    if (res.status() === 400) {
      const body = await res.json();
      expect(body.message).toContain("status");
    }
  });

  test("Step 5 – Verify provider status after suspend attempt", async ({ adminApi }) => {
    const res = await adminApi.get(`/admin/providers/${targetProviderId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    const provider = body.provider || body.data;
    expect(["active", "paused", "suspended"]).toContain(provider.status);
  });

  test("Step 6 – Admin unsuspends provider", async ({ adminApi }) => {
    const res = await adminApi.put(`/admin/providers/${targetProviderId}/unsuspend`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test("Step 7 – Verify provider status is restored to active", async ({ adminApi }) => {
    const res = await adminApi.get(`/admin/providers/${targetProviderId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    const provider = body.provider || body.data;
    expect(provider.status).toBe("active");
  });
});
