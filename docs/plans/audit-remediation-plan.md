# Audit Remediation Plan and Execution Prompt

> **Source:** `docs/audit/AUDIT_REPORT_2026-09-29.md`. It lists 94 findings: 1 Critical, 12 High, 31 Medium, 43 Low and 7 Info.
> **Branch:** work on `fix/audit-remediation`, created from `develop` in Phase 0. Commit per phase and never push.
> **Rules you must follow:** `CLAUDE.md ` (the filename ends in a space until Phase 11 renames it), `ARCHITECTURE.md`, and `api/API_INTEGRATION.md`, which is the live API contract. **`api/api-docs.json` is out of date and must not be used.**
> **Status:** not started.
>
> **This file has two parts.**
> - **Part A** is the plan: decisions, phases, tasks and acceptance criteria.
> - **Part B** is a prompt you paste into Claude Code, opened at the repo root, to carry out Part A one run at a time.

---

# PART A: The plan

## A0. How to use this plan

1. The product or tech owner reads **§A3 Decisions** and writes any answers that differ from the recommended default into the **Decisions log** (§A3.1). Any decision left blank uses the recommended default.
2. Claude Code carries out one **run** at a time (see §A4), using the prompt in Part B. The only thing that changes between runs is the prompt's `Scope` line.
3. Each finding ID (UI-01, API-02, …) points to its evidence in the audit report. When a task below is unclear, read that finding in the audit report first.
4. Items the frontend cannot fix are listed in **§A6 Hand-off** with a number for the backend, infra or DBA team. This repo only tracks them.

## A1. Goals and definition of done

