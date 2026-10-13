import { test, expect } from "../fixtures";

test.describe("API: Public & Catalog Endpoints", () => {
  test("GET /time-slots: public time slots list", async ({ guestApi }) => {
    const res = await guestApi.get("/time-slots");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data || body.timeSlots)).toBe(true);
  });

  test("GET /providers/search: search providers with filters", async ({ guestApi }) => {
    const res = await guestApi.get("/providers/search?page=1&limit=10");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data || body.providers)).toBe(true);
  });

  test("GET /providers/top-rated: returns top rated providers", async ({ guestApi }) => {
    const res = await guestApi.get("/providers/top-rated");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data || body.providers)).toBe(true);
  });

  test("GET /categories: public category list", async ({ guestApi }) => {
    const res = await guestApi.get("/categories");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data || body.categories)).toBe(true);
  });
});
