import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { QA_USERS, API_BASE_URL, APP_BASE_URL } from "./fixtures/test-data";
import { getDbConnection, setUserVerified } from "./fixtures/db.helper";
// @ts-ignore
import bcrypt from "../../hollis-blue-collor-backend/node_modules/bcryptjs/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_DIR = path.resolve(__dirname, ".auth");

async function setupUser(roleKey: "customer" | "provider" | "admin" | "support") {
  const filePath = path.join(AUTH_DIR, `${roleKey}.json`);
  if (fs.existsSync(filePath)) {
    try {
      const saved = JSON.parse(fs.readFileSync(filePath, "utf8"));
      const savedToken = saved.origins?.[0]?.localStorage?.find((i: any) => i.name === "token")?.value;
      if (savedToken) {
        const checkRes = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${savedToken}` },
        });
        if (checkRes.ok) {
          return; // Existing session is completely valid!
        }
      }
    } catch {
      // Re-create session
    }
  }

  const user = QA_USERS[roleKey];
  const conn = await getDbConnection();

  try {
    const [existing]: any = await conn.query(
      "SELECT id, role_id FROM users WHERE email = ? LIMIT 1",
      [user.email]
    );

    if (!existing || existing.length === 0) {
      if (roleKey === "support") {
        const hashed = await bcrypt.hash(user.password, 10);
        await conn.query(
          "INSERT INTO users (full_name, email, phone, password, role_id, status, email_verified, created_at) VALUES (?, ?, ?, ?, 4, 'active', 1, NOW())",
          [user.full_name, user.email, user.phone, hashed]
        );
      } else if (roleKey === "customer") {
        await fetch(`${API_BASE_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            full_name: user.full_name,
            email: user.email,
            phone: user.phone,
            password: user.password,
            role: 1,
          }),
        });
        await setUserVerified(user.email);
      } else if (roleKey === "provider") {
        await fetch(`${API_BASE_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            full_name: user.full_name,
            email: user.email,
            phone: user.phone,
            password: user.password,
            role: 2,
            business_name: "QA Cleaners & Services",
            category_id: 1,
            service_type_ids: [4],
            service_location_address: "123 Main St",
            city: "Dallas",
            state: "TX",
            country: "USA",
            zip_code: "75001",
            license_number: "LIC-123456",
            insurance_policy: "INS-987654",
          }),
        });
        await setUserVerified(user.email);
        const [u]: any = await conn.query("SELECT id FROM users WHERE email = ?", [user.email]);
        if (u && u[0]) {
          await conn.query(
            "UPDATE providers SET verified = 'verified', status = 'active' WHERE user_id = ?",
            [u[0].id]
          );
          const [pRow]: any = await conn.query("SELECT id FROM providers WHERE user_id = ? LIMIT 1", [u[0].id]);
          const pId = pRow?.[0]?.id;
          if (pId) {
            await conn.query(
              "INSERT INTO provider_subscriptions (provider_id, plan_id, start_date, end_date, price_paid, status, auto_renew, created_at, updated_at) VALUES (?, 1, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), 59.00, 'active', 1, NOW(), NOW()) ON DUPLICATE KEY UPDATE status = 'active', end_date = DATE_ADD(NOW(), INTERVAL 1 YEAR)",
              [pId]
            );
          }
        }
      }
    } else {
      // Ensure user is verified and active and has matching password
      const hashed = await bcrypt.hash(user.password, 10);
      await conn.query(
        "UPDATE users SET email_verified = 1, status = 'active', password = ? WHERE email = ?",
        [hashed, user.email]
      );
      if (roleKey === "provider") {
        await conn.query(
          "UPDATE providers SET verified = 'verified', status = 'active' WHERE user_id = ?",
          [existing[0].id]
        );
        const [pRow]: any = await conn.query("SELECT id FROM providers WHERE user_id = ? LIMIT 1", [existing[0].id]);
        const pId = pRow?.[0]?.id;
        if (pId) {
          const [sub]: any = await conn.query("SELECT id FROM provider_subscriptions WHERE provider_id = ? LIMIT 1", [pId]);
          if (sub && sub.length > 0) {
            await conn.query(
              "UPDATE provider_subscriptions SET status = 'active', end_date = DATE_ADD(NOW(), INTERVAL 1 YEAR) WHERE provider_id = ?",
              [pId]
            );
          } else {
            await conn.query(
              "INSERT INTO provider_subscriptions (provider_id, plan_id, start_date, end_date, price_paid, status, auto_renew, created_at, updated_at) VALUES (?, 1, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), 59.00, 'active', 1, NOW(), NOW())",
              [pId]
            );
          }
        }
      }
    }
  } finally {
    await conn.end();
  }

  // Now login via API to get tokens
  const loginRes = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: user.email,
      password: user.password,
    }),
  });

  const data: any = await loginRes.json();
  if (!loginRes.ok || !data.token) {
    throw new Error(`Failed to login as ${roleKey}: ${JSON.stringify(data)}`);
  }

  const token = data.accessToken || data.token;
  const refreshToken = data.refreshToken || token;
  const userId = String(data.user?.id || "");
  const roleName = data.user?.role?.name || roleKey;
  const roleId = String(data.user?.role_id || user.role_id);

  const storageState = {
    cookies: [],
    origins: [
      {
        origin: APP_BASE_URL,
        localStorage: [
          { name: "token", value: token },
          { name: "refreshToken", value: refreshToken },
          { name: "id", value: userId },
          { name: "userRole", value: roleName },
          { name: "userRoleId", value: roleId },
        ],
      },
    ],
  };

  fs.writeFileSync(filePath, JSON.stringify(storageState, null, 2), "utf8");
}

export default async function globalSetup() {
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }

  // 1. Health check & database safety check on backend
  try {
    const res = await fetch("http://localhost:5000/health");
    const json: any = await res.json();
    if (json.database !== "up") {
      throw new Error(`Backend reports database down: ${JSON.stringify(json)}`);
    }
    if (json.database_name && json.database_name !== "hollis_blue_collor_test") {
      throw new Error(
        `FATAL SAFETY ABORT: Backend is connected to database "${json.database_name}", NOT "hollis_blue_collor_test". Tests must run against the test database only!`
      );
    }
  } catch (err: any) {
    throw new Error(`Safety check failed on http://localhost:5000/health: ${err.message}`);
  }

  // 2. Direct database connection safety check
  const conn = await getDbConnection();
  try {
    const [dbRow]: any = await conn.query("SELECT DATABASE() as db");
    const activeDb = dbRow?.[0]?.db;
    if (activeDb && activeDb !== "hollis_blue_collor_test") {
      throw new Error(
        `FATAL SAFETY ABORT: MySQL connection is using database "${activeDb}", NOT "hollis_blue_collor_test". Tests must run against the test database only!`
      );
    }
  } finally {
    await conn.end();
  }

  // Setup all 4 roles
  await setupUser("admin");
  await setupUser("customer");
  await setupUser("provider");
  await setupUser("support");
}
