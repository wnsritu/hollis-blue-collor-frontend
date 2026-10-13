import { test, expect } from "../fixtures";

test.describe("Security: Injection & Token Tampering", () => {
  test("SQL injection attempt in search query is safely handled", async ({ guestApi }) => {
    const maliciousPayload = "' OR '1'='1' -- ";
    const res = await guestApi.get(`/providers/search?query=${encodeURIComponent(maliciousPayload)}`);
    // API must handle gracefully with 200 without SQL error or crash
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test("XSS payload in project title is stored safely", async ({ customerApi }) => {
    const xssTitle = `<script>alert("xss")</script> Project ${Date.now()}`;
    const res = await customerApi.post("/projects", {
      data: {
        title: xssTitle,
        description: "Valid description for security verification.",
        category_id: 1,
        service_type_id: 4,
        budget_min: 100,
        budget_max: 200,
        address_line: "789 Sec St",
        city: "Dallas",
        state: "TX",
        zip_code: "75001",
      },
    });
    expect(res.status()).toBe(201);
    const data = await res.json();
    const project = data.project || data.data;
    expect(project).toBeDefined();
  });

  test("Tampered JWT signature is rejected with 401", async ({ guestApi }) => {
    const tamperedToken =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OTk5LCJyb2xlIjoxLCJpYXQiOjE2MDAwMDAwMDB9.INVALID_SIGNATURE";
    const res = await guestApi.get("/auth/me", {
      headers: { Authorization: `Bearer ${tamperedToken}` },
    });
    expect(res.status()).toBe(401);
  });
});
