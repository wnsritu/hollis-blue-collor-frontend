import { test, expect } from "../fixtures";
import { createTestEmail, createTestPhone, QA_USERS } from "../fixtures/test-data";
import { getOtp, setUserVerified } from "../fixtures/db.helper";

test.describe("API: Auth & Users Endpoints", () => {
  const newEmail = createTestEmail("authtest");
  const newPhone = createTestPhone();
  let createdUserRefreshToken = "";

  test("Register customer: happy path", async ({ guestApi }) => {
    const res = await guestApi.post("/auth/register", {
      data: {
        full_name: "Auth Test User",
        email: newEmail,
        phone: newPhone,
        password: "Password@123",
        role: 1,
      },
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.user?.id).toBeDefined();
    expect(body.user?.role_id).toBe(1);
    expect(body.user?.email_verified).toBe(false);
    // Response safety check: password hash or OTP should not be returned
    expect(body.user?.password).toBeUndefined();
    expect(body.user?.password_hash).toBeUndefined();
    expect(body.otp).toBeUndefined();
  });

  test("Register customer: duplicate email rejected (409)", async ({ guestApi }) => {
    const res = await guestApi.post("/auth/register", {
      data: {
        full_name: "Duplicate User",
        email: newEmail,
        phone: createTestPhone(),
        password: "Password@123",
        role: 1,
      },
    });

    expect(res.status()).toBe(409);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.message).toBeDefined();
  });

  test("Register: validation error on missing required fields (422)", async ({ guestApi }) => {
    const res = await guestApi.post("/auth/register", {
      data: {
        email: "invalid-email-format",
      },
    });

    expect(res.status()).toBe(422);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.message).toBeDefined();
  });

  test("Login: invalid password rejected (401)", async ({ guestApi }) => {
    const res = await guestApi.post("/auth/login", {
      data: {
        email: QA_USERS.customer.email,
        password: "WrongPassword!999",
      },
    });

    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test("Login: valid credentials returns token pair & user info", async ({ guestApi }) => {
    const res = await guestApi.post("/auth/login", {
      data: {
        email: QA_USERS.customer.email,
        password: QA_USERS.customer.password,
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.token).toBeDefined();
    expect(body.refreshToken).toBeDefined();
    expect(body.user?.email).toBe(QA_USERS.customer.email);
    expect(body.user?.password).toBeUndefined();
    createdUserRefreshToken = body.refreshToken;
  });

  test("Refresh Token: returns new access token", async ({ guestApi }) => {
    const refreshRes = await guestApi.post("/auth/refresh-token", {
      data: { refreshToken: createdUserRefreshToken },
    });

    expect(refreshRes.status()).toBe(200);
    const refreshData = await refreshRes.json();
    expect(refreshData.success).toBe(true);
    expect(refreshData.accessToken || refreshData.token || refreshData.data?.accessToken).toBeDefined();
  });

  test("Refresh Token: invalid refresh token rejected (401)", async ({ guestApi }) => {
    const res = await guestApi.post("/auth/refresh-token", {
      data: { refreshToken: "invalid-token-string" },
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test("GET /auth/me: authenticated returns user profile", async ({ customerApi }) => {
    const res = await customerApi.get("/auth/me");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.user?.email).toBe(QA_USERS.customer.email);
  });

  test("GET /auth/me: unauthenticated returns 401", async ({ guestApi }) => {
    const res = await guestApi.get("/auth/me");
    expect(res.status()).toBe(401);
  });

  test.fixme(
    "Forgot password -> OTP -> Reset password lifecycle",
    // BUG: POST /auth/forgot-password returns HTTP 500 when the Gmail SMTP daily quota is
    // exhausted. The server should return 503 (or 200 with a queued-email note) and NOT roll
    // back the OTP record. Until fixed this test cannot run reliably in any environment that
    // shares a Gmail sender account. Tracked in TEST_REPORT.md § App Bugs.
    async ({ guestApi }) => {
      // Use throwaway user created in this test, never the shared QA customer
      const throwawayEmail = createTestEmail("forgotpw");
      const throwawayPhone = createTestPhone();
      const initialPassword = "Password@123";
      const newPassword = "NewPassword@456";

      const regRes = await guestApi.post("/auth/register", {
        data: {
          full_name: "Forgot PW Throwaway",
          email: throwawayEmail,
          phone: throwawayPhone,
          password: initialPassword,
          role: 1,
        },
      });
      expect(regRes.status()).toBe(201);
      await setUserVerified(throwawayEmail);

      // 1. Request forgot password (must return 200 — NOT 500)
      const forgotRes = await guestApi.post("/auth/forgot-password", {
        data: { email: throwawayEmail, role_id: 1 },
      });
      expect(forgotRes.status()).toBe(200);
      const forgotBody = await forgotRes.json();
      expect(forgotBody.success).toBe(true);

      // 2. Fetch OTP from DB (written before email dispatch)
      const otp = await getOtp(throwawayEmail);
      expect(otp).toBeTruthy();

      // 3. Reset password using the OTP
      const resetRes = await guestApi.post("/auth/reset-password", {
        data: {
          email: throwawayEmail,
          role_id: 1,
          otp: otp,
          new_password: newPassword,
        },
      });
      expect(resetRes.status()).toBe(200);
      const resetBody = await resetRes.json();
      expect(resetBody.success).toBe(true);

      // 4. Confirm the new password works by logging in
      const loginRes = await guestApi.post("/auth/login", {
        data: {
          email: throwawayEmail,
          password: newPassword,
        },
      });
      expect(loginRes.status()).toBe(200);
      const loginBody = await loginRes.json();
      expect(loginBody.success).toBe(true);
      expect(loginBody.token).toBeDefined();
    }
  );

  test("Logout: revokes token and blacklists it", async ({ guestApi }) => {
    // Register and login a disposable test user to verify logout without invalidating global QA customer
    const logoutEmail = createTestEmail("logout");
    const logoutPhone = createTestPhone();
    const password = "Password@123";

    const regRes = await guestApi.post("/auth/register", {
      data: {
        full_name: "Logout User",
        email: logoutEmail,
        phone: logoutPhone,
        password,
        role: 1,
      },
    });
    expect(regRes.status()).toBe(201);
    await setUserVerified(logoutEmail);

    const loginRes = await guestApi.post("/auth/login", {
      data: { email: logoutEmail, password },
    });
    expect(loginRes.status()).toBe(200);
    const loginData = await loginRes.json();
    const token = loginData.token || loginData.accessToken;
    expect(token).toBeDefined();

    const logoutRes = await guestApi.post("/auth/logout", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(logoutRes.status()).toBe(200);
    const logoutBody = await logoutRes.json();
    expect(logoutBody.success).toBe(true);

    // Confirm token is now blacklisted and rejected
    const meRes = await guestApi.get("/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(meRes.status()).toBe(401);
  });
});
