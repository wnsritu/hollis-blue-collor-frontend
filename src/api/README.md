# Frontend API Architecture

Production-ready API foundation for the Hollis Service Marketplace.
**No pages/UI here** — static pages from the FE team should call into this layer.

## Folder map

```
src/
  config/env.ts              → env-based config (apiBaseUrl, assets, keys)
  constants/
    endpoints.ts             → all backend paths (DRY, single source)
    roles.ts                 → role IDs synced with backend
    storageKeys.ts           → localStorage keys
  types/api/                 → TypeScript contracts (auth, project, proposal, …)
  lib/api/
    client.ts                → axios instance
    interceptors.ts          → Bearer token + refresh-token retry
    http.ts                  → get/post/put/patch/delete helpers (returns data)
    errors.ts                → ApiError + normalize
    queryKeys.ts             → React Query key factory
  api/modules/               → feature API modules (preferred)
  api/index.ts               → public barrel
  api/*.api.ts               → legacy wrappers (existing pages still import these)
  store/authStore.ts         → session state (no UI)
  hooks/useAuth.ts           → useAuthSession + bootstrapApi
  hooks/api/useRequestState.ts
  utils/tokenStorage.ts
  utils/mediaUrl.ts
```

## How to call APIs (new code)

```ts
import { api, projectApi, ApiError, getErrorMessage } from "@/api";
import { ENDPOINTS, ROLES } from "@/constants";
import { useRequestState } from "@/hooks/api";
import { useAuthSession } from "@/hooks/useAuth";

// Option A — namespaced
await api.project.create({ ... });

// Option B — direct module
await projectApi.listMine();

// Option C — with loading state helper
const { run, isLoading, error, data } = useRequestState();
await run(() => api.proposal.accept(id));
```

## Auth

```ts
import { bootstrapApi, useAuthSession } from "@/hooks/useAuth";

// Already called in main.tsx
bootstrapApi({ onUnauthorized: () => { /* redirect */ } });

const { login, logout, fetchMe, isProvider, isAuthenticated } = useAuthSession();
```

Tokens: `localStorage` via `tokenStorage` (`token`, `refreshToken`, role meta).
401 → refresh via `POST /auth/refresh-token` → retry; else clear session.

## Env

See `.env.example`.

- `VITE_BASE_URL` → `http://localhost:5000/api/v1` (versioned)
- `VITE_API_BASE_URL` → media host

`config/env.ts` auto-appends `/v1` if you only set `…/api`.

## Adding a new feature API

1. Add paths in `constants/endpoints.ts`
2. Add types in `types/api/`
3. Create `api/modules/<feature>.api.ts` using `http` + `ENDPOINTS`
4. Export from `api/modules/index.ts` and `api` object
5. Add `queryKeys` entry if using React Query

Do **not** put raw `axios` / URLs inside pages.

## Legacy note

Existing pages may still import `@/api/axios` or `@/api/auth.api`.
Those keep working. Prefer migrating call sites to `@/api` modules over time.
