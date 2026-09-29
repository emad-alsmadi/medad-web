# QA Remediation Plan — Functional Test Report (نظام إدارة الضبوط)

> **Source:** `docs/تقرير_الاختبار_الوظيفي_نظام_الضبوط.docx` (functional test run of 2026-09-29, `localhost:5173` / API `localhost:8080`).
> **Branch:** `develop` · **Analysis date:** 2026-09-29 · **Status:** Phases 0–5 done (2026-09-29); Phases 6–8 blocked on the backend.
> **Governing rules:** `CLAUDE.md ` (the filename ends with a space), `ARCHITECTURE.md`, `api/API_INTEGRATION.md` (the live API contract; `api/api-docs.json` is stale and still uses `report-types`).

---

## Status (2026-09-29): Phases 0–5 done, 6–8 blocked on the backend

**Phase 0 results (live backend, `curl`):**

| Item | Live? | Evidence |
|---|---|---|
| BE-1 report-number search | ❌ | `GET /reports?reportNumber=2025/6` ignores the parameter (208 results) |
| BE-2 natural sort | ❌ | `sort=reportNumber,asc` → `2025/1, 2025/10, 2025/11…` |
| BE-5 `reportsCount` on form types | ❌ | `FormTypeResponse` = `id, name, witnessNumber, parentId, childrenCount` |
| BE-6 `/auth/logout`, BE-8 `/users/me/password` | ❌ | both answer 403 (no such endpoint) |
| `details.byResult` includes `null` | ✅ | «بدون جرم» row: `{ key: null, label: "غير محدد", count: 4 }` |

**Decisions log (defaults applied, no answers received):** D5 new passwords ≥ 10 chars with a letter and a digit, not the email (UI only so far) · D2 block future report dates · D3 national ID optional, exactly 11 digits · D4 at most 20 witnesses · D9 «الإعدادات» removed · D10 bell hidden · D11 Qomra kept (with the spacing fix, retest passed) · D12 a deep link is dropped when a different user signs in. D1, D5–D8 and D13 wait for Phases 6–8.

**Commits (in order):** `ae12ed0` RBAC work committed first (it was uncommitted) · `4ad5310` docs · `c89d255` Phase 1 · `4772c8b` Phase 2 · `a4ae7aa` Phase 3 · `6822169` Phase 4 · `0ee0cc6` Phase 5.

**QA-019 (UI part, done early):** `lib/auth/password-policy.ts` holds the rule (D5) and its hint, applied in the create-user dialog; login is untouched, so older passwords still work. Arabic letters and digits count. The finding stays open until BE-8 enforces the same rule on the server; the change/reset screens in Phase 7 will reuse this schema.

**Closed (25, all FE-only findings):** QA-003, 010, 011, 016, 017 · 002 (FE), 013 (FE), 014 (FE), 025, 034 (FE) · 021, 022, 024, 032, 033, 038, 039, 041, 042 · 029, 030, 031, 036, 037, 040 · 028, 035. QA-002/013/014/034 still need BE-3 so the API rejects the same values.

**Verification:** `typecheck`, `lint` (0 warnings) and `build` pass on every commit. Every closed finding was re-run in headless Chrome (Playwright) against the live backend, as admin plus a temporary limited role (`REPORTS:VIEW/UPDATE`, `FORM_TYPES:VIEW`, `CRIME_TYPES:VIEW`). The regression list in §6 passed: XSS text (also through the new formatted text view), sealed report, filter deep links, legacy redirects, 404, and no horizontal scroll at 390/820px. All `QA-FIX` test data was deleted.

**Deviations from the plan:**

- **QA-022 root cause** is the font's narrow space glyph (2.5px at 14px), not `letter-spacing`: no Arabic text had negative letter-spacing applied. Fixed with `--word-spacing: 0.15em` on `body`. Form controls need `word-spacing: inherit`, because the browser resets it for them. «مفعّل» reads correctly at 2×, so no badge change was needed.
- **QA-025** was fixed inside `DateInput` for every date field, not only the statistics range. A fully typed date that is invalid or out of range now shows its reason, and **clears the value** (as a native date input does), so a form can't be saved with the old value while a rejection is visible. `max={today}` on the report date depends on this.
- **QA-031:** the IntersectionObserver was replaced with a scroll calculation (an activation line 80px below the top of the real scroll container, the last section at the bottom). A nav click also holds its choice for 1s while the smooth scroll runs.
- **QA-038:** in collapsed mode the CSS hides the group panels. Clicking a group icon on the rail therefore widens the sidebar with that group open; otherwise its links would be unreachable. Icon-only links got `aria-label` and a `title`.
- **QA-041** exposed a bug: `emitToast` dropped any toast raised before `ToastProvider` registered its sink (child effects run first on a full page load). Early toasts are now queued. Identical toasts already on screen are no longer stacked, which also absorbs StrictMode's double effects.
- **QA-036:** a refused delete (4xx, whose reason is already a toast) closes the dialog; a network or 5xx failure keeps it open for retry (`isFinalError` in `lib/api/errors.ts`). Report, role and crime-type deletes already closed on error and are unchanged.
- **QA-028:** `SearchableSelect` is used for the crime-type **filter** only. The report form's crime-type field keeps its Radix select: it protects a saved crime type whose option hasn't loaded yet, and swapping it could show «بدون جرم» for a report that has a crime.
- **QA-035:** `useClientPagination` itself now keeps the page in the URL (all three of its callers are pages). Page clicks push history; corrections replace.

**Still open:**

