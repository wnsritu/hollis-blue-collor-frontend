/**
 * Flow: Cancellation & Refund
 *
 * Journey:
 *  1. Seed a booking (DB)
 *  2. Customer requests cancellation preview (shows refund amount) (200)
 *  3. Customer cancels booking via status transition (200)
 *  4. Admin retrieves payouts overview (200)
 *  5. Refund endpoint validates payment ID (404 for invalid payment)
 */
import { test, expect } from "../fixtures";
import { getDbConnection } from "../fixtures/db.helper";

test.describe.serial("Flow: Cancellation & Refund", () => {
  let bookingId: number;

  test.beforeAll(async () => {
    const conn = await getDbConnection();
    try {
      const [result]: any = await conn.query(
        "INSERT INTO bookings (customer_id, provider_id, service_type_id, total_amount, booking_date, payment_status, status, appointment_status, version, createdAt, updatedAt) VALUES (2, 1, 4, 200.00, CURDATE(), 'paid', 'accepted', 'Confirmed', 0, NOW(), NOW())"
      );
      bookingId = result.insertId;
    } finally {
      await conn.end();
    }
  });

  test("Step 1 – Cancellation preview shows refund breakdown (200)", async ({ customerApi }) => {
    expect(bookingId).toBeGreaterThan(0);

    const res = await customerApi.get(`/appointments/${bookingId}/cancel-preview`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    const preview = body.data || body;
    expect(
      typeof preview.refund_amount !== "undefined" ||
      typeof preview.refundAmount !== "undefined" ||
      typeof preview.cancellation_fee !== "undefined"
    ).toBe(true);
  });

  test("Step 2 – Customer cancels booking via status transition (200)", async ({ customerApi }) => {
    expect(bookingId).toBeGreaterThan(0);

    const res = await customerApi.patch(`/appointments/${bookingId}/status`, {
      data: { appointment_status: "Cancelled", status: "Cancelled", reason: "Changed plans" },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test("Step 3 – Admin views payouts list (200)", async ({ adminApi }) => {
    const res = await adminApi.get("/admin/payouts");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test("Step 4 – Admin refund endpoint returns 404 for nonexistent payment ID (404)", async ({ adminApi }) => {
    const res = await adminApi.post("/payments/999999/refund", {
      data: { reason: "Cancellation refund" },
    });
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body.success).toBe(false);
  });
});
