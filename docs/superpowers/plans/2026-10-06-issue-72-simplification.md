# Issue 72 business navigation simplification plan

> For implementation workers: use the invoked Poteto adapter and implement workflow. Deliver these contracts in order. Application changes begin after the user reviews this plan and the representative UI. Preserve test-first seams and review the final branch with the invoked code-review workflow.

Goal: let Eralp understand the selected month, find a product or existing invoice, record expenses and export a report through five clear business pages.

Architecture: retain existing renderer page owners and service-owned reports. Add one selected-month owner above both data modes, keep business page list state mounted within the active workspace, and use identity-bound detail/return state. Extend existing local preferences and add a narrow purchase-document read projection. No router, new arithmetic or source projection.

Stack: existing Electron, TypeScript, React, local Node service, SQLite and locked dependencies.

Spec: [issue #72](https://github.com/AlesSystems/esmer-market-analytics/issues/72), [foundation specification](../specs/2026-09-04-esmer-market-rebuild-design.md), [monthly product profit](../../contracts/monthly-product-profit.md), [recorded estimates](../../contracts/recorded-estimates.md).

Status: user approved the plan and clean layout on 2026-10-06 and authorized implementation and PR creation. Baseline main `afe93cd`, verified origin `https://github.com/AlesSystems/esmer-market-analytics.git`. Application implementation and synthetic packaged verification are complete at `7ba2891`; see [the implementation receipt](../../evidence/2026-10-06-issue-72-simplification.md). Windows, real-source financial and owner acceptance remain open.

## Global constraints

- Turkish UI and presentation, English internal identifiers, TRY financial reports, one offline Windows application for one owner/store.
- Permanently read-only source access. No renewed source inspection, expanded private fields, production connection, owner contact or installation.
- Service-owned decimal calculations, unchanged cost/return/tax meanings, immutable accepted reports and matching complete exports.
- Preserve app-owned expenses, adjustments, settings, audit history and encrypted recovery through refresh and navigation.
- No login, PIN, roles, multi-user features, paid service, new dependencies or legacy runtime dependency.
- Synthetic fixtures and safe screenshots only. Real financial/source and Windows gates require their own evidence.

## Proposed experience

Keep the current white, cobalt `#2459d5`, Manrope, local logo and fine separators. The user confirmed this direction on 2026-10-06. Use compact working tables and ordinary labelled controls. Keep Settings' approved tile layout.

| Page | First view | Retained detail |
| --- | --- | --- |
| Özet | Net sales with comparable-period change, available covered gross estimate, recorded expenses; short daily sales chart and three product highlights | Detailed monthly report through Raporlar; product details through explicit labelled links |
| Satışlar | Sales summary and searchable product table | Product sales, category/year comparisons, transactions, returns, exclusions and source-line evidence |
| Alışlar ve maliyet | Purchasing summary and recent purchases, visible Faturalar tab | Existing invoices/available lines, linked dispatches, supplier returns, replacement costs, cost exclusions, stock/waste |
| Giderler | Recorded monthly expense total and records; one Gider ekle and one Excel'den aktar entry | Existing entry/import/validation, corrections, completeness and history |
| Raporlar | Selected month's existing report with Excel'e aktar and Rapor geçmişi | Full monthly product/day detail, review, immutable saved versions and comparisons |
| Ayarlar | Existing layout and controls | Short explanation of both data views with actual provenance and verification status |

The overview uses three figures. Comparison stays beside sales rather than becoming a separate box. Recorded expenses replace the currently unavailable operating-profit headline. The operating-result workflow remains in the monthly report and expense completeness tools.

Remove the full monthly workspace currently mounted below the overview. Move that capability into the report/detail route. Remove the permanent evidence column and duplicate action copies. Technical IDs, status codes and calculation evidence open under `Veri ve hesaplama ayrıntıları`. Missing costs, excluded returns, unknown amounts, incomplete expenses and unverified estimates stay beside the affected result.

The shell shows the page title, selected month and compact source status together. Detail pages show a breadcrumb, the parent sidebar selection and a labelled return such as `Satışlara dön` or `Faturalara dön`. Substantial product, transaction and invoice information uses the content area, not an aside or a section under the entire list. Small explanations use native disclosures.

On returning, restore the originating month, search, filters, sort, page, table scroll on both axes, window scroll and keyboard focus. A nested product → transaction or return → original-sale path restores its immediate parent before the list. If the original row is absent, focus the visible list heading and explain the changed record.

## Data and state decisions

`SelectedMonth` is a boundary-validated `YYYY-MM`. Only this preference persists across restarts. Filters, page locations and detail receipts remain session state.

The root owns the selected month and its loading/error state. The active financial workspace retains its existing `ReportContext`; the recorded workspace retains its package hash. Switching data view preserves the month but cannot reuse a detail under another source identity. Settings continues to hide the existing workspace without destroying drafts.

Detail state is a small discriminated union, with legal identity combinations. Product detail has immutable report ID and product ID. Financial transaction/invoice detail has its full session context. Recorded detail has exact package hash and record ID. The local return receipt stores that identity, originating filters/page and stable focus key. Do not add a global registry of every page's filter schema.

Keep page-local lists mounted while their dedicated details are open. Retain the active mode's business page state across sidebar navigation. Hidden pages do not query, claim focus or appear in keyboard/accessibility navigation. There is no requirement to keep both data-mode trees alive. A mode change invalidates incompatible details while retaining the selected month.

Month bootstrap waits for preferences and dataset information before the first query. A saved valid month wins, including when unavailable. On first use, the service resolves the latest actual dated record within the active dataset, not the host clock, import time or declared extraction end alone. Cutoff and partial-day/period qualifiers remain separate. Empty datasets show an empty state; do not fabricate an available month.

A requested month changes the visible selection into a loading state. Hide previous-month figures until a coherent context-matching response arrives. Failure keeps the requested month visible with an error or unavailable-period explanation. Discard delayed responses after month, source, mode or report changes. Existing session/hash validation remains authoritative.

Extend `Preferences` with an optional saved month and use validated field patches in the existing serialized preference service. Merge each patch inside the queue before atomic write. Legacy text-size-only files remain valid. Concurrent text-size and month changes cannot erase each other. If persistence fails, the session can show the selected month but must explain that it was not saved for restart and offer retry.

Every departure or month/mode mutation passes the existing expense-navigation guard before changing state or saving preferences. Cancelled navigation has no effect. Hidden UI never removes the locked-operation guard before the operation settles. Existing safe Settings entry remains usable during an operation, while incompatible mutations remain guarded.

An imported source does not silently refresh pinned financial details or accepted reports. Offer explicit refresh. For recorded package replacement, reject the old hash and clear old detail with a plain source-change notice. Reused record IDs from another lineage cannot reopen unrelated records. Refresh retains the selected month; if no longer available, show that fact. No silent fallback to a different month.

Archived reports retain their own saved month, source and calculation version. Opening another month's archived report is explicit. Its header shows that report's month and saved provenance; the return receipt restores the originating archive month/context. Do not rebuild accepted versions from the active dataset. Other business pages continue with the shared working month.

An archived detail shows its saved report month as a fixed label in place of the editable working-month control. It cannot display active-dataset totals beside saved detail. Returning restores the working-month control and the origin context.

The preview demonstrates the financial synthetic view. Recorded mode uses the same navigation hierarchy with its existing meanings. Özet shows recorded counts or the separately labelled unverified contribution estimate when the package supports it. Satışlar retains recorded candidate amounts and record browsing without calling them validated net sales. Alışlar shows recorded document amounts with their qualifications. Giderler still reads app-owned expenses. Raporlar can open/export saved financial versions, but cannot create a financial report from unverified recorded rows. Keep the current estimate product/day/month and full export paths; never copy the financial labels or safe synthetic names into raw records.

## Complete invoice browsing

`PurchasingView.evidence` is a relevance subset and omits some documents, including empty invoices. Do not label it a complete invoice list.

Add named `queryPurchaseDocuments({context, offset, search})` and `inspectPurchaseDocument({context, documentId, offset})` operations through the existing validated desktop/service boundary. Resolve the retained financial session snapshot. Use fixed 50-row pages. The list includes every retained selected-month purchase document whose supported representation is invoice, even without lines or recognized financial contribution. Unknown representations remain reachable as other purchasing documents with their actual status. Supplier-return documents retain their separate business route.

Each row contains only already-supported ID, date, representation, available recorded header amounts, line count, domain recognition/availability and reasons. Supplier information is optional and uses an already-supported retained mapping. Recognition can remain unsupported or unknown; absence from current calculated history is not proof of exclusion. Detail permits linked retained documents outside the month and states their actual date.

Recorded invoice browsing reuses `querySourceWorkspace` purchasing scope, document type `1`, documents view and current bounded detail reads. Retain the historical document-type qualification. The raw allowlist stays unchanged. Recorded currency stays explicit; non-TRY rows never receive a fabricated TRY value or conversion.

Use `Belge kayıt ID'si`, `Fatura numarası mevcut değil`, `Tedarikçi bilgisi mevcut değil` and `Belge toplamı mevcut değil` when applicable. Keep unverified recorded amounts labelled. A line sum never substitutes for a recorded header total. Browsing invoice and linked dispatch leaves existing purchase-event deduplication and financial totals unchanged. No attachment/scanning feature, source inspection, supplier-name extraction or new invoice-number field.

## File responsibilities

| Area | Planned change |
| --- | --- |
| `src/ui/App.tsx`, `AppShell.tsx` | Shared month hydration/selection, consistent heading/status and guarded transitions |
| New `src/ui/business-month.ts` | Small selected-month state helper and boundary parsing only where existing validation cannot be reused |
| `src/ui/SalesWorkspace.tsx`, `SourceWorkspace.tsx` | Active page lifecycles, dedicated details, retained local list context and response identity checks |
| `src/ui/overview/ControlDesk.tsx`, `MonthlyOverview.tsx`, `MonthlyWorkspace.tsx`, `MonthlyProfitPage.tsx`, `SelectedProduct.tsx` | Concise summary, product highlights and reuse of full existing report/product detail in its destination |
| `src/ui/purchasing/PurchasingWorkspace.tsx`, new `PurchaseDocuments.tsx` | Purchasing-first composition, complete invoice list/detail and retained secondary tools |
| `src/ui/ExpensesWorkspace.tsx`, `expense-navigation.tsx` | Single action entries and preserved draft/locked-operation behavior |
| `src/ui/reports/ReportVersions.tsx`, related existing archive/version components | Selected-month first view and retained history/review/export |
| `src/ui/settings/SettingsPage.tsx` | Only requested data-view explanation and preference setter adaptation |
| `src/desktop/preferences.ts`, `main.ts`, `requests.ts`, `preload.ts`, `src/domain/contracts.ts` | Backward-compatible preference patch and narrow named invoice reads |
| `src/reports/contracts.ts`, `query.ts`, `src/service/worker.ts` | Session-pinned invoice projection and service-owned initial month selection |
| Existing UI styles and scoped surface briefs | Approved composition changes in the incumbent system |
| `PRODUCT.md`, `DESIGN.md`, `docs/contracts/page-control-desks.md`, affected monthly contract/briefs and evidence index | Explicit issue-72 navigation delta and build-specific receipts |

Inspect actual owners before adding each proposed file. Reuse existing types/helpers and native elements. No dependency, package format, financial calculation version or SQLite migration is intended. If implementation reveals one is necessary, expose the concrete reason before expanding scope.

## Execution graph

| Node | Type and objective | Depends on | State / acceptance |
| --- | --- | --- | --- |
| N01 | Design and representative UI review | Read-only inventory, candidate review and preview | Completed; user approved the plan and representative UI |
| N02 | Test missing month, return context and invoice contracts | N01 approved | Completed; behavioral red results on safe fixtures |
| N03a | Shared month and consistent shell | N02 | Completed; preference/period/guard contracts pass |
| N03b | Full-page product/transaction details and concise overview/sales | N03a | Completed; contextual return and existing product contracts pass |
| N03c | Complete invoice projection and purchasing route | N03a, then N03b shared navigation accepted | Completed; invoice completeness, nulls, pinning and deduplication pass |
| N03d | Expenses, reports and Settings composition | N03b, N03c | Completed; existing mutations, report history/export and source modes preserved |
| N04 | Integrated and packaged verification | N03d | Completed; suites, screenshots, window/zoom/keyboard and build evidence |
| N05 | Independent code, UX, accessibility and data-meaning review | N04 | Completed; findings fixed and re-tested |
| N06 | Integration, product/design delta and exact handoff | N05 | Running; evidence and coherent commits prepared; PR delivery pending |

One implementation owner serializes shell/month/detail writes. Read-only review is independent. Use a suitable attached worktree or create `codex/issue-72-simplification` at execution time. Preserve existing untracked `outputs/` and other worktrees. Verify origin before any commit/push/PR. No merge is part of this plan.

## Test-first implementation units

Each unit begins with focused failing behavioral tests, distinguishes application failure from tool failure, implements the smallest change, verifies it and records a coherent commit. Use scoped `test:`, `feat:` or `fix:` and separate higher-risk `docs:` evidence.

### 1. Persist and share the month

- [x] Extend `tests/integration/preferences.test.ts` for legacy files, malformed month/unknown fields, concurrent patches and failed writes.
- [x] Add `tests/desktop/business-navigation.test.ts`. A dataset with latest records in September and a declared extraction end in October initially selects September. Selection follows all five pages and both modes, persists after restart and remains selected when unavailable.
- [x] Add delayed-response, failed-query and expense-guard cases. Previous-month amounts never appear under a pending/new month. Cancelled departure does not save or query a different month.
- [x] Select a month outside source coverage. Giderler still offers entry/import and app-owned records; Raporlar still offers saved report history. Missing source data cannot disable these workflows or imply zero expenses.
- [x] Implement root month and queued preference patches. Preserve text size and existing protected desktop boundaries.
- [x] Run focused integration/desktop checks, typecheck and relevant lint before the implementation commit.

### 2. Simplify overview, sales and substantial details

- [x] Extend `product-detail`, `sales-drilldown`, `workspace-subviews` and `source-workspace` desktop tests. Enter from second-page filtered/scrolled tables, return through labelled back and parent sidebar, and assert search/category/kind/day/sort/page, scroll and focus.
- [x] Cover nested transaction/original-sale evidence, missing return row, rapid month/source changes and reused IDs from another lineage. Accepted report details retain their saved identity.
- [x] Remove duplicated below-overview composition; reuse the existing full report and product queries in dedicated views. Preserve at most three graphs and numerical alternatives.
- [x] Keep all-products report scope independent of highlight/search/page. Display covered/excluded amounts and unknowns beside results.
- [x] Verify existing product Excel, signed quantities, fractional precision, return attribution and v1/v2 stored report journeys.

### 3. Add complete supported invoice browsing

- [x] Extend `tests/integration/purchasing-report.test.ts` and desktop boundary tests for all retained invoice documents, empty/unsupported documents, fixed paging, stale contexts, malformed requests and untrusted senders.
- [x] Assert a converted dispatch and its invoice appear as linked documents while purchasing totals remain unchanged.
- [x] Extend purchasing/source desktop tests for invoice search, second-page return, absent serial/supplier/header total, exact recorded values, non-TRY records and outside-month linked-document dates.
- [x] Implement the narrow retained-snapshot projection and named IPC operations. Reuse current raw source browsing without adding columns.
- [x] Add visible Faturalar list and full-page detail. Keep empty documents present and qualification text next to amounts.

### 4. Simplify remaining page entry points

- [x] Extend manual-expenses/expenses-control-desk tests to prove one route per entry action and protected draft, preview, duplicate decisions, correction, completeness and locked import.
- [x] Extend reports-control-desk/report-version-comparison tests for selected-month first view, immutable archive reopen, comparisons, review reason, complete export and version qualification.
- [x] Extend Settings/source-mode tests for actual dataset provenance, synthetic financial status and disabled/unsupported availability. Preserve import, live, recovery and display controls.
- [x] Compose the requested first views. Reuse existing service outputs and all secondary business workflows.

### 5. Verify the working application and review

- [x] Run focused unit and integration checks regularly, then the full `npm test` once after integration. Also run `npm run typecheck`, `npm run lint` and `npm run build`.
- [x] Run actual packaged desktop owner tasks with safe fixtures. Inspect desktop and narrow-window screenshots in one batch, fix material problems together and confirm once.
- [x] Check keyboard/focus, hidden-page accessibility, Turkish characters, text-size preferences and 200% zoom. Verify partial/empty/unavailable/loading/failed periods, stale responses and immutable exports.
- [x] Run the Impeccable mechanical detector once on changed UI targets. Use independent UX/data review and the invoked code-review workflow. Resolve findings and run affected regressions.
- [x] Build Windows artifacts with `npm run package:win`. If this host cannot perform actual Windows journeys, document exact remaining installer/portable, restart/offline, scaling, keyboard and task checks against the final branch/build. Cross-built files or macOS tests do not pass Windows A07.

### 6. Record the navigation delta and hand off

- [x] Update product/design and affected contracts/briefs explicitly. Issue 72 supersedes prior overview composition and inline detail placement, while preserving their calculation and evidence contracts.
- [x] Record task/gate, commit/build, safe fixture, environment, procedure, expected/actual outcomes, screenshots, limitations and Windows continuation in `docs/evidence/2026-10-06-issue-72-simplification.md`.
- [x] Complete the issue's nine owner tasks in the working application using synthetic automated packaged journeys. This verifies workflow behavior; it does not establish uncoached owner usability. User-reviewed prototype is N01 evidence only. Eralp acceptance remains open; no owner contact occurred.
- [ ] Use small coherent commits and a PR linked to #72 and this plan. Attach screenshots and identify preference-file change, narrow IPC extension and lack of new financial/source semantics. Report branch, hashes, PR and remaining gates.

## Review focus

- Hidden page effects and keyboard targets must not remain active; the locked expense mutation guard must remain alive.
- Month preference and text-size updates must not overwrite each other or flash old results under the new title.
- Missing invoice fields, empty documents and unsupported recognition must remain honest.
- A source/report replacement must not mix old detail, new totals or reused IDs.
- Saved v1/v2 reports and exports must retain original semantics, scope and exact decimals despite navigation changes.

## Planning evidence and limits

Read-only investigations and two ownership candidates are in `work/issue-72/`. An independent reviewer preferred candidate B, 22/25, over candidate A, 21/25. This plan adopts existing page-local ownership, plus A's identity-bound return receipt and explicit immutable-report variant. It resolves the review's pending-month, hidden guard and unsupported-invoice gaps.

Current-host baseline `npm run test:desktop -- tests/desktop/ozet-control-desk.test.ts` passed 3 tests at main `afe93cd`. The throwaway HTML preview has separate navigation checks in `work/issue-72/preview-verification.json`. It demonstrates layout, search, paging, contextual return, month continuity/reload and missing invoice fields with fabricated safe content. Its data/export/entry buttons are illustrative. It is planning evidence only. Later application evidence is recorded separately in the implementation receipt.

Poteto Experience First led to the dedicated detail preview before production code. Laziness Protocol led to retaining page owners, native controls and existing calculations. Model the Domain led to explicit month/detail/identity states instead of independent flags.
