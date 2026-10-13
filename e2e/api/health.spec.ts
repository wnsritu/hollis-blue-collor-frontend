import { test, expect } from "../fixtures";

test.describe("Backend Health & Baseline @smoke", () => {
  test("GET /health should return 200 with database: up", async ({ guestApi }) => {
    const res = await guestApi.get("/health");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.database).toBe("up");
  });

  test("Root endpoint / should return 200", async ({ guestApi }) => {
    const res = await guestApi.get("/");
    expect(res.status()).toBe(200);
  });
});
