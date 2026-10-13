/**
 * Flow: Customer Dispute Lifecycle
 *
 * Journey:
 *  1. Seed/identify a customer booking
 *  2. Customer raises a dispute via POST /disputes/create
 *  3. Admin/Support views dispute queue via GET /disputes/list
 *  4. Admin views dispute details via GET /disputes/details/:id
 *  5. Admin resolves dispute via POST /disputes/resolve/:id
 *  6. Confirm dispute status is marked as resolved
 */
import { test, expect } from "../fixtures";
import { getDbConnection } from "../fixtures/db.helper";

test.describe.serial("Flow: Customer Dispute Lifecycle Across Roles", () => {
  let bookingId: number;
  let disputeId: number;

  test("Step 1 – Seed a completed booking for dispute creation", async () => {
    const conn = await getDbConnection();
    try {
      const [result]: any = await conn.query(
        "INSERT INTO bookings (customer_id, provider_id, service_type_id, total_amount, booking_date, payment_status, status, version, createdAt, updatedAt) VALUES (2, 1, 4, 150.00, CURDATE(), 'paid', 'finished', 0, NOW(), NOW())"
      );
      bookingId = result.insertId;
      expect(bookingId).toBeGreaterThan(0);
    } finally {
      await conn.end();
    }
  });

  test("Step 2 – Customer creates a dispute on the booking", async ({ customerApi }) => {
    expect(bookingId).toBeGreaterThan(0);

    const res = await customerApi.post("/disputes/create", {
      data: {
        booking_id: bookingId,
        reason: "Poor service quality",
        issue_type: "quality",
        description: "The work completed did not match the agreed requirements.",
        refund_requested: 50,
      },
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    const dispute = body.dispute || body.data;
    expect(dispute).toBeDefined();
    expect(dispute.id).toBeDefined();
    disputeId = dispute.id;
  });

  test("Step 3 – Support/Admin lists disputes queue and finds new dispute", async ({ supportApi }) => {
    expect(disputeId).toBeGreaterThan(0);

    const res = await supportApi.get("/disputes/list");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    const list = body.disputes || body.data || body.rows || [];
    expect(Array.isArray(list)).toBe(true);
    const found = list.some((d: any) => d.id === disputeId);
    expect(found).toBe(true);
  });

  test("Step 4 – Admin retrieves dispute details", async ({ adminApi }) => {
    expect(disputeId).toBeGreaterThan(0);

    const res = await adminApi.get(`/disputes/details/${disputeId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    const details = body.dispute || body.data;
    expect(details.id).toBe(disputeId);
    expect(Number(details.booking_id)).toBe(bookingId);
  });

  test("Step 5 – Admin resolves dispute", async ({ adminApi }) => {
    expect(disputeId).toBeGreaterThan(0);

    const res = await adminApi.post(`/disputes/resolve/${disputeId}`, {
      data: {
        resolution_notes: "Partial refund approved and issued to customer.",
        admin_decision: "partial_refund",
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test("Step 6 – Verify dispute status is resolved", async ({ customerApi }) => {
    expect(disputeId).toBeGreaterThan(0);

    const res = await customerApi.get(`/disputes/details/${disputeId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    const dispute = body.dispute || body.data;
    expect(dispute.status).toBe("resolved");
  });
});
