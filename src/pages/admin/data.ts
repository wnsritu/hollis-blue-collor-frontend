// data.ts
export interface Agent {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  createdAt: string;
  status: "Active" | "Inactive";
}

export const mockAgents: Agent[] = [
  {
    id: 1,
    firstName: "Jim",
    lastName: "Carbate",
    email: "jim@test.com",
    phone: "+1 111 111 1111",
    createdAt: "2026-03-27",
    status: "Active",
  },
  {
    id: 2,
    firstName: "Karen",
    lastName: "Gibbs",
    email: "karen@test.com",
    phone: "+1 222 222 2222",
    createdAt: "2026-03-26",
    status: "Inactive",
  },
  {
    id: 3,
    firstName: "Peter",
    lastName: "Parker",
    email: "peter@test.com",
    phone: "+1 333 333 3333",
    createdAt: "2026-03-22",
    status: "Active",
  },
];