- **Blocked on the backend:** QA-001, 008, 009 (BE-1) · 004 (BE-5) · 005 (BE-6) · 006 (BE-7) · 007, 019 (BE-8) · 012 (BE-2) · 020 (BE-9) · plus backend-only 015, 018 (BE-4), 023 (BE-10), 026 (BE-11), 027 (BE-12).
- **Not tested:** real touch devices, Firefox/Safari, and the built-in «مستخدم» / «متابعة تقارير» roles with real accounts.
- **Data:** report `565654325` (id 6) is still dated 31/03/2027 and now fails on save until corrected (D2). The sealed test report `QA-TEST/P1` (id 221) remains.

---

## 0. Executive summary

The test run executed 254 cases: 218 passed, 36 failed and 2 were blocked. It documents **42 findings**: 0 × P0, 1 × P1, 6 × P2, 17 × P3 and 18 × P4. I traced each finding to the source code in this repository. Where I could, I confirmed the root cause against the code or the API contract.

Key conclusions:

1. **This repository is frontend only.** The Spring backend (`com.kmw.medad`) lives elsewhere. **17 of the 42 findings need backend work**, and 7 of those are backend-only. Most importantly, the **P1** (QA-001: search by report number) is blocked on the backend: `GET /reports` has no search parameter (see `API_INTEGRATION.md` §7.3). §4 of this plan gives the backend team exact change requests (BE-1 … BE-12).
2. **25 findings are frontend only** and can start today. Most are small, local fixes to existing components, with no new dependencies and no architectural change.
3. **The security findings (QA-005/006/007/019/020) form one workstream.** None of them can be closed without backend endpoints that do not exist yet (`/auth/logout`, password change/reset, throttling).
4. **Some findings need a product decision before coding.** Examples: the national ID format, the maximum witness count, the password policy, and whether to keep the new «Qomra Arabic» font. §3 lists these decisions, each with a recommended default so work is not blocked.

**Recommended sequence:** Phase 0 (preflight) → Phases 1–5 (frontend only, in parallel with backend work) → Phases 6–8 (frontend work that depends on the backend, done as each BE item lands) → Phase 9 (full retest).

---

## 1. Codebase facts that shape this plan (verified)

| Area | Fact | Evidence |
|---|---|---|
| Report search | Filtering is client-side over the **20 rows of the current page**. No request is sent while typing. The search text lives in `useState` and never reaches the URL. There is no digit normalization. | `src/pages/reports/reports-list-page.tsx` (`filteredReports`, `useState('')`) |
| Duplicate empty states | `ReportsTable` renders «لا توجد ضبوط» when given `[]`, and the page also renders «لا توجد نتائج … في هذه الصفحة». | `reports-table.tsx:69`, `reports-list-page.tsx` |
| Page param | `numberParam()` accepts any finite number (99, -1, 1.5). `abc` becomes `undefined` but stays in the URL. There is no clamping to `totalPages`. | `reports-list-page.tsx` |
| Form-type parent column | `nameById` is built from the `types` prop, which is `pageItems` (the current page only). Parents on another page resolve to «—». | `form-type-table.tsx:31,59`, `form-types-list-page.tsx:75` |
| Client pagination | `useClientPagination` keeps the page in `useState` and never in the URL. It is used by form types, crime types and users. | `hooks/shared/use-client-pagination.ts` |
| Crime-type search | `c.name.includes(debouncedSearch)`, with no Arabic normalization. | `pages/crime-types/crime-types-list-page.tsx:32` |
| Logout | Clears cookies only. A comment says «No /auth/logout endpoint exists». | `hooks/auth/use-logout.ts` |
| Report date rules | `reportDate`/`crimeDate` are only checked for "required" and "crimeDate required when crimeTypeId". There is no future-date or cross-field rule. `nationalId` is `max(50)` only. | `components/reports/report-form-schema.ts` |
| DateInput | Supports `min`/`max`. It **silently drops** a typed value that falls outside the range (this is QA-025). | `components/ui/date-input.tsx:82` |
| Switch labels | The label is a `<span>` with `aria-labelledby`, so clicking the text does nothing. | `report-form.tsx:191-215` |
| Scrollspy | The IntersectionObserver callback treats `entries` as "all visible sections", but `entries` only holds the entries that **changed**. It also uses the viewport as root even inside the dialog's scroll container. | `report-form-sections.tsx:160-180` |
| Report text view | The detail dialog renders template text as `whitespace-pre-wrap` raw strings. The markup syntax (`#`, `@`+TAB, `>`, `**`) is documented in `API_INTEGRATION.md` §7.6 but is not parsed. | `report-detail-dialog.tsx:182,195` |
| Dashboard crime table | Only three result columns (`UNDER_INVESTIGATION`, `FURTHER_INVESTIGATION`, `CLOSED`). `null` (unset) is dropped, although `StatisticItem.key` allows `null`. | `admin/dashboard/crime-statistics-table.tsx:16` |
| Header ☰ button | Always calls `toggleSidebar` (the mobile drawer flag). `toggleSidebarCollapsed` exists in `ui-store.ts`, and full CSS for `.admin-shell--collapsed` exists, but **nothing in the UI calls it**. | `layout/header.tsx:32`, `store/ui-store.ts`, `globals.css:2066,2407-2440` |
| Mobile drawer | Nothing closes `isSidebarOpen` on navigation. | `layout/sidebar.tsx` |
| Sidebar active item | The «كل الضبوط» link has `end: true`, so `/reports/:id/edit` does not match. | `layout/sidebar-nav.tsx:52` |
| Toasts | The container is `fixed start-4 top-4`. In RTL, `start` is the right edge, which is where the sidebar and logo sit. | `ui/toast-provider.tsx:66` |
| Settings / bell | «الإعدادات» is a `DropdownMenuItem` with no `onSelect`. The bell always renders a static "no notifications" line. There is no notifications backend. | `layout/header.tsx:46-67,108-111` |
| Permission guard | `RequirePermission` redirects to `/` with no feedback. | `auth/require-permission.tsx` |
| Post-login redirect | `GuestOnlyRoute` honours `location.state.from` whoever logs in. | `auth/guest-only-route.tsx:48-56` |
| Router | Uses `BrowserRouter`, not a data router, so **`useBlocker` is unavailable**. Unsaved-changes guards must therefore be explicit (Cancel/✕ confirmation plus `beforeunload`). | `providers/app-providers.tsx:26` |
| Font (QA-022) | «Qomra Arabic» has only 300/400/700 OTF faces. Its space glyph advance is **140/800 units = 0.175em**, which is narrow for Arabic. Several headings add a negative `letter-spacing` (-0.025em / -0.03em), which narrows word gaps further and is unsafe for cursive Arabic. | `public/images/fonts/*.otf` (cmap/hmtx parsed), `globals.css:89-110,2768,4412` |
| Available primitives | `@radix-ui/react-popover` is already a dependency, so a searchable select needs **no new dependency**. `ConfirmDialog` exists in `components/ui`. | `package.json`, `components/ui/confirm-dialog.tsx` |
| Tooling | No automated test tooling (by design, see `ARCHITECTURE.md`). The quality gates are `npm run typecheck`, `npm run lint` (zero warnings) and `npm run build`, plus manual browser verification. | `package.json` |

