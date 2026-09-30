# Medad Web — Full Frontend Audit

- **Date:** 2026-09-29
- **Branch / commit:** `develop` @ `d561460`. The working tree was clean, so this audit covers exactly that commit.
- **Scope:**
  - 170 files in `src/` (13,070 TS/TSX lines, plus 5,817 lines of `globals.css`)
  - configs, `api/`, `docs/`, `scripts/`
  - the tracked `vosk-model/*.py` scripts
- **Method:** static review of every file in scope, measured against `ARCHITECTURE.md` and `CLAUDE.md ` (note the trailing space in that filename).
- **Tooling runs:**
  - `tsc`, `eslint`, `prettier`, the Vite build and `npm audit`
  - knip and madge
  - rollup-plugin-visualizer and source-map-explorer
  - Lighthouse 13.5 in headless Chrome
  - contrast and CSS-usage scripts, and woff2 conversion
- **Where the tooling ran:** everything was installed and run in a scratch directory outside the repo. No repo file other than this report was created or changed, and nothing was committed.
- **Not done:** no requests were sent to any backend. No test URL or accounts were provided, so Phase 9 (functional walkthrough) and the live API diff were not run (see §8).

Each finding is marked **CONFIRMED** (reproduced, measured, or provable from the code) or **SUSPECTED** (needs a runtime check). Findings already tracked in `docs/plans/qa-remediation-plan.md` (QA-xxx / BE-x) are only cross-referenced, not reported again.

---

## 1. Executive summary

### 1.1 Scores

| Area | Score /10 | One-line verdict |
|---|---|---|
| Architecture and conventions | **7** | All 10 layering rules hold in substance. Docs have drifted badly, and no tooling enforces the rules. |
| API integration and client | **5** | Every call matches `API_INTEGRATION.md`. But the OpenAPI file is stale, the refresh path is effectively dead, and a failed retry logs the user out. |
| Security | **5** | No XSS sinks and route guards are correct. Tokens and PII sit in JS-readable cookies, the Vosk ASR server is open, and no CSP or header plan exists. |
| Components and UI correctness | **5** | Loading, empty and pagination states are mostly solid. Three paths silently corrupt or overwrite report and template data. |
| Data layer and state | **7** | Query keys come from one factory, 403 re-syncs work, and Zustand holds no server data. A few cross-feature invalidations are missing, and the dashboard over-fetches. |
| Performance | **6** | Login scores Lighthouse 89 on mobile and 100 on desktop. framer-motion, OTF fonts, 78% dead CSS and a 412 KB recharts landing chunk are easy wins. |
| Accessibility and RTL | **5** | RTL is correct (`DirectionProvider`, logical classes). But Buttons show no focus indicator, the report text fields have no name, and both themes have AA contrast failures. |
| Code quality | **7** | Strict TS, no `any`, no `@ts-ignore`, no TODOs. Error handling is inconsistent, there are 50 `as` casts, and dead code and duplication remain. |
| Testing | **0** | No test tooling (expected; see §10). |

### 1.2 Top 10 risks

1. **The report text editor corrupts the official ورقة الضبط text** (UI-01, Critical). Editing any character in المقدمة, المتن or الخاتمة turns every TAB into a space. That collapses the `@role⇥role` signature rows in both the saved text and the printed PDF.
2. **The report edit page submits a blank form over the real report** (UI-02, High). If `GET /reports/:id` fails, the edit page renders an empty, editable form, and the full-replacement `PUT` wipes the report.
3. **The template editor can overwrite a template, or bring a deleted one back** (UI-03, High). This happens after a load error, or after a delete while stale data is still cached.
4. **Any failure after a token refresh logs the user out** (API-02, High). After a successful refresh, any 4xx, 5xx or network error on the retried request logs the user out and loses the form.
5. **Dictation privacy and function** (DIC-01 and DIC-02, High).
   - The microphone and socket stay live if the field unmounts while the permission prompt is open.
   - Every Stop throws away the final phrase.
6. **The Vosk ASR server is open and unauthenticated** (SEC-01, High).
   - It binds `0.0.0.0` with no auth and no Origin check.
   - Any client can load an arbitrary server path as the global model.
   - The client defaults to cleartext `ws://`.
7. **Session design** (SEC-02 and API-03, Medium).
   - Access token, 30-day refresh token and a PII snapshot are all in JS-readable cookies.
   - The refresh token is never actually used, so sessions end after 24 h, and expiry shows up as "no permission".
8. **The dashboard fetches 500 full reports to draw one chart** (PERF-01, High). Its counts are wrong once the 6-month window holds more than 500 reports.
9. **Accessibility blockers** (A11Y-01 to A11Y-04, High).
   - Keyboard focus is invisible on every `<Button>`.
   - The five main report text fields have no accessible name.
   - Muted text fails AA in light mode.
   - The dark theme fails AA on primary buttons, links, error text and the CLOSED badge.
10. **Documentation and contract drift** (ARC-01 to ARC-03, Medium).
    - `api-docs.json` describes a pre-rename API.
    - `ARCHITECTURE.md` and `CLAUDE.md ` describe files and libraries that don't exist (sonner, `report-types`, `admin-layout`, staff/secretary folders).
    - The agent rules file isn't loaded, because its filename has a trailing space.

### 1.3 Production go / no-go

**NO-GO as-is.** It becomes a **GO** once the "Fix now" items in §6 are done. They are all Small effort and frontend-only, apart from the SEC-01 deployment decision:
- UI-01, UI-02, UI-03 (data corruption and overwrite)
- API-02 (logout on retry failure)
- DIC-01, DIC-02 (dictation)
- SEC-01 and SEC-03 (Vosk exposure and `wss://`)
- A11Y-01 (focus indicator)

The backend blockers already tracked in the QA plan (no server-side logout, no login throttling, no password change: QA-005, 006, 007, 019) stay open. They need an explicit risk acceptance before a production launch of a government system.

---

## 2. Phase 0 — Baseline

Environment: Node v22.23.2, npm 10.9.8, `git status` clean, branch `develop` 9 commits ahead of `origin/develop`.

| Command | Result |
|---|---|
| `npm run typecheck` | ✅ exit 0 (both `tsconfig.app.json` and `tsconfig.node.json`) |
| `npm run lint` (`--max-warnings=0`) | ✅ exit 0 |
| `npm run format:check` | ❌ exit 1: **48 files** (33 under `src/`, 6 inside `vosk-model/myenv` because there is no `.prettierignore`, plus the docs and `api/api-docs.json`) |
| `npm run build` | ✅ (typecheck + `vite build`, 2,840 modules, 3.86 s). Built into a scratch directory so the repo's `dist/` was not touched. |
| `npm audit --omit=dev` | ✅ **0 vulnerabilities** (full `npm audit` also 0) |
| `npm outdated` | 28 packages behind. Patch/minor within range: react-query 5.102.8→5.104.0, react-hook-form 7.87→7.89, react-router-dom 7.18.3→7.18.4, typescript-eslint 8.69→8.71, prettier 3.9.6→3.9.9, autoprefixer. Majors available (not recommended now): React 19, Vite 8, Tailwind 4, zod 4, framer-motion 13, lucide 1.x, TypeScript 7, ESLint 10, `@hookform/resolvers` 5, tailwind-merge 3, react-helmet-async 3. |

**Build output** (min / gzip):

| Chunk | Size | gzip | | Chunk | Size | gzip |
|---|---|---|---|---|---|---|
| dashboard-page | 412.26 kB | 120.68 | | users-list-page | 15.67 | 5.59 |
| vendor-react | 180.45 | 59.51 | | form-types-list-page | 15.67 | 5.02 |
| vendor-motion | 119.38 | 39.81 | | date-input | 15.30 | 5.67 |
| vendor-radix | 114.06 | 37.31 | | roles-list-page | 12.27 | 4.78 |
| vendor-forms | 89.35 | 24.80 | | crime-types-list-page | 6.27 | 2.67 |
| index (entry) | 79.47 | 26.36 | | profile-page | 3.68 | 1.53 |
| discard-changes-dialog¹ | 43.40 | 14.75 | | dropdown-select | 3.08 | 1.22 |
| vendor-query | 41.71 | 12.60 | | button / login-page / report-form-page | 2.81 / 2.80 / 2.54 | 1.19 / 1.43 / 1.34 |
| reports-list-page | 29.75 | 10.05 | | 20 more chunks | < 2.4 each | < 1.2 each |
| **index.css** | **160.68** | **26.92** | | index.html | 0.88 | 0.39 |

¹ Rollup named this shared chunk after its smallest module. It is actually the whole report-form bundle (report-form, dictation, schema).

There are no sourcemaps in the production build (`build.sourcemap` is not set, so it defaults to false).

**Inventory:**

- **Routes** (`src/routes/route-config.tsx`). The `REPORTS:UPDATE` + `FORM_TYPES:VIEW` guards on the edit route are nested; `/report-types` and `/admin/crime-types` are legacy redirects.

  | Route | Guard |
  |---|---|
  | `/login` | GuestOnlyRoute |
  | `/` | HomeRedirect |
  | `/profile` | authenticated only |
  | `/admin/dashboard`, `/reports`, `/reports/:id` | `REPORTS:VIEW` |
  | `/reports/:id/edit` | `REPORTS:UPDATE` + `FORM_TYPES:VIEW` |
  | `/form-types` | `FORM_TYPES:VIEW` |
  | `/crime-types` | `CRIME_TYPES:VIEW` |
  | `/admin/users` | `USERS:VIEW` |
  | `/admin/roles` | `ROLES:VIEW` |
  | `/report-types` → `/form-types`, `/admin/crime-types` → `/crime-types` | legacy redirects |
  | `*` | NotFound |

- **Pages** (11, all lazy): login, profile, dashboard, users, roles, form-types, crime-types, reports list, report detail, report form, not-found.
- **Components:** 78 files: 26 `ui/`, 10 dashboard, 6 users, 14 reports, 5 form-types, 2 crime-types, 3 roles, 6 layout, 4 auth, 3 shared, 1 common.
- **Hooks:** 32 across auth, users, roles, reports, report-templates, form-types, crime-types and shared.
- **`lib/*/api.ts` modules (8):** auth, users, roles, reports, report-templates, form-types, crime-types, plus the client in `lib/api/client.ts`.
- **Query keys** (`lib/query/query-keys.ts`): `auth.session`; `users.{all,list,detail,me}`; `roles.{all,list,options}`; `formTypes.{all,list,tree,roots,detail,children,ancestorChain}`; `crimeTypes.{all,list}`; `reports.{all,list,detail,options,statistics}`; `reportTemplates.{all,list,detail}`. `users.detail`, `formTypes.detail` and `reportTemplates.all` are never used, and `reportTemplates.list` is invalidated but never queried.
- **Env vars** (`lib/env/env.ts`):
  - `VITE_API_BASE_URL` (url, required)
  - `VITE_APP_ENV` (enum, default `development`, **never read**)
  - `VITE_VOSK_WS_URL` (url, default `ws://localhost:2700`)
  - `import.meta.env.DEV` (read directly in `query-provider.tsx:13`)

---

## 3. Findings

Severity: **Critical** = auth bypass, data leak, data loss, or crash on a main flow · **High** = broken feature, security weakness, or major perf/a11y failure · **Medium** = edge-case bug, maintainability risk, or convention violation with impact · **Low** = minor · **Info** = observation.

**ID prefixes:**

