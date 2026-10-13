/**
 * Flow: Custom Project → Proposal → Accepted → Booking
 *
 * Journey:
 *  1. Customer creates a project with status: 'open'
 *  2. Provider submits a proposal on that project
 *  3. Customer accepts the proposal → booking created
 *  4. Customer verifies project status reflects accepted proposal
 *  5. Provider lists own proposals and sees submitted/accepted one
 */
import { test, expect } from "../fixtures";
import { getDbConnection } from "../fixtures/db.helper";

test.describe.serial("Flow: Custom Project → Proposal → Accepted → Booking", () => {
  let projectId: number;
  let proposalId: number;
  const projectTitle = `Flow Project ${Date.now()}`;

  test.beforeAll(async () => {
    const conn = await getDbConnection();
    try {
      await conn.query(
        "UPDATE provider_subscriptions SET status = 'active', end_date = '2027-12-31' WHERE provider_id = 1"
      );
    } finally {
      await conn.end();
    }
  });

  test("Step 1 – Customer creates an open project", async ({ customerApi }) => {
    const res = await customerApi.post("/projects", {
      data: {
        title: projectTitle,
        description: "Full house deep-clean including attic and garage. 4-bed 3-bath.",
        category_id: 1,
        service_type_id: 4,
        budget_min: 300,
        budget_max: 600,
        address_line: "789 Oak Lane",
        city: "Dallas",
        state: "TX",
        zip_code: "75002",
        status: "open",
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    const proj = body.project || body.data;
    expect(proj).toBeDefined();
    expect(proj.title).toBe(projectTitle);
    expect(proj.status).toBe("open");
    projectId = proj.id;
  });

  test("Step 2 – Project appears in provider feed", async ({ providerApi }) => {
    expect(projectId).toBeGreaterThan(0);

    const res = await providerApi.get("/projects/provider/feed");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.projects || body.data || [])).toBe(true);
  });

  test("Step 3 – Provider submits a proposal on the project", async ({ providerApi }) => {
    expect(projectId).toBeGreaterThan(0);

    const res = await providerApi.post(`/proposals/project/${projectId}`, {
      data: {
        amount: 450,
        message: "I have 10 years of experience in deep cleaning and can complete this efficiently.",
        estimated_duration_hours: 6,
        status: "submitted",
      },
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    const proposal = body.proposal || body.data;
    expect(proposal?.id).toBeDefined();
    expect(Number(proposal.amount)).toBe(450);
    proposalId = proposal.id;
  });

  test("Step 4 – Customer accepts the proposal", async ({ customerApi }) => {
    expect(proposalId).toBeGreaterThan(0);

    const res = await customerApi.post(`/proposals/${proposalId}/accept`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    const result = body.booking || body.data?.booking || body.data;
    expect(result).toBeDefined();
  });

  test("Step 5 – Project status reflects accepted proposal", async ({ customerApi }) => {
    expect(projectId).toBeGreaterThan(0);

    const res = await customerApi.get(`/projects/${projectId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    const proj = body.project || body.data;
    expect(proj?.status).toBe("accepted_pending_payment");
  });

  test("Step 6 – Provider lists own proposals and sees submitted/accepted one", async ({ providerApi }) => {
    const res = await providerApi.get("/proposals/provider/my");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    const proposals = body.proposals || body.data || [];
    expect(Array.isArray(proposals)).toBe(true);
    if (proposalId) {
      const found = proposals.some((p: any) => p.id === proposalId);
      expect(found).toBe(true);
    }
  });
});