> ⚠️ **Working tree:** `develop` currently has large **uncommitted** RBAC changes (see `git status`). Commit or stash them before this work starts, so each QA fix lands as a clean, reviewable commit. Never discard them.

---

## 2. Triage matrix (all 42 findings)

**Owner:** `FE` = this repo only · `BE` = backend only · `FE+BE` = both (FE depends on BE) · `DEC` = needs a decision (§3) first.

| ID | Sev | Finding | Owner | Root cause (✔ verified · ≈ likely) | Phase |
|---|---|---|---|---|---|
| QA-001 | **P1** | Report-number search only covers the current page | FE+BE | ✔ client-side filter over 20 rows; no API search param | 6 |
| QA-002 | P2 | Future report date accepted | FE+BE | ✔ no rule in schema or API | 2 |
| QA-003 | P2 | «التصنيف الأب» shows «—» on pages 2-4 | FE | ✔ `nameById` built from page slice | 1 |
| QA-004 | P2 | A type used by reports can become a parent, locking those reports | FE+BE | ✔ rule enforced on report save, not on form-type save | 8 |
| QA-005 | P2 | Logout doesn't invalidate tokens server-side | FE+BE | ✔ client-only logout; no endpoint; no refresh rotation | 7 |
| QA-006 | P2 | No brute-force protection on login | BE (+FE msg) | ✔ no throttling | 7 |
| QA-007 | P2 | No change/reset password | FE+BE, DEC | ✔ no endpoints, no UI | 7 |
| QA-008 | P3 | Arabic-Indic digits (٠-٩) not matched | FE | ✔ no normalization | 6 (util in 1) |
| QA-009 | P3 | Search text not kept in URL | FE | ✔ `useState` only | 6 |
| QA-010 | P3 | Invalid `page` param shows misleading empty state | FE | ✔ no validation/clamp | 1 |
| QA-011 | P3 | Crime table omits unset-result reports | FE | ✔ no `null` column | 1 |
| QA-012 | P3 | Report-number sort is lexicographic | BE, DEC | ✔ string column sort | 8 |
| QA-013 | P3 | Crime date after report date accepted | FE+BE | ✔ no cross-field rule | 2 |
| QA-014 | P3 | National ID accepts any text | FE+BE, DEC | ✔ `max(50)` only | 2 |
| QA-015 | P3 | API doesn't trim report numbers (duplicates) | BE | ✔ uniqueness check ignores whitespace | BE track |
| QA-016 | P3 | Detail dialog shows raw `@`/`#` markup | FE | ✔ no markup rendering | 1 |
| QA-017 | P3 | Crime-type search ignores hamza/tashkeel | FE | ✔ plain `includes` | 1 |
| QA-018 | P3 | API accepts whitespace-variant duplicate crime types | BE | ✔ same as QA-015 | BE track |
| QA-019 | P3 | Weak password policy (8 chars) | FE+BE, DEC | ✔ `min(8)` only, both sides | 7 |
| QA-020 | P3 | Login reveals "disabled" before password check | BE | ✔ status checked before credentials | 7 |
| QA-021 | P3 | «الإعدادات» menu item does nothing | FE | ✔ no handler, no page | 3 |
| QA-022 | P3 | Word spaces vanish with «Qomra Arabic» | FE, DEC | ≈ narrow space glyph (0.175em) + negative letter-spacing; needs visual retest | 3 |
| QA-023 | P3 | API errors leak Java class names | BE | ✔ unsanitized `HttpMessageNotReadableException` | BE track |
| QA-024 | P3 | Mobile drawer stays open after navigating | FE | ✔ no close on route change | 3 |
| QA-025 | P4 | Invalid stats date range rejected silently | FE | ✔ `DateInput` drops out-of-range input | 2 |
| QA-026 | P4 | Excel export has duplicate «مكان الإقامة» header | BE | ✔ backend template | BE track |
| QA-027 | P4 | PDF accepts `copy=4` | BE | ✔ no range validation | BE track |
| QA-028 | P4 | Crime-type filter (73 options) not searchable | FE | ✔ plain Radix Select | 5 |
| QA-029 | P4 | Cancel discards edits without confirmation | FE | ✔ `onCancel` resets directly | 4 |
| QA-030 | P4 | Clicking switch label text doesn't toggle | FE | ✔ `<span>` label | 4 |
| QA-031 | P4 | Form section nav highlights the wrong section | FE | ✔ observer logic (see §1) | 4 |
| QA-032 | P4 | Toasts cover sidebar logo/page title | FE | ✔ `start-4 top-4` in RTL | 3 |
| QA-033 | P4 | «كل الضبوط» not active on the edit page | FE | ✔ `end: true` | 3 |
| QA-034 | P4 | Witness count accepts 99999 | FE+BE, DEC | ✔ no max | 2 |
| QA-035 | P4 | Form-type/crime-type page not in URL; no search on form types/users | FE | ✔ `useClientPagination` state | 5 |
| QA-036 | P4 | Delete confirm stays open after failure | FE | ✔ closes on `onSuccess` only | 4 |
| QA-037 | P4 | Misleading crime-type delete confirmation text | FE | ✔ static message | 4 |
| QA-038 | P4 | ☰ does nothing on desktop | FE | ✔ collapse action never wired | 3 |
| QA-039 | P4 | Bell always «لا توجد إشعارات حالياً» | FE, DEC | ✔ placeholder UI | 3 |
| QA-040 | P4 | Disable-user instant, no confirm; report-info dialog closes on outside click | FE | ✔ no confirm; no dirty guard | 4 |
| QA-041 | P4 | Unauthorized route redirects silently | FE | ✔ plain `<Navigate>` | 3 |
| QA-042 | P4 | Post-login redirect to a previous user's link | FE, DEC | ✔ `state.from` always honoured | 3 |

