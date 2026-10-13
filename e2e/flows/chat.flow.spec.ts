/**
 * Flow: Chat Messaging
 *
 * Journey:
 *  1. Customer creates a chat with the QA provider
 *  2. Customer sends a message
 *  3. Provider receives messages in the chat
 *  4. Provider sends a reply
 *  5. Customer marks chat as read
 */
import { test, expect } from "../fixtures";
import { getDbConnection } from "../fixtures/db.helper";

test.describe("Flow: Chat Messaging (Customer ↔ Provider)", () => {
  let chatId: number;

  test.beforeAll(async () => {
    // Create a chat between QA customer (id=2) and QA provider (provider id=1) via DB
    const conn = await getDbConnection();
    try {
      // Check if chat already exists
      const [existing]: any = await conn.query(
        "SELECT id FROM chats WHERE customer_id = 2 AND provider_id = 1 LIMIT 1"
      );
      if (existing.length > 0) {
        chatId = existing[0].id;
      } else {
        const [result]: any = await conn.query(
          "INSERT INTO chats (customer_id, provider_id, is_active, is_blocked, createdAt, updatedAt) VALUES (2, 1, 1, 0, NOW(), NOW())"
        );
        chatId = result.insertId;
      }
    } finally {
      await conn.end();
    }
  });

  test("Step 1 – Customer can list own chats", async ({ customerApi }) => {
    const res = await customerApi.get("/chats/user");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.chats || body.data || [])).toBe(true);
  });

  test("Step 2 – Customer sends a message", async ({ customerApi }) => {
    expect(chatId).toBeGreaterThan(0);

    const res = await customerApi.post("/chats/send-message", {
      data: {
        chat_id: chatId,
        message: `Flow test message at ${Date.now()}`,
      },
    });
    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    expect(body.success).toBe(true);
    const msg = body.data;
    if (msg) {
      expect(msg.id || msg.message_id).toBeDefined();
    }
  });

  test("Step 3 – Provider reads chat messages", async ({ providerApi }) => {
    expect(chatId).toBeGreaterThan(0);

    const res = await providerApi.get(`/chats/messages/${chatId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    const messages = body.messages || body.data || [];
    expect(Array.isArray(messages)).toBe(true);
    expect(messages.length).toBeGreaterThan(0);
  });

  test("Step 4 – Provider sends a reply", async ({ providerApi }) => {
    expect(chatId).toBeGreaterThan(0);

    const res = await providerApi.post("/chats/send-message", {
      data: {
        chat_id: chatId,
        message: `Provider reply at ${Date.now()}`,
      },
    });
    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test("Step 5 – Customer marks chat as read", async ({ customerApi }) => {
    expect(chatId).toBeGreaterThan(0);

    const res = await customerApi.post("/chats/mark-as-read", {
      data: { chat_id: chatId },
    });
    expect([200, 204]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(body.success).toBe(true);
    }
  });

  test("Step 6 – Provider lists own chats (chat still visible)", async ({ providerApi }) => {
    const res = await providerApi.get("/chats/user");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    const chats = body.chats || body.data || [];
    expect(Array.isArray(chats)).toBe(true);
    if (chatId) {
      const found = chats.some((c: any) => c.id === chatId || c.chat_id === chatId);
      expect(found).toBe(true);
    }
  });
});
