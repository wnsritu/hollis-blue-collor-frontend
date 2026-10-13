export const QA_USERS = {
  customer: {
    email: "qa+customer@mailinator.com",
    password: "Test@123",
    full_name: "QA Customer",
    phone: "9876543210",
    role_id: 1,
  },
  provider: {
    email: "qa+provider@mailinator.com",
    password: "Test@123",
    full_name: "QA Provider",
    phone: "9876543211",
    role_id: 2,
  },
  admin: {
    email: "backend@mailinator.com",
    password: "Test@123",
    full_name: "Super Admin",
    phone: "9999988888",
    role_id: 3,
  },
  support: {
    email: "qa+support@mailinator.com",
    password: "Test@123",
    full_name: "QA Support",
    phone: "9876543212",
    role_id: 4,
  },
};

export const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:5000/api/v1";
export const APP_BASE_URL = process.env.APP_BASE_URL || "http://localhost:8081";

export function createTestEmail(prefix: string = "qa"): string {
  return `${prefix}+${Date.now()}_${Math.floor(Math.random() * 10000)}@mailinator.com`;
}

export function createTestPhone(): string {
  return `9${Math.floor(100000000 + Math.random() * 900000000)}`;
}
