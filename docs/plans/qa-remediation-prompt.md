# Execution Prompt — QA Remediation (Functional Test Report)

> Copy everything below the line and paste it into Claude Code, opened at the project root.
> **Before pasting:** commit (or stash) the current RBAC work on `develop`, and start the backend on `http://localhost:8080`.
> To run a later phase, change the **Scope** line. Everything else stays the same.

---

You are a senior frontend engineer working on `medad-web`: React 18, Vite, TypeScript (strict), TanStack Query, react-hook-form + zod, Radix primitives and Tailwind. It is a fully Arabic, RTL-only, government system for managing police reports («الضبوط»). Branch: `develop`. The backend (Spring, `com.kmw.medad`) is a **separate repository**. You cannot change it here.

## Task

A functional test run produced 42 findings (1 × P1, 6 × P2, 17 × P3, 18 × P4). They have been triaged into a phased plan at `docs/plans/qa-remediation-plan.md`. Your job is to implement that plan phase by phase.

**Scope for this run:** Phase 0, then Phases 1 → 5 (the frontend-only fixes). Then **stop** and report. Do not start Phases 6–8 (they depend on backend endpoints) unless Phase 0 proves the required backend item is already live **and** I approve.

## Read first, in this order only

1. `CLAUDE.md ` at the repo root. **The filename ends with a space**, so read it with `cat "CLAUDE.md "`. Its rules are binding: the existing architecture is a contract, make the smallest correct change, no new dependencies, all user-facing text in Arabic.
2. `ARCHITECTURE.md`: layering (`lib` → `hooks` → `pages`/`components`), and the rule that only hooks call react-query.
3. `docs/plans/qa-remediation-plan.md` **in full**, especially §1 (verified root causes), §3 (decisions D1–D13 and their defaults) and §5 (per-phase tasks and acceptance criteria).
4. `api/API_INTEGRATION.md`: only the sections a task references (§3 error shape, §6 form types, §7.3 list params, §7.6 text markup, §7.7 statistics). **Ignore `api/api-docs.json`; it is stale.**
5. The original report, only if a finding is unclear: `docs/تقرير_الاختبار_الوظيفي_نظام_الضبوط.docx`. Its reproduction steps are the acceptance tests.

Do not read the whole repository. Work as SEARCH → IDENTIFY → READ → IMPLEMENT → VERIFY.

## Already correct: do not break or rewrite

- `lib/api/client.ts`: a single `fetch` client with a single-flight refresh on 401. The disabled-account message path works.
- Session storage in cookies through `lib/session` / `lib/cookies` only.
- RBAC: `can()` / `useCan()`, `RequirePermission`, `HomeRedirect`, and the 403 → refetch of `users.me` in `query-client.ts`.
- These passed QA and must still pass: server-side report filters and their URL deep links; the sealed-report rules (`CLOSED` → read-only in the UI, 409 from the API); **XSS-safe text rendering**; the duplicate report-number message; Excel/PDF downloads; dark mode; the 404 page; legacy route redirects; no horizontal scroll at 390px/820px.

## Hard constraints

- **No new npm dependencies.** Build the searchable select (QA-028) on the already-installed `@radix-ui/react-popover`.
- **Never use `dangerouslySetInnerHTML`.** The report text view (QA-016) builds React nodes directly.
- `components/ui/*` stays free of business logic: data and messages arrive as props.
- The router is `BrowserRouter`, so `useBlocker` is not available. **Do not migrate the router.** Guard unsaved changes with explicit confirmations and `beforeunload`.
- Do not invent backend contracts. If a task needs an endpoint or field that Phase 0 did not confirm, skip it and report it as blocked.
- Comments: only for non-obvious reasons, one line each. Fix any comment your change makes false.
- No refactoring outside what a finding requires. No new folders such as `features/`, no new stores, no new contexts.

## Decisions

Use the **recommended defaults in plan §3** (D1–D13) unless I have written different answers into the plan's "Decisions log". The ones that matter for Phases 1–5 are: D3 (national ID = optional, exactly 11 digits), D4 (witness count ≤ 20), D9 (remove «الإعدادات»), D10 (hide the bell), D11 (font: fix the spacing, revert only if the retest fails) and D12 (drop `from` when a different user signs in). State in the commit message which default you applied.

## Execution

### Phase 0: Preflight (no code)

1. `git status`. If the RBAC work is still uncommitted, **stop and tell me**. Do not commit it yourself, and never discard it.
2. Log in with `curl` (`admin@gmail.com` / `12345678`) and record:
   - whether `GET /api/v1/reports?reportNumber=2026&size=5` actually filters (BE-1);
   - whether `POST /api/v1/auth/logout` and `PUT /api/v1/users/me/password` exist (BE-6, BE-8);
   - whether `GET /api/v1/reports/statistics` → `byCrimeType[].details.byResult` contains a `null` key (needed for QA-011);
   - the exact fields of one `FormTypeResponse` (`reportsCount`/`hasReports` present? BE-5).
3. If the backend is down, say so and continue with Phases 1–5. **Never guess response shapes.**

### Phases 1 → 5

Implement them in order, exactly as specified in plan §5. After **each** phase:

```bash
npm run typecheck && npm run lint && npm run build
```

Then make one commit per phase (split per finding if a phase gets large). Use a short English message in the repository's log style, listing the QA IDs it closes, for example `Fix form-type parent names across pages and normalize Arabic search (QA-003, QA-017)`. End every commit message with:

```
Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
```

**Do not push. Do not open a PR.**

Phase-specific notes:
- **Phase 1:** create `lib/utils/text.ts` (`normalizeDigits`, `normalizeArabic`, `matchesSearch`) first, because later phases reuse it.
- **Phase 2:** apply the date rules in both the create dialog and the edit page. Existing records with legacy invalid data must still **open**; they fail only on save, with a field error.
- **Phase 3:** QA-022 is visual. Remove negative `letter-spacing` from Arabic text first, then tune `word-spacing`. Show me before/after screenshots or describe exactly what you saw. If it still reads badly, stop and ask before reverting the font.
- **Phase 4:** QA-031's root cause is in plan §1 (the observer only receives *changed* entries, and it uses the wrong root). Fix the logic; do not just tweak `rootMargin`.
- **Phase 5:** the searchable select needs full keyboard support and correct ARIA (`role="combobox"`, `aria-expanded`, `aria-activedescendant`, and a `role="listbox"` of `role="option"`), and it must work in RTL.

## Verification before you say "done"

1. All three gates pass on the final commit (lint must have zero warnings).
2. Run `npm run dev:vite-only` against the live backend and re-run the **original reproduction steps** from the report for every finding you closed. Use the admin account and a limited role (create it with `curl` per `API_INTEGRATION.md` §10; delete it afterwards). Check at 390px, 820px and desktop widths, in both light and dark themes.
3. Re-check the regression list under "Already correct" above.
4. If you cannot open a browser, **say so explicitly** and list which findings were verified by code review only. Never claim a test passed if you did not run it.
5. Clean up every record you created (prefix test data with `QA-FIX`).

## Final report (concise)

- Phase 0 results: which BE items (BE-1 … BE-12) are live, and the actual response shapes you saw.
- Per phase: the commits and the QA IDs each one closes.
- A verification table: QA ID → PASS / FAIL / not verified (with the reason).
- Every decision default you applied, and any deviation from the plan, with the reason.
- Items still blocked on the backend, each with its BE number.
- Then update the plan file: add a "Status" section at the top (what was done, deviations, what remains), following the format of `docs/plans/rbac-implementation-plan.md`.

Then **stop** and wait for my approval before Phases 6–8.
