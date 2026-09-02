# Frontend API Layer

Clean, scalable API surface aligned with backend Postman (**M1–M3**).

## Import (preferred)

```ts
import { api, queryKeys, http, ApiError } from "@/api";
import { ENDPOINTS, ROLES } from "@/constants";
import type { Project, CreateProjectPayload } from "@/types/api";
```

## Layout

```text
src/
  api/
    modules/          ← feature API modules (source of truth)
      auth.api.ts
      catalog.api.ts
      provider.api.ts
      project.api.ts
      matching.api.ts
      proposal.api.ts
      appointment.api.ts
      chat.api.ts
      …
    index.ts          ← re-exports modules + lib client
  constants/
    endpoints.ts      ← all paths under /api/v1
  types/api/          ← request/response TypeScript types
  lib/api/
    http.ts           ← typed get/post/put/patch/delete
    client.ts         ← axios instance
    interceptors.ts   ← auth / refresh
    queryKeys.ts      ← React Query keys
```

## Usage examples

```ts
// Catalog browse (public)
const catalog = await api.catalog.getTree();

// Provider search
const results = await api.provider.search({
  category_id: 1,
  city: "Austin",
  sort: "rating",
});

// Create open project (triggers matching on BE)
const project = await api.project.create({
  category_id: 1,
  service_type_id: 2,
  title: "Fix sink",
  description: "…",
  address_line: "123 Main",
  status: "open",
});

// Provider leads
const leads = await api.matching.listMyLeads();
// or api.provider.listMyLeads()

// Proposal accept → appointment
await api.proposal.accept(proposalId);

// Appointments
await api.appointment.updateStatus(bookingId, {
  appointment_status: "Confirmed",
});

// Project chat
const chat = await api.chat.createChat({ project_id: projectId });
await api.chat.sendMessage({ chat_id: chat.data.id, message: "Hi" });
```

## Module map (Postman ↔ FE)

| Domain | Module | Notes |
|--------|--------|-------|
| Auth | `api.auth` | M1 |
| Catalog | `api.catalog` | M3 preferred over `api.service.getCategories` |
| Provider search / leads | `api.provider` + `api.matching` | M3 |
| Projects | `api.project` | includes match helpers |
| Proposals | `api.proposal` | M3 |
| Appointments | `api.appointment` | M3 |
| Chat | `api.chat` | report/block included |
| Payments | `api.payment` / `api.payout` | M2/M4 |
| Legacy booking | `api.booking` | laundry-era |

## Rules for UI work

1. **Never hardcode URLs** in pages — use `ENDPOINTS` / `api.*`.
2. Prefer `api.catalog.*` for marketplace browse (not legacy services categories).
3. Prefer `api.appointment.*` for M3 status flow (not raw booking status enums).
4. Use `queryKeys.*` with React Query for cache invalidation.
5. Legacy files under `src/api/*.api.ts` (outside `modules/`) are old — do not extend them; use `modules/`.

## Env

`VITE_BASE_URL=http://localhost:5000/api/v1`
