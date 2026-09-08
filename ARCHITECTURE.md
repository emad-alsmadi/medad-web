# Architecture

Role-based, feature-colocated frontend wired to the real Medad API
(`API_INTEGRATION.md`). i18n and automated tests are intentionally **not**
wired up yet — this document covers the structure that is in place.

## Folder layout (`src/`)

| Folder | Purpose |
|---|---|
| `components/` | UI grouped by **role first** for role-exclusive features (`admin/users`, `admin/skeletons`), or flat by feature when a resource is shared by both roles (`report-types/`, `reports/`). `components/ui` holds generic, business-logic-free primitives (button, dialog, dropdown, tooltip, card, skeleton, table, input, label, textarea, select, pagination, form-field) built on Radix + cva + tailwind-merge. `components/shared` / `common` hold cross-role, non-generic building blocks. |
| `pages/` | Route-level components, mirroring the same structure as `components/`. A page wires a hook to UI components — it never fetches data itself. |
| `hooks/` | Mirrors the same structure. Wraps `lib/` functions with `useQuery`/`useMutation`. This is the **only** layer allowed to call react-query. |
| `lib/` | Pure functions: API calls (`lib/<feature>/api.ts`), the shared fetch client (`lib/api/client.ts`, including refresh-on-401), auth/session/cookies, env validation, query keys/client, notifications, generic utils. No React, no react-query here. |
| `layouts/` | `authenticated-layout.tsx` is the shared shell for any logged-in user (Reports, Report Types); `admin-layout.tsx` composes it and adds admin-only nav (Users). `public-layout.tsx` exists but is currently unused (no public routes in scope). |
| `routes/` | `route-config.tsx` is the single source of truth for the route tree; `lazy-pages.ts` is the only place `React.lazy()` is called. |
| `providers/` | One provider per concern (`query-provider`, `auth-provider`, `theme-provider`), composed together in `app-providers.tsx` (also mounts the `sonner` `<Toaster/>`), which is the only provider `main.tsx` touches. |
| `contexts/` | Context object + `useXContext` hook pairs (e.g. `auth-context.tsx`). |
| `store/` | Zustand stores for **client-only** UI state (e.g. sidebar open/closed). Server data always lives in react-query, never here. |
| `types/` | Shared TypeScript types, organized by domain (`types/user.ts`, `types/report-type.ts`, `types/report.ts`, `types/auth.ts`, `types/api.ts`). Kept flat rather than role-nested since these resources (`/users`, `/report-types`, `/reports`) aren't admin-exclusive and are reused across each other (e.g. `ReportResponse.creator: UserResponse`). |
| `constant/` | App-wide constants (e.g. `constant/routes.ts`). |
| `motion/` | Shared framer-motion variants. |
| `styles/` | Tailwind layers + CSS custom properties (design tokens) in `globals.css`. |

## The end-to-end pattern (copy this for every new feature)

Reference implementation: report types.

```
lib/report-types/api.ts                     pure fetch functions (list, tree, create, update, remove)
        ↓
hooks/report-types/use-report-types.ts      useQuery wrappers, uses queryKeys
hooks/report-types/use-report-type-mutations.ts   useMutation wrappers, invalidate + toast
        ↓
pages/report-types/report-types-list-page.tsx     page: calls hooks, renders states
        ↓
components/report-types/*                   presentational + dialogs, props/hooks only
components/ui/*                             generic primitives
        ↓
routes/lazy-pages.ts             lazy() registration
routes/route-config.tsx          route entry + RoleGuard
```

To add a new feature: create the same files under the right feature
folder, add a query key under `lib/query/query-keys.ts`, register the
page in `lazy-pages.ts`, and add its route in `route-config.tsx`.

## Rules

1. **No role logic in shared code.** Shared/common/ui components take
   data via props only. Pages that are visible to both roles but have
   role-restricted actions (e.g. report-types list) check
   `useAuthContext().user.role` in-page to conditionally render the
   action, not to gate the whole route.
2. **Components/pages never call `lib/` or `fetch` directly** — always
   go through a hook.
3. **All routes are lazy-loaded** via `routes/lazy-pages.ts`.
4. **`components/ui` has zero business logic** — only generic,
   Radix-based (or plain native-element) primitives.
5. **Reports pagination uses the real Spring `Page<T>`** (`types/api.ts`)
   — `content`, `totalElements`, `totalPages`, `number` (0-based),
   `size`, `first`, `last`. Users (`GET /users`) and report types
   (`GET /report-types`) are plain arrays, not paginated — don't force
   `Page<T>` onto them.
6. **Auth/session/cookies only through `lib/auth`, `lib/session`,
   `lib/cookies`** — never read `document.cookie` or persist tokens
   elsewhere. There is no `/auth/me`; the user profile is only ever
   returned by `/auth/login`, so it (along with the access + refresh
   token) is persisted in a cookie by `lib/session/session.ts`.
   `lib/api/client.ts`'s `request()` transparently refreshes once on a
   401 and retries the original call; a second failure clears the
   session.
7. **Env vars are validated** in `lib/env/env.ts` via zod — the app
   throws at boot on misconfiguration instead of failing silently later.
8. **Route guards, not in-page checks**, gate whether a role can reach a
   route at all (`components/auth/role-guard.tsx`); in-page role checks
   are only for conditionally rendering actions within a shared-route
   page (see rule 1).
9. **Strict TypeScript, no `any`** in domain code; path aliases (`@/...`)
   for all internal imports.
10. **Toasts go through `lib/notifications/toast.ts`** (`notify.success/
    error/info`), not `sonner` directly — keeps one swap-out point.

## Not yet wired up (by request)

- i18n (react-i18next / RTL+LTR switching) — structure left for a future
  pass.
- Automated tests (Vitest, Testing Library, MSW, Playwright) — no test
  tooling or config included in this pass.
- Self-registration UI — `POST /auth/register` is implemented at the
  `lib/auth/api.ts` level only; no page/route consumes it (see
  `API_INTEGRATION.md` and the permission matrix, which never lists
  self-registration as a capability of either role).

## Roles

Only two roles exist: `ADMIN` and `USER` (`types/auth.ts`). Both roles
can read and create/edit reports, report types, and users; only `ADMIN`
can delete a report, manage report types (create/edit/delete), edit
another user's report info, or delete a user. See `API_INTEGRATION.md`
§4 for the full permission matrix — the UI mirrors it (hides/disables
actions a role can't perform) but the backend remains the actual
enforcement.
