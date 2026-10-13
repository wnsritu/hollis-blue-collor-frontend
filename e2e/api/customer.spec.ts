import { test, expect } from "../fixtures";

test.describe("API: Customer Endpoints", () => {
  let createdProjectId: number;

  test("GET /customers/me/profile: returns customer profile", async ({ customerApi }) => {
    const res = await customerApi.get("/customers/me/profile");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.data.id).toBeDefined();
  });

  test("PUT /customers/me/profile: update customer profile", async ({ customerApi }) => {
    const res = await customerApi.put("/customers/me/profile", {
      data: {
        full_name: "QA Customer Updated",
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.full_name).toBe("QA Customer Updated");
  });

  test("Create Project: POST /projects happy path", async ({ customerApi }) => {
    const res = await customerApi.post("/projects", {
      data: {
        title: "Test Home Cleaning Project",
        description: "Need full home cleaning this weekend with deep kitchen scrubbing.",
        category_id: 1,
        service_type_id: 4,
        budget_min: 100,
        budget_max: 150,
        address_line: "123 Elm St",
        city: "Dallas",
        state: "TX",
        zip_code: "75001",
      },
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    const proj = body.project || body.data;
    expect(proj).toBeDefined();
    expect(proj.title).toBe("Test Home Cleaning Project");
    if (proj?.id) {
      createdProjectId = proj.id;
    }
  });

  test("Create Project: validation error on missing title/description (400)", async ({ customerApi }) => {
    const res = await customerApi.post("/projects", {
      data: {
        budget_min: 100,
      },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.message).toBeDefined();
  });

  test("List Customer Projects: GET /projects/customer/my", async ({ customerApi }) => {
    const res = await customerApi.get("/projects/customer/my");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.projects || body.data)).toBe(true);
  });

  test("Calculate Booking Price: POST /booking/calculate-price", async ({ customerApi }) => {
    const res = await customerApi.post("/booking/calculate-price", {
      data: {
        service_id: 1,
        items: [{ id: 1, quantity: 1, price: 100 }],
        total_amount: 100,
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
  });

  test("List Bookings: POST /booking/list", async ({ customerApi }) => {
    const res = await customerApi.post("/booking/list", {
      data: { page: 1, limit: 10 },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.bookings || body.data)).toBe(true);
  });

  test("Security Check: Customer token cannot access admin routes (403)", async ({ customerApi }) => {
    const res = await customerApi.get("/admin/dashboard");
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.message).toBeDefined();
  });
});