| Prefix | Area |
|---|---|
| SEC | Security |
| API | Contract / client |
| UI | Components |
| DIC | Dictation |
| DAT | Data layer |
| PERF | Performance |
| A11Y | Accessibility / RTL |
| ARC | Architecture / docs |
| CQ | Code quality |

### 3.1 Critical and High

| ID | Sev | Area | file:line | Problem | Impact | Evidence | Fix | Effort | Status |
|---|---|---|---|---|---|---|---|---|---|
| UI-01 | **Critical** | UI / data integrity | `src/components/shared/dictation-rich-text.tsx:80` | `serialize()` ends with `out.replace(/[^\S\n]+/g, ' ').trim()`. `[^\S\n]` matches `\t`, so every serialize turns tabs into single spaces (and collapses spaces, trims). In a contentEditable the Tab key also moves focus, so a tab can't be typed back. | The official markup uses tabs for signature rows (`API_INTEGRATION.md:496,771`: `"@شرطي\tشرطي\tمساعد أول\t…"`). The backend seeds the text fields from the template. Typing one character in المقدمة, المتن or الخاتمة saves every signature row as a single cell, both in `ReportTextView` (splits on `\t`, `report-text-view.tsx:19`) and on the PDF. The corruption is silent. | Serializing `'@شرطي\tشرطي  x'` gives `"@شرطي شرطي x"`. | Collapse only `/ {2,}/` and keep `\t`. Handle `keydown` Tab by inserting `\t`. Don't trim inner lines. Add a unit test. | S | CONFIRMED (code). Needs one real template with tab rows to confirm the data impact. |
| UI-02 | High | UI / data integrity | `src/pages/reports/report-form-page.tsx:26,56-66,90-94` | Only `isPending` is handled. On 404, 403, network or 5xx (after retries), `report` is undefined and `useReportForm(undefined)` falls back to empty defaults (today's date, UNDER_INVESTIGATION). The full editable form renders under «تعديل الضبط». | `PUT /reports/{id}` replaces the whole object (`API_INTEGRATION.md:597`, fields not sent become null). A user who re-enters data or submits wipes the stored report's parties, crime and text. Close to Critical: it needs a load failure plus a submit. | `const { data: report, isPending: isReportPending } = useReport(reportId);` has no `isError` branch. | When `isError` or `!report`, show an error or empty state with retry and back (404-specific text), and never mount the form without a report. | S | CONFIRMED |
| UI-03 | High | UI / data integrity | `src/components/form-types/form-type-template-form.tsx:77,90,114-176`; `src/hooks/report-templates/use-report-template.ts:18` | Two failures: **(a)** a non-404 load error renders empty fields with active «حفظ» and «حذف النص» buttons; **(b)** after a successful delete, the refetch returns 404 but TanStack keeps the last `data`, so `values` still holds the deleted text while the "no text yet" note shows. | (a) Saving overwrites the official template with blanks. (b) Pressing Save re-creates a template that was just deleted. | `values: templateToFormValues(template)`. The only guard is `isNotFound`. | Render an error state when `isError && !isNotFound`. Use `values: isNotFound ? undefined : template`. In the delete `onSuccess`, call `setQueryData(detail(id), undefined)` or `removeQueries` before invalidating. | S | CONFIRMED |
| API-02 | High | Client | `src/lib/api/client.ts:176-185` | One `try/catch` wraps both `await refreshPromise` and the retried `perform()`. Its `catch` calls `forceLogoutRedirect(retryError)` for **any** error. | After a successful refresh, a 400 (validation), 409 (duplicate number or closed report), 404, 500 or network error on the retry clears the session and hard-navigates to /login. The user's form is lost. | `} catch (retryError) { forceLogoutRedirect(retryError); throw retryError; }` | Refresh in its own try block and log out only if the refresh fails. After that, log out only if the retry returns 401, and rethrow everything else. | S | CONFIRMED |
| DIC-01 | High | Dictation / privacy | `src/hooks/shared/use-dictation.ts:165-180,226`; `dictation-rich-text.tsx:258` | `start()` awaits `getUserMedia` with no mounted or attempt check. The unmount cleanup (`useEffect(() => cleanup, [cleanup])`) runs while `streamRef` and `socketRef` are still null. When the prompt resolves, the hook stores the stream, opens the socket and starts the audio pipeline for a dead component. The mic button is disabled while connecting, so the user can't cancel. | The user clicks the mic, then closes the create dialog or navigates away while the permission prompt is open. The microphone stays live (browser indicator on) and audio keeps streaming to the ASR server, with no UI to stop it until the tab closes. | `stream = await navigator.mediaDevices.getUserMedia(...)` → `streamRef.current = stream; socket = new WebSocket(...)` | Add an attempt token or mounted ref. After each await, if the component is stale, stop the tracks and return. Allow `stop()` while connecting. | S | CONFIRMED |
| DIC-02 | High | Dictation | `src/hooks/shared/use-dictation.ts:217-224`; `vosk-model/asr_server.py:71-73` | `stop()` sends `{"eof":1}` and immediately calls `cleanup()` → `socket.close()`. The server replies to EOF with `FinalResult()`, but a CLOSING socket drops incoming messages and `socketRef` is already null. | Every press of Stop discards whatever was said since the last pause. `vosk-server.log` shows the server failing to send the final result into a socket the client had already closed: `ConnectionClosedOK: received 1005`. | `socket.send('{"eof" : 1}'); cleanup();` | On stop, stop the audio nodes and tracks, send EOF, set status to `finishing`, and keep `onmessage` until the server closes or about 3 s pass, then clean up. | S | CONFIRMED |
| SEC-01 | High | Security / ASR | `vosk-model/asr_server.py:50-53,79-82,93,117`; `scripts/dev-with-vosk.sh:21-22` | The WebSocket server binds `VOSK_SERVER_INTERFACE` (default `0.0.0.0`) and has no authentication and no Origin check. A client `{"config":{"model":"<path>"}}` runs `Model(jobj['model'])` on a `global model` shared by every connection. | Anyone on the LAN, or any website the user visits (WebSockets are not bound by CORS), can use the transcription server. They can also make it load an arbitrary server path, which is a DoS and swaps the model for all users. If deployed like this, dictated crime-report audio is exposed. | Log: `server listening on 0.0.0.0:2700`. The code has `global model` in `recognize()`. | Bind 127.0.0.1 in dev. In production, put it behind a TLS reverse proxy with an Origin allow-list and a short-lived token, and delete the `model` config branch. | S (dev) / M (prod) | CONFIRMED (code); production deployment SUSPECTED |
| DIC-03 | High | Dictation / data | `src/components/shared/dictation-rich-text.tsx:61-81,223-245` | The serializer only maps top-level text nodes, slot spans and `<br>`; every other element contributes `textContent` with no `\n`. Chromium and Firefox insert `<div>` on Enter, and paste inserts `<p>`/`<div>` trees. The editable root is also `flex flex-wrap`. | "abc⏎def" is saved as "abcdef" and blank lines vanish. The `#`, `>` and `@` markup is line-based, so its structure is lost. A slot inside a block loses its value. | Serializer branches as quoted. | Use `contentEditable="plaintext-only"`, or intercept `beforeinput` (`insertParagraph`/`insertLineBreak`) and paste as `text/plain`. Make `serialize` recursive with block boundaries. Drop the flex layout. | M | SUSPECTED (needs a browser check) |
| PERF-01 | High | Perf / correctness | `src/pages/admin/dashboard/dashboard-page.tsx:50,74-94` | `useReports({ size: 500, sort: 'reportDate,desc' })` downloads 500 full `ReportResponse`s (five long texts, parties, confiscation, nested creator/editor/formType) just to count reports per month, count "this month", and show 8 recent rows. | The trend and "this month" are silently undercounted once the 6-month window has more than 500 reports. It is also a multi-MB payload on the default landing page, re-downloaded after every report mutation (it's under `['reports']`). | Trend computed client-side from `reportsQuery.data.content`. | Use `useReports({ size: 8 })` for recent. Use `/reports/statistics?from&to` `.total` for this month, and six statistics calls or a backend `byMonth` for the trend. | M | CONFIRMED (logic); payload size SUSPECTED |
| A11Y-01 | High | A11y | `src/components/ui/button.tsx:8`; `src/components/ui/dialog.tsx:43` | The Button base class has `focus-visible:outline-none` and no ring. The global `:focus-visible` outline is in `@layer base` (`globals.css:5,79-84`), and Tailwind utilities win over base. The dialog close button does the same. | No visible keyboard focus on any Button (submit, cancel, table actions, pagination, menu triggers) or on the ✕ of every dialog. This fails WCAG 2.4.7. | The built CSS contains `.focus-visible\:outline-none:focus-visible{outline:2px solid transparent}`. Input, Switch, Checkbox and chips do add `ring-4`. | Add `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` (and a dark-safe ring colour; see A11Y-06) to both. | S | CONFIRMED |
| A11Y-02 | High | A11y | `src/components/shared/dictation-rich-text.tsx:223-229`; `src/components/ui/form-field.tsx:32-50`; `report-form.tsx:373-387` | `<Label htmlFor>` points at a `div[role=textbox][contenteditable]`. A `<label for>` only names labelable elements, so the five report text fields have no accessible name, and clicking the label does nothing. Errors are not linked either. | Screen-reader users hear an unnamed "edit text" five times on the main data-entry form. | `<div id={id} role="textbox" contentEditable …>` | Give the Label an id and pass `aria-labelledby` and `aria-describedby`. Give the slot inputs an `aria-label`. | S | CONFIRMED |
| A11Y-03 | High | A11y / contrast | `src/styles/globals.css:21,135` (`--muted-foreground`, `--color-text-muted`) | Light-theme muted text is #6b7b77. It measures **3.92:1** on `--background` and **4.46:1** on white; `--color-text-muted` measures 3.89 and 4.39. It is also the input placeholder colour. | `text-muted-foreground` is used 83 times (subtitles, table metadata, placeholders). Fails WCAG 1.4.3 AA (4.5:1). | Computed from the token values (script in the scratch directory). | Use `--muted-foreground: 166 7% 41%` (#61706c), which gives 4.56 on bg and 5.2 on white. Apply the same to `--color-text-muted`. | S | CONFIRMED (computed) |
| A11Y-04 | High | A11y / contrast | `src/styles/globals.css:37-59` (`html.dark` tokens), `117` | Dark theme: primary-button text 3.81; `text-primary` on card 2.47 and on bg 3.60; `--destructive` text on card 2.53; white on destructive 4.48; CLOSED badge (`text-syid-umber` on `bg-syid-umber/10`) **1.04**; gold-dark chips 2.51 and 2.32. No TSX file uses a `dark:` variant. | Every default Button, report-number links (`reports-table.tsx:82`), form error text, and the CLOSED and UNDER_INVESTIGATION badges (`report-result-control.tsx:18-19`, `stat-card.tsx:20-21`) are unreadable or fail AA in dark mode. | Computed ratios. | Dark `--primary-foreground` → white (4.59). Add a dark text token for primary (#68b1a5: 4.56 on card). Dark destructive text #ea8a94 (4.64). Give the umber and gold chips dark variants. | M | CONFIRMED (computed) |

### 3.2 Medium

| ID | Sev | Area | file:line | Problem | Impact | Evidence | Fix | Effort | Status |
|---|---|---|---|---|---|---|---|---|---|
| SEC-02 | Medium | Security / session | `src/lib/session/session.ts:14-23,36-38`; `src/lib/cookies/cookies.ts:15-28` | The access token (24 h), the refresh token (30 days, **not rotated**: `API_INTEGRATION.md:95`), and a user snapshot `{id, fullName, email, role, permissions}` are stored in **JS-readable** cookies (no HttpOnly; `SameSite=Strict`; `Secure` only on https). The snapshot outlives the access token by 29 days, and logout is client-side only (QA-005 / BE-6 is still open). | Any XSS or malicious extension can take a 30-day non-revocable credential. PII (name and email) stays on shared terminals for 30 days after the access token expires, which conflicts with `CLAUDE.md ` §10 ("do not store unnecessary PII"). **CSRF:** the API authenticates with a Bearer header, not cookies, so CSRF risk is low. `SameSite=Strict` helps if the API is ever same-site. | `setCookie(USER_COOKIE, JSON.stringify(user), { days: REFRESH_DAYS, … })` | Short term: drop `fullName` and `email` from the snapshot (keep `id`, `role`, `permissions`); expire it with the access token; deploy a CSP (SEC-05). Target: have the backend set the refresh token as an HttpOnly, Secure, `SameSite=Strict` cookie scoped to `/api/v1/auth/refresh`, with rotation and a revoke-on-logout endpoint (BE-6). | S / L | CONFIRMED |
| API-03 | Medium | Client / session | `src/lib/session/session.ts:20,47`; `components/auth/require-auth.tsx:25-31`; `guest-only-route.tsx:45-47`; `hooks/auth/use-session.ts:35` | The access-token cookie lives 1 day, the same as the JWT. When it disappears, RequireAuth redirects and `useSession` returns null, even though the refresh cookie is valid for 30 days. In an open tab, requests go out without `Authorization`, and the backend answers **403 with an empty body** (`API_INTEGRATION.md:109`), not 401. So there is no refresh, and mutations toast «ليس لديك صلاحية…». The comment at `session.ts:11-12` describes behaviour the code doesn't have. | Everyone is forced to log in again every 24 h, with a misleading permission message, and the refresh code in `client.ts` is effectively dead. Unsaved work is lost at the 24 h boundary. | `if (!readAccessToken()) return null;` and `!hasToken → <Navigate to login>` | When there is no access cookie but a refresh cookie exists, refresh first (in `request()` and in the session `queryFn`), and let the guards treat that state as "restorable". Or deliberately document 24 h sessions and stop storing the refresh token. | M | CONFIRMED |
| SEC-03 | Medium | Security / config | `src/lib/env/env.ts:10-13` | `VITE_VOSK_WS_URL` silently defaults to `ws://localhost:2700`. Neither URL is required to use `wss://` or `https://` in production, and `VITE_APP_ENV` is validated but never read. | On an HTTPS deployment, `ws://` is blocked as mixed content, so dictation is broken. Over HTTP, dictated crime details travel in cleartext. With the default, every client points at its own localhost. | `z.string().url().default('ws://localhost:2700')` | Add a `superRefine`: when `VITE_APP_ENV === 'production'`, require `https:` / `wss:` and no default. | S | CONFIRMED |
| SEC-04 | Medium | Security / client | `src/lib/api/client.ts:123-127` (and the whole of `lib/`, `hooks/`) | There is no timeout, no `AbortController`, and TanStack's `signal` is never forwarded (grep finds 0 uses of `signal` or `AbortController` in `lib/` and `hooks/`). | A hung backend leaves spinners and disabled buttons forever. Queries for pages the user has left keep running. Offline mode has no dedicated message (network `TypeError`s fall back to generic toasts). | `fetch(\`${env.VITE_API_BASE_URL}${path}\`, { ...options, headers, body })` | Pass `signal` from `queryFn` context. Add a default 30 s `AbortSignal.timeout`, combined with the caller's signal via `AbortSignal.any`. Map `TypeError`/`AbortError` to an Arabic "تعذّر الاتصال بالخادم" message. | S | CONFIRMED |
| SEC-05 | Medium | Security / hosting | `index.html`; no hosting config in the repo | There is no CSP and no security-header configuration anywhere (no `public/_headers`, no nginx conf, no meta CSP). Because the tokens are JS-readable (SEC-02), a CSP is the main XSS backstop. | There is no defence in depth against script injection or clickjacking. | `grep` for CSP / X-Frame finds nothing. | See §3.5 for the recommended header set. | S | CONFIRMED |
| API-01 | Medium | Contract | `api/api-docs.json` (whole file) | The spec is stale: its last change (2026-09-16) predates the RBAC and form-types rename (2026-09-29). It uses `/report-types` and `reportTypeId`, and has no roles, crime-types, options, statistics, export, `PATCH …/result`, `POST /users` or `/users/{id}/{role,enabled}`. It declares **no response schemas** (every 200 is `*/*` object), no enums and no error responses, and puts bearer security on login and refresh. | 15 of its 28 operations disagree with the code, and 16 code calls have no spec entry. It can't be used for codegen, contract tests or response-type verification. `API_INTEGRATION.md` is the de facto contract, and the code matches it (§4). | Matrix in §4. | Regenerate from the running backend's `/v3/api-docs` with `@Schema` / `@ApiResponse` annotations (DTOs, `ApiErrorBody`, enums, 201/204). Diff it in CI. | S (FE) / M (BE) | CONFIRMED |
| UI-04 | Medium | UI | `src/components/reports/report-form-schema.ts:241-247` → `report-form-page.tsx:30` | RHF's `values` prop resets the form whenever the report data changes (deep compare). There is no `resetOptions.keepDirtyValues`. The detail query refetches on reconnect, on any `['reports']` invalidation, or after a 403 re-sync. | If the report changes on the server during an edit (another user, or a result change), the local edits are silently replaced. | `useForm({ …, values })` | Use `resetOptions: { keepDirtyValues: true }`, or `reset()` once on first load, and optionally warn that someone else changed the report. | S | SUSPECTED |
| UI-05 | Medium | UI | `src/components/reports/report-form-schema.ts:263-273`; `hooks/reports/use-report-mutations.ts:29,50` | The hooks suppress the toast on 400. If none of the `fieldErrors` keys matches `FIELD_NAMES` (a class-level constraint or a nested key), nothing gets `setError`. | Save re-enables and nothing is shown. The user doesn't know why the save failed. | The loop only sets errors on known roots. | Track `applied`. If nothing was applied, `setError('root', { message: first message ?? 'البيانات المرسلة غير صالحة' })`. | S | CONFIRMED |
| UI-06 | Medium | UI | `src/components/reports/reports-table.tsx:45,76-79,165-169` vs `pages/reports/reports-list-page.tsx:91,231-235` | There are two independent `ReportDetailDialog` instances: the table's local `detailReportId` and the page's `?view=`. Row clicks use the local one. | The row-click view can't be linked, reloaded or closed with Back. The duplicated state and queries caused L-series bugs (UI-L2). | Two mounts. | Delete the table's instance and pass `onOpen(id)` up to the page, which sets `?view=`. | S | CONFIRMED |
| UI-07 | Medium | UI | `src/lib/utils/download.ts:5-9` (called from `use-report-mutations.ts:106`, `use-report-template-mutations.ts:50`) | `window.open(blobUrl, '_blank', 'noopener,noreferrer')` runs after an `await`, outside the user gesture. With `noopener` it always returns null, so a blocked popup can't be detected. The `Content-Disposition` filename is ignored. | Safari (always) and Chrome/Firefox (on PDFs slower than ~5 s) block it silently, so "طباعة" does nothing. | As quoted. | Open `window.open('', '_blank')` synchronously in the click handler, then set its location after the fetch. Fall back to `downloadBlob` plus a toast. Re-wrap the blob as `application/pdf`. | S | SUSPECTED |
| DIC-04 | Medium | Dictation | `src/lib/dictation/date-time-templates.ts:37-101,183`; `dictation-rich-text.tsx:73` | Fuzzy keyword matching (edit distance ≤ 2 on short roots) inserts spurious slots. Unfilled slots are saved as the literal `____DATE____`, `____TIME____` or `____TEXT____`. | Run against common phrases: «حضر النائب العام» → `… ____DATE____`; «ثلاثة أشخاص» → `ثلاثة ____DATE____ أشخاص`; «أربعة سيارات» → two DATE slots; «قيد التحقيق» → `قيد ____TEXT____`. Markers the user misses end up in the saved text and the PDF. | Executed with node. | Use distance 0 for roots of 5 letters or fewer. Drop `عام`, `قيد` and `احد` as bare roots or require context. Block number words. Add a zod refine that rejects unfilled `____X____` markers before save. | M | CONFIRMED (executed) |
| DIC-05 | Medium | Dictation | `use-dictation.ts:153,184-214`; `dictation-rich-text.tsx:209-216,258` | No connect timeout, and Stop is disabled while connecting. Repeated identical errors are de-duplicated by `lastError`, so the second permission denial shows nothing. A server-initiated close mid-recording is silent. | A blackholed ASR host leaves the mic open in "connecting" with no way out. Retries look like the button is dead. | As cited. | Add a 10 s timeout that calls `fail(...)`. Allow `stop()` while connecting. Reset `lastError` when a new attempt starts. Show an error style on the button. | S | CONFIRMED (dedupe) / SUSPECTED (timeout) |
| UI-08 | Medium | UI | `src/pages/admin/users/users-list-page.tsx:71,87-92` | The table branch isn't gated on `isPending`, so while loading, the skeleton **and** «لا يوجد مستخدمون» render together. | Every load briefly tells admins there are no users, and screen readers announce both. | `{!isError && (filtered.length > 0 \|\| !debouncedSearch.trim()) && …}` | Add `!isPending &&`, as `crime-types-list-page.tsx:87` does. | S | CONFIRMED |
| UI-09 | Medium | UI / RBAC | `src/components/admin/users/users-table.tsx:78,89-100,135-155` | Row actions and the enable switch check only `!isSelf && can(...)`. They don't hide actions on users whose role exceeds the editor's permissions (`API_INTEGRATION.md` §4.4 → 403). | A "users admin" sees disable, delete, role and report-info actions on system-admin rows, and every one fails with 403. The switch flips optimistically, then snaps back. UX only; the backend enforces the rule. | `const hasActions = !isSelf && (canUpdate \|\| canDelete);` | When `ROLES:VIEW` is held, disable or hide the actions if `exceedsPermissions(role.permissions, me.permissions)`. | S–M | CONFIRMED |
| UI-10 | Medium | UI / RBAC | `src/components/roles/roles-table.tsx:64-66`; `role-form-dialog.tsx:90-96` | Nothing warns when a user edits **their own** role. They can remove the `ROLES` or `USERS` permissions they depend on. | Self-lockout from role and user management; only another admin can undo it. | No `role.id === user.role?.id` check. | Show a confirm step ("ستفقد صلاحية …") when editing your own role, or lock the cells the editor currently uses. | S | CONFIRMED |
| UI-11 | Medium | UI | `src/pages/reports/report-form-page.tsx:39-45`; `providers/app-providers.tsx:26` | Only `beforeunload` guards the edit page. With `<BrowserRouter>` there is no `useBlocker`, so a sidebar link or Back discards edits silently. QA-029 recorded "do not migrate to a data router" as out of scope, so this is a known, accepted gap. | A long report edit can be lost with one click. | As cited. | Plan the move to `createBrowserRouter` (the routes are already a `RouteObject[]`) and use `useBlocker(isDirty)`. | M | CONFIRMED (accepted risk) |
| DAT-01 | Medium | Data / errors | `hooks/users/use-create-user.ts:24` + `create-user-dialog.tsx:66-71`; same pattern in `use-form-type-mutations.ts:21,40`, `use-crime-type-mutations.ts:22,40`, `use-set-report-info.ts:16,31`, `use-report-template-mutations.ts:25`; roles in `use-role-mutations.ts:83-89` | There are three error-handling strategies: `failureMessage`, `userActionErrorMessage` and a hand-rolled one in roles. Five hooks toast on 400 **and** the form maps the field errors, so the error is shown twice. `useDeleteRole` shows a generic message on 403. 409 is sometimes toasted and sometimes not. | Inconsistent feedback, duplicate messages, and a wrong message on 403. | Quoted code. | One policy: hooks toast only non-field errors, and forms own 400 and 409. Add `apiErrorBody(error)` and `applyFieldErrors(error, setError, allowedKeys)` in `lib/api/errors.ts` (this also removes 10 duplicated `as ApiErrorBody` casts and 6 copies of the field-error mapping). | M | CONFIRMED |
| PERF-02 | Medium | Perf | `src/components/ui/toast-provider.tsx:3,73-79`; `vite.config.ts` `manualChunks['vendor-motion']` | framer-motion (with `layout`, which pulls in the projection engine) is used for toasts. That puts `vendor-motion` (119 KB / 39.8 KB gz) in the `modulepreload` list for every page, including /login. Everything else that uses it is dashboard-only. | About 19% of login JS; Lighthouse reports 35.8 KB of it as unused. | The `dist/index.html` modulepreload list includes vendor-motion. | Use CSS / tailwindcss-animate (already a dependency) for toasts and drop the `vendor-motion` manual chunk. | S–M | CONFIRMED |
| PERF-03 | Medium | Perf | `src/components/admin/dashboard/reports-trend-chart.tsx:1`, `crime-type-chart.tsx:2-11`; `components/auth/home-redirect.tsx:8` | recharts (with d3, redux-toolkit, immer, decimal.js, es-toolkit) makes `dashboard-page` 412 KB / 120.7 KB gz, for two charts. The dashboard is the landing page for every `REPORTS:VIEW` user, and its queries only start after this chunk runs. | A slow first screen after login on low-end devices. | source-map-explorer: recharts 254.7 KB, plus about 125 KB of dependencies. | Lazy-load the two chart components so the KPI cards and queries render first, or replace them with small SVG (the donut already is). Prefetch the chunk after login. | M | CONFIRMED (size); timing SUSPECTED |
| PERF-04 | Medium | Perf | `src/routes/route-config.tsx:4`; `vite.config.ts:32-46` | `AuthenticatedLayout` (header, sidebar, dropdown, confirm dialog) is imported statically, and `vendor-radix` bundles select and menu into one preloaded chunk. So /login downloads the whole shell. | Lighthouse: 32.6 KB of vendor-radix unused on /login. With PERF-02, about 70 KB of the ~205 KB of login JS can be cut. | Lighthouse `unused-javascript`. | Lazy-load the layout. Remove or split the radix and motion manual chunks. Also drop `@radix-ui/react-tooltip` from them (unused) and add `react-popover`. | S–M | CONFIRMED |
| PERF-05 | Medium | Perf / fonts | `src/styles/globals.css:89-109`; `index.html` | Three OTF faces (about 55 KB each), `format('opentype')`, no woff2, no preload. The Light (300) face is declared but unused. `font-display: swap` is set (good). There is no metric-matched fallback. | On /login the fonts are 32% of page weight (110 KB) and are discovered late (HTML → CSS → font). | woff2 measured: 28.5 / 28.8 / 27.5 KB (**−49%**). | Ship woff2 with OTF as fallback, preload Regular, drop Light, and add a `size-adjust` fallback face. | S | CONFIRMED |
| PERF-06 | Medium | Perf / maint. | `src/styles/globals.css` (5,817 lines) | 285 of 364 class selectors (**78%**) are never referenced. Whole families come from another product (`asset-mgmt-*`, `custody-form-modal`, `wo-chip`, `org-tree`, `maintenance-*`), plus Bootstrap-era classes (`form-control`, `ui-card`, `modal-*`, `thead-light`). The file also has 321 `!important`, `:root` declared 6 times and `html.dark` 4 times, and 71 selectors defined more than once. | 160.7 KB CSS, render-blocking (about 600 ms on mobile per Lighthouse). `CLAUDE.md ` tells contributors to reuse these dead classes. | Pruned and rebuilt: **160.7 → 83.8 KB (−47%)**, gzip 26.7 → 15.5 KB. | Delete the dead blocks, with a class-usage script or PurgeCSS limited to `globals.css`. Then update `CLAUDE.md `. | M | CONFIRMED (measured) |
| A11Y-05 | Medium | A11y | `src/styles/globals.css:2472-2483`; `components/layout/sidebar.tsx:33` | Below 992px the closed drawer is only `translateX(100%)`: no `inert`, no `visibility:hidden`. When open, focus isn't moved into it or trapped, and Escape doesn't close it. | Keyboard users tab through about 8 invisible links on every page, and screen readers read hidden navigation. | CSS as cited. | Set `inert` when closed. When open, focus it and handle Escape (or use Radix Dialog for the drawer). | M | CONFIRMED |
| A11Y-06 | Medium | A11y / contrast | `globals.css:30,59` (`--input`), `81-84` (`:focus-visible`), `ui/input.tsx` | Input borders are 1.50:1 (light) and 1.44:1 (dark). The input focus ring is `ring-primary/15` (1.20:1). The global focus ring is 2.47:1 on the dark card. | Fails WCAG 1.4.11 (non-text contrast, 3:1). | Computed. | Use a darker `--input` (about `41 22% 54%`), a solid 2 px focus ring, and a lighter ring colour in dark mode. | S | CONFIRMED |
| A11Y-07 | Medium | A11y | `src/components/ui/form-field.tsx:32-50` | The error `<p role="alert">` and the hint have no id, and no `aria-describedby` is passed. Required fields are marked only with an `aria-hidden` asterisk (no `aria-required`). | Screen-reader users don't hear why a field is invalid, and never hear the password policy hint. | As cited. | Generate `${id}-error` / `${id}-hint`, pass `aria-describedby` and `aria-invalid`, and set `aria-required`. | M | CONFIRMED |
| A11Y-08 | Medium | A11y / theming | `src/providers/theme-provider.tsx:8-16` | The `dark` class is applied in `useEffect`, after first paint. `localStorage` is read unguarded and cast (`as Theme`). There is no `prefers-color-scheme` default and no `color-scheme` meta. | Measured: a light frame paints before dark (for the whole JS load on mobile). If storage is blocked, `getItem` throws inside the provider and takes down the whole app. | puppeteer timing (4× CPU): light until 467 ms. | Add an inline `<script>` in `index.html` that sets `html.dark` before CSS applies. Wrap storage access in `try/catch` and validate `=== 'dark'`. | S | CONFIRMED (flash) / SUSPECTED (crash) |
| A11Y-09 | Medium | A11y | `src/components/ui/toast-provider.tsx:38,49,66-133`; `tailwind.config.js:60` | Toasts auto-dismiss after 4 s with no pause on hover or focus (WCAG 2.2.1). Errors use a polite region, not `role="alert"`. Colours are hard-coded for light mode (34 hex/rgba literals, against the brand rules). `font-sans` resolves to the undeclared `'Forest'` font, so toasts don't render in Qomra. There is no reduced-motion handling. | Session-expiry and permission messages can vanish before they're read, and toasts look wrong in dark mode. | As cited. | Pause on hover and focus, use `role="alert"` for errors, use token colours, change the Tailwind `sans` to `var(--font-family)`, and wrap the app in `MotionConfig reducedMotion="user"`. | S | CONFIRMED |
| A11Y-10 | Medium | A11y | `src/pages/auth/login-page.tsx`; `src/components/ui/card.tsx:31` | /login has no `<main>` landmark and no `h1` (the CardTitle is an `h3`). | This is Lighthouse's only a11y failure (98/100 in both themes). | Lighthouse `landmark-one-main`. | Wrap the page in `<main>` and render the title as `h1`. | S | CONFIRMED |
| ARC-01 | Medium | Docs | `ARCHITECTURE.md:4,11,15,17,20,30-37,59,62,76,83` | Stale in many places: <br>• the reference implementation is "report types" (`lib/report-types/api.ts`, `hooks/report-types/*`, `pages/report-types/*`), none of which exist <br>• `layouts/admin-layout.tsx` doesn't exist <br>• "mounts the `sonner` `<Toaster/>`" is false: sonner isn't installed, and a custom `ToastProvider` + `toast-sink` is used <br>• `types/report-type.ts` doesn't exist <br>• rule 2 says "never call `lib/`" but should say `lib/*/api` <br>• `notify.warning` is omitted | New contributors, and AI agents following the rules, are pointed at non-existent patterns. | grep and ls. | Rewrite the "end-to-end pattern" section around form-types, and correct the provider list and rules. | S | CONFIRMED |
| ARC-02 | Medium | Docs / tooling | `"CLAUDE.md "` (root, trailing space); `claude/rules/"CLAUDE.md "` | Both filenames end in a space, and the second file sits in `claude/` without the dot, so tools looking for `CLAUDE.md` or `.claude/rules/` won't load them. The second file is a stale duplicate: it refers to the `HayyakumAllah` font and `role-guard.tsx`, and lacks the "never authorize on builtIn" rule. The root file contradicts the code: `staff/`/`secretary/`/`public/` folders, `hooks/admin/…`, `PaginatedResponse<T>`, `/auth/me`, the "Forest" font, `html.theme-dark` (the code uses `html.dark`), and mandatory reuse of dead CSS classes. A trailing-space path is also invalid on Git for Windows, and the repo ships `.bat` scripts. | The agent rules this repo relies on are likely not auto-loaded, and where they are read, they give wrong instructions. Windows checkouts may fail. | `ls -la`; diff. | Rename to `CLAUDE.md`, delete `claude/rules/`, and fix the listed contradictions. | S | CONFIRMED (names and content); load and Windows effects SUSPECTED |
| ARC-03 | Medium | Tooling | no `.prettierignore`; `eslint.config.mjs:9,10-36` | `format:check` fails on 48 files and walks `vosk-model/myenv` and `model` (about 780 MB). ESLint lints 4 files inside `vosk-model/myenv`. **None of the ARCHITECTURE rules is enforced by tooling**: there is no `no-restricted-imports` or boundaries rule for `lib/*/api` in components/pages, react-query outside hooks, `@/hooks` in `components/ui`, or `@/components` in `lib`. | A CI format gate would fail today, and architecture drift can only be caught in review. | Phase 0 output. | Add a `.prettierignore` (vosk-model, dist, api-docs.json, docs) and run `format` once. Add `no-restricted-imports` zones and `@typescript-eslint/no-non-null-assertion`. Ignore `vosk-model` in ESLint. | S | CONFIRMED |

### 3.3 Low

| ID | Area | file:line | Problem → Fix | Effort | Status |
|---|---|---|---|---|---|
| API-04 | Client | `src/lib/api/client.ts:85,168` | `/auth/register` (called with the admin's token) is in `NO_REFRESH_PATHS`, so a 401 there gets no refresh and no logout, just a generic toast. → Remove it from the list (`API_INTEGRATION.md:1308` excludes only login and refresh). | S | CONFIRMED |
| API-05 | Client | `src/lib/api/client.ts:145-149` | Only 204 skips JSON parsing, so a 200 with an empty body throws and a successful mutation shows as failed. (`API_INTEGRATION.md` documents 204 for deletes, but the spec says 200.) → Read the body as text and parse only if it's non-empty. | S | SUSPECTED |
| API-06 | Client | `src/lib/api/client.ts:66-71`; `lib/users/errors.ts:21`; `lib/reports/errors.ts:13`; `report-form-schema.ts:275` | Behaviour depends on matching English backend messages (`'User is disabled'`, `'is the last'`, `'is closed'`, `'Form type'`). `users/errors.ts:25-27` treats every 403 (including an empty-body "no token" 403) as escalation. → Ask the backend for a machine-readable `code` (QA plan §4 proposal), and handle `Access denied` separately. | S/M | CONFIRMED |
| API-07 | Contract | `src/pages/reports/reports-list-page.tsx:63-66,91` | `sort`, `from` and `to` from the URL are forwarded unvalidated (a hand-edited value becomes a backend 400 and the list shows an error state). `?view=` with an empty value fetches `/reports/0`. Whether Spring restricts sortable properties (e.g. `creator.password`) is unverified. → Whitelist the 4 sort values offered in `report-filters.tsx:287-292`, validate dates with `parseIsoDate`, and reject `view` values ≤ 0. | S | CONFIRMED (forwarding) / SUSPECTED (backend) |
| API-08 | Contract | `src/hooks/form-types/use-form-types.ts:41-45`; `types/form-type.ts:15` | `parentId?: number`. If the backend sends `null`, the ancestor loop requests `/form-types/null`. → Use `!= null` and type it `number \| null`. | S | SUSPECTED |
| API-09 | Contract | `src/hooks/reports/use-report-mutations.ts:118` | The export filename uses `new Date().toISOString().slice(0,10)`, which is the UTC date, so it is one day early between 00:00 and 03:00 local time. → Use `todayIsoDate()`. | S | CONFIRMED |
| API-10 | Validation | `report-info-dialog.tsx:14-18`, `profile-page.tsx:20-24`, `form-type-template-form.tsx:24-33`, `create-user-dialog.tsx:18-19`, `form-type-form.tsx:28-29` | Some zod schemas lack the backend's `max(100/200)` and `.trim()`, so whitespace-only values pass and an email with a trailing space fails with a misleading message. `z.coerce.number()` turns an empty witness count into 0. The report enums are `z.string()` then cast (`report-form-schema.ts:45-47,214-218`). → Add `.trim().max(n)`, `z.enum`, and an explicit empty-string check. | S | CONFIRMED |
| API-11 | Validation | `src/components/reports/report-form-schema.ts:22-27`; `form-type-form.tsx:25,33` | The client enforces national ID = 11 digits and witnesses ≤ 20 (QA decisions D3 and D4), but the backend doesn't yet (BE-3). A report or type stored earlier with other values can't be saved again after editing. → Keep this until BE-3 lands, but let unchanged legacy values through, or show a clear message. | S | CONFIRMED |
| DAT-02 | Cache | `hooks/form-types/use-form-type-mutations.ts:8-10,36-39`; `hooks/users/use-set-report-info.ts`; `use-set-user-role.ts` | A form-type rename, a report-info change or a user role change doesn't invalidate `reports.all`, although reports embed `formType`, `creator` and `editor`. So reports and statistics labels are stale for up to 60 s. (Crime-type updates do this correctly.) → Add `reports.all`. | S | CONFIRMED |
| DAT-03 | Cache | `hooks/reports/use-report-mutations.ts:13-16,84`; `use-report-options.ts:22-25` | Deleting a report invalidates `['reports']`, which refetches the deleted `detail(id)` and gets a guaranteed 404. `reports.options` (staleTime ∞) sits under the same prefix, so every report mutation refetches it. → Call `removeQueries(detail(id))` on delete, and move options to their own root key. | S | CONFIRMED |
| DAT-04 | Cache | `lib/query/query-keys.ts:16,29,45-46` | `users.detail`, `formTypes.detail` and `reportTemplates.all` are unused. `reportTemplates.list` is invalidated but never queried (and `lib/report-templates/api.ts:4 list()` and `lib/users/api.ts:18 get()` have no callers). → Remove them. | S | CONFIRMED |
| UI-L1 | Reports | `delete-report-dialog.tsx:30,37-45`; `report-detail-dialog.tsx:109,262` | Cancel and Esc stay active while a delete is pending. If dismissed, the per-call `onSuccess` never runs, so the detail stays open on the deleted report. The `deleting` state also survives a `reportId` change and can pop a delete confirm unprompted. → Block closing while pending, and add `key={reportId}`. | S | CONFIRMED |
| UI-L2 | Reports | `reports-list-page.tsx:134-138`; `create-report-dialog.tsx:50` | `closeDetail` pushes a history entry, so Back reopens the dialog. After create, it navigates to `/reports?view=id` and drops the current filters. → Use `replace: true`, and merge `view` into the current params. | S | CONFIRMED |
| UI-L3 | Reports | `report-filters.tsx:234-261`; `report-statistics-panel.tsx:452` | A `crimeTypeId`, `creatorId` or `formTypeId` from the URL (e.g. from dashboard drill-down links) filters the list with no visible control when the user lacks that `*:VIEW` permission, and `SearchableSelect` shows «جميع الجرائم». → Render a removable chip for each active filter. | S | CONFIRMED |
| UI-L4 | Dashboard | `dashboard-page.tsx:203-211`; `use-report-statistics.ts:10`; `statistics-range-picker.tsx:16-37,53` | The statistics error always says "check the start date is before the end date", even for 5xx. There is no `isFetching` cue while `placeholderData` shows the old range. In January, «هذا الشهر» and «هذه السنة» are both `aria-pressed`. → Show the real error, add a fetching indicator, and resolve preset ties. | S | CONFIRMED |
| UI-L5 | Reports | `report-form.tsx:444-460,695` | The error-scroll effect keyed on `errorKey` doesn't re-run for the same failing sections. Controller fields don't forward `ref`s. Submit is disabled on `isPending` only, not on `isSubmitting` (async resolver window). → Also key on submit count, forward refs, and use `disabled={isPending \|\| isSubmitting}`. | S | CONFIRMED / SUSPECTED |
| UI-L6 | Reports | `reports-table.tsx:134-136`; `dictation-rich-text.tsx:97-100` | Print menu items stay enabled while a PDF is loading, so repeated clicks open several tabs. The slot "remove" button bypasses `lastSerialized`, so the editor is rebuilt, filled slots become text and the caret is lost. → Disable while pending, and route removal through `handleInputRef`. | S | CONFIRMED |
| UI-L7 | Admin | `form-type-template-form.tsx`; `role-form-dialog.tsx`; `crime-type-form-dialog.tsx`; `create-user-dialog.tsx`; `form-type-form.tsx` | Only `ReportInfoDialog` and the create-report dialog guard dirty state against outside-click and Esc; the other dialogs lose typed data. → Reuse the same pattern. | S | CONFIRMED |
| UI-L8 | Admin | `crime-types-list-page.tsx:87-92`; `change-role-dialog.tsx:18`; `create-user-dialog.tsx:43`; `role-form-dialog.tsx:91-94`; `not-found-page.tsx:33` | • Crime-type search has no "no match" state. <br>• The role selects have no error state. <br>• The read-only role dialog always blames "permissions you don't hold", even when the real reason is the missing `ROLES:UPDATE`. <br>• The 404 page links to `/reports`, which many roles can't open. <br>→ Add these states, pass the real reason, and link to `/`. | S | CONFIRMED |
| UI-L9 | Admin | `users-list-page.tsx:26`; `form-types-list-page.tsx:78`; `crime-types-list-page.tsx:29` | Search text and the list/tree view aren't kept in the URL (report search is QA-009), and the page resets 300 ms before the debounced filter applies. → Store them in the URL and reset the page together with the debounced value. | S | CONFIRMED |
| UI-L10 | UI primitives | `searchable-select.tsx:62-67`; `role-select.tsx:26`; `dialog.tsx:59` | • Reopening `SearchableSelect` highlights a row computed from the old query. <br>• `value={value \|\| undefined}` flips Radix Select between controlled and uncontrolled. <br>• `DialogTitle` has `leading-none` while titles embed full Arabic names, so text may clip. | S | CONFIRMED / SUSPECTED |
| DIC-06 | Dictation | `use-dictation.ts:121,136`; `dictation-rich-text.tsx:197-207` | • Uses `ScriptProcessorNode` (deprecated, main-thread audio). <br>• `socket.send` ignores `bufferedAmount`. <br>• Several fields can record at once. <br>• Text always appends at the end, not at the caret. <br>→ Use an AudioWorklet, add back-pressure, allow one active recorder, and insert at the selection. | M | CONFIRMED |
| SEC-06 | Security | `src/lib/api/client.ts:152-155`; `lib/utils/download.ts:5-9` | The blob `Content-Type` isn't checked, so an HTML error page from a proxy would open as a same-origin `blob:` document. → Verify it is `application/pdf` (or `spreadsheetml` for export), or re-wrap it with that type. | S | CONFIRMED |
| SEC-07 | Security | `vosk-model/start.sh:45-50`; `vosk-model/web_server.py:15` | `web_server.py` binds `0.0.0.0` on port 8080, the same port as `VITE_API_BASE_URL`. `vosk-server.log` is written into the repo root. → Use a different port and bind 127.0.0.1. | S | CONFIRMED |
| SEC-08 | Security (info) | `components/auth/require-auth.tsx`; `session.ts:75-84` | The permission snapshot comes from a client-writable cookie. Editing it only reveals UI for about one request, until `/users/me` revalidates (the backend enforces). No action needed; noted for completeness. | – | CONFIRMED |
| PERF-07 | Perf | `pages/reports/reports-list-page.tsx:6,14-15` | The list statically imports `CreateReportDialog` and `ReportDetailDialog`, so the 43 KB report-form bundle loads on every list view. → Lazy-load the dialogs. | S | CONFIRMED |
| PERF-08 | Perf | `routes/lazy-pages.ts:7`; entry chunk | LoginPage is lazy, which adds a second request tier before LCP. react-helmet-async (about 14 KB with its dependencies) is used only to set `<title>`. → Import login statically (2.8 KB), and replace helmet with a small `useDocumentTitle`. | S | SUSPECTED |
| A11Y-11 | Contrast | `globals.css:14,116-117` | Light theme: `--syid-gold` text 2.37:1, `--syid-gold-dark` chips 3.07–3.20, `--primary` as text on the page background 4.04. → Use #6a5d44 for chip text and `170 32% 35%` for primary. | S | CONFIRMED |
| A11Y-12 | A11y | `password-input.tsx:26`; `skeleton.tsx:7-8`; `users-table.tsx:92,102-107`; `reports-table.tsx:76-84`; `report-form.tsx:137`; `reports-distribution-chart.tsx:199` | • The password toggle has `tabIndex={-1}`. <br>• Every skeleton bar is its own `role="status"` region. <br>• The account switch is named by its state, not the user. <br>• Report rows open on mouse click only. <br>• `aria-label` is on a role-less span. <br>• The donut centre `aria-live` announces on hover. | S | CONFIRMED |
| A11Y-13 | A11y / i18n | `src/components/ui/dialog.tsx:44`; `index.html:5-7`; `layouts/public-layout.tsx:11` | • The dialog close button has `aria-label="Close"` (English). <br>• `<title>Medad</title>` is English. <br>• The unused layout has an English skip link. <br>• `ReportDetailDialog`, `FormTypeForm` and `CrimeTypeFormDialog` have no `DialogDescription` (Radix warning). <br>• There is no skip link in the authenticated shell. <br>→ Use Arabic strings, add descriptions or `aria-describedby={undefined}`, and add a skip link. | S | CONFIRMED |
| A11Y-14 | Motion | `globals.css` (0 `prefers-reduced-motion` blocks, 41 transitions, 4 keyframes); `report-form.tsx:457,466` | There is no reduced-motion handling outside the dashboard's `MotionConfig`, and smooth `scrollIntoView` ignores the preference. → Add a global media block and an app-level `MotionConfig`. | S | CONFIRMED |
| A11Y-15 | RTL | `src/components/ui/date-input.tsx:143,151`; `dashboard/*-chart.tsx` | • `pl-11 pr-3.5 text-right left-1` are the only real physical-direction violations (9 physical vs about 45 logical in TSX; the rest are correct `space-x`+`rtl:space-x-reverse` or centring). <br>• The recharts X axis isn't `reversed`, so time runs left-to-right on an RTL page. <br>• `TableHead` uses `uppercase tracking-wide` on Arabic, which may break letter joining. | S | CONFIRMED / SUSPECTED |
| CQ-01 | Types | `hooks/auth/use-session.ts:16`; `providers/theme-provider.tsx:9`; `crime-type-chart.tsx:103`; `dictation-rich-text.tsx:99,136` | 50 `as` casts and 25 `!`. The risky ones: `permissions!` on a field typed optional; an unvalidated `localStorage` cast; a double cast `as unknown as`; `containerRef.current as HTMLElement` in a click handler. → Fix these four; the rest are justified (full list in the scratch analysis). | S | CONFIRMED |
| CQ-02 | Config | `tsconfig.app.json:23,26-41`; `tsconfig.node.json`; `vite.config.ts:10-23` | `exactOptionalPropertyTypes: false` (enabling it gives 88 errors, mostly `error={x?.message}`). `tsconfig.node.json` lacks `noUnused*` and `noUncheckedIndexedAccess`. There are 13 redundant path aliases in both files. `vite-env.d.ts` doesn't type `ImportMetaEnv`. | S–M | CONFIRMED |
| CQ-03 | Dead code | `layouts/public-layout.tsx`; `components/ui/select.tsx`; `components/ui/tooltip.tsx`; `components/ui/toast-context.ts:14-22`; `package.json:26` (`@radix-ui/react-tooltip`); `motion/variants.ts:9,14`; `types/auth.ts:15`; `types/api.ts:20` | Unused files, a dependency, a context, variants and types (knip + madge, checked by hand). → Remove them. | S | CONFIRMED |
| CQ-04 | Duplication | `report-info-dialog.tsx:13-35` ≡ `profile-page.tsx:19-41`; `crime-type-chart.tsx:19-21` ≡ `reports-distribution-chart.tsx:22-24`; the route→permission mapping ×3 (`route-config.tsx`, `home-redirect.tsx:6-13`, `sidebar-nav.tsx:36-89`); `?view=` URL built 6 times; enum lists hand-copied (`reports-list-page.tsx:23-34`, `crime-statistics-table.tsx:17-21`); `Partial<Record<Resource,Action[]>>` declared 4 times | Duplicated logic can drift. → Extract shared pieces: `ROUTES.reports.view(id)`, one `PermissionSet` type, one route-permission table. | M | CONFIRMED |
| CQ-05 | Layering | `lib/notifications/toast.ts:1` → `components/ui/toast-sink.ts`; `lib/query/query-client.ts:1`; `components/ui/toast-provider.tsx:6-7`, `toast-sink.ts:1` (relative imports); `types/role.ts → report.ts → user.ts → role.ts` (type-only cycle) | `lib` depends on `components/ui`, and `lib` imports react-query (infrastructure, but contrary to rule 10). There are 3 relative imports and one type cycle. → Move the sink to `lib/notifications`, move `EnumOption` to `types/api.ts`, and state the query-client exception in the docs. | S | CONFIRMED |
| CQ-06 | Style | `toast-provider.tsx:81-133`; chart palettes; `login-page.tsx:44`; `not-found-page.tsx:14` | Hard-coded hex and rgba colours (including Tailwind-default hues), against the brand rules in `CLAUDE.md `. → Use tokens, or document an approved chart palette. | S | CONFIRMED |
| CQ-07 | Size | `report-form.tsx` (701 lines), `report-form-schema.ts` (334: schema + hook + error mapping under `components/`), `date-input.tsx` (312), `reports-distribution-chart.tsx` (311) | Oversized files with mixed responsibilities. → Split `report-form.tsx` per section, and move the hook and error mapping out of `components/`. | M | CONFIRMED |
| CQ-08 | Naming | `hooks/users/*` (one hook per file) vs `use-*-mutations.ts` elsewhere; `report-templates` module vs "form-type template" in the UI; `form-type-table.tsx` (singular); `roles/` top-level vs `/admin/roles`; `constant/` singular; runtime functions in `types/`; `AdminUsersListPage` alias | Naming is inconsistent. → Pick one convention per item when those files are next touched. | S | CONFIRMED |
| CQ-09 | Comments | `routes/lazy-pages.ts:5` ("routes.tsx"); `use-dictation.ts:31` (a missing `index.html` prototype); `guest-only-route.tsx:17,23`; `client.ts:22-23` (pre-RBAC "USER" example); `session.ts:11-12`; `motion/variants.ts:6-7` | These comments describe code or behaviour that no longer exists. → Update them. | S | CONFIRMED |
| ARC-04 | Docs | `docs/plans/qa-remediation-plan.md:3,94,257`; `docs/plans/rbac-implementation-plan.md`; `api/API_INTEGRATION.md:737` (§7.5 `creator.role` shown as a string), §9 (Axios example) | These plans refer to files that don't exist or to a working-tree state that no longer applies, and there is a small inconsistency in the contract document. → Mark the plans as archived, and fix §7.5. | S | CONFIRMED |
| ARC-05 | Repo | `index.html:5`; `test/` (empty, untracked); `vosk-model/web_server.py:4-6` | The favicon `/vite.svg` doesn't exist (the SPA fallback returns HTML with status 200). `test/` is empty. The Vosk docstring refers to a backend persistence API that doesn't exist. There is no meta description, `theme-color`, `noindex` or `robots.txt` (recommended for an internal government system). | S | CONFIRMED |

### 3.4 Info

- **INF-01:** `components/ui` contains only generic Arabic UI strings (weekday names, pagination labels, "تأكيد" and "إلغاء" defaults) and no domain or permission logic. This satisfies rule 4.
- **INF-02:** `roles-table.tsx:65-66` and `role-form-dialog.tsx:92` read `builtIn` on the **target** role, to keep the ADMIN role immutable and built-in roles undeletable (sanctioned by `API_INTEGRATION.md` §4.1). The check is always paired with `can()` and is never the only authorization gate. It is not a rule-8 violation, but the docs should state the distinction.
- **INF-03:** `React.lazy` in `providers/query-provider.tsx:5` (devtools) is outside `lazy-pages.ts`. It is harmless: production gets a 120-byte stub that is never requested.
- **INF-04:** `vite.config.ts` has no `server.proxy`, so the browser calls the API cross-origin and the backend must configure CORS for the production origin.
- **INF-05:** `Page<T>` (`types/api.ts:6-18`) relies on Spring's `PageImpl` JSON. A backend upgrade to Spring Data 3.3+ with `VIA_DTO` serialization would nest the totals under `page`. The serialization mode should be pinned on the backend.
- **INF-06:** `invalidateRoleData` also refetches `roles.options` (staleTime ∞) on every role mutation. This is wasteful but harmless.
- **INF-07:** The password policy (`lib/auth/password-policy.ts`) is enforced only in the UI until BE-8 lands (QA-019).

### 3.5 Recommended CSP and security headers (hosting layer)

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';          # Radix/framer inject inline styles
  img-src 'self' data: blob:;
  font-src 'self';
  connect-src 'self' https://<api-host> wss://<asr-host>;
  frame-src 'self' blob:;                     # PDF preview in blob: tab/iframe
  object-src 'none';
  base-uri 'none';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
Permissions-Policy: microphone=(self), camera=(), geolocation=(), payment=()
Cross-Origin-Opener-Policy: same-origin
X-Frame-Options: DENY
Cache-Control: no-store                      # index.html only; hashed /assets/* → public, max-age=31536000, immutable
```

Before enforcing, verify the policy with `Content-Security-Policy-Report-Only`. The app has no inline scripts today. The inline theme script proposed in A11Y-08 would need a hash.

---

## 4. Endpoint contract matrix

Paths are relative to `VITE_API_BASE_URL` (`…/api/v1`). Two contract sources were compared:
- `api/api-docs.json`: 28 operations, stale, no response schemas.
- `api/API_INTEGRATION.md`: 46 operations, current. The code matches it field-for-field, including enums, `Page<T>` and `ApiErrorBody`, except where noted.

**Legend:**
- ✅ matches both sources
- ⚠️ matches the `.md`, with a gap
- ❌-spec: the spec is wrong or missing; the code matches the `.md`
- unused: no caller

**Columns:** "Request type" and "Response type" are the TS types used by the code. "Called from" is the lib function followed by its hook.

### 4.1 Auth

| Method | Path | Request type | Response type | Called from | Match? | Notes |
|---|---|---|---|---|---|---|
| POST | /auth/login | `LoginPayload` | `LoginResponse` (AuthUser + tokens) | `auth/api.ts:19` ← `use-login.ts:23` | ✅ | The spec wrongly requires a bearer token. |
| POST | /auth/refresh | `{refreshToken}` | `RefreshResponse` | `client.ts:95` (raw fetch) | ✅ | Single-flight. The refresh token is not rotated (`.md:95`). See API-03. |
| POST | /auth/register | `RegisterRequest` | `UserResponse` | `auth/api.ts:24` ← `use-create-user.ts:19` (when the creator has no ROLES:VIEW) | ⚠️ | Excluded from refresh (API-04). `reportInfo` is never sent. |

### 4.2 Users

| Method | Path | Request type | Response type | Called from | Match? | Notes |
|---|---|---|---|---|---|---|
| GET | /users | – | `UserResponse[]` | `users/api.ts:9` ← `use-users.ts:13` | ✅ | Plain array; `enabled` gated on USERS:VIEW. |
| GET | /users/{id} | – | `UserResponse` | `users/api.ts:18` | unused | No caller. |
| GET | /users/me | – | `UserResponse` | `users/api.ts:23` ← `use-session.ts:36`, `use-me.ts:13` | ✅ | `permissions!` assertion (CQ-01). |
| POST | /users | `CreateUserRequest` | `UserResponse` | `users/api.ts:14` ← `use-create-user.ts:19` | ❌-spec | |
| PUT | /users/{id}/role | `{roleId}` | `UserResponse` | `users/api.ts:27` ← `use-set-user-role.ts:11` | ❌-spec | |
| PUT | /users/{id}/enabled | `{enabled}` | `UserResponse` | `users/api.ts:32` ← `use-set-user-enabled.ts:14` | ❌-spec | Optimistic update with rollback (correct). |
| PUT | /users/me/report-info | `ReportInfo` | `UserResponse` | `users/api.ts:36` ← `use-set-report-info.ts:11` | ⚠️ | zod lacks `max(100)` (API-10). |
| PUT | /users/{id}/report-info | `ReportInfo` | `UserResponse` | `users/api.ts:40` ← `use-set-report-info.ts:26` | ⚠️ | Same. |
| DELETE | /users/{id} | – | `void` (204) | `users/api.ts:44` ← `use-delete-user.ts:11` | ✅ | The spec says 200 (API-05). |

### 4.3 Roles

| Method | Path | Request type | Response type | Called from | Match? | Notes |
|---|---|---|---|---|---|---|
| GET | /roles | – | `RoleResponse[]` | `roles/api.ts:4` ← `use-roles.ts:9` | ❌-spec | |
| GET | /roles/options | – | `RoleOptionsResponse` | `roles/api.ts:9` ← `use-roles.ts:18` | ❌-spec | staleTime ∞. |
| POST | /roles | `RoleRequest` | `RoleResponse` | `roles/api.ts:13` ← `use-role-mutations.ts:30` | ❌-spec | Name ≤ 100. |
| PUT | /roles/{id} | `RoleRequest` (full set) | `RoleResponse` | `roles/api.ts:18` ← `use-role-mutations.ts:53` | ❌-spec | |
| DELETE | /roles/{id} | – | `void` (204) | `roles/api.ts:22` ← `use-role-mutations.ts:78` | ❌-spec | |
| GET | /roles/{id} | – | – | – | unused | In the `.md` only. |

### 4.4 Form types and templates

| Method | Path | Request type | Response type | Called from | Match? | Notes |
|---|---|---|---|---|---|---|
| GET | /form-types | – | `FormTypeResponse[]` | `form-types/api.ts:4` ← `use-form-types.ts:10` | ❌-spec | The spec still says `/report-types`. |
| GET | /form-types/tree | – | `FormTypeTreeNode[]` | `form-types/api.ts:8` ← `use-form-types.ts:18` | ❌-spec | Renamed path. |
| GET | /form-types/roots | – | `FormTypeResponse[]` | `form-types/api.ts:13` ← `use-form-types.ts:25` | ❌-spec | Renamed path. |
| GET | /form-types/{id} | – | `FormTypeResponse` | `form-types/api.ts:17` ← `use-form-types.ts:42` (ancestor chain) | ❌-spec | Null `parentId` risk (API-08). |
| GET | /form-types/{id}/children | – | `FormTypeResponse[]` | `form-types/api.ts:21` ← `use-form-types.ts:32` | ❌-spec | Renamed path. |
| POST | /form-types | `FormTypeRequest` | `FormTypeResponse` | `form-types/api.ts:25` ← `use-form-type-mutations.ts:16` | ❌-spec | Witnesses ≤ 20 (client only, API-11). |
| PUT | /form-types/{id} | `FormTypeRequest` | `FormTypeResponse` | `form-types/api.ts:29` ← `use-form-type-mutations.ts:35` | ❌-spec | Always sends `parentId`. Doesn't invalidate reports (DAT-02). |
| DELETE | /form-types/{id} | – | `void` (204) | `form-types/api.ts:33` ← `use-form-type-mutations.ts:54` | ❌-spec | Renamed path. |
| GET | /form-types/{id}/template | – | `ReportTemplateResponse` | `report-templates/api.ts:8` ← `use-report-template.ts:14` | ❌-spec | A 404 means "no template". UI-03. |
| PUT | /form-types/{id}/template | `ReportTemplateRequest` | `ReportTemplateResponse` | `report-templates/api.ts:12` ← `use-report-template-mutations.ts:20` | ❌-spec | The spec's max lengths are not in zod. Blank fields are sent as `''`. |
| DELETE | /form-types/{id}/template | – | `void` (204) | `report-templates/api.ts:19` ← `use-report-template-mutations.ts:35` | ❌-spec | Stale cached data after the delete (UI-03). |
| GET | /form-types/{id}/template/pdf | – | `Blob` | `report-templates/api.ts:23` ← `use-report-template-mutations.ts:49` | ❌-spec | Popup opened after an `await` (UI-07). |
| GET | /report-templates | – | `ReportTemplateResponse[]` | `report-templates/api.ts:4` | unused | |

### 4.5 Crime types

| Method | Path | Request type | Response type | Called from | Match? | Notes |
|---|---|---|---|---|---|---|
| GET | /crime-types | – | `CrimeTypeResponse[]` | `crime-types/api.ts:5` ← `use-crime-types.ts:9` | ❌-spec | |
| POST | /crime-types | `CrimeTypeRequest` | `CrimeTypeResponse` | `crime-types/api.ts:9` ← `use-crime-type-mutations.ts:17` | ❌-spec | Name ≤ 150. |
| PUT | /crime-types/{id} | `CrimeTypeRequest` | `CrimeTypeResponse` | `crime-types/api.ts:13` ← `use-crime-type-mutations.ts:33` | ❌-spec | Invalidates reports (correct). |
| DELETE | /crime-types/{id} | – | `void` (204) | `crime-types/api.ts:17` ← `use-crime-type-mutations.ts:51` | ❌-spec | |
| GET | /crime-types/{id} | – | – | – | unused | In the `.md` only. |

### 4.6 Reports

| Method | Path | Request type | Response type | Called from | Match? | Notes |
|---|---|---|---|---|---|---|
| GET | /reports | `ReportListParams` | `Page<ReportResponse>` | `reports/api.ts:26` ← `use-reports.ts:9` | ⚠️ | The spec has `typeId`; the code sends `formTypeId`, `type`, `crimeTypeId` and `result` (all in the `.md`). URL params are unvalidated (API-07). No search param exists (QA-001/BE-1). |
| GET | /reports/{id} | – | `ReportResponse` | `reports/api.ts:56` ← `use-report.ts:8` | ✅ | NaN guarded. |
| POST | /reports | `ReportRequest` | `ReportResponse` (201) | `reports/api.ts:60` ← `use-report-mutations.ts:22` | ❌-spec | The spec body uses `reportTypeId`. |
| PUT | /reports/{id} | `ReportRequest` (full replace) | `ReportResponse` | `reports/api.ts:64` ← `use-report-mutations.ts:39` | ❌-spec | UI-02 and UI-04. |
| PATCH | /reports/{id}/result | `{result}` | `ReportResponse` | `reports/api.ts:69` ← `use-report-mutations.ts:61` | ❌-spec | |
| DELETE | /reports/{id} | – | `void` (204) | `reports/api.ts:73` ← `use-report-mutations.ts:82` | ⚠️ | The spec says 200. A 409 when the report is CLOSED is handled. |
| GET | /reports/options | – | `ReportOptionsResponse` | `reports/api.ts:36` ← `use-report-options.ts:23` | ❌-spec | Refetched on every report mutation (DAT-03). |
| GET | /reports/statistics | `StatisticsRange` | `ReportStatisticsResponse` | `reports/api.ts:40` ← `use-report-statistics.ts:9` | ❌-spec | Matches `.md` §7.7 field-for-field. |
| GET | /reports/export | `ReportFilterParams` | `Blob` (xlsx) | `reports/api.ts:51` ← `use-report-mutations.ts:116` | ❌-spec | Filename uses the UTC date (API-09). |
| GET | /reports/{id}/pdf?copy= | `copy?` | `Blob` | `reports/api.ts:78` ← `use-report-mutations.ts:105` | ⚠️ | `copy` is not in the spec. UI-07. |

### 4.7 Client (`src/lib/api/client.ts`)

| Check | Result |
|---|---|
| Concurrent 401s | ✅ Only one refresh runs at a time (`refreshPromise ??=`), and there is no infinite loop (`_isRetry`, and auth paths are excluded). A 401 arriving after the refresh completes triggers one extra refresh. That is harmless, because refresh tokens aren't rotated. |
| Retrying non-idempotent requests after a refresh | ✅ Safe: a 401 is rejected by the auth filter before the handler runs. ❌ However, a failed retry forces logout (API-02). |
| Timeouts, AbortController, cancel on unmount | ❌ None (SEC-04). |
| Credentials and headers | ✅ Bearer header on every call; `Content-Type` only when there is a body; `Accept: */*` for blobs. There is no `credentials: 'include'`, so cookies are never sent to the API. |
| Error normalization | ✅ `ApiError{status, details}`. Empty and non-JSON bodies are tolerated. `ApiErrorBody` matches `.md` §3. ⚠️ English messages are string-matched (API-06). |
| 403 handling | ✅ Never logs out. `QueryCache`/`MutationCache` `onError` invalidates the session so `/users/me` is refetched. ⚠️ A 403 caused by a missing token is shown as "no permission" (API-03). |
| Disabled account | ✅ `'User is disabled'` on login shows a distinct message. During a session, a forced logout shows «تم تعطيل حسابك…». |
| Offline or network failure | ⚠️ Queries retry twice. Mutations show generic fallback toasts. There is no offline indicator. |

---

## 5. Performance measurements

**Lighthouse 13.5, `/login`**
- Setup: headless Chrome, simulated throttling, production build served by `vite preview`.
- Only /login could be measured. With no backend or accounts provided, the authenticated pages could not be reached. A local backend on :8080 was blocked during every run, so no requests reached it.

| | Perf | A11y | Best Pr. | SEO | FCP | LCP | TBT | CLS | Speed Idx | TTI |
|---|---|---|---|---|---|---|---|---|---|---|
| Mobile | **89** | 98 | 100 | 82 | 2.9 s | **3.0 s** | 0 ms | 0 | 2.9 s | 3.0 s |
| Desktop | 100 | 98 | 100 | 82 | 0.6 s | 0.6 s | 0 ms | 0 | 0.6 s | 0.6 s |

- **INP:** not measurable in a lab run. TBT is 0 ms on both profiles.
- **LCP element:** the `h3` «تسجيل الدخول».
- **Failing audits:**
  - render-blocking CSS: about 600 ms on mobile
  - unused JS: 89 KiB
  - unused CSS: 25.4 of 26.7 KB
  - no preload or preconnect for fonts
  - `landmark-one-main`
  - `meta-description`
  - `robots.txt` (the SPA fallback returns HTML)
- **Console:** no errors on /login.

**Login transfer: 345 KiB**
- JS: about 205 KB. vendor-react 58.5, vendor-motion 39.3, vendor-radix 36.8, index 26.1, vendor-forms 24.6, vendor-query 12.7, login chunks 7.5.
- CSS: 26.7 KB.
- **Fonts: Regular 54.7 KB and Bold 55.8 KB, not compressed** (32% of the page).

**Bundle composition** (minified, from source-map-explorer):

| Chunk | Contents |
|---|---|
| dashboard-page | recharts 254.7 KB, d3-* 54.8 KB, es-toolkit 14.4 KB, decimal.js-light 12.7 KB, @reduxjs/toolkit 10.9 KB, immer 9.6 KB, app code 23.1 KB |
| vendor-motion | framer-motion 111.7 KB. The only first-paint user is the toast provider. |
| vendor-radix | select 17.1 KB, menu 12.9 KB, floating-ui 22 KB. On /login only label and slot are needed. |
| entry | app code 31.2 KB, tailwind-merge 19.5 KB, react-helmet-async about 14 KB, lucide 8.5 KB (24 icons) |

- **Duplicated modules:** none. Each package resolves once.
- **lucide-react:** tree-shakes correctly (47 icon modules in the whole app).
- **React Query Devtools:** not shipped.
- **react-router production build:** forcing its production build saves only 0.5 KB gzip, so it's not worth changing.

**CSS**
- 160.7 KB (26.9 KB gzip), of which Tailwind accounts for 39.8 KB.
- 78% of the custom classes are dead.
- A measured prune takes it to 83.8 KB (15.5 KB gzip).

**Fonts, OTF → woff2 (measured)**
- Regular: 55,704 → 28,472 B
- Bold: 56,812 → 28,788 B
- Light: 55,204 → 27,468 B
- About 49% smaller.

**Runtime**
- Context values are stable: auth, theme and toast all use `useMemo`, and `useCan` is memoized.
- No leaked listeners or timers were found, other than DIC-01.
- Page sizes are small (reports 20 server-side, the others 10–15 client-side), so no virtualization is needed.
- `use-animated-number` cleans up its animation.
- The session query refetches `/users/me` on each tab focus once 60 s have passed (by design).

---

## 6. Prioritized remediation roadmap

### Fix now (before production, about 3–4 dev-days in total)
1. **UI-01:** keep tabs in `serialize` and handle the Tab key; add a unit test. Then check an existing report containing tab rows.
2. **UI-02:** error state on the edit page.
3. **UI-03:** template editor error state, and clear the cache on delete.
4. **API-02:** split the refresh and retry error handling.
5. **DIC-01, DIC-02:** attempt token after `getUserMedia`; graceful EOF on stop.
6. **SEC-01, SEC-03, SEC-07:** bind Vosk to 127.0.0.1 in dev and remove the `model` config branch. For production, decide on TLS, Origin and token, and require `wss://` in `env.ts`.
7. **A11Y-01:** focus ring on Button and the dialog close button.
8. **A11Y-02:** name the rich-text fields.
9. **ARC-03 (part):** add a `.prettierignore` and run `format` once, so CI can have a format gate.

### Next sprint
- **Session and security:**
  - API-03: use the refresh token, or drop it deliberately.
  - SEC-02: remove PII from the snapshot cookie, and align its lifetime.
  - SEC-04: timeouts and `signal`.
  - SEC-05: CSP and headers.
  - Push BE-6 (logout and rotation) with the backend team.
- **Data correctness:**
  - PERF-01: dashboard aggregation.
  - DIC-03: line breaks.
  - DIC-04: stricter keyword matching, and block unfilled markers.
  - UI-04, UI-05.
  - DAT-02, DAT-03.
- **Accessibility:** A11Y-03 to A11Y-10 (contrast tokens, drawer, form-field ARIA, theme flash, toasts, login landmarks).
- **Performance:** PERF-02, PERF-04, PERF-05 (motion off the login path, lazy layout, woff2 plus preload). Together these take about 125 KB off the login page.
- **UX and RBAC:** UI-06 to UI-10, DAT-01 (one error policy).
- **Docs:** ARC-01, ARC-02; regenerate `api-docs.json` (API-01).

### Later
- PERF-03 (charts), PERF-06 (CSS purge), PERF-07, PERF-08.
- UI-11 (move to a data router so `useBlocker` is available).
- ARC-03: `no-restricted-imports` architecture zones.
- All remaining Low items: CQ-01 to CQ-09, A11Y-11 to A11Y-15, UI-L*, API-04 to API-11, ARC-04, ARC-05.
- Dependency patch bumps. Major upgrades (React 19, Vite 8, Tailwind 4, zod 4) are a separate project.

---

## 7. Areas verified clean

- **Architecture rules 1–9** hold in substance:
  - 0 `lib/*/api` imports and 0 `fetch` calls in components or pages.
  - React Query is used only in hooks, plus the provider and client infrastructure.
  - All 11 pages are lazy-loaded through `lazy-pages.ts`.
  - `components/ui` has no business logic.
  - 0 `any`.
  - Every toast goes through `notify`.
  - `document.cookie` appears only in `lib/cookies`.
  - Zustand holds only UI booleans.
- **Route guards:** every authenticated route is guarded as in the §2 table, and sidebar links mirror the guards exactly. A direct `/admin/*` URL visited without permission redirects to `/` with one toast, and the lazy chunk and its queries never run. HomeRedirect falls back to `/profile`, so it can't loop.
- **`exceedsPermissions` and `withRequiredPermissions`:** correct and fail closed. Role, user and permission-matrix choices beyond the editor's permissions are disabled. The ADMIN role is read-only, built-in roles have no delete, and the signed-in user's own row has no actions.
- **Stale permissions:** role mutations invalidate `auth.session`, any 403 triggers a `/users/me` resync, and the session refetches on focus after 60 s.
- **No open redirect after login:** `from` comes only from router state; only pathname and search are used, `/login` is excluded, and a different user's saved link is ignored.
- **XSS:** there is no `dangerouslySetInnerHTML`, `document.write` or `eval`. `innerHTML` is used only for a static SVG and for clearing. Dictated and loaded text goes in via `createTextNode`, and report text is rendered as React nodes.
- **Secrets and build:**
  - `.env` is gitignored and holds only localhost URLs.
  - No secrets are tracked.
  - No sourcemaps in production.
  - The only app `console` call is the env validation error, which logs field names, not values.
  - React Query Devtools are not shipped.
  - `npm audit`: 0 vulnerabilities.
- **Pagination:** reports use `Page<T>`, the others are client-side arrays. `?page=` is kept in sync, clamped after a delete on the last page (with `replace`), and a malformed value is dropped.
- **Dates:** only local `YYYY-MM-DD` strings are sent to the API, and there are no `toISOString()` shifts apart from API-09. Ranges are inclusive, from > to is prevented, and Arabic digits are normalized. All `Intl` formatting uses `ar-SY-u-nu-latn`.
- **Enums, DTOs and `ApiErrorBody`** match `API_INTEGRATION.md` field-for-field.
- **Double submit:** every submit, confirm and switch control is disabled while its mutation is pending. There is one small window, covered in UI-L5.
- **List keys, dialog reset, controlled inputs:**
  - Stable ids are used as list keys everywhere.
  - Dialogs are keyed or conditionally mounted per entity, so reopening one for a different entity never shows stale data.
  - No controlled/uncontrolled switches were found, except the one in UI-L10.
- **Optimistic enable toggle:** correct (cancel in-flight queries, snapshot, roll back, invalidate).
- **RTL:** `lang="ar" dir="rtl"`, Radix `DirectionProvider`, and logical classes almost everywhere (see A11Y-15 for the exceptions). Custom widgets (Switch, Checkbox, Chips, SegmentedTabs, SearchableSelect) use real elements with the right roles and RTL-aware arrow keys.
- **Bundles:** no duplicated modules, lucide tree-shakes, and there is no heavy date library.

---

## 8. Open questions and anything not verified

1. **Phase 9 (functional end-to-end) was not run.** No non-production API URL or per-role test accounts were provided. Needed: a staging base URL plus an admin account and a limited account (the QA plan used a `REPORTS:VIEW/UPDATE` + `FORM_TYPES:VIEW` role). Note that a local backend was listening on :8080 during the audit. It was deliberately blocked and never called.
2. **Live API diff not done.** For the same reason, the GET responses were not diffed against `src/types/`. The comparison was made against `API_INTEGRATION.md` only.
3. **UI-01 data impact.** Confirm that production templates or reports actually contain `\t` signature rows. `API_INTEGRATION.md:496` says they do. If they do, check the reports that were already edited, because some may already be corrupted.
4. **SUSPECTED items that need a browser:**
   - DIC-03: line breaks on Enter or paste in Chrome and Firefox.
   - UI-07: popup blocking on a slow PDF.
   - UI-04: a background refetch resetting the edit form.
   - A11Y-08: the localStorage crash when storage is blocked.
   - A11Y-15: letter-spacing on Arabic.
5. **Vosk in production (SEC-01).** How and where will the ASR server be deployed (host, TLS, network exposure)? This decides whether SEC-01 is a dev-only or a production issue.
6. **Backend behaviour to confirm:**
   - Does DELETE ever return 200 with an empty body (API-05)?
   - Is `parentId` ever `null` (API-08)?
   - Does Spring restrict sortable properties (API-07)?
   - What `Page` serialization mode is used (INF-05)?
   - What CORS policy applies to the production origin (INF-04)?
7. **Accepted risks to record:**
   - UI-11: no in-app navigation guard (QA-029 scope decision).
   - The open backend security items QA-005, 006, 007, 019 and 020 (BE-6 to BE-9). They need sign-off before launch.
8. **INP:** not measurable in a lab run. Measure it in the field (web-vitals) once deployed.
9. **Colour contrast on authenticated pages** was computed from the tokens rather than measured by Lighthouse, because those pages couldn't be reached. The computed values are exact for the token pairs listed. Component-level overrides were not exhaustively enumerated.

---

## 9. Testing gap and proposed strategy (Phase 10 — proposal only, nothing installed)

**Minimal setup** (needs approval, per `CLAUDE.md ` §20):
- **Unit and integration:** Vitest with a `jsdom` environment, `@testing-library/react`, `@testing-library/user-event`, and MSW 2 for the network.
  - Put tests next to the code as `*.test.ts(x)`.
  - One `src/test/setup.ts` that starts the MSW server and resets the `queryClient` between tests.
- **End-to-end:** Playwright with an admin project and a limited-role project against staging. Reuse the QA plan's regression list and seed and clean test data through the API.
- **CI:** typecheck → lint → format:check → vitest → build → Playwright smoke on PRs to `main`.

**Top 15 test cases, ranked by risk:**

| # | Test | Layer | Covers |
|---|---|---|---|
| 1 | `serialize()` keeps `\t`, `\n`, filled and unfilled slots, and blank lines; round-trips template text unchanged | unit | UI-01, DIC-03 |
| 2 | The edit page renders an error state (not the form) when `GET /reports/:id` returns 500, 404 or 403, and never PUTs | RTL + MSW | UI-02 |
| 3 | `client.ts`: 401 → exactly one refresh for 5 concurrent requests → all retried with the new token | unit + MSW | refresh single-flight |
| 4 | `client.ts`: after a successful refresh, a retried 409 or 500 is rethrown **without** logout; a refresh 401 **does** log out, with the disabled-account message when applicable | unit + MSW | API-02 |
| 5 | Template editor: a 500 on load shows an error with no Save button; after a delete, the fields are empty and Save doesn't re-create the template | RTL + MSW | UI-03 |
| 6 | `use-dictation`: unmount while `getUserMedia` is pending → tracks stopped, no WebSocket opened; Stop sends EOF and applies the final result | hook + fake WS | DIC-01, DIC-02 |
| 7 | `exceedsPermissions` / `withRequiredPermissions` / `can()` truth table, including null `held` and unknown resources | unit | RBAC |
| 8 | Route guards: each route with and without its permission redirects correctly, with one toast; HomeRedirect with zero permissions goes to `/profile` | RTL (memory router) | authorization |
| 9 | 403 on any query → `auth.session` invalidated → the `/users/me` refetch hides the button | RTL + MSW | stale permissions |
| 10 | Report form: zod cross-field rules (future date, crimeDate ≤ reportDate, crime type requires place and date) and mapping of 400 `fieldErrors`, including unmapped keys | RTL | UI-05, validation |
| 11 | Reports list: `?page` clamps after deleting the last row; filters round-trip through the URL; invalid `sort`/`from` are ignored | RTL + MSW | pagination, API-07 |
| 12 | Session: access cookie missing plus a valid refresh cookie → session restored (after the API-03 fix) | unit + MSW | API-03 |
| 13 | `date-time-templates`: a corpus of common legal phrases produces no slots; real date and time phrases do | unit | DIC-04 |
| 14 | E2E: login as admin → create report → edit (with a tab signature row) → PDF opens → seal → delete blocked (409) → logout clears cookies and cache | Playwright | main flow |
| 15 | E2E: a limited role can't see or reach `/admin/users` or `/admin/roles`; changing that role in another tab takes effect on the next focus or 403 | Playwright | RBAC end-to-end |
