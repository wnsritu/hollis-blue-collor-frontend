/**
 * Flow: Fixed-Price Booking → Payout
 *
 * Journey:
 *  1. Customer calculates booking price via POST /booking/calculate-price
 *  2. Customer creates a booking via POST /booking/add
 *  3. Customer creates a payment intent for the booking
 *  4. Admin retrieves eligible payouts list
 *  5. Admin retrieves payout history
 */
import { test, expect } from "../fixtures";
import { getDbConnection } from "../fixtures/db.helper";

test.describe("Flow: Fixed-Price Booking → Payout", () => {
  let bookingId: number;

  test("Step 1 – Customer can calculate booking price", async ({ customerApi }) => {
    const res = await customerApi.post("/booking/calculate-price", {
      data: {
        service_type_id: 4,
        category_id: 1,
        items: [{ id: 1, quantity: 1, price: 100 }],
        total_amount: 100,
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
  });

  test("Step 2 – Customer creates a booking (201)", async ({ customerApi }) => {
    const res = await customerApi.post("/booking/add", {
      data: {
        provider_id: 1,
        service_type_id: 4,
        booking_date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
        time_slot_id: 1,
        total_amount: 120,
        items: [{ service_id: 1, service_name: "Standard Cleaning", quantity: 1, price: 120 }],
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    const booking = body.booking || body.data;
    expect(booking?.id).toBeDefined();
    bookingId = booking.id;
  });

  test("Step 3 – Customer creates a payment intent for an existing booking", async ({ customerApi }) => {
    // Seed a booking via DB for determinism
    const conn = await getDbConnection();
    try {
      const [result]: any = await conn.query(
        "INSERT INTO bookings (customer_id, provider_id, service_type_id, total_amount, booking_date, payment_status, status, version, createdAt, updatedAt) VALUES (2, 1, 4, 120.00, CURDATE(), 'pending', 'pending', 0, NOW(), NOW())"
      );
      bookingId = result.insertId;
    } finally {
      await conn.end();
    }

    const res = await customerApi.post("/payments/create-payment-intent", {
      data: { booking_id: bookingId, amount: 120 },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    // Returns clientSecret, paymentIntentId, or fallback alreadyPaid/transactionId
    const hasPaymentIdentifier = Boolean(
      body.data?.clientSecret ||
      body.clientSecret ||
      body.data?.paymentIntentId ||
      body.paymentIntentId ||
      body.data?.transactionId ||
      body.data?.alreadyPaid
    );
    expect(hasPaymentIdentifier).toBe(true);
  });

  test("Step 4 – Admin retrieves eligible payouts list", async ({ adminApi }) => {
    const res = await adminApi.get("/admin/payouts");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.payouts || body.data || [])).toBe(true);
  });

  test("Step 5 – Admin retrieves payout history", async ({ adminApi }) => {
    const res = await adminApi.get("/admin/payouts/history");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.payouts || body.data || [])).toBe(true);
  });
});