**Counts:** FE-only 25 · FE+BE 10 · BE-only 7 (total 42).

---

## 3. Decisions required (recommended defaults in **bold**)

If the product owner does not answer, implement the recommended default and record it in the phase commit message.

| # | Question | Options | Recommendation |
|---|---|---|---|
| D1 | Search parameter name and semantics for `GET /reports` | `q` / `reportNumber`; contains / prefix | **`reportNumber` = case-insensitive *contains*, trimmed; also accepted by `/reports/export`** |
| D2 | Is a future `reportDate` blocked or only warned? | Block / warn | **Block (`reportDate ≤ today`, server time zone Asia/Damascus)**. The existing future-dated report `565654325` (31/03/2027) needs a data fix by its owner. |
| D3 | National ID format | 11 digits / 10–12 / free | **Optional; if present, exactly 11 digits** (after converting Arabic-Indic digits). Check existing data for violations before enforcing on the backend. |
| D4 | Maximum witness count | 10 / 20 / 50 | **20** |
| D5 | Password policy | length only / length + classes | **≥ 10 chars, at least one letter and one digit, not equal to the email.** Existing passwords stay valid until changed. |
| D6 | Password recovery model | email reset / admin reset | **Admin reset (`USERS:UPDATE`) + self-service change.** There is no email infrastructure, and an internal government system favours admin-mediated recovery. |
| D7 | Token lifetimes after logout support | keep 24h/30d / shorten | **Access 15 min, refresh 7 days with rotation + revocation on logout** |
| D8 | Report-number sort | natural sort on BE / remove option | **Natural sort on BE (year, then sequence)**. If BE can't deliver it, hide both «رقم الضبط» sort options. |
| D9 | «الإعدادات» menu item | remove / link to profile | **Remove now**; Phase 7 adds «تغيير كلمة المرور» in its place. |
| D10 | Notification bell | hide / build feature | **Hide until a notifications backend exists** |
| D11 | Font | keep Qomra with spacing fix / revert | **Keep Qomra only if the visual retest (Phase 3) passes at all sizes; otherwise revert to the previous font.** |
| D12 | Post-login deep link after a different user signs in | always honour / drop when user changes | **Drop `from` when the signing-in user differs from the last signed-out user in this browser** |
| D13 | Form-type restructuring (QA-004) | block / migrate reports | **Block** with a clear message (409). Migration is a separate feature. |

---

## 4. Backend change requests (hand-off to the backend team)

The frontend must not invent these contracts. Each BE item needs its response shape confirmed with `curl` (Phase 0 / the phase that depends on it) before the frontend is coded against it. **Proposal:** add a stable machine-readable `code` to the error body (for example `FORM_TYPE_HAS_REPORTS`, `LOGIN_THROTTLED`, `DUPLICATE_NAME`), so the frontend maps errors to Arabic text without matching English messages.