- **Milestone M1, ready to release (end of Run 1):** every "Fix now" item in the audit is closed.
  - UI-01, UI-02, UI-03 (report and template text corruption or overwrite)
  - API-02 (logout on a failed retry)
  - DIC-01, DIC-02 (dictation)
  - The frontend part of SEC-01, plus SEC-03 and SEC-07 (Vosk exposure and cleartext `ws://`)
  - A11Y-01, A11Y-02 (focus indicator and the report text fields' names)
  - The format part of ARC-03
- **Milestone M2, all clear (end of Run 4):** every finding in the coverage matrix (§A7) is either **closed**, **handed off** (§A6), or recorded as an **accepted risk or won't-fix** with a reason.
- **Every phase ends with:**
  - `npm run typecheck && npm run lint && npm run format:check && npm run build` all passing (lint must show 0 warnings).
  - Every acceptance criterion checked. Say whether each was checked in a browser or only by reading the code.
  - A commit whose message lists the finding IDs it closes.
- Nothing on the regression checklist (§A8.2) gets worse.

## A2. Guardrails

**Architecture.** The existing architecture is a contract. The flow is `lib` (pure API functions) → `hooks` (the only layer that uses React Query) → `pages` and `components`. `components/ui` has no business logic, route guards live in `route-config.tsx`, and `can()` / `useCan()` handle permissions.

**Hard constraints:**
- **No new npm runtime dependencies.** Removing one is fine (react-helmet-async, `@radix-ui/react-tooltip`). Adding dev tooling for tests is only allowed in Phase 13, after approval.
- **All user-facing text stays in Arabic.** This includes new messages, `aria-label`s and `title`s. The app stays RTL-only.
- **Colours come only from tokens** (`src/styles/globals.css`). Don't hard-code hex values in components.
- **Never use `dangerouslySetInnerHTML`.** Don't insert user content through `innerHTML`.
- **Don't invent backend contracts.** If a task needs an endpoint or field that Phase 0 didn't confirm, skip it and report it as blocked.
- **Make the smallest correct change.** Only refactor where a finding requires it. When code only moves (CQ-07, CQ-04), its behaviour must not change.
- **Comments:** write them only where the reason isn't obvious, and fix any comment your change makes wrong.
- **`React.lazy()` stays in `routes/lazy-pages.ts` only.** Phase 6 and Phase 10 extend that rule to cover the lazy layout and heavy widgets, and Phase 11 updates the doc to say so.
- **Backend:** use only the **local development** backend (`http://localhost:8080`), never staging or production. Phase 0 is read-only apart from one delete-status probe. Name any test data with the prefix `AUDIT-FIX` and delete it before the phase ends.

## A3. Decisions (recommended default in **bold**)

| # | Question | Options | Recommended default |
|---|---|---|---|
| DA-1 | Session model (API-03) | A: actually use the 30-day refresh token · B: document 24 h sessions and stop storing the refresh token | **A.** Refresh when the access cookie is missing but the refresh cookie exists, and let the guards accept that state. Once BE-17 moves the refresh token into an HttpOnly cookie, the frontend stops handling it. |
| DA-2 | PII in the session snapshot cookie (SEC-02) | keep · drop email · drop name and email | **Drop `fullName` and `email`.** The snapshot keeps only `{id, role, permissions}`. The name comes from `/users/me`, with a skeleton until it loads. |
| DA-3 | Tab key inside the report text fields (UI-01) | always insert `\t` · never · only where needed | **Insert `\t` only when the caret is on a line that starts with `@`** (a signature row). Everywhere else, Tab and Shift+Tab move focus as normal, and **Esc then Tab** always leaves the field. Say this in the field hint. This avoids a keyboard trap (WCAG 2.1.2). |
| DA-4 | Unfilled `____DATE/TIME/TEXT____` slots on save (DIC-04) | block · strip silently · allow | **Block** with a field error: «يوجد حقل تاريخ أو وقت أو نص لم يُعبّأ في هذا النص. املأه أو احذفه.» |
| DA-5 | Where the dashboard trend numbers come from (PERF-01) | 6 × `/reports/statistics` · a new backend `byMonth` | **6 statistics calls now** (one per month, via `useQueries`). Switch to BE-13 when it exists. |
| DA-6 | recharts cost (PERF-03) | lazy-load the chart widgets · rewrite them as SVG | **Lazy-load** the two chart components (a small change). SVG is a later option. |
| DA-7 | Contrast token changes (A11Y-03/04/06/11) | Option A: swap the dark primary and destructive tokens · Option B: add separate text tokens | **Option A**, plus the light token values in Phase 9. **This needs design sign-off before Run 3**, because brand shades change slightly. |
| DA-8 | Stricter client rules against older stored values (API-11) | always enforce · accept an unchanged older value | **Accept an unchanged older value** (national ID, witness count). A new or changed value must satisfy the rule. |
| DA-9 | `CLAUDE.md ` filenames (ARC-02) | keep · rename | **Rename** to `CLAUDE.md` with `git mv`, and delete the stale `claude/rules/` copy. |
| DA-10 | Editing your own role (UI-10) | warn and confirm · lock cells | **Warn and confirm**, listing the permissions the user is about to lose. |
| DA-11 | Row actions on users whose role exceeds the editor's permissions (UI-09) | hide · disable with a reason | **Hide** the menu actions and disable the switch. Name the reason in `aria-description` and `title`: «دور هذا المستخدم يتجاوز صلاحياتك». |
| DA-12 | Request timeouts (SEC-04) | – | **30 s** for JSON requests, **120 s** for blobs (PDF and Excel). |
| DA-13 | Move to a data router so `useBlocker` works (UI-11) | now · later | **Later.** It is Phase 12 and needs approval. It reverses the QA-029 scope decision. |
| DA-14 | Test tooling (Vitest, RTL, MSW, Playwright) | – | **Phase 13, only after explicit approval** (`CLAUDE.md ` §20). |
| DA-15 | Vosk `config.model` override (SEC-01) | keep · remove | **Remove** it. The server always uses the model it started with. |
| DA-16 | How to remove dead CSS (PERF-06) | delete dead rule blocks · add PurgeCSS to the build | **Delete dead blocks by hand**, one family per commit. Adding PurgeCSS would be a new dependency. |
| DA-17 | `api/api-docs.json` (API-01) | delete · keep with a warning | **Keep it**, add `api/README.md` saying it is out of date, and track regeneration as BE-15. |
| DA-18 | Keeping LoginPage lazy (PERF-08) | lazy · static | **Keep it lazy** (ARCHITECTURE rule 3). Record the extra round trip (about 7.5 KB) as an accepted cost. |

### A3.1 Decisions log (owner fills in; blank means the default applies)

| # | Decision | By / date |
|---|---|---|
| | | |

## A4. Phases at a glance

| Phase | Theme | Findings | Effort (dev-days) | Risk | Run |
|---|---|---|---|---|---|
| 0 | Preflight and tooling baseline | ARC-03 (format and ignore files), backend probes | 0.5 | Low | 1 |
| 1 | Data integrity | UI-01, DIC-03, UI-02, UI-04, UI-03, UI-05 | 1.5 | **High** (contentEditable) | 1 |
| 2 | API client and session | API-02, API-03, SEC-02 (FE), SEC-03, SEC-04, API-04, API-05, SEC-06, API-06, API-07, API-08, API-09, SEC-08 | 2 | **High** (guards and session) | 1 |
| 3 | Dictation and ASR server | DIC-01, DIC-02, DIC-05, DIC-04, DIC-06, UI-L6 (slot part), SEC-01 (dev), SEC-07 | 2 | Medium | 1 |
| 4 | Accessibility blockers | A11Y-01, A11Y-02 | 0.5 | Low | 1 |
| **M1** | **Ready to release** | | **≈ 6.5** | | |
| 5 | Error policy, cache, report flows | DAT-01, DAT-02, DAT-03, DAT-04, INF-06, UI-06, UI-07, UI-L1, UI-L2, UI-L3, UI-L5, UI-L6 (print part), API-10, API-11 | 2 | Medium | 2 |
| 6 | Dashboard and statistics | PERF-01, PERF-03, UI-L4, A11Y-15 (charts) | 1.5 | Medium | 2 |
| 7 | Admin UX and RBAC | UI-08, UI-09, UI-10, UI-L7, UI-L8, UI-L9, UI-L10 | 1.5 | Low | 2 |
| 8 | Accessibility (the rest) and toast rewrite | A11Y-05, 07, 09, 10, 12, 13, 14, 15 (rest), PERF-02 (toast part), CQ-06 (toast part) | 2 | Medium | 3 |
| 9 | Theming and contrast (needs DA-7) | A11Y-03, 04, 06, 08, 11, CQ-06 (rest) | 1 | Medium (visual) | 3 |
| 10 | Performance | PERF-02 (chunk), PERF-04, PERF-05, PERF-06, PERF-07, PERF-08 | 2 | **High** (CSS purge) | 3 |
| 11 | Docs, contract and code quality | ARC-01, 02, 03 (lint zones), 04, 05, API-01, SEC-05 (doc), CQ-01 to CQ-09, INF-02, INF-03 | 2 | Low | 4 |
| **M2** | **All clear** | | **≈ 18** | | |
| 12 | *(needs approval)* Data router with `useBlocker` | UI-11 | 1.5 | Medium | 5 |
| 13 | *(needs approval)* Test infrastructure and the top 15 tests | audit §9 | 3 | Low | 5 |

**Why this order:**
- Data loss and corruption come first.
- The client and session come next, because every later phase depends on correct error handling.
- The release blockers are finished by Run 1.
- The error-handling helpers from Phase 5 are reused in Phases 6 and 7.
- The toast rewrite in Phase 8 has to land before Phase 10 can drop the `vendor-motion` chunk.
- The CSS purge (Phase 10) comes after the token work (Phase 9), so screenshots only need comparing once.
- The docs (Phase 11) come last, so they describe the final code.

---

## A5. Phases in detail

Each task below gives the **finding ID**, the **files**, the **change**, and the **acceptance** criteria. Line numbers are from commit `d561460`, so find the code by content if it has moved.

### Phase 0: Preflight and tooling baseline

**0.1 Branch.**
- Run `git status`. If the working tree isn't clean, **stop and report**. Never commit or discard someone else's work.
- Otherwise run `git switch -c fix/audit-remediation develop`.
- If the branch already exists, switch to it and continue from its last commit.

**0.2 Baseline.** Run the four gates and record the results. `format:check` is expected to fail.

**0.3 Backend probes.** Use the local dev backend only. Record the results in the Phase 0 section of the final report and **print no personal data**. Sign in with the dev admin account from `API_INTEGRATION.md` §2.5.

| Probe | Why | How |
|---|---|---|
| (a) Do stored report texts contain `\t` signature rows, and do any `@` lines lack a tab? | Sizes UI-01's impact on existing data and feeds DATA-1 | `GET /reports?size=100`. For each of the five text fields, count lines that start with `@` and contain a `\t`, and count those that don't. **Report only the counts.** |
| (b) DELETE status code | API-05 | Create a crime type named `AUDIT-FIX-probe`, delete it, and record the status (204 or 200) and whether a body came back. The record must be gone afterwards. |
| (c) `parentId` on root form types | API-08 | `GET /form-types`: is it absent, or `null`? |
| (d) Does the backend accept arbitrary `sort` values? | API-07, BE-16 | `GET /reports?sort=creator.password,asc&size=1`. Record **only** the HTTP status. |
| (e) `Page` serialization | INF-05 | Check whether `totalElements` sits at the top level or under `page`. |
| (f) Request with no token | API-03 | `GET /users/me` without `Authorization`. Expect 403 with an empty body; record what actually comes back. |
| (g) Deleting a role that exceeds your permissions | UI-L8 (the suspected role-delete item) | Optional, and only with `AUDIT-FIX` roles and users you create yourself, then delete. Skip it if setting it up needs more than 10 requests. |

If the backend is down, say so, mark the probes "not verified", and carry on.

**0.4 Tooling (ARC-03, format part).**
- Add a `.prettierignore` containing `vosk-model/`, `dist/`, `docs/`, `api/` and `package-lock.json`.
- Add `'vosk-model'` to the ESLint `ignores` list in `eslint.config.mjs`.
- Run `npm run format`.
- **Commit this on its own:** `Format code base with Prettier and ignore generated/vendor paths (ARC-03)`. The diff must be formatting only; confirm that typecheck, lint and build still pass.
- **Acceptance:** `npm run format:check` exits 0.

### Phase 1: Data integrity

**1.1 UI-01: keep tabs and newlines in the report text editor** (`src/components/shared/dictation-rich-text.tsx:61-81`).
- Replace `out.replace(/[^\S\n]+/g, ' ').trim()`. Collapse only runs of two or more U+0020 spaces into one (`/ {2,}/g`). Trim only leading and trailing spaces and newlines from the whole value (`/^[ \n]+|[ \n]+$/g`). **Never** touch `\t`.
- Keep the padding around slots that stops words fusing together.
- Tab key, following DA-3: in `onKeyDown`, if the key is Tab (no Shift) and the caret's line starts with `@`, prevent the default and insert `\t` at the caret. Otherwise do nothing, so focus moves. Track Esc so that Esc followed by Tab always leaves the field.
- Update the hint in `report-form.tsx:366-367` to explain this.
- The root already has `whitespace-pre-wrap`, so tabs will display.
- **Acceptance:**
  1. Open a report whose المتن contains `@شرطي⇥شرطي⇥مساعد أول⇥صاحب الإفادة` on its own line, type one character elsewhere, and save. The PUT body in DevTools keeps every `\t` and `\n`.
  2. `ReportTextView` shows the row as separate cells, and the PDF shows columns.
  3. Tab on a normal line moves focus to the next field.
  4. Tab on an `@` line inserts a tab. Esc then Tab leaves the field.

**1.2 DIC-03: line breaks on Enter and paste** (same file, lines 61-81 and 223-245).
- Stop the browser inserting block elements.
  - Where supported, set `contentEditable="plaintext-only"`, and feature-detect it.
  - Otherwise, in `onBeforeInput`, handle `insertParagraph` and `insertLineBreak` by inserting a `\n` text node at the selection.
  - Add an `onPaste` handler that inserts `clipboardData.getData('text/plain')` with `\r\n` normalised to `\n`.
- Make `serialize` recursive. A `DIV` or `P` block adds a `\n` before its content when it isn't the first node, and slot inputs are read at any depth.
- Remove `flex flex-wrap items-center` from the editable root, then check that the slots still line up visually.
- Read how the `[value]` effect rebuilds the DOM from the string, and keep the two directions symmetric.
- **Acceptance:**
  1. "abc⏎def⏎⏎ghi" saves with both line breaks and the blank line.
  2. Pasting formatted text from Word or a web page gives plain text with its line breaks.
  3. A slot that ends up inside a block keeps its value.
  4. Check in Chrome and Firefox, and in Safari if you have it. If you can't test a browser, say so.

**1.3 UI-02 and UI-04: edit page load failures, and not resetting on refetch** (`src/pages/reports/report-form-page.tsx`).
- Split the file into two components:
  - `ReportFormPage` is the loader. It reads the params, calls `useReport`, and handles the pending, **error**, closed and invalid-id states.
  - `EditReportForm({ report })`, in the same file, sets up the form **once** from `reportToFormValues(report)`.
- Adapt `useReportForm` in `report-form-schema.ts` so the edit form uses `defaultValues` (or `values` with `resetOptions: { keepDirtyValues: true }`). A background refetch must never overwrite edits the user has made. The create dialog must keep working as it does now.
- Error states use `components/shared/empty-state.tsx`:
  - **404:** «هذا الضبط غير موجود أو تم حذفه.» with a link back to the list.
  - **403:** `FORBIDDEN_MESSAGE`.
  - **Anything else:** «تعذّر تحميل الضبط.» with a «إعادة المحاولة» button that calls `refetch`.
- **Acceptance:**
  1. Block `GET /reports/:id` in DevTools. The error state shows, no form renders, and no PUT is ever sent.
  2. Use an id that doesn't exist. The 404 state shows.
  3. Make an edit, switch tabs, and come back after 60 s. The edits are still there.

**1.4 UI-03: template editor error state and delete** (`src/components/form-types/form-type-template-form.tsx`, `src/hooks/report-templates/use-report-template.ts`, `use-report-template-mutations.ts`).
- When `isError && !isNotFound`, show an error state with a retry button and hide the form, «حفظ» and «حذف النص».
- Set `values: isNotFound ? undefined : templateToFormValues(template)`.
- In the delete mutation's `onSuccess`, call `queryClient.removeQueries({ queryKey: queryKeys.reportTemplates.detail(id) })` **before** anything refetches. In TanStack v5, `setQueryData(…, undefined)` does nothing, so don't use it.
- **Acceptance:**
  1. Block the template GET. The error state shows with no Save or Delete buttons.
  2. Delete a template. The fields become empty and the "no text yet" note shows. Pressing Save with empty fields doesn't restore the old text.
  3. The create flow for a form type with no template (404) still works.

**1.5 UI-05: 400 errors that don't match any field** (`report-form-schema.ts:263-273`).
- Count how many field errors were actually applied. If none were, set `root` to the first backend message, or to «البيانات المُرسلة غير صالحة. راجع الحقول وحاول مرة أخرى.»
- **Acceptance:** a 400 whose `fieldErrors` only contain an unknown key shows the root error above the actions. The Save button isn't left silently doing nothing.

**Commit(s):** `Keep report text tabs and line breaks, and guard edit and template forms against load errors (UI-01, DIC-03, UI-02, UI-04, UI-03, UI-05)`. Split this into two commits if the editor changes get large.

### Phase 2: API client and session

**2.1 API-02: a failed retry must not log the user out** (`src/lib/api/client.ts:175-193`).
- Put the refresh and the retry in separate `try` blocks.
- **Refresh failure:**
  - If it is an `ApiError` (401, 400 or 403 from `/auth/refresh`), call `forceLogoutRedirect` and rethrow. This keeps the disabled-account message.
  - If it is a network `TypeError` or a timeout, rethrow **without** logging out.
- **Retry failure:** log out only if the retry returns 401. Rethrow everything else unchanged.
- **Acceptance:**
  1. Set the access cookie to garbage (keep the refresh cookie), then save a report with a duplicate number. The user stays signed in and sees the 409 message.
  2. Set the refresh cookie to garbage too. The user is sent to login with «انتهت جلستك…».

**2.2 API-03: actually use the refresh token, following DA-1** (`client.ts`, `lib/session/session.ts`, `hooks/auth/use-session.ts`, `components/auth/require-auth.tsx`, `guest-only-route.tsx`).
- In `request()`, for any path that isn't an auth path: if there is no access token but there is a refresh token, `await` the same single-flight refresh **before** the first attempt.
- `useSession`'s `queryFn` returns `null` only when **neither** token exists.
- Add `hasRestorableSession()` to `lib/session` (`Boolean(readAccessToken() || readRefreshToken())`). Use it in **both** RequireAuth and GuestOnlyRoute. They must always agree, or you get back the old "Maximum update depth" loop; keep and update their comments.
- Fix the comment at `session.ts:4-13`.
- **Acceptance:**
  1. Delete only the access cookie and reload. The user stays signed in, and you see exactly one `/auth/refresh` followed by `/users/me`, even on the dashboard with its parallel queries.
  2. Delete both cookies. The user goes to `/login`, and there is no redirect loop.
  3. An expired or invalid refresh token goes to login with the session-expired toast.
  4. No request is sent without an `Authorization` header while a refresh token exists.

**2.3 SEC-02 (frontend part): no PII in the snapshot cookie, following DA-2** (`lib/session/session.ts`, `types/auth.ts`, the consumers of `user.fullName` / `user.email`).
- Add a `SessionSnapshot` type, `{ id; role; permissions }`. `persistSessionUser` writes only that.
- Anywhere that shows the name or email should read `useMe()` (the `users.me` query, which `useSession` already fills) and show a skeleton until it has loaded. `grep -rn "fullName\|\.email" src` lists the consumers.
- `isAuthUser` is replaced by an `isSessionSnapshot` check. An old snapshot cookie that still has name and email is simply overwritten after the next `/users/me`.
- **Acceptance:**
  1. After signing in, the `medad_session_user` cookie contains no name or email.
  2. The header shows the user's name after `/users/me`, with no visible layout jump beyond the skeleton.
  3. Guards and `useCan` still work on the first paint after a reload.

**2.4 SEC-03: production URL guards** (`src/lib/env/env.ts`).
- Add a `superRefine`. When `import.meta.env.PROD` is true, `VITE_API_BASE_URL` must be `https:` and `VITE_VOSK_WS_URL` must be `wss:` and must be set explicitly (no default). The one exception is when the hostname is `localhost` or `127.0.0.1`, so `npm run preview` still works.
- Remove the unused `VITE_APP_ENV` from the schema and from `.env.example` (CQ). **Don't edit the developer's local `.env`.**
- Type `ImportMetaEnv` in `src/vite-env.d.ts`.
- **Acceptance:**
  1. A production build with `VITE_VOSK_WS_URL=ws://asr.example.gov` throws the Arabic or English boot error from `loadEnv` (this is developer-facing).
  2. Localhost values still boot.

**2.5 SEC-04: timeouts and cancellation** (`client.ts`, `lib/*/api.ts` GET functions, and the matching hooks).
- In `client.ts`, add `createRequestSignal(callerSignal?, timeoutMs)`. Use `AbortSignal.any` / `AbortSignal.timeout` when they exist, with a small manual `AbortController` fallback otherwise.
- Default timeouts follow DA-12. The refresh call also gets a timeout.
- **Timeouts and network errors:**
  - A timeout, or a network `TypeError`, becomes `new ApiError('Network error', 0)`.
  - A cancellation that came **from the caller** (React Query's own `signal`) is rethrown unchanged, so React Query silently ignores it.
- `failureMessage()` maps status 0 to «تعذّر الاتصال بالخادم. تحقق من الاتصال وحاول مرة أخرى.» Query retry already covers non-4xx errors.
- **Passing `signal`:**
  - Every GET used by a `useQuery` takes an optional `{ signal }` argument.
  - Its hook passes it through as `queryFn: ({ signal }) => list(params, { signal })`.
  - Mutations don't need it.
- **Acceptance:**
  1. With DevTools set to offline, lists show their error state with the Arabic network message after the retries.
  2. Leaving the reports page mid-request shows the request as "(canceled)", and no error toast appears.
  3. A request with a hard delay of more than 30 s ends in the timeout message.

**2.6 API-04.** Remove `'/auth/register'` from `NO_REFRESH_PATHS` (`client.ts:85`).

**2.7 API-05.** In `performFetch`, read `response.text()` and only parse it when it isn't empty. Keep the 204 shortcut.

**2.8 SEC-06.**
- In `performBlobFetch`, if the response `content-type` starts with `text/html` or `application/json`, throw `ApiError(…, response.status)`.
- Callers re-wrap the result as `new Blob([blob], { type: 'application/pdf' })` for PDFs, and as the spreadsheet MIME type for the Excel export.

**2.9 API-06: one place for backend error messages.**
- Move the English message constants (`'User is disabled'`, `'is the last'`, `'is closed'`, `'Form type'`) into a single `BACKEND_MESSAGES` map in `lib/api/errors.ts`, with a comment pointing at the relevant `API_INTEGRATION.md` lines.
- In `lib/users/errors.ts`, only treat a 403 as "escalation" when the body is non-empty **and** its message isn't `Access denied`. Otherwise use `FORBIDDEN_MESSAGE`.
- Machine-readable error codes are BE-14 (see §A6).

**2.10 API-07: validate URL parameters on the reports list** (`reports-list-page.tsx:52-66,91`).
- Export the sort options from one place (`report-filters.tsx` or a constant) and only accept those values for `sort`.
- Check `from` and `to` with `parseIsoDate`, and drop them if they don't parse.
- `view` must be a positive integer.
- Drop invalid values with a `replace` navigation.
- **Acceptance:** `?sort=creator.password,asc&from=abc&view=0` loads the default list and cleans up the URL.

**2.11 API-08.**
- Type the field as `parentId?: number | null` (`types/form-type.ts`).
- Use `!= null` in `use-form-types.ts:41-45` and in `form-type-form.tsx:81`.
- The select value never becomes the string `'null'`.

**2.12 API-09.** The export filename uses `todayIsoDate()` (`use-report-mutations.ts:118`).

**2.13 SEC-08.** No code change. The snapshot cookie is still revalidated by `/users/me` after task 2.3.

**Commit(s):** `Harden API client and session: safe retry, refresh-token restore, timeouts, PII-free snapshot (API-02, API-03, SEC-02, SEC-04, …)`. Split it where that helps review, for example 2.1–2.2, 2.3, 2.4–2.8, and 2.9–2.12.

### Phase 3: Dictation and ASR server

**3.1 DIC-01: an attempt token so a stale start can't leave the mic on** (`src/hooks/shared/use-dictation.ts`).
- Keep `attemptRef` and `mountedRef`.
- After `await getUserMedia` and in `socket.onopen`: if the attempt is stale or the hook has unmounted, stop every track, close the socket and return.
- `stop()` also works while `connecting`: it increases the attempt number and cleans up.
- The mic button stays enabled while connecting and acts as «إلغاء» (`dictation-rich-text.tsx:258`).
- **Acceptance:** click the mic, close the create dialog while the permission prompt is open, then allow access. The browser's microphone indicator turns off, and no WebSocket is opened (check the DevTools WS tab).

**3.2 DIC-02: a graceful Stop.**
- Add a `'finishing'` status. `stop()` disconnects the processor, source and gain nodes and stops the tracks straight away.
- If the socket is open: send `{"eof" : 1}`, set the status to `finishing`, and start a 3 s timer.
- The final `text` result is appended through the existing `handleServerMessage`.
- When `onclose` fires or the timer runs out, clean up and set the status to `idle`. Unmounting during `finishing` clears the timer.
- **Acceptance:**
  1. Say a sentence and press Stop straight away, without pausing. The sentence appears.
  2. `vosk-server.log` no longer shows the `ConnectionClosedOK` traceback.

**3.3 DIC-05: connection timeout and error feedback.**
- Add a 10 s connect timeout that calls `fail('انتهت مهلة الاتصال بخادم التعرف على الصوت.')`.
- Reset `lastError` (`dictation-rich-text.tsx:209-216`) at the start of every attempt.
- Give the button an error look while `status === 'error'`.
- If the server closes the connection mid-recording, show «انقطع الاتصال بخادم التعرف على الصوت.»

**3.4 DIC-04: stricter keyword matching, and block unfilled slots** (`src/lib/dictation/date-time-templates.ts`, `report-form-schema.ts`).
- Allow edit distance 0 for roots of 5 letters or fewer, and at most 1 for longer roots.
- `عام`, `قيد` and `احد` only count as keywords with context: the word before is `يوم`, `تاريخ`, `بتاريخ` or `الساعة`, or a digit follows.
- Block number words (`ثلاثة`, `أربعة`, `اثنين`, `ثانية`, …) unless `يوم` or `الساعة` comes before them.
- Following DA-4, add a zod refine to the five text fields that rejects `/____(DATE|TIME|TEXT)____/` with the DA-4 message.
- **Acceptance:** write a corpus script **outside the repo**. It holds the 8 false-positive phrases from the audit (DIC-04) and at least 10 genuine date and time phrases. The false positives must produce 0 slots and the genuine phrases must still produce slots. Put the before-and-after table in the final report.

**3.5 DIC-06: dictation robustness.**
- Only one recorder can be active at a time. Starting a second one stops the first (a controller in the hook module).
- Dictated text goes in at the caret if the selection is inside the editor, and is appended otherwise.
- Back-pressure: skip audio frames while `socket.bufferedAmount > 1_000_000`.
- *(Optional, M effort)* Replace `ScriptProcessorNode` with an `AudioWorklet`. Load it with `new URL('./pcm-worklet.js', import.meta.url)` and fall back to ScriptProcessor. If you skip this, record it as deferred.

**3.6 UI-L6, slot part.** The slot remove button goes through `handleInputRef.current()` so the whole editor isn't rebuilt (`dictation-rich-text.tsx:97-100`).

**3.7 SEC-01 (dev part) and SEC-07** (`vosk-model/asr_server.py`, `vosk-model/web_server.py`, `vosk-model/start.sh`, `scripts/dev-with-vosk.sh`).
- The default interface becomes `127.0.0.1`, and `dev-with-vosk.sh` passes `VOSK_SERVER_INTERFACE=127.0.0.1`.
- Following DA-15, delete the `if 'model' in jobj` branch.
- Add an origin allow-list: `websockets.serve(..., origins=[...])`, read from `VOSK_ALLOWED_ORIGINS` (comma-separated, default `http://localhost:5173`).
- `web_server.py` defaults to host `127.0.0.1` and port `2701`. Update `start.sh` and `entrypoint.py` if they refer to it. Fix the out-of-date docstring (`web_server.py:4-6`).
- **Acceptance:**
  1. `ss -tln` shows `127.0.0.1:2700` and `127.0.0.1:2701`.
  2. A connection with a disallowed `Origin` is refused. Test it with a small Python script from the venv, not with a browser from another site.
  3. `{"config":{"model":"/tmp"}}` is ignored.
- Production TLS, the token and deployment are INFRA-1.

**Commit(s):** `Fix dictation lifecycle, graceful stop and keyword matching; lock the dev ASR server to localhost (DIC-01…06, SEC-01, SEC-07)`.

### Phase 4: Accessibility blockers

**4.1 A11Y-01: a visible focus indicator** (`src/components/ui/button.tsx:8`, `src/components/ui/dialog.tsx:43`).
- Add `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background` to both. Check those tokens exist in `tailwind.config.js`.
- Phase 9 tunes the ring colour for dark mode.
- **Acceptance:** tabbing through login, the reports list, a dialog and pagination shows a visible ring on every Button and on the dialog ✕, in both themes.

**4.2 A11Y-02: accessible names for the report text fields** (`dictation-rich-text.tsx`, `ui/form-field.tsx`, `report-form.tsx:373-387`).
- `FormField` gives its Label `id={`${htmlFor}-label`}` and its error and hint `id`s (`-error`, `-hint`).
- `DictationRichText` accepts `aria-labelledby`, `aria-describedby` and `aria-required`, and applies them to the `role="textbox"` element.
- Clicking the label focuses the editor.
- Each slot `<input>` gets an `aria-label`: «تاريخ», «وقت» or «نص».
- **Acceptance:** the Chrome DevTools Accessibility pane shows each field's name (المقدمة, المتن, الخاتمة, …) and its error description.

**M1 gate (end of Run 1):**
- The full regression checklist (§A8.2).
- Both roles (admin plus a limited `AUDIT-FIX` role), at 390, 820 and 1440 px, in light and dark.
- Then **stop and report.**

### Phase 5: Error policy, cache and report flows

**5.1 DAT-01: one error-handling policy.**
- In `lib/api/errors.ts`, add:
  - `apiErrorBody(error): ApiErrorBody | undefined`
  - `applyFieldErrors<T>(error, setError, allowedKeys): boolean`. Unmatched keys go to `root`, and it returns whether anything was applied.
- **The policy:**
  - Hooks never toast a 400.
  - Forms own 400, and also 409 where the form can show it.
  - Every hook uses `failureMessage()`, so a 403 always gives `FORBIDDEN_MESSAGE`. That includes `use-role-mutations.ts`.
- Apply it to: `create-user-dialog`, `report-info-dialog`, `profile-page`, `form-type-form`, `form-type-template-form`, `role-form-dialog`, `crime-type-form-dialog` and `report-form-schema`. Remove the 10 `as ApiErrorBody` casts.
- **Acceptance:**
  1. Every form shows backend field errors exactly once, under the field, with no duplicate toast.
  2. A role delete that gets a 403 shows the permission message.
  3. Where a backend 400 can't be triggered, say "verified by code review".

**5.2 DAT-02.** The form-type update, `useSetReportInfo`, `useSetMyReportInfo` and `useSetUserRole` also invalidate `queryKeys.reports.all`.

**5.3 DAT-03 and INF-06.**
- Deleting a report calls `removeQueries(detail(id))` before invalidating.
- Move report options to their own root key (`queryKeys.reportOptions`), so report mutations stop refetching them.
- `invalidateRoleData` invalidates `roles.list()` instead of `roles.all`, so `roles.options` isn't refetched.

**5.4 DAT-04.** Remove `users.detail`, `formTypes.detail`, `reportTemplates.all` and `reportTemplates.list`, the unused `users.get()` and `reportTemplates.list()`, and the invalidation of that unused key.

**5.5 UI-06 and UI-L2: one report detail dialog.**
- Remove the table's own dialog (`reports-table.tsx:45,165-169`). The table takes an `onOpenReport(id)` prop, and the page opens `?view=` with a push.
- Closing uses `replace: true`.
- After create, merge `view` into the current search params instead of replacing them.

**5.6 UI-L1.**
- While a delete is pending, the delete dialog ignores `onOpenChange(false)` and disables Cancel.
- `ReportDetailDialog` is keyed by `reportId`.

**5.7 UI-07 and UI-L6 (print part): PDF opening.**
- In the click handler, synchronously open `const w = window.open('', '_blank')`, then pass `w` into the mutation.
- On success:
  - If `w` exists: `w.opener = null; w.location.href = blobUrl`.
  - If not: `downloadBlob()` plus a toast: «تم تنزيل الملف لأن المتصفح منع فتح نافذة جديدة.»
- On error, close `w`.
- Disable the print items while the mutation is pending.
- Keep the blob URL alive for 5 minutes.
- **Acceptance:**
  1. In Chrome with a slow network (more than 6 s), the PDF still opens.
  2. With popups blocked, the file downloads.

**5.8 UI-L3.** Any active filter from the URL that has no visible control (because of a missing `*:VIEW` permission, or options not loaded yet) shows as a removable chip in `report-filters.tsx`. `SearchableSelect` must not say «جميع…» while a filter is active.

**5.9 UI-L5.**
- The error-scroll effect keys on `formState.submitCount` as well.
- Controller fields forward refs where the component supports it.
- The submit button is disabled on `isPending || isSubmitting`.

**5.10 API-10: schemas.**
- Add `.trim().max(n)` following `API_INTEGRATION.md`: ReportInfo fields 100, template creator and writer 200, copyLabel 100.
- Trim the email in create-user.
- The witness count needs an explicit required check before coercion.
- Declare `REPORT_TYPES`, `REPORT_RESULTS` and `SEARCH_BROADCASTS` as `as const` arrays in `types/report.ts`. Derive the unions from them, use `z.enum(...)`, and reuse the arrays in `reports-list-page.tsx:23-34` and `crime-statistics-table.tsx:17-21`. This also removes the casts in `report-form-schema.ts:214-218` (CQ-04 in part).

**5.11 API-11: accept unchanged older values, following DA-8.**
- The national ID and witness-count rules are skipped when the value is unchanged from what was loaded. Pass the original values into the schema factory.
- A changed value must pass the rule.

**Commit(s):** one per group: 5.1 · 5.2–5.4 · 5.5–5.9 · 5.10–5.11.

### Phase 6: Dashboard and statistics

**6.1 PERF-01, following DA-5** (`dashboard-page.tsx:50,74-94`, `hooks/reports/use-report-statistics.ts`).
- Recent reports: `useReports({ size: 8, sort: 'reportDate,desc' })`.
- Add `useMonthlyReportCounts(months = 6)`, which uses `useQueries` over `statistics({ from: firstDay, to: lastDayOrToday })` and returns `[{ month, count: total }]`.
- "This month" is the last entry. Month boundaries use local dates (Asia/Damascus) through the existing date utilities. **Never use `toISOString()`.**
- Each widget has its own loading and error state.
- **Acceptance:**
  1. There is no `size=500` request any more.
  2. Each month's count matches `GET /reports/statistics?from&to` `.total` (check with curl).
  3. The dashboard's API payload is under about 50 KB.

**6.2 PERF-03, following DA-6.**
- Register lazy `ReportsTrendChart` and `CrimeTypeChart` in `routes/lazy-pages.ts`, next to a comment extending the rule to heavy widgets.
- Their Suspense fallback is a skeleton the same size as the chart.
- Export `prefetchDashboard()` from `lazy-pages.ts` and call it after login succeeds.
- **Acceptance:**
  1. The `dashboard-page` chunk is under 60 KB and recharts lands in its own chunk.
  2. The KPI cards appear before the charts.

**6.3 UI-L4.**
- The statistics error text depends on the status: 400 gives the range message, anything else gives «تعذّر تحميل الإحصائيات.» plus retry.
- Add an `isFetching` indicator (`aria-busy` and a small spinner).
- When two presets resolve to the same range, only the more specific one (the month) is `aria-pressed`.

**6.4 A11Y-15 (charts).**
- Set `reversed` on XAxis and `orientation="right"` on YAxis for RTL.
- Retitle the crime chart to match what it shows: «أكثر أنواع الجرائم تكرارًا».
- Format the trend tooltip with `Intl.NumberFormat('ar-SY-u-nu-latn')`.

### Phase 7: Admin UX and RBAC

**7.1 UI-08.** Gate the users table on `!isPending` (`users-list-page.tsx:87`), the same way `crime-types-list-page.tsx:87` does.

**7.2 UI-09, following DA-11.**
- When the editor holds `ROLES:VIEW`, find the target user's role in `useRoles()`.
- If `exceedsPermissions(role.permissions, me.permissions)`, hide the actions menu and disable the switch, with the DA-11 reason.
- Without `ROLES:VIEW`, keep the current behaviour. The backend still returns 403, and task 5.1 shows the right message.

**7.3 UI-10, following DA-10.** Saving the role the signed-in user holds opens a `ConfirmDialog` that lists the `RESOURCE:ACTION` pairs being removed: «أنت تعدّل الدور المسند إليك. ستفقد الصلاحيات التالية فورًا: …»

**7.4 UI-L7.**
- Move `components/reports/discard-changes-dialog.tsx` to `components/shared/`, which is justified now that it is reused.
- Apply the dirty guard (block outside-click and Esc, and confirm on Cancel or ✕) to the create-user, role-form, form-type-form and crime-type-form dialogs, and to the template editor dialog if it is one.

**7.5 UI-L8.**
- Crime-type search gets a "no match" state (`SearchX`), like users and form types.
- `ChangeRoleDialog` and `CreateUserDialog` show an error state with a retry button when `/roles` fails.
- A read-only role dialog gives the real reason: either no `ROLES:UPDATE`, or the role exceeds your permissions.
- The 404 page links to `ROUTES.home`.
- For the role-delete item (suspected), use probe 0.3(g). Only change it if the probe proves the delete button is wrongly hidden.

**7.6 UI-L9.**
- Keep search in the URL as `?q=` on the users, form-types and crime-types pages, and the form-types view as `?mode=tree|list`. Don't use `view`, because the reports page already uses it.
- Reset the page at the same moment the debounced value changes, not on every keystroke.

**7.7 UI-L10.**
- `SearchableSelect` resets its `query` on close and works out the active row from the unfiltered list.
- `RoleSelect` always passes a string (`value ?? ''`).
- `DialogTitle` changes `leading-none` to `leading-snug`.

### Phase 8: The remaining accessibility work, and the toast rewrite

**8.1 Toast rewrite: A11Y-09, the toast part of PERF-02, the toast part of CQ-06, CQ-03 and CQ-05** (`components/ui/toast-provider.tsx`, `toast-sink.ts`, `toast-context.ts`, `lib/notifications/toast.ts`, `tailwind.config.js`).
- Remove framer-motion from toasts. Animate them with tailwindcss-animate (`animate-in fade-in slide-in-from-top-2`, plus `motion-reduce:animate-none`).
- The auto-dismiss timer pauses on hover and focus.
- Errors and warnings go in a `role="alert"` region (assertive). Success and info stay polite.
- Colours come from tokens. If a success or warning surface token is missing, add it to `:root` and `html.dark` using the brand palette.
- Tailwind's `fontFamily.sans` becomes `['var(--font-family)']`, which fixes the undeclared 'Forest' font.
- Fix the timer leak when a message is de-duplicated.
- Move `toast-sink.ts` to `lib/notifications/`. Delete the unused `ToastContext` and `useToast`, and fix the relative imports.
- **Acceptance:**
  1. Toasts are readable in dark mode.
  2. Hovering pauses dismissal.
  3. NVDA or VoiceOver reads errors immediately. If you can't test that, say so.
  4. `framer-motion` is no longer imported by anything outside `components/admin/dashboard`, `pages/admin/dashboard` and `hooks/shared/use-animated-number.ts`.

**8.2 A11Y-05: the mobile drawer** (`components/layout/sidebar.tsx`, `layouts/authenticated-layout.tsx`, `globals.css:2472-2483`).
- On mobile widths, when the drawer is closed, set the `inert` attribute. React 18 needs `{...(closed ? { inert: '' } : {})}`.
- When it opens, move focus to the first link. Esc closes it, and focus goes back to the ☰ button.
- **Acceptance:** at 390 px with the drawer closed, Tab never reaches hidden links. When open, Esc closes it and returns focus.

**8.3 A11Y-07: `FormField` wiring.**
- Provide the ids through a small generic context in `ui/form-field.tsx`. `Input`, `Textarea`, `PasswordInput` and the select triggers read it and set `aria-describedby` (hint and error), `aria-invalid` and `aria-required`.
- **Acceptance:** the password field announces the password rule, and invalid fields announce their error.

**8.4 A11Y-10.**
- Wrap the login and not-found pages in `<main>`.
- The page title is an `h1`. Let `CardTitle` take an `as` prop, or render an `h1` with the same classes.

**8.5 A11Y-12.**
- The password toggle is focusable, with `aria-label` «إظهار كلمة المرور» / «إخفاء كلمة المرور» and `aria-pressed`.
- Skeletons: the container is `role="status"` with «جاري التحميل», and the bars are `aria-hidden`.
- The user switch gets `aria-label={`تفعيل حساب ${fullName}`}`.
- In the reports table, the report number is a `<button>` that opens the detail view (keyboard reachable).
- `FilledDot` gets `role="img"`.
- Remove `aria-live` from the donut centre.

**8.6 A11Y-13 and CQ-03 (layouts).**
- Change the dialog close label to «إغلاق».
- Add a `DialogDescription`, or `aria-describedby={undefined}`, to ReportDetailDialog, FormTypeForm and CrimeTypeFormDialog.
- Change the `index.html` `<title>` to «مداد».
- Add a skip link «تخطَّ إلى المحتوى» to `AuthenticatedLayout`, pointing at `<main id="main-content" tabIndex={-1}>`.
- **Delete** the unused `layouts/public-layout.tsx`.

**8.7 A11Y-14.**
- Add a global `@media (prefers-reduced-motion: reduce)` block to `globals.css` that shortens animations and transitions and sets `scroll-behavior: auto`.
- `scrollIntoView` in `report-form.tsx:457,466` uses `'auto'` when reduced motion is requested.
- Don't add an app-level `MotionConfig`, because that would put framer-motion back on the entry path. The dashboard's existing `MotionConfig` covers the rest.

**8.8 A11Y-15 (the rest).**
- In `date-input.tsx:143,151`, replace `pl-11 pr-3.5 text-right left-1` with `ps-3.5 pe-11 text-start start-1`, after checking which side is which visually.
- Remove `uppercase tracking-wide` from `TableHead`.

### Phase 9: Theming and contrast (needs DA-7 sign-off)

Before changing anything, write a contrast script **outside the repo** that reads the final token values. Run it again after the changes, and put both tables in the final report. **Target:** at least 4.5:1 for text and at least 3:1 for UI boundaries and focus rings, in **both** themes.

**9.1 A11Y-03 (light theme).**
- `--muted-foreground: 166 7% 41%` (#61706c).
- `--color-text-muted`: the same value.

**9.2 A11Y-04 (dark theme), following DA-7 Option A.**
- **Primary:** dark `--primary` becomes about `170 32% 55%` (#68b1a5), and dark `--primary-foreground` becomes the forest-deep token. Buttons then show dark text on light teal, and `text-primary` passes on the dark card.
- **Destructive:** dark `--destructive` becomes about `354 70% 73%` (#ea8a94), with a dark `--destructive-foreground`.
- **Badges:** give the CLOSED (umber) and gold badges dark variants through tokens (`report-result-control.tsx:18-19`, `stat-card.tsx:20-21`, `report-detail-dialog.tsx:140`).
- Check each value with the script before committing.

**9.3 A11Y-06.**
- `--input` becomes about `41 22% 54%` (light), with a dark equivalent at 3:1 or better.
- Inputs get a solid 2 px focus ring.
- The dark `--ring` gets a lighter value that passes 3:1 on the dark card.

**9.4 A11Y-11.** Gold chip text becomes #6a5d44 (or a token equivalent), and light `--primary` used as text becomes about `170 32% 35%`. Coordinate this with 9.2, so a button that uses primary as its background still passes.

**9.5 A11Y-08.**
- Add an inline script at the top of `<head>` in `index.html` that adds `dark` to `<html>` when `localStorage['medad-theme'] === 'dark'`, inside try/catch.
- In `theme-provider.tsx`, put storage reads and writes in try/catch, and accept only `'light'` or `'dark'`.
- The inline script needs a CSP hash. Record the exact script in the Phase 11 security-headers document.
- **Acceptance:** with the dark theme saved and 4× CPU throttling, no light frame appears.

**9.6 CQ-06 (the rest).**
- Chart colours become `--chart-1 … --chart-6` tokens in `:root` and `html.dark`, used as `fill="var(--chart-n)"`. Remove the duplicated palettes (`crime-type-chart.tsx:19-21`, `reports-distribution-chart.tsx:22-24`).
- The login and not-found background gradient moves to one token-based class.

**Acceptance for the whole phase:**
- The contrast script shows no failures.
- Lighthouse accessibility on /login is 100 in both themes.
- Before and after screenshots of every page in both themes are attached, or described if you can't take them.

### Phase 10: Performance

Record **before and after** numbers: the chunk table from `npm run build`, and Lighthouse mobile and desktop on /login, run against `npm run preview` with the backend blocked.

**10.1 PERF-02 (chunk).** Remove `'vendor-motion'` from `manualChunks`. **Acceptance:** `dist/index.html` doesn't modulepreload framer-motion.

**10.2 PERF-04.**
- Register `AuthenticatedLayout` as a lazy export in `lazy-pages.ts`, with a Suspense fallback of `RouteFallback`.
- Remove the `vendor-radix` manual chunk, or cut it down to what login needs, and let Rollup split the rest.
- **Acceptance:** the total JS that /login downloads (gzip) is **150 KB or less**. It is about 205 KB today.

**10.3 PERF-05: fonts.**
- Convert the Regular and Bold OTF files to woff2 **once**, with a tool run outside `package.json` (for example `npx --yes wawoff2`, or `fonttools`), and commit the `.woff2` files next to the OTFs.
- Each `@font-face` lists `format('woff2')` first and keeps the OTF as a fallback.
- Remove the unused Light (300) `@font-face` and its file, after checking with grep that nothing uses weight 300.
- Add `<link rel="preload" href="/images/fonts/itfQomraArabic-Regular.woff2" as="font" type="font/woff2" crossorigin>` to `index.html`.
- *(Optional)* A metric-matched `size-adjust` fallback face. CLS is already 0, so this is low priority.
- **Acceptance:** /login downloads about 57 KB of fonts instead of 110 KB.

**10.4 PERF-06: remove dead CSS, following DA-16.** This is the highest-risk task.
- **Before deleting any class, check that it is really dead:**
  1. Class names built at runtime: template literals, string concatenation, `cva` variants, classes in `.ts` files and in `index.html`, and `className` strings set from DOM code in `dictation-rich-text.tsx`.
  2. Classes added by libraries: React Router's `NavLink` adds **`active`** (`.app-sidebar__link.active` is live), plus Radix `data-state` selectors.
  3. `html.dark` variants of live classes.
- Delete one family per commit, for example "asset-mgmt", "org-tree", "Bootstrap modal/form" and "maintenance".
- **Compare every page visually** before and after each commit: 390, 820 and 1440 px, light and dark, both roles. Use a headless Chrome script outside the repo if you can, and describe what you compared if you can't.
- Don't restructure the live rules. Only merge duplicate `:root` or `html.dark` blocks where that is trivially safe.
- **Acceptance:**
  1. The built CSS is **90 KB or less** raw (it is 160.7 KB today).
  2. No visual changes, apart from those intended in Phase 9.

**10.5 PERF-07.**
- Lazy-load `CreateReportDialog` and `ReportDetailDialog` through `lazy-pages.ts`, and render the dialogs only when they are open or `?view=` is set.
- Move `useExportReports` into its own module if it is what pulls the form bundle into the list chunk.
- **Acceptance:** the reports list no longer loads the report-form chunk until a dialog is opened.

**10.6 PERF-08.**
- Following DA-18, LoginPage stays lazy. Record that as an accepted cost.
- Replace react-helmet-async (used in 11 files) with a small `useDocumentTitle(title)` hook in `hooks/shared/`.
- Remove `HelmetProvider` and uninstall `react-helmet-async`. **Removing a dependency is allowed.**

### Phase 11: Docs, contract and code quality

**11.1 ARC-02, following DA-9.**
- Run `git mv "CLAUDE.md " CLAUDE.md` and `git rm -r claude/`.
- In `CLAUDE.md`, fix every contradiction listed in the audit's ARC-02:
  - the staff, secretary and public folder trees
  - the `hooks/admin/…` and `lib/admin/…` example paths
  - `PaginatedResponse<T>` (the code uses `Page<T>`, and plain arrays)
  - `/auth/me` (it is `/users/me`)
  - the "Forest" font (it is Qomra)
  - `html.theme-dark` (it is `html.dark`)
  - the instruction to reuse CSS classes deleted in Phase 10
- Update any references to the old trailing-space name in `docs/plans/*.md`.

**11.2 ARC-01, INF-02, INF-03: rewrite the stale parts of `ARCHITECTURE.md`.**
- The reference implementation is form-types.
- There is no `admin-layout`.
- The provider list is current, with Helmet removed.
- The toast system is custom (`lib/notifications`) and doesn't use sonner.
- The lazy rule covers pages, the layout and heavy widgets.
- Rule 2 says "`lib/*/api`".
- Rule 8 explains that reading `builtIn` on the target role is allowed.
- `lib/query/query-client.ts` is the one allowed React Query import in `lib`.
- Add the error-handling policy (5.1), the session model (DA-1), timeouts (DA-12) and naming conventions (CQ-08).

**11.3 ARC-04.**
- Add an "Archived" banner to `docs/plans/rbac-implementation-plan.md`.
- Fix the stale lines in `qa-remediation-plan.md` (`:3`, `:94`, `:257`).
- In `API_INTEGRATION.md` §7.5, show `creator.role` as a `RoleSummary` object, with a one-line note that the frontend changed it.

**11.4 ARC-05.**
- Add `public/favicon.svg`, copied from the existing logo in `public/images/`, and reference it.
- Add an Arabic `<meta name="description">`, a `theme-color`, and `<meta name="robots" content="noindex, nofollow">`.
- Add `public/robots.txt` with `Disallow: /`.
- Remove the empty `test/` directory.

**11.5 API-01, following DA-17.** Add `api/README.md` saying that `API_INTEGRATION.md` is the contract, and that `api-docs.json` is out of date until BE-15.

**11.6 SEC-05.**
- Add `docs/deploy/security-headers.md`. It contains the header set from audit §3.5, an nginx example, cache rules (hashed `/assets/*` immutable, `index.html` `no-store`), and the **sha256 CSP hash** of the inline theme script from task 9.5.
- Deploying it is INFRA-2.

**11.7 ARC-03 (lint zones).** Add `no-restricted-imports` overrides to `eslint.config.mjs`:

| Files | Must not import |
|---|---|
| `src/components/**`, `src/pages/**` | `@/lib/*/api`, `@tanstack/react-query` |
| `src/components/ui/**` | `@/hooks/*`, `@/contexts/*`, `@/types/*`, `@/lib/*/api` |
| `src/lib/**` (except `src/lib/query/**`) | `react`, `@tanstack/react-query`, `@/components/*`, `@/hooks/*` |

Lint must pass with 0 warnings.

**11.8 CQ-01 and CQ-02.**
- Fix the four risky casts:
  - `use-session.ts:16` `permissions!` becomes a fallback or an explicit error
  - `theme-provider.tsx:9`, already fixed in task 9.5
  - `crime-type-chart.tsx:103`, use the typed payload
  - `dictation-rich-text.tsx:99,136`, use a null check
- Add `noUnusedLocals`, `noUnusedParameters` and `noUncheckedIndexedAccess` to `tsconfig.node.json`.
- Remove the 13 redundant path aliases from both `tsconfig.app.json` and `vite.config.ts`, keeping only `@/*`.
- `exactOptionalPropertyTypes` would raise 88 errors, so record it as **deferred**.

**11.9 CQ-03: remove dead code.**
- Delete `components/ui/select.tsx` and `components/ui/tooltip.tsx`, and uninstall `@radix-ui/react-tooltip`.
- Delete the unused exports and types listed in the audit: `fadeIn`/`slideUp`, `Session`, `PageParams`, and others.
- Afterwards, run `npx --yes knip` and `npx --yes madge --circular src` outside `package.json`. Both must come back clean, or every remaining item must have a reason.

**11.10 CQ-04 and CQ-05: remove duplication.**
- Add `ROUTES.reports.view(id)` and use it at all 6 places that build that URL.
- Put the report-info form fields and schema in one shared component, used by `report-info-dialog.tsx` and `profile-page.tsx`.
- Make `constant/route-permissions.ts` the single route → permission table, used by `route-config.tsx`, `home-redirect.tsx` and `sidebar-nav.tsx`.
- Declare `PermissionSet` once, in `types/role.ts`.
- Move `EnumOption` to `types/api.ts` to break the type-only circular import.
- Move `LoginPayload`, `LoginResponse` and `RefreshResponse` into `types/auth.ts`.

**11.11 CQ-07: move files, without changing behaviour.**
- Move `useReportForm` into `hooks/reports/use-report-form.ts`.
- Split `report-form.tsx` (701 lines) into one file per section under `components/reports/report-form/`.
- These commits contain moves and import updates only, nothing else.

**11.12 CQ-08.** Record the naming conventions in `ARCHITECTURE.md`. **Don't rename files in bulk.** Renames only happen when a file is touched for another reason.

**11.13 CQ-09.** Fix every stale comment listed in the audit's CQ-09.

**M2 gate:**
- The full regression checklist.
- The coverage matrix (§A7) with every row marked Done, Handed off, Accepted or Deferred.
- **Stop.**

### Phase 12 *(needs approval)*: A data router with `useBlocker` (UI-11)

- Switch from `<BrowserRouter>` to `createBrowserRouter(routeConfig)` and `<RouterProvider>`. The existing `RouteObject[]` is reused unchanged.
- Providers that use router hooks move under a root layout route. Providers that don't stay in `AppProviders`.
- Use `useBlocker(isDirty && !isSubmitting)` on the edit page and in the create dialog, together with `DiscardChangesDialog`.
- **Acceptance:** leaving a dirty edit through the sidebar, the header or the browser Back button asks first, and cancelling keeps the edits. Every existing route, guard, redirect and deep link still behaves the same.

### Phase 13 *(needs approval)*: Test infrastructure

- Add Vitest (jsdom), `@testing-library/react`, `@testing-library/user-event`, MSW 2 and Playwright as **devDependencies**, with `src/test/setup.ts` and an `npm test` script.
- Write the 15 test cases from audit §9, in its ranked order.
- Add the gates to CI (typecheck, lint, format:check, test, build, and a Playwright smoke test).

---

## A6. Hand-off: backend, infra and data

The frontend can't close these. Numbering continues from the QA plan's BE-1 to BE-12.

| ID | Closes | Owner | Request |
|---|---|---|---|
| **DATA-1** | UI-01 (existing data) | Backend / DBA | Use the counts from probe 0.3(a) to find stored report texts whose `@` lines have lost their `\t`. Decide with the owner how to repair them (for example, re-apply the template's signature rows) before release. |
| **INFRA-1** | SEC-01 (production) | Infra | Put the Vosk ASR server behind a TLS reverse proxy (`wss://`). Add an Origin allow-list for the production origin and authenticate each connection, for example with a short-lived token from BE-19. Bind it to localhost behind the proxy, and set connection and CPU limits. |
| **INFRA-2** | SEC-05 | Infra | Deploy the headers and CSP from `docs/deploy/security-headers.md`, starting in `Report-Only` mode. |
| **INFRA-3** | INF-04 | Backend / infra | CORS allow-list for the production frontend origin only. |
| **BE-13** | PERF-01 (final form) | Backend | Add `byMonth` (or a `groupBy=month` option) to `/reports/statistics`. |
| **BE-14** | API-06 | Backend | A machine-readable `code` in every error body (already proposed in QA plan §4). |
| **BE-15** | API-01 | Backend | Regenerate the OpenAPI document with DTO schemas, `ApiErrorBody`, enums, 201/204 responses and `security: []` on login and refresh. Diff it in CI. |
| **BE-16** | API-07 | Backend | An allow-list of sortable properties on `/reports` and `/reports/export`, returning 400 otherwise. Probe 0.3(d) shows the current behaviour. |
| **BE-17** | SEC-02 (target) | Backend | Issue the refresh token as an `HttpOnly; Secure; SameSite=Strict` cookie scoped to `/api/v1/auth/refresh`, with rotation and revocation (extends BE-6). The frontend then stops storing it (follow-up task). |
| **BE-18** | INF-05 | Backend | Pin the Spring `Page` JSON serialization mode (probe 0.3(e)). |
| **BE-19** | INFRA-1 | Backend | *(If INFRA-1 chooses tokens)* `GET /asr/token`, issuing short-lived signed tokens that the ASR proxy checks. |
| existing | API-11, SEC-02, INF-07 | Backend | BE-3 (validation rules), BE-6 (logout, revocation, rotation), BE-8 (password policy on the server). These are already tracked in the QA plan. |

## A7. Coverage matrix (every audit finding)

| Finding | Where | | Finding | Where | | Finding | Where |
|---|---|---|---|---|---|---|---|
| UI-01 | 1.1 + DATA-1 | | PERF-02 | 8.1, 10.1 | | A11Y-11 | 9.4 |
| UI-02 | 1.3 | | PERF-03 | 6.2 | | A11Y-12 | 8.5 |
| UI-03 | 1.4 | | PERF-04 | 10.2 | | A11Y-13 | 8.6 |
| UI-04 | 1.3 | | PERF-05 | 10.3 | | A11Y-14 | 8.7 |
| UI-05 | 1.5 | | PERF-06 | 10.4 | | A11Y-15 | 6.4, 8.8 |
| UI-06 | 5.5 | | PERF-07 | 10.5 | | ARC-01 | 11.2 |
| UI-07 | 5.7 | | PERF-08 | 10.6 (partly accepted, DA-18) | | ARC-02 | 11.1 |
| UI-08 | 7.1 | | SEC-01 | 3.7 + INFRA-1 | | ARC-03 | 0.4, 11.7 |
| UI-09 | 7.2 | | SEC-02 | 2.3 + BE-17/BE-6 | | ARC-04 | 11.3 |
| UI-10 | 7.3 | | SEC-03 | 2.4 | | ARC-05 | 11.4 |
| UI-11 | 12 (accepted risk until approved) | | SEC-04 | 2.5 | | CQ-01 | 11.8 |
| UI-L1 | 5.6 | | SEC-05 | 11.6 + INFRA-2 | | CQ-02 | 11.8 (exactOptional deferred) |
| UI-L2 | 5.5 | | SEC-06 | 2.8 | | CQ-03 | 8.1, 8.6, 11.9 |
| UI-L3 | 5.8 | | SEC-07 | 3.7 | | CQ-04 | 5.10, 9.6, 11.10 |
| UI-L4 | 6.3 | | SEC-08 | 2.13 (no action) | | CQ-05 | 8.1, 11.10 |
| UI-L5 | 5.9 | | API-01 | 11.5 + BE-15 | | CQ-06 | 8.1, 9.6 |
| UI-L6 | 3.6, 5.7 | | API-02 | 2.1 | | CQ-07 | 11.11 |
| UI-L7 | 7.4 | | API-03 | 2.2 | | CQ-08 | 11.12 (document only) |
| UI-L8 | 7.5 | | API-04 | 2.6 | | CQ-09 | 11.13 |
| UI-L9 | 7.6 | | API-05 | 2.7 | | INF-01 | no action (compliant) |
| UI-L10 | 7.7 | | API-06 | 2.9 + BE-14 | | INF-02 | 11.2 |
| DIC-01 | 3.1 | | API-07 | 2.10 + BE-16 | | INF-03 | 11.2 |
| DIC-02 | 3.2 | | API-08 | 2.11 | | INF-04 | INFRA-3 |
| DIC-03 | 1.2 | | API-09 | 2.12 | | INF-05 | BE-18 |
| DIC-04 | 3.4 | | API-10 | 5.10 | | INF-06 | 5.3 |
| DIC-05 | 3.3 | | API-11 | 5.11 + BE-3 | | INF-07 | BE-8 (existing) |
| DIC-06 | 3.5 (AudioWorklet optional) | | A11Y-01 | 4.1 | | DAT-01 | 5.1 |
| PERF-01 | 6.1 + BE-13 | | A11Y-02 | 4.2 | | DAT-02 | 5.2 |
| A11Y-03 | 9.1 | | A11Y-04 | 9.2 | | DAT-03 | 5.3 |
| A11Y-05 | 8.2 | | A11Y-06 | 9.3 | | DAT-04 | 5.4 |
| A11Y-07 | 4.2, 8.3 | | A11Y-08 | 9.5 | | A11Y-09 | 8.1 |
| A11Y-10 | 8.4 | | | | | | |

## A8. Verification protocol

### A8.1 After every phase
1. `npm run typecheck && npm run lint && npm run format:check && npm run build` all pass (lint shows 0 warnings).
2. Run `npm run dev:vite-only` against the local backend and check the phase's acceptance criteria. Use the dev admin account and a **limited `AUDIT-FIX` role** (`REPORTS:VIEW/UPDATE`, `FORM_TYPES:VIEW`, `CRIME_TYPES:VIEW`), created with curl following `API_INTEGRATION.md` §10 and deleted at the end.
3. Check layout-affecting phases at 390, 820 and 1440 px, in light and dark.
4. If something can't be checked in a browser, **say so** and mark the criterion "verified by code review". Never report a check as passed if you didn't run it.
5. Delete every record whose name starts with `AUDIT-FIX`.

### A8.2 Regression checklist (these already work and must keep working)
- **Route guards and RBAC:**
  - Each route and its permission, per the table in audit §2.
  - A direct `/admin/*` URL visited without permission shows one toast and goes to `/`.
  - `HomeRedirect` with no permissions goes to `/profile`.
  - Role mutations re-sync `/users/me`, and so does any 403.
- **Escalation limits:** `exceedsPermissions` and the permission matrix disable anything beyond the editor's own permissions. The ADMIN role is read-only, built-in roles can't be deleted, and the signed-in user's own row has no actions.
- **Login deep links:** after login, the user goes back to the page they were trying to reach, but not to a link saved by a different user. There is no open redirect and no loop between `/` and `/login`.
- **Filters and pagination:** server-side report filters and their URL deep links. `?page=` is clamped after the last row on a page is deleted.
- **Sealed reports:** a `CLOSED` report is read-only in the UI, and the API returns 409 for it.
- **Report text:** it renders safely against XSS, including in the formatted text view, and **now also keeps its tabs and newlines**.
- **Downloads:** the duplicate report-number message; Excel and PDF downloads.
- **Pages and layout:** dark mode; the 404 page; the legacy redirects (`/report-types`, `/admin/crime-types`); no horizontal scroll at 390 and 820 px.
- **Dictation:** start, stop and the permission-denied message.
- **Speed:** Lighthouse /login mobile Performance is at least 89, and must not drop below the baseline.

## A9. Risks and rollback

| Risk | Mitigation |
|---|---|
| contentEditable behaves differently across browsers (1.1, 1.2) | Keep the editor change in its own commit, test it in Chrome and Firefox at least, and revert it independently if needed. |
| Guards and session loops (2.2), which have happened before ("Maximum update depth") | Both guards use the same `hasRestorableSession()`. Test with every combination of cookies (access only, refresh only, both, neither, garbage). |
| Visual regressions from the CSS purge (10.4) | One family per commit, with before and after screenshots. Revert a single commit if something breaks. |
| Contrast token changes alter the brand look (Phase 9) | Needs DA-7 sign-off. Screenshot every page in both themes. |
| Moving to a data router (Phase 12) | Needs approval. Keep it on its own branch and re-check every route. |
| Scope creep | Follow the coverage matrix only. Report anything newly discovered as a new finding, and don't fix it silently. |

Rollback: every phase is one commit or a few, so `git revert <sha>` undoes it. Nothing is pushed until the owner reviews it.

---

# PART B: Execution prompt

> Paste everything below the line into Claude Code, opened at the repo root.
> **Before you paste:**
> - Make sure `git status` is clean.
> - Start the **local** backend on `http://localhost:8080`, and the Vosk server if you want to check dictation.
> - Fill in the decisions log in Part A §A3.1, or accept the defaults.
> - Change **only** the `Scope` line from one run to the next.

---

You are a principal-level frontend engineer working on `medad-web`. It is a React 18, Vite 6 and TypeScript (strict) app using TanStack Query 5, react-hook-form with zod, Radix primitives and Tailwind 3. The UI is Arabic-only and right-to-left. It is a government system for managing police reports («الضبوط»). The Spring backend lives in **a separate repository**, and you can't change it from here.

## Task

A full audit (`docs/audit/AUDIT_REPORT_2026-09-29.md`, with 94 findings) has been turned into a phased plan in `docs/plans/audit-remediation-plan.md`, **Part A**. Carry out that plan one phase at a time, exactly as written.

**Scope for this run:** `Run 1: Phase 0 → Phase 4, then stop at the M1 gate.`
*(The later runs are: Run 2 = Phases 5–7 · Run 3 = Phases 8–10, which need the DA-7 sign-off · Run 4 = Phase 11 · Run 5 = Phases 12–13, which need explicit approval.)*

## Read first, in this order only

1. `cat "CLAUDE.md "`. **The filename ends with a space** until Phase 11 renames it. After that, read `CLAUDE.md`. Its rules are binding.
2. `ARCHITECTURE.md`: the layering, and the rule that only hooks use React Query.
3. `docs/plans/audit-remediation-plan.md`: **all of Part A.** In particular read §A2 (guardrails), §A3 and the decisions log, the tasks for this run's phases in §A5, and §A8 (verification).
4. The findings for this run in `docs/audit/AUDIT_REPORT_2026-09-29.md`, **by ID**, to see the evidence behind each task.
5. `api/API_INTEGRATION.md`: only the sections a task mentions. **Ignore `api/api-docs.json`; it is out of date.**

Don't read the whole repository. Work as SEARCH → IDENTIFY → READ → IMPLEMENT → VERIFY. The line numbers in the plan come from commit `d561460`, so find the code by its content if it has moved.

## Hard constraints

- **No new runtime dependencies.** Removing react-helmet-async and `@radix-ui/react-tooltip` is part of the plan. Tools such as `wawoff2`, `knip`, `madge` and contrast scripts run through `npx --yes`, or from a scratch directory **outside the repo**. Never add them to `package.json`.
- **All user-facing text is in Arabic**, including `aria-label`, `title`, toasts and validation messages. The layout stays RTL. Use logical CSS properties.
- **No `dangerouslySetInnerHTML`, and no user content through `innerHTML`.**
- **Colours come only from the tokens in `src/styles/globals.css`.** If a token is missing, add it to `:root` and `html.dark` following the brand palette in `CLAUDE.md`.
- `components/ui/*` stays generic. `React.lazy()` stays in `routes/lazy-pages.ts` only. Server data stays in React Query and never goes into Zustand.
- **Don't invent backend contracts.** If a task needs something Phase 0 didn't confirm, skip it and report it as **blocked**.
- **Change only what the finding needs.** Commits that move code (CQ-07, CQ-04) contain moves and import updates only.
- **Backend use:** the local dev backend only (`http://localhost:8080`). **Never** point at staging or production.
  - Phase 0 probes are GET-only, apart from the single `AUDIT-FIX-probe` create-and-delete.
  - All test data is named with the prefix `AUDIT-FIX` and deleted before the phase ends.
  - **Never print personal data** from API responses. Report counts and shapes only.
- **Never discard work you didn't write.** If `git status` isn't clean at the start, stop and tell me.

## Decisions

Use the **decisions log** in plan §A3.1 where it has an entry. Otherwise use the **recommended defaults** in §A3 (DA-1 … DA-18). Name every default you applied in the commit message, for example `(DA-3 default)`.

**Stop and ask** before:
- starting Phase 9 without a DA-7 sign-off in the log;
- starting Phase 12 or 13;
- any change a finding doesn't require that would alter behaviour users can see, or authorization;
- anything that would need a new dependency or a new backend endpoint.

## Execution

1. **Phase 0** exactly as in plan §A5: create the branch, record the baseline, run probes (a)–(g), and make the formatting-only commit.
2. Then work through each phase in scope, in order. Inside a phase, do the tasks in numbered order, because later tasks rely on earlier ones.
3. After **every** phase:
   ```bash
   npm run typecheck && npm run lint && npm run format:check && npm run build
   ```
   Then check the phase's acceptance criteria following plan §A8.1, and commit.
4. **Commits:**
   - One commit per phase, or per task group where the plan says so.
   - A short English message in the style of this repository's log, listing the finding IDs it closes and the decision defaults it applied. For example: `Keep report text tabs and line breaks, guard edit and template forms against load errors (UI-01, DIC-03, UI-02, UI-04, UI-03, UI-05; DA-3 default)`.
   - End every commit message with:
   ```
   Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
   ```
   **Don't push. Don't open a PR.**
5. **High-risk tasks need extra care:**
   - **1.1 and 1.2 (the editor):** check Enter, paste, Tab, slots and save round-trips in a real browser.
   - **2.2 (session):** test every combination of cookies (access only, refresh only, both, neither, garbage values), and confirm there is **no redirect loop** between `/` and `/login`.
   - **10.4 (CSS purge):** confirm each class is really dead first (NavLink `active`, runtime-built class names, `data-state`, `html.dark`). Remove one family per commit, and compare before-and-after screenshots.

## Verification before you say "done"

1. All four gates pass on the final commit.
2. Every acceptance criterion in this run's phases is marked **PASS**, **FAIL**, or **verified by code review only**, with the reason. **Never claim a browser check you didn't run.** If you can't open a browser, say so clearly.
3. The regression checklist in plan §A8.2 has been re-checked.
4. Every `AUDIT-FIX` record has been deleted, and `git status` shows no stray files. Scratch scripts stay outside the repo.

## Final report (keep it short)

- **Phase 0:** the probe results (a)–(g), counts and shapes only, and which hand-off items (§A6) they affect.
- **Per phase:** the commit hashes and the finding IDs each commit closes.
- **Verification table:** finding ID → PASS / FAIL / code-review-only (with the reason).
- **Measurements, where the run includes them:**
  - the DIC-04 corpus table (Run 1)
  - the dashboard payload and chunk sizes (Run 2)
  - contrast tables before and after (Run 3)
  - Lighthouse and chunk tables before and after (Run 3)
- **Decisions:** every decision default applied, and every deviation from the plan with its reason.
- **Open items:** anything blocked, with its §A6 ID, and any new issues found along the way (reported, not fixed).
- **Update the plan:** add or refresh a **"Status"** section at the top of `docs/plans/audit-remediation-plan.md`. It lists the date, the phases finished, the deviations, what remains, and the coverage-matrix rows closed in this run. Commit it with the last phase of the run.

Then **stop** and wait for my review before the next run.
