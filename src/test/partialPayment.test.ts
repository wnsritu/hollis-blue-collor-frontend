import { describe, it, expect } from "vitest";
import { normalizeBooking, getBookingStatusDisplay } from "@/utils/bookingAdapter";
import { STATUS_TO_TONE_MAP } from "@/constants/status.constants";

describe("Frontend Partial Payment Support", () => {
  it("should normalize booking with 30% partial payment correctly", () => {
    const rawBooking = {
      id: 42,
      booking_number: "BKG-00042",
      status: "in_progress",
      appointment_status: "In Progress",
      total_amount: 200,
      payment_status: "partially_paid",
      partial_payment_percentage: 30,
      initial_payment_amount: 60,
      remaining_balance: 140,
      total_paid_amount: 60,
    };

    const norm = normalizeBooking(rawBooking);

    expect(norm.isPartialPayment).toBe(true);
    expect(norm.isPartiallyPaid).toBe(true);
    expect(norm.isPaid).toBe(false);
    expect(norm.partialPaymentPercentage).toBe(30);
    expect(norm.initialPaymentAmount).toBe(60);
    expect(norm.remainingBalance).toBe(140);
    expect(norm.totalPaidAmount).toBe(60);
  });

  it("should normalize fully completed and paid booking correctly", () => {
    const rawBooking = {
      id: 42,
      booking_number: "BKG-00042",
      status: "finished",
      appointment_status: "Completed",
      total_amount: 200,
      payment_status: "paid",
      partial_payment_percentage: 30,
      initial_payment_amount: 60,
      remaining_balance: 0,
      total_paid_amount: 200,
      final_payment_date: "2026-10-22T20:00:00Z",
    };

    const norm = normalizeBooking(rawBooking);

    expect(norm.isPartialPayment).toBe(true);
    expect(norm.isPartiallyPaid).toBe(false);
    expect(norm.isPaid).toBe(true);
    expect(norm.isCompleted).toBe(true);
    expect(norm.remainingBalance).toBe(0);
    expect(norm.totalPaidAmount).toBe(200);
    expect(norm.finalPaymentDate).toBe("2026-10-22T20:00:00Z");
  });

  it("should preserve backward compatibility for legacy bookings without partial payment", () => {
    const rawLegacyBooking = {
      id: 15,
      booking_number: "BKG-00015",
      status: "pending",
      appointment_status: "Requested",
      total_amount: 150,
      payment_status: "pending",
    };

    const norm = normalizeBooking(rawLegacyBooking);

    expect(norm.isPartialPayment).toBe(false);
    expect(norm.isPartiallyPaid).toBe(false);
    expect(norm.partialPaymentPercentage).toBe(100);
    expect(norm.initialPaymentAmount).toBe(150);
    expect(norm.remainingBalance).toBe(0);
  });

  it("should map partially_paid status display correctly", () => {
    expect(getBookingStatusDisplay("partially_paid")).toBe("Partially Paid");
    expect(getBookingStatusDisplay("partially paid")).toBe("Partially Paid");
  });

  it("should map partiallypaid to purple tone in STATUS_TO_TONE_MAP", () => {
    expect(STATUS_TO_TONE_MAP["partiallypaid"]).toBe("purple");
    expect(STATUS_TO_TONE_MAP["partiallyrefunded"]).toBe("purple");
  });

  it("should prioritize partially_paid over payment.payment_status === 'success'", () => {
    const rawBooking = {
      id: 9,
      status: "pending",
      appointment_status: "Requested",
      payment_status: "partially_paid",
      payment: {
        id: 10,
        payment_status: "success",
        amount: 10,
      },
      remaining_balance: 10,
      initial_payment_amount: 10,
      total_amount: 20,
    };

    const norm = normalizeBooking(rawBooking);
    expect(norm.isPartiallyPaid).toBe(true);
    expect(norm.isPaid).toBe(false);
    expect(norm.paymentStatus).toBe("partially_paid");
  });
});
