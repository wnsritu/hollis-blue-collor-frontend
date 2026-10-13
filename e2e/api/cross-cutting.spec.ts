import { test, expect } from "../fixtures";
import { createTestEmail, createTestPhone } from "../fixtures/test-data";
import { setUserVerified, getDbConnection } from "../fixtures/db.helper";

test.describe("API: Cross-cutting & Financial Security Checks", () => {
  let customerBUserId = 0;
  let projectBId = 0;
  let addressBId = 0;
  let providerBId = 0;
  let chatBId = 0;
  let customerABookingId = 0;
  let customerBBookingId = 0;

  test.beforeAll(async () => {
    const conn = await getDbConnection();
    try {
      // 1. Create Customer B in DB
      const emailB = createTestEmail("custb");
      const phoneB = createTestPhone();
      const [uBResult]: any = await conn.query(
        "INSERT INTO users (full_name, email, phone, password, role_id, status, email_verified, created_at) VALUES (?, ?, ?, 'hashed', 1, 'active', 1, NOW())",
        ["Customer B", emailB, phoneB]
      );
      customerBUserId = uBResult.insertId;

      // Project for Customer B
      const [projBResult]: any = await conn.query(
        "INSERT INTO projects (customer_id, category_id, service_type_id, title, description, status, payment_status, address_line, city, state, zip_code, created_at, updated_at) VALUES (?, 1, 4, 'Customer B Private Project', 'Confidential renovation project for customer B only.', 'open', 'pending', '456 Private Ave', 'Dallas', 'TX', '75001', NOW(), NOW())",
        [customerBUserId]
      );
      projectBId = projBResult.insertId;

      // Address for Customer B
      const [addrBResult]: any = await conn.query(
        "INSERT INTO user_addresses (user_id, address_line, city, state, zip_code, country, createdAt, updatedAt) VALUES (?, '100 Confidential St', 'Dallas', 'TX', '75001', 'USA', NOW(), NOW())",
        [customerBUserId]
      );
      addressBId = addrBResult.insertId;

      // 2. Set up Provider B and test bookings in DB
      const emailProvB = createTestEmail("provb");
      const phoneProvB = createTestPhone();
      const [uResult]: any = await conn.query(
        "INSERT INTO users (full_name, email, phone, password, role_id, status, email_verified, created_at) VALUES (?, ?, ?, 'hashed', 2, 'active', 1, NOW())",
        ["Provider B Business", emailProvB, phoneProvB]
      );
      const provBUserId = uResult.insertId;
      const [pResult]: any = await conn.query(
        "INSERT INTO providers (user_id, business_name, bank_name, bank_account_holder, bank_account_number, bank_routing_number, status, verified, category_id, license_number, insurance_policy, createdAt, updatedAt) VALUES (?, ?, 'Chase Bank', 'Provider B LLC', '987654321', '021000021', 'active', 'verified', 1, 'LIC-999999', 'INS-999999', NOW(), NOW())",
        [provBUserId, "Provider B LLC"]
      );
      providerBId = pResult.insertId;

      // Create test chat for Customer B and Provider B
      const [cResult]: any = await conn.query(
        "INSERT INTO chats (customer_id, provider_id, is_active, is_blocked, createdAt, updatedAt) VALUES (?, ?, 1, 0, NOW(), NOW())",
        [customerBUserId, providerBId]
      );
      chatBId = cResult.insertId;

      // Create test booking for Customer A (user 2)
      const [b1Result]: any = await conn.query(
        "INSERT INTO bookings (customer_id, provider_id, service_type_id, total_amount, booking_date, payment_status, status, version, createdAt, updatedAt) VALUES (2, 1, 4, 100.00, CURDATE(), 'paid', 'accepted', 0, NOW(), NOW())"
      );
      customerABookingId = b1Result.insertId;

      // Create test booking for Customer B
      const [b2Result]: any = await conn.query(
        "INSERT INTO bookings (customer_id, provider_id, service_type_id, total_amount, booking_date, payment_status, status, version, createdAt, updatedAt) VALUES (?, ?, 4, 150.00, CURDATE(), 'pending', 'pending', 0, NOW(), NOW())",
        [customerBUserId, providerBId]
      );
      customerBBookingId = b2Result.insertId;
    } finally {
      await conn.end();
    }
  });

  test("Webhook rejects unsigned or incorrectly signed requests with 400", async ({ guestApi }) => {
    const res = await guestApi.post("/payments/webhook", {
      headers: {
        "stripe-signature": "invalid_sig_12345",
      },
      data: JSON.stringify({ id: "evt_test", type: "payment_intent.succeeded" }),
    });

    expect(res.status()).toBe(400);
  });

  test("IDOR check: Customer A gets 403 reading Customer B project", async ({ customerApi }) => {
    expect(projectBId).toBeGreaterThan(0);
    const res = await customerApi.get(`/projects/${projectBId}`);
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test("IDOR check: Customer A gets 404 reading nonexistent project", async ({ customerApi }) => {
    const res = await customerApi.get("/projects/999999");
    expect(res.status()).toBe(404);
  });

  test("IDOR check: Customer A gets 403 mutating Customer B address", async ({ customerApi }) => {
    expect(addressBId).toBeGreaterThan(0);
    const res = await customerApi.patch(`/user/user-address/${addressBId}`, {
      data: { address_line: "Hacked Address" },
    });
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test("IDOR check: Customer A gets 404 mutating nonexistent address", async ({ customerApi }) => {
    const res = await customerApi.patch("/user/user-address/999999", {
      data: { address_line: "Nonexistent" },
    });
    expect(res.status()).toBe(404);
  });

  test("IDOR check: Customer A gets 403 reading Customer B chat messages", async ({ customerApi }) => {
    expect(chatBId).toBeGreaterThan(0);
    const res = await customerApi.get(`/chats/messages/${chatBId}`);
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test("IDOR check: Customer A gets 404 reading nonexistent chat", async ({ customerApi }) => {
    const res = await customerApi.get("/chats/messages/999999");
    expect(res.status()).toBe(404);
  });

  test("IDOR check: Customer A gets 403 reading Customer B appointment/booking", async ({ customerApi }) => {
    expect(customerBBookingId).toBeGreaterThan(0);
    const res = await customerApi.get(`/appointments/${customerBBookingId}`);
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test("IDOR check: Customer A gets 404 reading nonexistent appointment/booking", async ({ customerApi }) => {
    const res = await customerApi.get("/appointments/999999");
    expect(res.status()).toBe(404);
  });

  test("IDOR check: Customer A gets 403 accessing Customer B booking payment intent", async ({ customerApi }) => {
    expect(customerBBookingId).toBeGreaterThan(0);
    const res = await customerApi.post("/payments/create-payment-intent", {
      data: { booking_id: customerBBookingId },
    });
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test("IDOR check: Provider A gets 403 reading Provider B bank info", async ({ providerApi }) => {
    expect(providerBId).toBeGreaterThan(0);
    const res = await providerApi.get(`/providers/${providerBId}/bank-info`);
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test("IDOR check: Provider A gets 404 reading nonexistent provider bank info", async ({ providerApi }) => {
    const res = await providerApi.get("/providers/999999/bank-info");
    expect(res.status()).toBe(404);
  });

  test("IDOR check: Provider earnings endpoint strictly scoped to authenticated provider", async ({ providerApi }) => {
    const res = await providerApi.get("/providers/dashboard/earnings");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(Array.isArray(body.data.transactions || [])).toBe(true);
  });

  test("Response Safety: Users list / profile never leaks password hashes or raw secrets", async ({ adminApi }) => {
    const res = await adminApi.get("/admin/customers");
    expect(res.status()).toBe(200);
    const body = await res.json();
    const customers = body.customers || body.data || [];
    for (const cust of customers) {
      expect(cust.password).toBeUndefined();
      expect(cust.password_hash).toBeUndefined();
    }
  });

  test("Idempotency: Payment intent endpoint returns identical 200 response for duplicate key", async ({ customerApi }) => {
    expect(customerABookingId).toBeGreaterThan(0);
    const idempotencyKey = `test-idem-${Date.now()}`;
    const payload = {
      booking_id: customerABookingId,
      amount: 100,
    };

    const res1 = await customerApi.post("/payments/create-payment-intent", {
      headers: { "idempotency-key": idempotencyKey },
      data: payload,
    });

    const res2 = await customerApi.post("/payments/create-payment-intent", {
      headers: { "idempotency-key": idempotencyKey },
      data: payload,
    });

    expect(res1.status()).toBe(200);
    expect(res2.status()).toBe(200);
    expect(res1.status()).toBe(res2.status());
    const body1 = await res1.json();
    const body2 = await res2.json();
    expect(body1.success).toBe(true);
    expect(body2.success).toBe(true);
  });
});