| BE | Closes | Change |
|---|---|---|
| BE-1 | QA-001, QA-008 (server side) | `GET /reports` and `GET /reports/export` accept `reportNumber` (D1): trim, case-insensitive `contains`, paginated with the existing filters and sort. |
| BE-2 | QA-012 | Natural sort for `sort=reportNumber,asc|desc` (D8). Example: a persisted sort key such as `(year, sequence, raw)`. |
| BE-3 | QA-002, QA-013, QA-014, QA-034 | Validation: `reportDate ≤ today` (D2); `crimeDate ≤ reportDate` when both are present; `nationalId` matches `^\d{11}$` when present (D3), for both `plaintiff` and `defendant`; `witnessNumber ≤ 20` (D4). Return `400` with `fieldErrors` in the existing shape (`API_INTEGRATION.md` §3). |
| BE-4 | QA-015, QA-018 | Trim and collapse internal whitespace for `reportNumber` and all `name` fields (crime types, form types, roles) before validating and saving. Base uniqueness on the normalized value (unique index). **Data task:** list existing whitespace-variant duplicates before adding the index. |
| BE-5 | QA-004 | `POST`/`PUT /form-types` → `409` (`FORM_TYPE_HAS_REPORTS`) when `parentId` refers to a type that has reports. Add `reportsCount` (or `hasReports`) to `FormTypeResponse` so the UI can disable those parent options up front. |
| BE-6 | QA-005 | `POST /auth/logout` (body `{ refreshToken }`) revokes the refresh token and the current access token (denylist by `jti` or a per-user token version). Rotate the refresh token on every `/auth/refresh`, and reject reuse of a rotated token. Set lifetimes per D7. |
| BE-7 | QA-006 | Login throttling: per account (for example 5 failures → 15-minute lock) and per IP. Respond `429` with a `Retry-After` header. Do not reveal whether the account exists. |
| BE-8 | QA-007, QA-019 | `PUT /users/me/password` `{ currentPassword, newPassword }`; `PUT /users/{id}/password` `{ newPassword }` (`USERS:UPDATE`, subject to §4.4 escalation rules). Enforce the password policy (D5) server-side on these endpoints, on `POST /users` and on `/auth/register`. Revoke the user's other sessions on password change. Optional: `PUT /users/{id}` for `fullName`/`email`. |
| BE-9 | QA-020 | Check the password **before** the account status. Wrong credentials → generic `401 Bad credentials` whatever the status. Only a correct password on a disabled account → `401 User is disabled`. |
| BE-10 | QA-023 | Global exception handler: map `HttpMessageNotReadableException`, type-mismatch and enum-parse errors to a generic `400` message. Never include class names or stack text. |
| BE-11 | QA-026 | Excel export: rename the defendant residence column to «مكان الإقامة 2», matching «اسم الام2» and «الرقم الوطني2». |
| BE-12 | QA-027 | `GET /reports/{id}/pdf?copy=` accepts only 1–3; anything else → `400`. |

