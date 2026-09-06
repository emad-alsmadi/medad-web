# Architecture

Scaffold for a role-based, feature-colocated government frontend. i18n
and the automated test setup are intentionally **not** wired up yet —
this document covers the structure that is in place.

## Folder layout (`src/`)

| Folder | Purpose |
|---|---|
| `components/` | UI grouped by **role first** (`admin`, `staff`, `secretary`, `public`, `auth`, `layout`), then by feature (`admin/users`, `admin/dashboard`, `admin/skeletons`). `components/ui` holds generic, business-logic-free primitives (button, dialog, dropdown, tooltip, card, skeleton) built on Radix + cva + tailwind-merge. `components/shared` / `common` hold cross-role, non-generic building blocks. |
| `pages/` | Route-level components, mirroring the same role/feature structure as `components/`. A page wires a hook to UI components — it never fetches data itself. |
| `hooks/` | Mirrors role/feature structure. Wraps `lib/` functions with `useQuery`/`useMutation`. This is the **only** layer allowed to call react-query. |
| `lib/` | Pure functions: API calls (`lib/<role>/<feature>/api.ts`), the shared fetch client (`lib/api/client.ts`), auth/session/cookies, env validation, query keys/client, generic utils. No React, no react-query here. |
| `layouts/` | One shell per role (`admin-layout.tsx`, `public-layout.tsx`), each rendering an `<Outlet />`. |
| `routes/` | `route-config.tsx` is the single source of truth for the route tree; `lazy-pages.ts` is the only place `React.lazy()` is called. |
| `providers/` | One provider per concern (`query-provider`, `auth-provider`, `theme-provider`), composed together in `app-providers.tsx`, which is the only provider `main.tsx` touches. |
| `contexts/` | Context object + `useXContext` hook pairs (e.g. `auth-context.tsx`). |
| `store/` | Zustand stores for **client-only** UI state (e.g. sidebar open/closed). Server data always lives in react-query, never here. |
| `types/` | Shared TypeScript types, organized by domain (`types/admin/user.ts`, `types/auth.ts`, `types/api.ts`). |
| `constant/` | App-wide constants (e.g. `constant/routes.ts`). |
| `motion/` | Shared framer-motion variants. |
| `styles/` | Tailwind layers + CSS custom properties (design tokens) in `globals.css`. |

## The end-to-end pattern (copy this for every new feature)

Reference implementation: admin → users list.

```
lib/admin/users/api.ts          pure fetch function (fetchAdminUsers)
        ↓
hooks/admin/users/use-admin-users.ts   useQuery wrapper, uses queryKeys
        ↓
pages/admin/users/users-list-page.tsx  page: calls the hook, renders states
        ↓
components/admin/users/users-table.tsx        presentational, props-only
components/admin/skeletons/users-table-skeleton.tsx   loading state
components/ui/*                                generic primitives
        ↓
routes/lazy-pages.ts             lazy() registration
routes/route-config.tsx          route entry + RoleGuard
```

To add a new feature: create the same five files under the right
role/feature folders, add a query key under `lib/query/query-keys.ts`,
register the page in `lazy-pages.ts`, and add its route in
`route-config.tsx`.

## Rules

1. **No role logic in shared code.** Shared/common/ui components take
   data via props only.
2. **Components/pages never call `lib/` or `fetch` directly** — always
   go through a hook.
3. **All routes are lazy-loaded** via `routes/lazy-pages.ts`.
4. **`components/ui` has zero business logic** — only generic,
   Radix-based primitives.
5. **Every list endpoint returns `PaginatedResponse<T>`** (`types/api.ts`)
   so pagination UI stays uniform.
6. **Auth/session/cookies only through `lib/auth`, `lib/session`,
   `lib/cookies`** — never read `document.cookie` or persist tokens
   elsewhere. No user PII is persisted client-side; the authenticated
   user profile is re-fetched from `/auth/me` on load, not cached in
   storage.
7. **Env vars are validated** in `lib/env/env.ts` via zod — the app
   throws at boot on misconfiguration instead of failing silently later.
8. **Route guards, not in-page checks**, gate roles (`components/auth/role-guard.tsx`).
9. **Strict TypeScript, no `any`** in domain code; path aliases (`@/...`)
   for all internal imports.

## Not yet wired up (by request)

- i18n (react-i18next / RTL+LTR switching) — structure left for a future
  pass.
- Automated tests (Vitest, Testing Library, MSW, Playwright) — no test
  tooling or config included in this pass.

## Pending decisions

Confirm before adding real pages/roles:
- The actual government entity/domain.
- Final list of roles (currently placeholder: `admin`, `staff`,
  `secretary`, `public` in `types/auth.ts`).
- Core MVP modules/features per role.
