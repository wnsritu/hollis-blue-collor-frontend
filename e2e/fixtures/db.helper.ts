import mysql from "../../../hollis-blue-collor-backend/node_modules/mysql2/promise.js";

const DB_CONFIG = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS ?? process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME || "hollis_blue_collor_test",
};

export async function getDbConnection() {
  return await mysql.createConnection(DB_CONFIG);
}

export async function getOtp(email: string): Promise<string | null> {
  const connection = await getDbConnection();
  try {
    const [users]: any = await connection.query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email]
    );
    if (!users || users.length === 0) return null;
    const userId = users[0].id;

    const [otps]: any = await connection.query(
      "SELECT otp FROM user_otps WHERE user_id = ? ORDER BY id DESC LIMIT 1",
      [userId]
    );
    if (!otps || otps.length === 0) return null;
    return String(otps[0].otp);
  } finally {
    await connection.end();
  }
}

export async function setUserVerified(email: string): Promise<void> {
  const connection = await getDbConnection();
  try {
    await connection.query(
      "UPDATE users SET email_verified = 1, status = 'active' WHERE email = ?",
      [email]
    );
  } finally {
    await connection.end();
  }
}

export async function getProviderIdForUser(userId: number): Promise<number | null> {
  const connection = await getDbConnection();
  try {
    const [providers]: any = await connection.query(
      "SELECT id FROM providers WHERE user_id = ? LIMIT 1",
      [userId]
    );
    if (!providers || providers.length === 0) return null;
    return providers[0].id;
  } finally {
    await connection.end();
  }
}

export async function cleanupTestData(): Promise<void> {
  const connection = await getDbConnection();
  try {
    // Only delete test users that start with 'qa+'
    await connection.query(
      "DELETE FROM users WHERE email LIKE 'qa+%' AND email NOT IN ('qa+customer@mailinator.com', 'qa+provider@mailinator.com', 'qa+support@mailinator.com')"
    );
  } catch (err) {
    console.warn("Cleanup warning:", err);
  } finally {
    await connection.end();
  }
}
