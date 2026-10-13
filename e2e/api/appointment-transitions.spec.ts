/**
 * API: Appointment Status Transitions
 *
 * Tests ROLE_STATUS_TRANSITIONS — allowed and disallowed transitions
 * for customer and provider roles with exact HTTP status assertions.
 */
import { test, expect } from "../fixtures";
import { getDbConnection } from "../fixtures/db.helper";

// ── Helpers ────────────────────────────────────────────────────────────────
async function seedBooking(
  appointmentStatus: string,
  paymentStatus: string = "paid"
): Promise<number> {
  const conn = await getDbConnection();
  try {
    const [result]: any = await conn.query(
      `INSERT INTO bookings (customer_id, provider_id, service_type_id, total_amount, booking_date,
       payment_status, status, appointment_status, version, createdAt, updatedAt)
       VALUES (2, 1, 4, 150.00, DATE_SUB(NOW(), INTERVAL 2 HOUR), ?, 'accepted', ?, 0, NOW(), NOW())`,
      [paymentStatus, appointmentStatus]
    );
    return result.insertId;
  } finally {
    await conn.end();
  }
}

test.describe("API: Appointment Status Transitions", () => {
  // ── Customer: allowed ──────────────────────────────────────────────────────
  test("Customer: Requested → Cancelled (allowed 200)", async ({ customerApi }) => {
    const id = await seedBooking("Requested");
    const res = await customerApi.patch(`/appointments/${id}/status`, {
      data: { status: "Cancelled", reason: "No longer needed" },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  // ── Customer: disallowed ───────────────────────────────────────────────────
  test("Customer: Requested → Confirmed (disallowed provider privilege 400)", async ({ customerApi }) => {
    const id = await seedBooking("Requested");
    const res = await customerApi.patch(`/appointments/${id}/status`, {
      data: { status: "Confirmed" },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test("Customer: Requested → In Progress (disallowed sequence 400)", async ({ customerApi }) => {
    const id = await seedBooking("Requested");
    const res = await customerApi.patch(`/appointments/${id}/status`, {
      data: { status: "In Progress" },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  // ── Provider: allowed ──────────────────────────────────────────────────────
  test("Provider: Requested → Confirmed (allowed 200)", async ({ providerApi }) => {
    const id = await seedBooking("Requested");
    const res = await providerApi.patch(`/appointments/${id}/status`, {
      data: { status: "Confirmed" },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test("Provider: Requested → Cancelled (allowed 200)", async ({ providerApi }) => {
    const id = await seedBooking("Requested");
    const res = await providerApi.patch(`/appointments/${id}/status`, {
      data: { status: "Cancelled", reason: "Unavailable at that time" },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  // ── Provider: disallowed ───────────────────────────────────────────────────
  test("Provider: Requested → Completed (disallowed invalid jump 400)", async ({ providerApi }) => {
    const id = await seedBooking("Requested");
    const res = await providerApi.patch(`/appointments/${id}/status`, {
      data: { status: "Completed" },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test("Invalid status value rejected with 400", async ({ providerApi }) => {
    const id = await seedBooking("Requested");
    const res = await providerApi.patch(`/appointments/${id}/status`, {
      data: { status: "NonexistentStatus123" },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  // ── List & History ─────────────────────────────────────────────────────────
  test("GET /appointments/me: customer lists their appointments (200)", async ({ customerApi }) => {
    const res = await customerApi.get("/appointments/me");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.appointments || body.data || [])).toBe(true);
  });

  test("GET /appointments/:id/history: returns appointment status history log (200)", async ({ customerApi }) => {
    const id = await seedBooking("Requested");
    const res = await customerApi.get(`/appointments/${id}/history`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