**Data remediation (backend/DBA, needs the owner's approval):** fix or confirm report `565654325` (future date). Delete the sealed test report `QA-TEST/P1` (id 221) directly in the DB if wanted. Resolve any whitespace duplicates found by BE-4.

---

## 5. Implementation phases (frontend)

Every phase must: follow `CLAUDE.md ` (smallest correct change, existing patterns, Arabic UI text, no new dependencies); end green on `npm run typecheck && npm run lint && npm run build`; and land as **one commit per phase**, or one per finding when a phase is large. The commit message is short, in English, and in the repository's log style.

### Phase 0 — Preflight (no code changes)

1. Confirm the RBAC work in the tree is committed (see the ⚠️ in §1). If not, stop and ask.
2. Run `curl` against the live backend to record what exists **today**. Check: `GET /reports?reportNumber=2026` (is the param ignored?), `POST /auth/logout`, `PUT /users/me/password`, the `statistics` `details.byResult` payload (does it include a `null` key?), and the `FormTypeResponse` fields.
3. Record the answers to D1–D13 (or the defaults) at the top of this file, under a "Decisions log" heading.
4. Output: a short matrix of which BE items are already available. Phases 6–8 depend on it.

### Phase 1 — Data shown incorrectly (FE only) · QA-003, QA-010, QA-011, QA-016, QA-017 + shared text utils

- **Shared util** `src/lib/utils/text.ts` (pure functions, no React):
  - `normalizeDigits(s)`: map `٠-٩` (U+0660–0669) and `۰-۹` (U+06F0–06F9) to `0-9`.
  - `normalizeArabic(s)`: `normalizeDigits`, strip tashkeel (U+064B–U+065F, U+0670) and tatweel (U+0640), map `أ إ آ ٱ → ا` and `ى → ي`, trim, collapse whitespace, lowercase Latin.
  - `matchesSearch(haystack, needle)`: `normalizeArabic(h).includes(normalizeArabic(n))`.
- **QA-017** `pages/crime-types/crime-types-list-page.tsx`: filter with `matchesSearch`. Acceptance: «اساءة» finds «إساءة أمانة»; «جثة» finds «العثور على جثّة»; the originals still work.
- **QA-003** `form-type-table.tsx`: build `nameById` from the **full** list, not the page slice. Pass `allTypes={data}` from `FormTypesListView` (or a `parentNameById` map). Acceptance: every child row on every page shows its parent's name, matching the tree view.
- **QA-010** `reports-list-page.tsx`: `page` accepts only a non-negative integer. An invalid value (such as `abc`) is removed from the URL with `setSearchParams(…, { replace: true })`. Once data arrives with `number ≥ totalPages > 0`, replace the URL with the last valid page. Acceptance: `?page=99` lands on the last page with the correct active page button; `?page=abc` shows page 1 and a clean URL.
- **QA-011** `crime-statistics-table.tsx`: add a «غير محدد» column for `countOf(byResult, null)`. If Phase 0 showed that `null` is absent from `details.byResult`, compute `row total − sum(result columns)` instead. Label it with `UNSPECIFIED_LABEL` (`hooks/reports/use-report-options.ts`). Acceptance: the result columns sum to the total for every row (for example «بدون جرم»: 7+14+9+4 = 34).
- **QA-016** Add `components/reports/report-text-view.tsx`, a pure presentational parser of the §7.6 markup: `# ` → centred bold subheading; `@a<TAB>b<TAB>c` → signature row with equal-width cells (right→left); `> ` → centred line; `**x**` → `<strong>`; any other line → paragraph. Build React nodes directly; **never** use `dangerouslySetInnerHTML`, so the passing XSS test keeps passing. Use it for `introduction`, `body` and `conclusion` in `report-detail-dialog.tsx`. Keep `referral` line by line and `summary` plain. Acceptance: report 2026/107 shows headings and signature rows formatted, with no raw `#`/`@`.

### Phase 2 — Input validation (FE now; BE-3 in parallel) · QA-002, QA-013, QA-014, QA-025, QA-034

- **QA-002** `report-form-schema.ts`: `reportDate ≤ today` (use the existing `todayIsoDate()`), message «لا يمكن أن يكون تاريخ الضبط في المستقبل». In `report-form.tsx`, pass `max={today}` to the report-date `DateInput`.
- **QA-013** Same schema, in `superRefine`: when both dates are set, `crimeDate ≤ reportDate`, message «يجب ألا يكون تاريخ الجرم بعد تاريخ الضبط». Pass `max={reportDate}` to the crime-date `DateInput`.
- **QA-014** `partySchema.nationalId`: empty is allowed; otherwise run `normalizeDigits` and require `^\d{11}$` (D3), message «الرقم الوطني يتكون من 11 رقمًا». Normalize the value before it goes into the request body (`reportFormValuesToBody`).
- **QA-034** `form-type-form.tsx`: `witnessNumber` gets `.max(20, …)` (D4) and `max` on the input.
- **QA-025** `components/ui/date-input.tsx`: when the user types a **complete** date that is invalid or outside `min`/`max`, keep the typed text, set `aria-invalid`, and show a generic message. Add an optional `rangeErrorMessage` prop (plain text, so it carries no business logic in `ui/`). Do not call `onChange`. In `statistics-range-picker.tsx`, pass «يجب أن يكون تاريخ "إلى" بعد تاريخ "من"». Acceptance: from 15/09/2026 to 01/09/2026 shows the message; nothing is cleared silently.
- When BE-3 lands, map its `fieldErrors` through the existing `applyReportFormApiError`. No new mapping should be needed; verify it.
- Acceptance: each rule is rejected in the UI **and** the edit page shows the same messages. Existing reports with already-invalid data still open. They fail only on save, with a clear field error.

### Phase 3 — App shell, navigation and visuals (FE only) · QA-021, QA-022, QA-024, QA-032, QA-033, QA-038, QA-039, QA-041, QA-042

- **QA-024** Close the drawer on route change: a `useEffect` keyed on `location.pathname` calls `setSidebarOpen(false)`. Put it in `authenticated-layout.tsx` or `sidebar.tsx`.
- **QA-038** `header.tsx`: at ≥ 992px (the CSS breakpoint `991.98px`), ☰ toggles `toggleSidebarCollapsed`; below it, ☰ toggles the drawer. Use `window.matchMedia`, read at click time. Make `aria-label`/`aria-expanded` reflect the real state. Optional: persist the collapsed state in `localStorage`, wrapped in try/catch. Verify the existing `.admin-shell--collapsed` CSS renders correctly, including tooltips/labels for icon-only links.
- **QA-033** `sidebar-nav.tsx`: set `end: false` on «كل الضبوط», so `/reports/:id/edit` highlights it. Confirm no other link becomes falsely active.
- **QA-032** `toast-provider.tsx`: move the stack to the **end** side (the visual left in RTL), away from the sidebar and the page title. Recommended: `bottom-4 end-4`; at mobile width, full width with a 16px gutter. Verify at 390px, 820px and desktop.
- **QA-021** (D9) Remove the «الإعدادات» item. Phase 7 adds «تغيير كلمة المرور».
- **QA-039** (D10) Remove the bell dropdown from the header. Leave no dead code behind.
- **QA-041** `require-permission.tsx`: on denial, redirect to `/` **and** show one Arabic notice: «ليس لديك صلاحية للوصول إلى هذه الصفحة.». It must fire once per denial. Guard against React StrictMode double effects (for example a ref, or passing `state` through `HomeRedirect`). It must not fire during the transient permission refetch after a 403 (`query-client.ts` invalidates `users.me`).
- **QA-042** (D12) On explicit logout, store the signing-out user's id through `lib/session` (non-sensitive cookie, same module as the other session cookies). In `GuestOnlyRoute`, drop `from` and go to `/` when a stored id exists and differs from the new user's id. Clear the stored id after it is used.
- **QA-022** (D11) Visual fix, then retest:
  1. Remove negative `letter-spacing` from selectors that render Arabic text (`globals.css` ~2768, ~4412 and similar). Letter-spacing on cursive Arabic breaks joining and eats word gaps.
  2. If gaps are still too tight, add `word-spacing: 0.06em–0.1em` to `body` (tune visually).
  3. Check «مفعّل» vs «مقفل» at the badge font size; raise the badge size or weight if they remain confusable.
  4. If the retest still fails, revert `--font-family` to the previous font (D11).
  Acceptance: «الأدوار والصلاحيات», «دور جديد» and «مدير النظام» show clear spaces in light/dark themes at 390px, 820px and desktop.

### Phase 4 — Forms and dialogs (FE only) · QA-029, QA-030, QA-031, QA-036, QA-037, QA-040

- **QA-029** Create dialog (`create-report-dialog.tsx`) and edit page (`report-form-page.tsx`): when `isDirty`, Cancel and ✕ open a `ConfirmDialog` («لديك تغييرات غير محفوظة. هل تريد تجاهلها؟», with «تجاهل التغييرات» / «متابعة التعديل»). On the edit page, also register `beforeunload` while dirty. Do **not** migrate to a data router to get `useBlocker`; that is out of scope.
- **QA-030** `SwitchField` in `report-form.tsx`: make the text a real `<label htmlFor={name}>` (a `<button>` is labelable, so a label click activates it). Keep `aria-labelledby` or rely on the label, but **not both** with different text.
- **QA-031** `ReportFormNav` in `report-form-sections.tsx`: keep a persistent `Map<sectionId, isIntersecting>` across observer callbacks. Pick the **first section in document order** that intersects the activation band. When the scroll container reaches its bottom, activate the last section. Pass the dialog/page scroll container as the observer `root` (not the viewport). Acceptance: scrolling to «نص ورقة الضبط» highlights it in both the create dialog and the edit page.
- **QA-036** `delete-form-type-dialog.tsx`, `delete-user-dialog.tsx` (and any delete dialog that follows the same pattern): on a **409** (non-retryable business rule), close the dialog and show the error as a toast. On network or 5xx errors, keep it open so the user can retry.
- **QA-037** `crime-types-table.tsx`: the confirmation becomes a question, «هل تريد حذف نوع الجرم «{name}»؟ لا يمكن التراجع عن هذا الإجراء.». The "used by reports" explanation appears only when the backend returns 409.
- **QA-040** `users-table.tsx`: **disabling** opens a `ConfirmDialog` («سيتم إيقاف وصول المستخدم فورًا وإنهاء جلساته.»). Enabling stays immediate. `report-info-dialog.tsx`: when the form is dirty, block outside-click and Escape (same pattern as `create-report-dialog.tsx:53-54`).

### Phase 5 — Lists and URL state (FE only) · QA-028, QA-035

- **QA-035** Add a small `hooks/shared/use-url-page.ts` (read and write `?page=` with `replace`, 1-based in the URL or matching the reports page convention, validated like QA-010). Let `useClientPagination` accept a controlled page. Apply it to form types (list view), crime types and users. Add a search box, filtered with `matchesSearch`, to form types (by name) and users (by name or email). Resetting the search resets the page to the first.
- **QA-028** Add `components/ui/searchable-select.tsx`: a combobox on `@radix-ui/react-popover` (already installed) with a text input, a filtered listbox (`matchesSearch`), full keyboard support (↑/↓/Enter/Escape, `aria-activedescendant`), RTL, and an «الكل» option. It is generic, with options passed as props and no business logic. Use it for the «نوع الجرم» filter in `report-filters.tsx`. Optionally use it for `CrimeTypeSelect` in the report form too.

### Phase 6 — Report search, the P1 (FE+BE, needs BE-1) · QA-001, QA-008, QA-009

**Blocked until BE-1 is live.** If Phase 0 shows BE-1 missing, implement nothing here and report the blocker. Do not ship a "fetch everything and filter" workaround: it does not scale and hides the defect.

- `types/report.ts`: add `reportNumber?: string` to `ReportFilterParams`, so it flows into both the list and the export.
- `lib/reports/api.ts` `appendFilters`: send `reportNumber` when it is non-empty.
- `reports-list-page.tsx`:
  - `paramsFromSearch`/`searchFromParams` read and write `reportNumber` (QA-009).
  - Remove `filteredReports` and the client-side filter.
  - The input keeps a local draft, debounced 300 ms, then updates the URL with `page` reset to 0 and `replace: true` (so typing doesn't flood history). The draft re-syncs when the URL changes externally (the "clear filters" button, back/forward).
  - Normalize with `normalizeDigits` and trim before writing to the URL (QA-008).
  - Render **one** empty state: «لا توجد ضبوط مطابقة لـ "{q}"» when searching, otherwise the existing «لا توجد ضبوط».
  - Keep pagination visible while searching.
- `report-filters.tsx`: the "clear" action also clears the search. Update the helper/placeholder text if needed.
- Export (`exportCurrent`) passes `reportNumber` too, so an Excel export of a search matches the list.
- Acceptance (from the report): «2025/6» finds the report on page 11; «2026» returns all 108 matches, paginated; «2026/10» returns 10/10; «٢٠٢٦» behaves like «2026»; refresh and shared links keep the search; exactly one empty state.

### Phase 7 — Authentication and account security (FE+BE, needs BE-6…BE-9) · QA-005, QA-006, QA-007, QA-019, QA-020

Implement each item only after its BE endpoint is confirmed with `curl`.

- **QA-005** (BE-6) `lib/auth/api.ts`: add `logout(refreshToken)`. In `use-logout.ts`, call it **best effort** before clearing the session: await it with a short timeout, and ignore failures, so logout can never trap the user. Update the now-false comment «No /auth/logout endpoint exists». In `lib/api/client.ts`, store the **rotated** refresh token returned by `/auth/refresh` (verify the client doesn't assume it is unchanged).
- **QA-006** (BE-7) `use-login.ts`: map `429` to «تم إيقاف تسجيل الدخول مؤقتًا بسبب محاولات متكررة. حاول بعد {n} دقيقة.» using `Retry-After`. Disable the submit button until then, if feasible without a timer leak.
- **QA-020** (BE-9): no UI change beyond verifying that `isAccountDisabledError` still shows its message only after a correct password.
- **QA-007** (BE-8, D6):
  - `lib/users/api.ts`: `changeMyPassword`, `resetUserPassword`. Add hooks `hooks/users/use-change-password.ts` and `use-reset-password.ts`.
  - `/profile`: a «تغيير كلمة المرور» card (current, new, confirm; `PasswordInput`).
  - Users table: a «إعادة تعيين كلمة المرور» action in the row menu, gated by `useCan()('USERS','UPDATE')` and hidden for rows the editor cannot manage (existing `exceedsPermissions` logic).
  - Header user menu: «تغيير كلمة المرور» links to the profile card (replacing the removed «الإعدادات»).
  - After a successful self-change, if BE revokes other sessions, keep the current session only if BE returns new tokens; otherwise log out with an explanatory toast.
- **QA-019** (D5) Add one shared zod password schema (for example `lib/auth/password-policy.ts`). Use it in `create-user-dialog.tsx`, the change form and the reset form. Show the policy as a hint under the field. The backend enforces the same rule (BE-8).

### Phase 8 — Form-type integrity and sorting (FE+BE) · QA-004 (BE-5), QA-012 (BE-2)

- **QA-004** When `FormTypeResponse.reportsCount`/`hasReports` exists, add it to `types/form-type.ts`. In `form-type-form.tsx` `parentOptions`, render types that have reports as **disabled**, with the reason «مستخدم في ضبوط». Map a 409 `FORM_TYPE_HAS_REPORTS` to «لا يمكن جعل نموذج مستخدم في ضبوط تصنيفًا أبًا». Acceptance: the exact repro (sub-type with a report → new child under it) is refused, and the report stays editable.
- **QA-012** No FE change if BE-2 delivers a natural sort. If D8 falls back to "remove", delete the two `reportNumber` options from `report-filters.tsx`. Keep `sort=reportNumber,*` in old URLs harmless: ignore unknown sort values the same way enums are ignored.

### Backend-only tracking (FE verifies after deploy) · QA-015, QA-018, QA-023, QA-026, QA-027

There is no frontend code change. After each BE item deploys, re-run the report's reproduction steps and tick the item off in §6.

---

## 6. Retest matrix (Phase 9)

Re-run each finding's **original reproduction steps** from the test report and record PASS/FAIL here. Test roles: «مدير النظام», a limited role (`REPORTS:VIEW/UPDATE`, `FORM_TYPES:VIEW`, `CRIME_TYPES:VIEW`), **plus the built-in «مستخدم» and «متابعة تقارير» roles**, which the original run could not cover. Viewports: 390px, 820px, desktop. Browsers: Chrome and at least one of Firefox/Safari.

| Group | IDs | Key checks |
|---|---|---|
| Search | 001, 008, 009, 010, 012 | cross-page hits, Arabic digits, URL persistence, invalid page, numeric sort |
| Data integrity | 002, 004, 013, 014, 015, 018, 034 | UI **and** direct API (`curl`) rejection |
| Security | 005, 006, 007, 019, 020, 023 | old tokens → 401 after logout; 429 after N failures; password flows; generic messages |
| Display | 003, 011, 016, 022, 026 | parent names on all pages; column sums; formatted template text; word spacing; Excel headers |
| UX | 021, 024, 025, 028–033, 035–042 | each behaves as the report's "Expected" |

**Regression guard (these passed before and must still pass):** server-side filters and deep links; the sealed-report rules (UI hidden and API 409); XSS text rendering (report text view!); concurrent duplicate-create returns one 201 and two 409; all RBAC 403 paths; the Excel/PDF downloads; dark mode; 404 page; legacy route redirects; no horizontal page scroll at 390/820px; a clean console.

**Still untestable in this environment (report §6):** voice dictation, real 24h token expiry, network failure during save, concurrent multi-user edits, and real touch devices. Schedule a manual pass for these.

---

## 7. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Backend items slip, leaving the P1 open | Start BE-1 first; Phase 6 is small once BE-1 exists. Do not ship the client-side workaround. |
| New validation rejects edits of existing records with legacy data | Rules are enforced on save only, with field-level messages. Run BE-3/BE-4 data audits before enabling the constraints. |
| Shorter token lifetime (D7) increases refresh traffic | The existing single-flight refresh in `lib/api/client.ts` already handles it. Verify rotation is stored correctly. |
| `RequirePermission` notice spams during permission refetch | Fire only on a settled denial, once per navigation (Phase 3 note). |
| Font change affects layout widely | Scope QA-022 changes to spacing properties first. Keep the revert path (D11). |
| Large uncommitted RBAC tree mixed with QA fixes | Phase 0 gate: the tree must be clean before starting. |

---

## 8. Definition of done

- All FE-owned findings are fixed and retested PASS. BE-dependent findings are either PASS or explicitly listed as blocked, with the BE item that blocks them.
- `npm run typecheck`, `npm run lint` (0 warnings) and `npm run build` are green on every commit.
- No new dependencies. No `dangerouslySetInnerHTML`. All user-facing text is Arabic. Comments are updated wherever they became false (for example in `use-logout.ts` and `use-client-pagination.ts`).
- `ARCHITECTURE.md` is updated where behaviour changed: report search is now server-side, list pages are in the URL, and logout is server-revoked.
- This file gains a "Status" section listing what was done, deviations from the plan and what remains blocked. The previous RBAC plan uses the same format.
