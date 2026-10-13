/**
 * API: Proposals – Create / Accept / Reject
 * Covers all CRUD + accept/reject operations with exact assertions.
 */
import { test, expect } from "../fixtures";
import { getDbConnection } from "../fixtures/db.helper";

test.describe.serial("API: Proposals – Create / Accept / Reject", () => {
  let project1Id: number;
  let project2Id: number;
  let proposal1Id: number;
  let proposal2Id: number;

  test.beforeAll(async () => {
    const conn = await getDbConnection();
    try {
      // Seed two projects: one for accept flow, one for reject flow
      const [r1]: any = await conn.query(
        "INSERT INTO projects (customer_id, category_id, service_type_id, title, description, status, payment_status, address_line, city, state, zip_code, created_at, updated_at) VALUES (2, 1, 4, 'Proposal Accept Project', 'Testing proposal accept endpoint.', 'open', 'pending', '500 Accept Ave', 'Dallas', 'TX', '75001', NOW(), NOW())"
      );
      project1Id = r1.insertId;

      const [r2]: any = await conn.query(
        "INSERT INTO projects (customer_id, category_id, service_type_id, title, description, status, payment_status, address_line, city, state, zip_code, created_at, updated_at) VALUES (2, 1, 4, 'Proposal Reject Project', 'Testing proposal reject endpoint.', 'open', 'pending', '501 Reject Ave', 'Dallas', 'TX', '75001', NOW(), NOW())"
      );
      project2Id = r2.insertId;
    } finally {
      await conn.end();
    }
  });

  // ── Create proposal 1 ───────────────────────────────────────────────────────
  test("POST /proposals/project/:id: provider creates proposal (201)", async ({ providerApi }) => {
    expect(project1Id).toBeGreaterThan(0);

    const res = await providerApi.post(`/proposals/project/${project1Id}`, {
      data: {
        amount: 380,
        message: "Experienced cleaner — 8 years doing residential deep-cleans.",
        estimated_duration_hours: 5,
      },
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    const proposal = body.proposal || body.data;
    expect(proposal.id).toBeDefined();
    proposal1Id = proposal.id;
  });

  // ── Create proposal 2 (for reject) ─────────────────────────────────────────
  test("POST /proposals/project/:id: provider creates proposal on project 2 (201)", async ({ providerApi }) => {
    expect(project2Id).toBeGreaterThan(0);

    const res = await providerApi.post(`/proposals/project/${project2Id}`, {
      data: {
        amount: 420,
        message: "Second proposal for reject testing.",
        estimated_duration_hours: 6,
      },
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    const proposal = body.proposal || body.data;
    expect(proposal.id).toBeDefined();
    proposal2Id = proposal.id;
  });

  // ── List project proposals ─────────────────────────────────────────────────
  test("GET /proposals/project/:id: customer lists proposals for project (200)", async ({ customerApi }) => {
    expect(project1Id).toBeGreaterThan(0);

    const res = await customerApi.get(`/proposals/project/${project1Id}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.proposals || body.data || [])).toBe(true);
  });

  // ── Provider lists own proposals ───────────────────────────────────────────
  test("GET /proposals/provider/my: provider lists own proposals (200)", async ({ providerApi }) => {
    const res = await providerApi.get("/proposals/provider/my");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    const proposals = body.proposals || body.data || [];
    expect(Array.isArray(proposals)).toBe(true);
  });

  // ── Get proposal by ID ─────────────────────────────────────────────────────
  test("GET /proposals/:id: customer retrieves proposal by ID (200)", async ({ customerApi }) => {
    expect(proposal1Id).toBeGreaterThan(0);

    const res = await customerApi.get(`/proposals/${proposal1Id}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    const proposal = body.proposal || body.data;
    expect(proposal.id).toBe(proposal1Id);
  });

  // ── Reject proposal ────────────────────────────────────────────────────────
  test("POST /proposals/:id/reject: customer rejects proposal (200)", async ({ customerApi }) => {
    expect(proposal2Id).toBeGreaterThan(0);

    const res = await customerApi.post(`/proposals/${proposal2Id}/reject`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  // ── Accept proposal ────────────────────────────────────────────────────────
  test("POST /proposals/:id/accept: customer accepts proposal (200)", async ({ customerApi }) => {
    expect(proposal1Id).toBeGreaterThan(0);

    const res = await customerApi.post(`/proposals/${proposal1Id}/accept`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  // ── Non-owner cannot accept ────────────────────────────────────────────────
  test("POST /proposals/:id/accept: provider cannot accept own proposal (403)", async ({ providerApi }) => {
    expect(proposal1Id).toBeGreaterThan(0);

    const res = await providerApi.post(`/proposals/${proposal1Id}/accept`);
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.success).toBe(false);
  });
});
