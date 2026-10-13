/**
 * API: Admin Write Endpoints
 * Covers: approve/reject/suspend provider, payout process/fail/retry,
 *         dispute resolve, platform settings update
 */
import { test, expect } from "../fixtures";
import { createTestEmail, createTestPhone } from "../fixtures/test-data";
import { getDbConnection } from "../fixtures/db.helper";

test.describe.serial("API: Admin Write Endpoints", () => {
  let testProviderId: number;
  let rejectProviderId: number;
  let testBookingId: number;
  let processPayoutId: number;
  let failPayoutId: number;
  let retryPayoutId: number;
  let testDisputeId: number;

  test.beforeAll(async () => {
    const conn = await getDbConnection();
    try {
      // 1. Seed a pending provider for approve/suspend/unsuspend tests
      const email = createTestEmail("admin-write-prov");
      const phone = createTestPhone();
      const [uR]: any = await conn.query(
        "INSERT INTO users (full_name, email, phone, password, role_id, status, email_verified, created_at) VALUES (?, ?, ?, 'hashed', 2, 'active', 1, NOW())",
        ["Admin Write Test Provider", email, phone]
      );
      const [pR]: any = await conn.query(
        "INSERT INTO providers (user_id, business_name, bank_name, bank_account_holder, bank_account_number, bank_routing_number, status, verified, category_id, license_number, insurance_policy, createdAt, updatedAt) VALUES (?, 'AdminWrite LLC', 'Chase', 'AdminWrite LLC', '777888999', '021000021', 'pending', 'unverified', 1, 'LIC-WRITE', 'INS-WRITE', NOW(), NOW())",
        [uR.insertId]
      );
      testProviderId = pR.insertId;

      // 2. Seed a second pending provider for reject test
      const email2 = createTestEmail("reject-target");
      const phone2 = createTestPhone();
      const [uR2]: any = await conn.query(
        "INSERT INTO users (full_name, email, phone, password, role_id, status, email_verified, created_at) VALUES (?, ?, ?, 'hashed', 2, 'active', 1, NOW())",
        ["Reject Target Provider", email2, phone2]
      );
      const [pR2]: any = await conn.query(
        "INSERT INTO providers (user_id, business_name, bank_name, bank_account_holder, bank_account_number, bank_routing_number, status, verified, category_id, license_number, insurance_policy, createdAt, updatedAt) VALUES (?, 'Reject Target LLC', 'Chase', 'Reject Target LLC', '123454321', '021000021', 'pending', 'unverified', 1, 'LIC-REJ', 'INS-REJ', NOW(), NOW())",
        [uR2.insertId]
      );
      rejectProviderId = pR2.insertId;

      // 3. Seed a booking with valid status 'finished'
      const [bR]: any = await conn.query(
        "INSERT INTO bookings (customer_id, provider_id, service_type_id, total_amount, booking_date, payment_status, status, version, createdAt, updatedAt) VALUES (2, 1, 4, 300.00, CURDATE(), 'paid', 'finished', 0, NOW(), NOW())"
      );
      testBookingId = bR.insertId;

      // 4. Seed payments & payouts for process, fail, retry tests
      const [payR1]: any = await conn.query(
        "INSERT INTO payments (booking_id, provider_id, stripe_payment_intent_id, amount, currency, status, created_at, updated_at) VALUES (?, 1, ?, 300.00, 'usd', 'paid', NOW(), NOW())",
        [testBookingId, `pi_test_proc_${Date.now()}`]
      );
      const [poR1]: any = await conn.query(
        "INSERT INTO payouts (provider_id, payment_id, booking_id, amount, gross_amount, commission_amount, currency, status, createdAt, updatedAt) VALUES (1, ?, ?, 255.00, 300.00, 45.00, 'usd', 'eligible', NOW(), NOW())",
        [payR1.insertId, testBookingId]
      );
      processPayoutId = poR1.insertId;

      const [payR2]: any = await conn.query(
        "INSERT INTO payments (booking_id, provider_id, stripe_payment_intent_id, amount, currency, status, created_at, updated_at) VALUES (?, 1, ?, 300.00, 'usd', 'paid', NOW(), NOW())",
        [testBookingId, `pi_test_fail_${Date.now()}`]
      );
      const [poR2]: any = await conn.query(
        "INSERT INTO payouts (provider_id, payment_id, booking_id, amount, gross_amount, commission_amount, currency, status, createdAt, updatedAt) VALUES (1, ?, ?, 255.00, 300.00, 45.00, 'usd', 'eligible', NOW(), NOW())",
        [payR2.insertId, testBookingId]
      );
      failPayoutId = poR2.insertId;

      const [payR3]: any = await conn.query(
        "INSERT INTO payments (booking_id, provider_id, stripe_payment_intent_id, amount, currency, status, created_at, updated_at) VALUES (?, 1, ?, 300.00, 'usd', 'paid', NOW(), NOW())",
        [testBookingId, `pi_test_retry_${Date.now()}`]
      );
      const [poR3]: any = await conn.query(
        "INSERT INTO payouts (provider_id, payment_id, booking_id, amount, gross_amount, commission_amount, currency, status, failure_reason, createdAt, updatedAt) VALUES (1, ?, ?, 255.00, 300.00, 45.00, 'usd', 'failed', 'Initial test failure', NOW(), NOW())",
        [payR3.insertId, testBookingId]
      );
      retryPayoutId = poR3.insertId;

      // 5. Seed a dispute for resolve test
      const [dR]: any = await conn.query(
        "INSERT INTO disputes (booking_id, customer_id, issue_type, customer_description, status, createdAt, updatedAt) VALUES (?, 2, 'other', 'Test dispute for admin write spec', 'open', NOW(), NOW())",
        [testBookingId]
      );
      testDisputeId = dR.insertId;
    } finally {
      await conn.end();
    }
  });

  // ── Provider approve ───────────────────────────────────────────────────────
  test("PUT /admin/providers/:id/approve: admin approves pending provider (200)", async ({ adminApi }) => {
    expect(testProviderId).toBeGreaterThan(0);

    const res = await adminApi.put(`/admin/providers/${testProviderId}/approve`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  // ── Provider suspend ───────────────────────────────────────────────────────
  test("PUT /admin/providers/:id/suspend: admin suspends provider with reason (200)", async ({ adminApi }) => {
    expect(testProviderId).toBeGreaterThan(0);

    const res = await adminApi.put(`/admin/providers/${testProviderId}/suspend`, {
      data: { reason: "Automated test — temporary suspension." },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  // ── Provider unsuspend ─────────────────────────────────────────────────────
  test("PUT /admin/providers/:id/unsuspend: admin unsuspends provider (200)", async ({ adminApi }) => {
    expect(testProviderId).toBeGreaterThan(0);

    const res = await adminApi.put(`/admin/providers/${testProviderId}/unsuspend`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  // ── Provider reject ────────────────────────────────────────────────────────
  test("PUT /admin/providers/:id/reject: admin rejects provider with reason (200)", async ({ adminApi }) => {
    expect(rejectProviderId).toBeGreaterThan(0);

    const res = await adminApi.put(`/admin/providers/${rejectProviderId}/reject`, {
      data: { rejection_reason: "Incomplete documents provided. Missing insurance proof." },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  // ── Payout list ────────────────────────────────────────────────────────────
  test("GET /admin/payouts: admin gets payout list (200)", async ({ adminApi }) => {
    const res = await adminApi.get("/admin/payouts");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  // ── Payout process ─────────────────────────────────────────────────────────
  test("POST /admin/payouts/:id/process: admin marks eligible payout as paid (200)", async ({ adminApi }) => {
    expect(processPayoutId).toBeGreaterThan(0);

    const res = await adminApi.post(`/admin/payouts/${processPayoutId}/process`, {
      data: { transfer_reference: "TR-QA-100200" },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  // ── Payout fail ────────────────────────────────────────────────────────────
  test("POST /admin/payouts/:id/fail: admin marks eligible payout as failed (200)", async ({ adminApi }) => {
    expect(failPayoutId).toBeGreaterThan(0);

    const res = await adminApi.post(`/admin/payouts/${failPayoutId}/fail`, {
      data: { failure_reason: "Bank account details rejected by routing bank." },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  // ── Payout retry ───────────────────────────────────────────────────────────
  test("POST /admin/payouts/:id/retry: admin retries failed payout (200)", async ({ adminApi }) => {
    expect(retryPayoutId).toBeGreaterThan(0);

    const res = await adminApi.post(`/admin/payouts/${retryPayoutId}/retry`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  // ── Payout on-hold ─────────────────────────────────────────────────────────
  test("GET /admin/payouts/on-hold: admin retrieves on-hold payouts (200)", async ({ adminApi }) => {
    const res = await adminApi.get("/admin/payouts/on-hold");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.payouts || body.data || [])).toBe(true);
  });

  // ── Dispute resolve ────────────────────────────────────────────────────────
  test("POST /disputes/resolve/:id: admin resolves dispute with decision (200)", async ({ adminApi }) => {
    expect(testDisputeId).toBeGreaterThan(0);

    const res = await adminApi.post(`/disputes/resolve/${testDisputeId}`, {
      data: {
        resolution_notes: "Refund customer — verified service not delivered.",
        admin_decision: "refund_customer",
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  // ── Admin platform settings update ────────────────────────────────────────
  test("PUT /admin/platform-settings: admin updates platform settings (200)", async ({ adminApi }) => {
    const res = await adminApi.put("/admin/platform-settings", {
      data: {
        platform_name: "Hollis Blue Collar Platform",
        tagline: "Connecting quality service professionals",
        admin_commission: 12,
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
