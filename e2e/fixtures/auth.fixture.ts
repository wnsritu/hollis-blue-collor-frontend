import { test as base, Page, APIRequestContext, request } from "@playwright/test";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { API_BASE_URL } from "./test-data";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

type RoleName = "customer" | "provider" | "admin" | "support";

function getTokenFromStorage(role: RoleName): string {
  const filePath = path.resolve(__dirname, `../.auth/${role}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Storage state for ${role} not found. Run global-setup first.`);
  }
  const content = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const localStorageItems = content.origins?.[0]?.localStorage || [];
  const tokenItem = localStorageItems.find((item: any) => item.name === "token");
  return tokenItem ? tokenItem.value : "";
}

type AuthFixtures = {
  customerPage: Page;
  providerPage: Page;
  adminPage: Page;
  supportPage: Page;
  customerApi: APIRequestContext;
  providerApi: APIRequestContext;
  adminApi: APIRequestContext;
  supportApi: APIRequestContext;
  guestApi: APIRequestContext;
};

function wrapContext(ctx: APIRequestContext): APIRequestContext {
  const normalize = (url: string) => {
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (url === "/health" || url === "/") return url;
    if (url.startsWith("/api/v1/")) return url;
    if (url.startsWith("api/v1/")) return "/" + url;
    const clean = url.startsWith("/") ? url.slice(1) : url;
    return `/api/v1/${clean}`;
  };

  return new Proxy(ctx, {
    get(target, prop, receiver) {
      if (
        typeof (target as any)[prop] === "function" &&
        ["get", "post", "put", "patch", "delete", "head"].includes(String(prop))
      ) {
        return (url: string, options?: any) => {
          return (target as any)[prop](normalize(url), options);
        };
      }
      return Reflect.get(target, prop, receiver);
    },
  });
}

const SERVER_HOST = "http://localhost:5000";

export const test = base.extend<AuthFixtures>({
  customerPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: path.resolve(__dirname, "../.auth/customer.json"),
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  providerPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: path.resolve(__dirname, "../.auth/provider.json"),
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: path.resolve(__dirname, "../.auth/admin.json"),
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  supportPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: path.resolve(__dirname, "../.auth/support.json"),
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  customerApi: async ({}, use) => {
    const token = getTokenFromStorage("customer");
    const ctx = await request.newContext({
      baseURL: SERVER_HOST,
      extraHTTPHeaders: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    await use(wrapContext(ctx));
    await ctx.dispose();
  },

  providerApi: async ({}, use) => {
    const token = getTokenFromStorage("provider");
    const ctx = await request.newContext({
      baseURL: SERVER_HOST,
      extraHTTPHeaders: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    await use(wrapContext(ctx));
    await ctx.dispose();
  },

  adminApi: async ({}, use) => {
    const token = getTokenFromStorage("admin");
    const ctx = await request.newContext({
      baseURL: SERVER_HOST,
      extraHTTPHeaders: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    await use(wrapContext(ctx));
    await ctx.dispose();
  },

  supportApi: async ({}, use) => {
    const token = getTokenFromStorage("support");
    const ctx = await request.newContext({
      baseURL: SERVER_HOST,
      extraHTTPHeaders: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    await use(wrapContext(ctx));
    await ctx.dispose();
  },

  guestApi: async ({}, use) => {
    const ctx = await request.newContext({
      baseURL: SERVER_HOST,
      extraHTTPHeaders: {
        Accept: "application/json",
      },
    });
    await use(wrapContext(ctx));
    await ctx.dispose();
  },
});

export { expect } from "@playwright/test";
