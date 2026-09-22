// Agent interface — used as a TypeScript type by SupportAgentsPage.
// NOTE: Real data is loaded from the API. There is no mock data here.
export interface Agent {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  createdAt: string;
  status: "Active" | "Inactive";
}
