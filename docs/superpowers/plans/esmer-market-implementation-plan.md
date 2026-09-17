# Esmer Market Analytics Implementation Plan

> **For agentic workers:** Use `superpowers:executing-plans` to execute this plan task by task after implementation is authorized. Use subagents only when explicitly requested. Track execution with the unchecked steps below.

**Goal:** Build an independent Turkish desktop application that gives Eralp Esmer useful, explainable market analytics from prepared backup data.

**Architecture:** One Electron application contains a React interface and a local Node service. A developer-side, read-only extractor produces a minimal analytics package; the desktop imports it into SQLite. Deterministic calculations, app-owned expenses, report revisions and recovery remain independent of the source system.

**Tech stack:** Electron, TypeScript, React, Node and SQLite. Use Vitest for focused TypeScript tests; select and lock compatible maintained build, decimal, SQLite and Excel dependencies in Phase 1 after checking Windows packaging and licences.

**Approved foundation:** The user has approved the three written planning documents. This plan records implementation phases, dependencies and completion criteria. It contains no delivery schedule or effort estimates. The user subsequently authorized repository creation and a documentation-only PR and merge. Repository setup is complete; application implementation, database access, installation on Eralp's computer and production integration remain outside this change.

**Spec:** Read the [foundation specification](../specs/2026-09-04-esmer-market-rebuild-design.md), [database audit](../specs/2026-09-04-esmer-market-rebuild-audit.md) and [release acceptance checklist](../specs/2026-09-04-esmer-market-rebuild-acceptance.md) before execution. They remain authoritative; this plan organizes their delivery without replacing their calculation or safety requirements.

## Phases at a glance

| Phase | Outcome | Depends on | Completion gate |
| --- | --- | --- | --- |
| 1. Independent foundation | A private, offline desktop shell and repeatable verification | Separate authorization to implement; repository setup is complete | Empty app runs on Windows with protected desktop boundaries |
| 2. Source contract and test evidence | Reviewed financial mappings, privacy allowlist and independent expected results | Phase 1; separate authorization for any renewed source access | Every released source population is supported or explicitly excluded |
| 3. Read-only extraction | A minimal, validated analytics package | Phase 2 | Extraction proves read-only access and excludes prohibited data |
| 4. Durable imports and local storage | Repeatable imports that preserve app-owned information | Phases 1–3 | Invalid, interrupted and overlapping imports cannot corrupt the active state |
| 5. Sales and traceability | Reconciled sales analytics with explainable drill-downs | Phases 2 and 4 | Summary, detail and source evidence agree |
| 6. Costs, purchasing and supplier returns | Honest historical estimates and distinct purchasing analyses | Phases 2, 4 and 5 | Estimates disclose coverage; conversions and returns are counted correctly |
| 7. Expenses and operating results | Excel expense workflow, corrections and conditional operating profit | Phases 4–6 | Missing evidence never becomes a zero expense or an invented profit |
| 8. Complete Turkish reporting experience | Monthly overview, report revisions and matching Excel exports | Phases 5–7 | All released values share one calculation and evidence path |
| 9. Backup and recovery | Automatic encrypted backups and verified recovery on another installation | Phases 4, 7 and 8 | Recovery survives loss of the original computer |
| 10. Windows acceptance and reveal package | A tested installer, portable build and documented reveal dataset | Phases 1–9 | All applicable A01–A07 gates have recorded evidence |
| 11. Conditional live integration | Approved read-only synchronization into the same local analytics model | Product acceptance, Eralp's explicit permission and separate implementation direction | Every L01 gate passes before live rollout |

Phases 1–10 form the first release. Phase 11 is a separate release boundary. A phase completes on evidence, not merely because its code exists. Synthetic work may proceed while authorized source evidence is unavailable, but source-dependent gates remain open.

## Global constraints

- One store, one owner, one trusted local computer; Windows is the deployment target.
- Turkish-only interface and Turkish presentation conventions; English internal code/domain identifiers. TRY only.
- The business is in the TRNC/KKTC. Do not import legal or tax assumptions from another jurisdiction.
- The market database and operational system remain strictly read-only to the application, permanently.
- Development uses isolated restored backups. Prefer a newer supplied backup for the reveal when available; preserve its actual coverage and cutoff.
- Dashboards read only the local analytics store. The surprise build works offline and has live access disabled.
- No application login, PIN, roles, multi-user features, required subscription or paid cloud service.
- Do not import identifiable customer information or employee-level payroll. Monthly labour totals are sufficient.
- Historical cost is an explicitly labelled last-purchase estimate after source semantics are validated. It is not weighted-average inventory valuation.
- Missing cost, incomplete expenses and unknown KDV treatment remain missing or unknown. Owner acknowledgement cannot turn an estimate into exact cost.
- Profitability follows incurred periods; payment views use payment dates. Financing, owner funds, transfers and asset purchases are not silently operating expenses.
- Every released KPI retains population, source, batch, method, confidence and adjustment provenance.
- Source refreshes preserve expenses, settings, adjustments, audit history and accepted reports. Accepted versions cannot change silently.
- Excel import/export and encrypted, independently recoverable backups are first-release requirements.
- Preserve the performance and freshness acceptance targets in the approved specification; this plan does not restate them as project scheduling information.
- Do not copy legacy runtime code, migrations or Git history into the new repository. Do not commit private backups, credentials or unreviewed source data.
- Exclude PDF export, forecasts/AI, multi-store, multi-currency, customer analytics, statutory declarations and manual supplier-claim processing from the first release.

## Implementation structure and decisions

All implementation paths below are proposed paths **inside this independent repository**. They do not refer to existing implementation files. Create them only during authorized execution. The approved specifications and this plan are stored in `docs/superpowers/`; their repository context and approval status have been updated while retaining their requirements and evidence limitations.

| Location | Responsibility |
| --- | --- |
| `src/desktop/main.ts`, `preload.ts`, `requests.ts` | Desktop lifecycle, narrow validated IPC and native dialogs |
| `src/service/worker.ts`, `operations.ts` | Local application operations and serialized persistence work |
| `src/domain/contracts.ts`, `money.ts`, `evidence.ts` | Shared decimal, identity, coverage and report contracts |
| `src/source/contract.ts`, `extract.ts`, `package.ts` | Reviewed source mapping, approved reads and package generation |
| `tools/prepare-backup.ts` | Developer-side orchestration against an already authorized isolated restore |
| `src/store/schema.ts`, `migrations.ts`, `imports.ts`, `revisions.ts` | App-only schema, versioned source datasets, atomic activation and app revisions |
| `src/analytics/sales.ts`, `costs.ts`, `purchasing.ts`, `operating.ts` | Deterministic calculations and explicit unsupported populations |
| `src/reports/query.ts`, `versions.ts`, `export.ts` | Consistent report reads, immutable accepted versions and Excel generation |
| `src/expenses/template.ts`, `import.ts`, `adjustments.ts` | Expense preview, batch confirmation, classification and correction history |
| `src/recovery/backup.ts`, `restore.ts`, `keys.ts` | Consistent encrypted backups, key handling and candidate restore |
| `src/ui/overview/`, `sales/`, `purchasing/`, `expenses/`, `reports/`, `recovery/` | Turkish feature views and drill-downs |
| `tests/unit/`, `integration/`, `desktop/`, `fixtures/` | Focused behavioural tests and reviewed synthetic/reduced fixtures |
| `docs/contracts/`, `decisions/`, `evidence/`, `operations/` | Source decisions, evidence and operating/recovery instructions |

Keep one application and one dependency manifest. Do not introduce a monorepo framework, public HTTP API or independently deployed services.

Use one application-owned SQLite database. Source rows belong to immutable dataset versions; an active-dataset pointer selects the current source. App-owned records have their own revision history and are never replaced by source activation. Accepted reports pin the source dataset, app revision, calculation version and evidence needed to reproduce them.

Stage source imports without calculating against a mutable snapshot of expenses. Activate source facts in a short database transaction; calculate or query combined results using a pinned source/app revision. This prevents a completed import from overwriting an expense created while the import was running. Use SQLite transactions for atomic changes. [SQLite atomic commit documentation](https://www.sqlite.org/atomiccommit.html)

Use an explicitly versioned package containing a manifest and allowlisted data streams. The manifest records source lineage, schema/mapping version, cutoff, extraction identity, table/stream counts and content hashes. The package reader accepts only the documented streams and bounded sizes; hashes detect corruption, not proof of an authorized sender. Financial and source values remain decimal strings until parsed by the approved decimal layer.

For the first release, define average basket as net value of completed sale documents after their discounts and excluding separately issued return documents, divided by completed sale-document count. Show customer returns separately and deduct them in net sales. Label the basket convention in Turkish explanations and exports. Validate this convention against the Phase 2 document mapping before using real data.

Cost coverage shows covered/excluded line counts and separate signed sales/return amounts. A monetary coverage percentage uses absolute net line amounts so returns cannot cancel the denominator; label that basis. If the denominator is zero, show an unavailable percentage while retaining counts and amounts. A full operating-profit headline requires supported cost for every financially relevant sale/return line, reconciled sales, resolved expense classification/treatment and owner-confirmed expense completeness. Otherwise show supported sales/covered gross estimates and explain why the headline is unavailable.

Persist accepted estimates without labelling them trusted exact profitability. The historical estimate method keeps profitability provisional even when a saved report is accepted. `Açık / Geçici / Güvenilir` period states must never override metric evidence.

## Execution and evidence rules

For each behavioural task below:

1. Write the named test using the specified independent inputs and expected outcomes.
2. Run it and capture the expected missing-behaviour failure; distinguish that from a broken toolchain.
3. Commit the missing contract with a scoped `test:` message when useful, then make the smallest implementation change.
4. Run the focused test, type checking and relevant lint; commit the implementation with a scoped `feat:` or `fix:` message.
5. Add separate regression/integration coverage where the boundary requires it. Record acceptance evidence for financial, privacy, source-safety and recovery changes.

Phase 1 must establish `npm run test:unit -- <file>`, `npm run test:integration -- <file>`, `npm run test:desktop -- <file>`, `npm run typecheck`, `npm run lint`, `npm run build` and `npm run package:win`. Configure unit and integration commands to run Vitest once with a file filter; configure desktop checks to exercise the actual packaged application. Commands in this plan are contracts to establish, not claims that scripts already exist. [Vitest test filtering](https://vitest.dev/guide/filtering.html)

Tests use synthetic values or approved reduced fixtures. Examples below are test assertions to author during execution, not implemented application code. A source-backed expectation must be independently reviewed before it becomes an oracle; current program output is not its own proof.

For every completed gate, record: task/gate ID, build and commit, fixture/source-batch identity, environment, procedure or command, expected outcome, actual outcome, evidence path and remaining limitations. Keep private evidence outside Git and reference it by opaque identity. PRs link this plan's phase/task and any relevant decision record, explain risk, list verification, attach UI evidence where relevant, and identify schema/security/privacy/deployment effects.

## Phase 1 — Independent foundation

**Outcome:** A minimal offline application can be built, tested and opened on Windows before business features accumulate.

### Task 1.1 — Establish the repository and empty desktop slice

**Files:** Create `package.json`, the lockfile, `tsconfig.json`, build/test/lint configuration, `.gitignore`, `src/desktop/main.ts`, `src/service/worker.ts`, `src/ui/App.tsx`, `tests/desktop/startup.test.ts`, `docs/decisions/runtime.md` and `docs/evidence/index.md`.

**Interface:** The desktop starts the local service and displays its typed availability result. The service has no source connection at startup. An empty local store is a valid application state.

- [x] Before application work begins, confirm implementation authorization, inspect this repository's instructions and check release inputs for private material. Use the existing independent repository and approved planning artifacts. Preserve the legacy checkout and its unrelated untracked files.
- [x] Select and lock compatible maintained dependencies after validating licence terms, Windows support, Electron native-module packaging and decimal/Excel requirements. Record exact selections in `runtime.md`; do not copy legacy dependency choices by default.
- [x] Establish the verification scripts above and a desktop test that opens an empty application, finds `Henüz veri içe aktarılmadı`, observes no source connection and confirms no login screen appears.
- [x] Build the smallest window/service/React slice that passes that test. Open a packaged smoke build on a documented Windows test environment; do not install on Eralp's computer as a development shortcut.

**Verify:** `npm run test:desktop -- tests/desktop/startup.test.ts`, `npm run typecheck`, `npm run lint`, `npm run build`.

**Commit boundaries:** `test(desktop): define offline startup contract` → `feat(desktop): add independent offline shell`.

### Task 1.2 — Protect privileged operations

**Files:** Create `src/desktop/preload.ts`, `src/desktop/requests.ts`, `src/service/operations.ts`, `tests/integration/desktop-boundary.test.ts` and `docs/contracts/desktop.md`.

**Interface:** Expose named operations for report reads, import preview/confirmation, export and recovery as those features arrive. Each request has a validated payload and trusted sender. File selection returns a service-owned handle; the renderer cannot send arbitrary SQL, credentials or unchecked filesystem paths.

- [x] Add cases for an unknown operation, invalid payload, untrusted sender and SQL text embedded in an import request. Every case must fail before privileged work begins.
- [x] Enable renderer context isolation and sandboxing, disable renderer Node integration, restrict navigation/permissions and use a restrictive content policy. Expose individual operations through preload, never raw IPC or database handles. [Electron security guidance](https://www.electronjs.org/docs/latest/tutorial/security)
- [x] Assert that source credentials and native modules are absent from renderer-visible state. Return useful Turkish errors while logging only safe diagnostic metadata.

**Verify:** `npm run test:integration -- tests/integration/desktop-boundary.test.ts` and the startup test.

**Evidence status (2026-09-15): Complete.** [Windows verification](../../evidence/windows-phase-1.md) records packaged checks, dependency notices, runtime versions, screenshots, installer removal, and user-performed offline startup. A01, A05, and A07 remain broader release gates. Stop after Phase 1.

**Exit gate:** Offline startup and privilege-boundary checks pass. Dependency choices and Windows smoke evidence are recorded. Covers the foundation of A01, A05 and A07.

## Phase 2 — Source contract and independent test evidence

**Outcome:** Implementers know which source records mean what, which calculations are justified and which populations remain unsupported.

### Task 2.1 — Resolve source semantics before financial implementation

**Files:** Create `docs/contracts/source.md`, `docs/contracts/calculations.md`, `docs/contracts/privacy.md`, `src/source/contract.ts` and `tests/fixtures/source-contract/`.

**Interface:** A versioned mapping declares document inclusion, unit conversion, money/KDV basis, return/conversion attribution, stable IDs and field allowlists. Each rule identifies its evidence and whether it is supported, unsupported or excluded with a warning.

- [x] Start with the existing audit. If renewed source inspection is needed, obtain authorization for that isolated audit before starting any container, restoring a backup or reconnecting. Planning approval alone does not grant this access.
- [ ] Revalidate the source contract on an authorized clean restore or newer backup, as required by the audit. Record lineage, backup identity/hash where available, schema differences, legacy-app additions and coverage. Use read-only queries and scoped permission checks; keep credentials and full source records out of documentation. If suitable input is unavailable, leave the affected source evidence gates open.
- [ ] Validate historical last-purchase cost units and KDV basis, zero/negative costs, fractional quantities, return-cost links, header/line discounts and rounding. Adopt explicit decimal precision rules only after representative source examples support them.
- [ ] Resolve financial inclusion for every relevant dictionary type. Specifically investigate sale type 11 versus type 35, invoice/dispatch links and inconsistent conversion flags; reused receipt keys and absent exact matches do not settle economic identity.
- [ ] Define sale-document counting and the basket convention above; classify voids, archived deletions, customer returns and supplier returns separately. Verify the market-local business-date convention independently of machine timezone.
- [ ] Produce a reviewed column allowlist. Use purchasing counterparties for suppliers; exclude customer identifiers, contact/address/tax/loyalty data, personnel fields and raw change-log SQL.
- [x] Record unresolved cases with their affected population and the exact consequence: block the dependent metric, show an identified covered subset, or reject an essential import. Do not weaken a gate to make the source fit.

**Gate:** A reviewed source-to-domain contract exists before implementing any affected formula. Synthetic development can continue for unsupported cases, but no source-reconciled label is granted without evidence. Covers A02, A03 and A05.

### Task 2.2 — Establish calculation oracles and multi-snapshot fixtures

**Files:** Create `tests/fixtures/golden/`, `tests/fixtures/source-a/`, `tests/fixtures/source-b/`, `tests/integration/fixture-contract.test.ts` and `docs/evidence/golden-oracles.md`.

**Interface:** Each fixture includes input records, independent expected outputs, mapping version, coverage and provenance. Paired snapshots explicitly identify the same source lineage and stable document identities.

- [x] Encode G01–G08 from the acceptance checklist without changing their assumptions. Independently check their arithmetic; label all generated data synthetic.
- [x] Add fractional units, unknown units, unsuitable denominators, rare document types, inconsistent conversion links, KDV anomalies, backdated corrections, deleted lines, source-ID reuse after reset and interrupted publication cases.
- [x] Add source A/B fixtures with insert, edit and deletion changes. Include app-owned expenses/adjustments that must survive and a referenced source line that disappears.
- [ ] When source access is authorized, create a reduced fixture using the approved allowlist. Review generated contents before committing; use synthetic sentinels to test privacy filtering.
- [x] Write a fixture contract test that fails on missing expected outputs, undeclared source lineage, unsupported semantics presented as supported, and unreviewed private fields.

**Verify:** `npm run test:integration -- tests/integration/fixture-contract.test.ts`.

**Exit gate:** Every initially released formula has an independent oracle, and source-supported versus synthetic-only evidence is distinguishable. Financial implementation remains blocked for unresolved rules.

**Evidence status (2026-09-17): Synthetic contract and fixture checks complete for #5; source gates open.** The [source contract](../../contracts/source.md), [oracle record](../../evidence/golden-oracles.md) and [local evidence](../../evidence/phase-2-local.md) distinguish synthetic checks from source validation. The subsequent [Windows evidence](../../evidence/windows-phase-2.md) records passing packaged regression, inventory and portable/NSIS lifecycle checks on the same branch. The user reported successful physical-disconnect testing on 2026-09-17. Source-dependent checkboxes and broader release gates remain open. No Phase 3 work is authorized by this status note.

## Phase 3 — Read-only extraction and analytics packages

**Outcome:** An authorized isolated restore can be converted into a minimal customer-free input without modifying the source.

### Task 3.1 — Extract through the reviewed allowlist

**Files:** Create `src/source/extract.ts`, `tools/prepare-backup.ts`, `tests/integration/source-readonly.test.ts`, `tests/integration/source-privacy.test.ts` and `docs/operations/prepare-package.md`.

**Interface:** The extractor consumes the reviewed mapping plus a protected read-only connection and streams only approved records. The preparation tool orchestrates extraction from an already isolated restore; database administration is separate from both extractor and desktop.

- [ ] Write an isolated permission test for the full extraction lifecycle, including connection initialization, retry, cancellation and failure. Approved reads succeed; forbidden writes/administration are denied by the test account.
- [x] Test a source-shaped fixture containing prohibited synthetic sentinel values; assert they never appear in extracted records, logs or diagnostic output. Do not broadly select customer-bearing tables and redact after persistence.
- [x] Implement explicit parameterized SELECT queries with bounded batches, query limits and cancellation/resource cleanup. Review dependency initialization for hidden source writes; do not execute unchecked source procedures.
- [x] Keep tests that attempt forbidden writes exclusively on the isolated test instance. Capture permission/workflow evidence without sensitive parameter values.

These completed steps apply to `synthetic-relational-v1` and generated SQLite databases only. The restricted SQL Server account test above and the reviewed real-source mapping remain open. The preparation tool rejects unsupported mappings before opening a source.

**Verify:** `npm run test:integration -- tests/integration/source-readonly.test.ts` and `npm run test:integration -- tests/integration/source-privacy.test.ts`.

### Task 3.2 — Produce and validate portable analytics input

**Files:** Create `src/source/package.ts`, `tests/integration/analytics-package.test.ts` and `docs/contracts/analytics-package.md`.

**Interface:** The package writer consumes approved streams and emits a versioned manifest plus payload. The reader returns validated records and metadata or a structured rejection; it does not activate a dataset.

- [x] Define the exact stream/schema encoding and size limits in `analytics-package.md`; record lineage, mapping version, coverage, record counts and content hashes. Preserve decimal strings and stable source IDs without numeric precision loss.
- [x] Test round-trip identity, a changed payload/hash, unsupported schema, undeclared stream, invalid required references and truncated input. Reject malformed input before activation; show permitted incompleteness as warnings.
- [x] Keep full POS backups, source credentials and operational restoration tooling out of the desktop distribution. Document preparation without promising an ongoing manual import service.

**Verify:** `npm run test:integration -- tests/integration/analytics-package.test.ts`.

**Evidence status (2026-09-17): Synthetic implementation verified locally and on Windows; successful physical-disconnect testing is human-reported.** The [package contract](../../contracts/analytics-package.md), [preparation procedure](../../operations/prepare-package.md), [local evidence](../../evidence/phase-3-local.md) and [Windows record](../../evidence/windows-phase-3.md) record bounded synthetic scope. Windows tests, packaging, CLI cleanup, distribution inspection and portable/NSIS lifecycle checks passed after a fixture-only setup fix. The user subsequently reported successful physical-disconnect testing. The package reader does not activate a dataset. Real-source extraction, source privacy and SQL Server permissions remain unvalidated, so the source-dependent exit gate remains open. The [Windows prompt](../../operations/windows-phase-3-handoff.md) remains the procedure. Stop after Phase 3.

**Exit gate:** A prepared package is reproducible, minimal and validated. Read-only and privacy evidence satisfies the extraction portions of A01/A05; package validation contributes to A04.

## Phase 4 — Durable local storage and safe imports

**Outcome:** Users can import repeated or newer packages without losing working data, corrections or report history.

### Task 4.1 — Introduce versioned persistence and app-owned revisions

**Files:** Create `src/store/schema.ts`, `src/store/migrations.ts`, `src/store/revisions.ts`, `tests/integration/store-ownership.test.ts` and `docs/contracts/persistence.md`.

**Interface:** Dataset IDs namespace immutable source facts. An app revision identifies expense, adjustment, confirmation and settings changes. Report reads explicitly bind both; migrations target only the app database.

- [ ] Define tables for import batches, source versions/facts/links, active dataset, app-owned revisions, report versions and evidence references. Use exact decimal text or documented scaled storage; never SQLite floating-point money as an accidental default.
- [ ] Write a test that creates a source version, an expense revision and an accepted report, applies an app schema migration, and verifies all values and references remain readable.
- [ ] Serialize app writes through the owning service. Keep expensive parsing/calculation work outside the renderer; use read transactions or pinned versions for coherent reports.
- [ ] Document retention: preserve active data and everything required by accepted reports and unresolved adjustments; prune redundant unreferenced candidate data/caches. Expose storage pressure instead of silently deleting required evidence.

**Verify:** `npm run test:integration -- tests/integration/store-ownership.test.ts`.

### Task 4.2 — Stage, validate and atomically activate imports

**Files:** Create `src/store/imports.ts`, `tests/integration/import-activation.test.ts` and `tests/integration/import-failures.test.ts`.

**Interface:** Import state advances through staged → validated → active, with explicit failed/cancelled outcomes. Activation changes only the selected source dataset and source-related metadata; it does not replace the database file.

- [ ] Test identical-package idempotency and overlapping source A/B snapshots. Edits/deletions replace the current source view exactly once; changed source lineage cannot collide on reused IDs.
- [ ] Test an expense and adjustment created after staging but before activation. Both survive activation; changed or missing adjustment targets become review-required without reassignment.
- [ ] Inject failures during package reading, batch persistence, validation, summary generation and activation. Restart after interruption and verify the prior complete dataset remains usable.
- [ ] Test disk exhaustion, corrupt input, essential reference failures and a failed first import. Preserve the working state; show an empty/error view on first-use failure.
- [ ] Activate only a coherent candidate. Do not publish source-only summaries together with operating results computed from an obsolete app revision. Retain rollback and difference evidence.

**Verify:** `npm run test:integration -- tests/integration/import-activation.test.ts` and `npm run test:integration -- tests/integration/import-failures.test.ts`.

**Exit gate:** A04 import, ownership, interruption and overlap scenarios pass. The source package is now usable without source connectivity.

## Phase 5 — Sales analytics and traceability

**Outcome:** Sales, transactions, basket values, products and categories reconcile through one calculation path.

### Task 5.1 — Implement decimal sales calculations

**Files:** Create `src/domain/money.ts`, `src/domain/contracts.ts`, `src/analytics/sales.ts`, `tests/unit/sales.test.ts` and `tests/unit/decimal-boundaries.test.ts`.

**Interface:** `calculateSales` consumes normalized, supported sale/return events and an explicit calculation context. It returns net sales, sale-document count, basket numerator/denominator, quantities by unit, exclusions and provenance. No UI code supplies financial formulas.

- [ ] Write G01 as an independent test: two units at 100, line discount 10%, recorded KDV 5% produce net 180, recorded KDV 9 and gross 189. These synthetic values assert source assumptions, not jurisdictional tax rates.
- [ ] Test sale total 200 across two completed sale documents and a separate return of 50: net sales 150, sale-document count 2 and basket 100 under the declared convention. Pre-completion voids do not create another deduction.
- [ ] Implement the approved discounts, tax basis, conversion and inclusion rules. Exclude/flag unknown meanings; do not silently treat unresolved type-11/type-35 relationships as independent or duplicate.
- [ ] Test fractional quantity precision, explicit rounding, zero counts, negative/zero comparison bases and separate kilogram/piece totals. Run the same fixture in different input orders and machine date/timezone settings; results must agree.

**Example assertion to add to `sales.test.ts`:**

```ts
// `result` comes from the explicit sale/return fixture above.
expect(result.netSales).toBe('150');
expect(result.saleDocumentCount).toBe(2);
expect(result.averageBasket).toBe('100');
```

**Verify:** `npm run test:unit -- tests/unit/sales.test.ts` and `npm run test:unit -- tests/unit/decimal-boundaries.test.ts`.

### Task 5.2 — Query reports and reconcile drill-downs

**Files:** Create `src/domain/evidence.ts`, `src/reports/query.ts`, `src/ui/sales/`, `tests/integration/sales-reconciliation.test.ts` and `tests/desktop/sales-drilldown.test.ts`.

**Interface:** A report query consumes period, filters and a pinned dataset/app/calculation version. It returns metrics plus their component/source evidence. Drill-down requests carry that same version context.

- [ ] Test month → category/product → transaction → source line navigation with stable IDs, batch and method visible. Refreshing the source during navigation must not mix versions.
- [ ] Compare header and line totals under the approved reconciliation rules. Mark unexplained discrepancies incomplete; do not give a matching headline and inconsistent breakdown the same reconciled status.
- [ ] Implement previous-period/year comparisons with accurate coverage. Label partial periods and actual matched boundaries; distinguish monetary changes from transaction or unit growth.
- [ ] Expose cutoff, import state, exclusions and warnings in the first usable sales view. An older dataset must never appear as current live activity.

**Verify:** `npm run test:integration -- tests/integration/sales-reconciliation.test.ts` and `npm run test:desktop -- tests/desktop/sales-drilldown.test.ts`.

**Exit gate:** Sales metrics reconcile and are explainable. The sales portions of A02/A03 and relevant UI portions of A07 pass.

## Phase 6 — Historical estimates, purchasing and supplier returns

**Outcome:** Purchasing insights are useful while cost uncertainty remains visible.

### Task 6.1 — Add historical cost and coverage-aware gross estimates

**Files:** Create `src/analytics/costs.ts`, `tests/unit/cost-coverage.test.ts`, `tests/unit/return-cost.test.ts` and `tests/integration/cost-provenance.test.ts`.

**Interface:** `estimateGrossResult` consumes normalized sale/return lines with validated cost evidence and returns covered sales, covered estimated cost/profit/margin, covered/excluded counts and amounts, method and reason codes.

- [ ] Implement G02: sales of 100 and 100 with cost 60 available only on the first yield covered sales 100, cost 60 and estimated gross profit 40. The full-population value 140 must never appear as gross profit.
- [ ] Implement G03: three historical units at cost 10 keep historical cost 30 while replacement prices change. A newer source correction creates a new candidate version; ordinary price changes do not rewrite accepted history.
- [ ] Implement G04: a validated linked return contributes sales -100 and historical cost -60. Missing attribution excludes the unsupported cost population; no fallback to the latest purchase price.
- [ ] Distinguish missing cost, invalid zero and documented zero-cost items. Test unknown units/KDV, negative-stock warnings, all-zero monetary populations and sale/return cancellation in coverage denominators.
- [ ] Withhold a margin for zero/negative covered net sales. Keep historical cost and profitability labelled estimated; no accepted report action promotes them to exact weighted-average cost.

**Example assertion to add to `cost-coverage.test.ts`:**

```ts
// `result` uses the independently checked G02 fixture.
expect(result.coveredSales).toBe('100');
expect(result.coveredCost).toBe('60');
expect(result.coveredGrossProfit).toBe('40');
expect(result.costCoveragePercent).toBe('50');
expect(result.confidence).toBe('estimated');
```

**Verify:** The three named cost test files through their corresponding unit/integration scripts.

### Task 6.2 — Add purchase history, supplier returns and inventory warnings

**Files:** Create `src/analytics/purchasing.ts`, `src/ui/purchasing/`, `tests/unit/purchasing.test.ts`, `tests/integration/supplier-return.test.ts` and `tests/desktop/purchasing.test.ts`.

**Interface:** Purchasing queries return unit-aware historical/replacement prices, evidenced supplier identities, linked return events and explicit physical-return/claim/credit states. They do not submit operational transactions.

- [ ] Build product/supplier purchase history and replacement-cost comparison from validated purchasing documents. Keep nominal price change distinct from a formal inflation or real-growth index.
- [ ] Test G07: linked dispatch and invoice recognize one event under the approved quantity/value convention. Conflicting flags/links produce a warning or blocked metric.
- [ ] Show supplier-return invoices and dispatches with their source evidence. Recognized credit requires supported financial evidence; a physical return alone cannot imply settlement or replacement goods.
- [ ] Add read-only inventory/waste views only for supported data. Display negative stock and sparse recording warnings; no recorded waste must not become a claim that no losses occurred.

**Verify:** The three named purchasing test files; inspect Turkish labels for customer versus supplier returns.

**Exit gate:** A02/A03 cost, returns, purchasing and uncertainty scenarios pass. Historical estimates and replacement analysis remain distinct.

## Phase 7 — Expenses, adjustments and operating results

**Outcome:** Eralp can import expenses from Excel and understand exactly when operating results can be calculated.

### Task 7.1 — Implement the canonical expense workbook and import flow

**Files:** Create `src/expenses/template.ts`, `src/expenses/import.ts`, `src/ui/expenses/`, `tests/unit/expense-validation.test.ts` and `tests/integration/expense-import.test.ts`.

**Interface:** Workbook parsing produces a preview with valid/rejected rows, suggested duplicate candidates and batch provenance. Confirmation writes an app revision; merely opening or previewing a workbook never changes financial records.

- [ ] Provide Turkish columns for record reference, incurred date, optional payment date, category/classification, net/KDV/gross, KDV treatment/evidence and supporting reference. Aggregate labour by period; reject employee-level payroll fields.
- [ ] Test Turkish decimal/date parsing, fractional values, missing required values, inconsistent net/KDV/gross, unknown classification/tax treatment and repeated legitimate expenses. Formula cells must not be executed; reject ambiguous calculated input instead of trusting an absent or stale cached value.
- [ ] Use stable source references when supplied and batch/row identity otherwise. Reimporting an identical batch is idempotent; matching dates and amounts alone only suggest review. Preserve distinct legitimate rows on explicit confirmation.
- [ ] Implement preview → validate → confirm with per-row explanations, import history and whole-batch rollback on failure. A successful import never automatically confirms expense completeness.

**Verify:** `npm run test:unit -- tests/unit/expense-validation.test.ts` and `npm run test:integration -- tests/integration/expense-import.test.ts`.

### Task 7.2 — Preserve corrections and gate operating profitability

**Files:** Create `src/expenses/adjustments.ts`, `src/analytics/operating.ts`, `tests/unit/operating-profit.test.ts`, `tests/integration/adjustment-history.test.ts` and `docs/contracts/expense-completeness.md`.

**Interface:** Corrections append a reasoned revision linked to original records. `calculateOperatingResult` consumes a pinned gross result, classified period expenses/labour, separately evidenced losses and an owner completeness confirmation bound to the reviewed expense revision.

- [ ] Test G05: an expense incurred in period A and paid in period B affects operating results only in A and payment analysis only in B.
- [ ] Test G06: absent/incomplete expense evidence yields an unavailable headline with `Faaliyet kârı hesaplanamıyor — gider verileri eksik.` Never fabricate owner confirmation before the reveal.
- [ ] Classify operating expense, labour, inventory loss, asset purchase, taxes, financing/loan, owner contribution/withdrawal, transfer and unclassified rows. Unknown cost treatment or material unclassified items block the operating headline; avoid counting an inventory loss twice.
- [ ] Require full supported cost coverage and reconciled sales for the headline. Incomplete cost coverage may still show covered gross estimates. Complete inputs with historical estimated costs yield explicitly estimated management operating profit, never statutory net profit or trusted exact profitability.
- [ ] Make corrections reversible without deleting original rows. Require a reason and affected record/period; flag changed/missing source targets on refresh. Relevant expense changes require renewed completeness review rather than reusing a stale confirmation.
- [ ] Test that expense 50 reduces eligible gross result 200 to estimated operating result 150, while a separate owner contribution of 500 does not change that result. Remove completeness confirmation and assert the headline becomes unavailable.

**Verify:** `npm run test:unit -- tests/unit/operating-profit.test.ts` and `npm run test:integration -- tests/integration/adjustment-history.test.ts`.

**Exit gate:** Expense import, provenance, revision and completeness rules satisfy the relevant A02–A05 gates. A reveal without a real expense workbook remains useful and honest.

## Phase 8 — Complete Turkish reporting, report revisions and Excel export

**Outcome:** One monthly overview brings the approved analytics together without competing formulas or misleading confidence labels.

### Task 8.1 — Complete the monthly experience

**Files:** Create `src/ui/overview/`, shared Turkish presentation components, `tests/desktop/monthly-overview.test.ts` and `tests/desktop/unavailable-states.test.ts`.

**Interface:** UI components consume report results and evidence from `src/reports/query.ts`; they format values and navigate, but do not recompute financial metrics.

- [ ] Assemble `Aylık Market Özeti`: sales, completed transactions, basket, comparisons, covered gross estimates, expenses/labour and eligible operating result.
- [ ] Show metric confidence, covered/excluded amounts, method/version, cutoff and import status close to the corresponding figures. Keep `Açık / Geçici / Güvenilir` separate from per-metric evidence; estimated profitability prevents a trusted-profit claim.
- [ ] Test Turkish characters/search/sorting, TRY/date/decimal presentation, unit labels, customer versus supplier return vocabulary and keyboard navigation through the primary workflow.
- [ ] Exercise empty, loading, stale, partial, warning, failed and unavailable-profit states. Background import/calculation shows progress, supports cancellation and leaves navigation responsive.
- [ ] Capture representative screenshots for the acceptance evidence and PR. Synthetic demonstration data must be clearly labelled and excluded from the reveal's real-data view.

**Verify:** Both named desktop test files plus the sales and purchasing drill-down checks after UI integration.

### Task 8.2 — Preserve report versions and export the same values

**Files:** Create `src/reports/versions.ts`, `src/reports/export.ts`, `src/ui/reports/`, `tests/integration/report-revisions.test.ts` and `tests/integration/excel-report.test.ts`.

**Interface:** A report version binds dataset, app revision, calculation version, filters, metrics and evidence. Export consumes that report version directly. Revision review compares a candidate with an accepted version without mutating the accepted record.

- [ ] Test G08 across source corrections/deletions, expense corrections and a changed calculation version. Show candidate differences and preserve prior values, explanations and referenced evidence.
- [ ] Prevent accepted-report caches from depending on mutable current data. Retain the serialized accepted output and the versioned facts/rules needed for reproducibility; invalidate ordinary caches by their full version context.
- [ ] Export Excel numbers, filters, period/cutoff, method, confidence, coverage, warnings and report version from the selected report. Export alongside a source refresh and assert that all sheets retain the selected version.
- [ ] Test numeric versus text cell types, Turkish round-trips, fractional precision and safe handling of spreadsheet formula-like text. Exported totals and detail must reconcile with the corresponding UI.

**Verify:** `npm run test:integration -- tests/integration/report-revisions.test.ts` and `npm run test:integration -- tests/integration/excel-report.test.ts`.

**Exit gate:** A03 traceability/revision gates and A07 UI/export gates pass for every released KPI.

## Phase 9 — Encrypted backup and independent recovery

**Outcome:** The application can recover financial records and report history after the original computer is lost.

### Task 9.1 — Back up consistent state and protect recovery material

**Files:** Create `src/recovery/backup.ts`, `src/recovery/keys.ts`, `src/ui/recovery/`, `tests/integration/encrypted-backup.test.ts` and `docs/operations/recovery-tr.md`.

**Interface:** Backup consumes a consistent snapshot containing app-owned records, accepted reports and required source/calculation provenance. It produces an authenticated encrypted artifact and a verification result; secret material never enters renderer state, logs or exports.

- [ ] Use the selected SQLite binding's supported consistent backup mechanism; do not copy only a live database file and assume its journals are unnecessary. [SQLite backup API](https://www.sqlite.org/backup.html)
- [ ] Use a reviewed authenticated-encryption implementation with a separately exportable recovery key. Store the local wrapped key through an appropriate OS-protected facility; require successful setup of separately retained recovery material. A machine-bound credential store alone cannot satisfy recovery after computer loss. [Electron safeStorage](https://www.electronjs.org/docs/latest/api/safe-storage)
- [ ] Trigger automatic backup checkpoints after successful source activation and durable app-owned/report changes, with coalescing while a backup is already running. Persist pending backup state across restart; failed backup displays a recoverable error and leaves the latest good copy intact.
- [ ] Adopt a count-based default: retain the latest five verified backups plus explicitly pinned and pre-upgrade copies. Prune only after a newer backup verifies; document how the chosen destination and separately retained key survive loss of the computer. A same-disk destination alone does not pass recovery acceptance.
- [ ] Test concurrent app writes, encryption tampering, missing recovery setup, destination unavailable and interrupted backup creation. Plaintext temporary snapshots are access-restricted and cleaned after success/failure; credentials never enter them.

**Verify:** `npm run test:integration -- tests/integration/encrypted-backup.test.ts`.

### Task 9.2 — Restore safely on a clean installation

**Files:** Create `src/recovery/restore.ts`, `tests/integration/restore-failures.test.ts` and `tests/desktop/clean-install-restore.test.ts`.

**Interface:** Restore verifies/decrypts into an isolated candidate, validates schema/integrity/report evidence and switches the working installation only after explicit user confirmation. The existing store remains recoverable on failure.

- [ ] Simulate complete loss of the original installation and OS credential store. Restore from independently retained backup and recovery material on a clean Windows installation.
- [ ] Compare restored expenses, adjustments, completeness revisions, accepted reports, source evidence and UI/Excel values with the backed-up version.
- [ ] Test wrong key, corrupted/truncated ciphertext, invalid database, unsupported schema, failed migration, disk exhaustion and interruption during switching. None may destroy the working store.
- [ ] Provide Turkish recovery instructions and an auditable success/failure record. Recovery setup is not an application login or PIN workflow.

**Verify:** Both named restore test files and a recorded clean-installation recovery walkthrough.

**Exit gate:** Every A06 criterion has evidence, including independent recovery and safe failure. Creating an encrypted file alone does not pass.

## Phase 10 — Windows acceptance and reveal package

**Outcome:** A tested local release is ready to present with accurate limitations and no operational dependency on the market system.

### Task 10.1 — Package and verify the full Windows application

**Files:** Create `tests/desktop/package-lifecycle.test.ts`, `tests/desktop/full-dataset.test.ts`, `docs/evidence/windows-acceptance.md`, `docs/evidence/licences.md` and `docs/operations/install-tr.md`; complete the build/packaging configuration introduced in Phase 1.

**Interface:** Installer and portable outputs contain the application and approved public dependencies, accept prepared analytics packages and preserve app-owned data according to the documented lifecycle contract.

- [ ] Test clean install, launch, restart, upgrade, failed upgrade and uninstall behaviour on the supported Windows configuration. Define app-data location explicitly for installer and portable variants; document preservation/removal behaviour and verify it.
- [ ] Verify the app runs/imports offline without a developer runtime, SQL restore or live credentials. Inspect every release file for original backups, legacy databases, private fixtures, credentials and identifying data.
- [ ] Measure the approved dashboard/drill-down performance targets against the full imported dataset. Record hardware, OS, build, dataset size, query/filter set, cold/warm conditions and repeated observations; include background-import responsiveness and cancellation.
- [ ] Review licences, native-module compatibility, dependency security and publisher warnings. Document unsigned distribution honestly; introduce no paid signing or hosting requirement.
- [ ] Run the completed unit, integration and desktop suites, type checking, lint and release build. Each remaining applicable A01–A07 item must have its required evidence rather than being inferred from passing source integrity checks.

**Verify:** `npm run test:unit`, `npm run test:integration`, `npm run test:desktop`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm run package:win`, plus documented Windows manual acceptance.

### Task 10.2 — Assemble the reveal and acceptance record

**Files:** Create `docs/evidence/release-acceptance.md`, `docs/operations/reveal-tr.md` and `docs/operations/known-limitations-tr.md`.

**Interface:** The release record binds one tested build to its approved package/dataset and acceptance evidence. It lists honest limitations and separates local reveal readiness from production access.

- [ ] Use the newest authorized prepared backup available. If only the existing historical dataset is available, state its actual cutoff and partial coverage; do not invent fresh transactions.
- [ ] Verify the reveal works with no expense spreadsheet or owner completeness confirmation: sales and eligible covered estimates remain available, while operating-profit absence is explained.
- [ ] Prepare a Turkish walkthrough covering monthly overview, one sale drill-down, historical versus replacement cost, a supplier-return example, expense preview, Excel export and recovery.
- [ ] Record build/commit hashes, verification, unresolved supported/excluded populations and every applicable A01–A07 outcome. An unpassed source-write, privacy, data-loss or required recovery gate blocks release.
- [ ] Present the concrete package for the user's release/install direction. Do not contact Eralp or install on his computer merely because the build is ready.

**Exit gate:** First-release acceptance is evidenced. Known cost/expense limitations are visible, and the reveal does not require production integration.

## Phase 11 — Conditional live integration

**Outcome:** Authorized source changes feed the same local report model while the application remains usable when the source is unavailable.

**Entry gate:** Eralp has accepted the product and explicitly approved access to the specific production source. The user separately directs this phase's implementation/rollout. No earlier phase grants that access.

### Task 11.1 — Prove synchronization on an isolated representative source

**Files:** Create `src/source/live.ts`, `tests/integration/live-consistency.test.ts`, `tests/integration/live-reconciliation.test.ts` and `docs/contracts/live-sync.md` only after the entry gate.

**Interface:** Live extraction produces the same validated candidate datasets as package ingestion. It never makes dashboards query the source or grants the renderer source credentials.

- [ ] Characterize existing sequence, archive and change-log coverage without enabling CDC/change tracking or altering source configuration/indexes. Treat the hybrid synchronization approach as a hypothesis to prove.
- [ ] Test inserts, updates, deletions, backdating, source resets, reconnects and incomplete header/line transactions. Include an ID allocated before its transaction commits, followed by a later committed ID; the earlier transaction must not be missed.
- [ ] Establish coherent extraction with approved isolation/read techniques. Do not use dirty reads to avoid load, and do not rely solely on maximum ID or business date.
- [ ] Prove full/recent reconciliation detects deliberately introduced gaps and corrections. Repeated polling must not duplicate events or overwrite app-owned records and accepted reports.

### Task 11.2 — Verify restricted rollout and failure behaviour

**Files:** Create `tests/integration/live-failure.test.ts`, `docs/evidence/live-acceptance.md` and `docs/operations/live-rollout-tr.md`.

- [ ] Verify a dedicated approved read-only account and protected credentials without introducing administrative access or source schema dependencies.
- [ ] Measure the specification's freshness goal and source impact under representative activity using bounded reads and controlled polling. Release only with evidence for every L01 item.
- [ ] Test source unavailable, permission revoked, delayed refresh and corrupt candidate cases. Keep the last successful local dataset available with a visible stale state.
- [ ] Document enable/disable, rollback to local-only operation and the explicitly approved production rollout. Never run negative write tests against production.

**Verify:** The three live integration test files, isolated permission/load reports and the approved rollout acceptance record.

**Exit gate:** All L01 checks pass. Live access improves freshness; it does not resolve historical cost uncertainty or promote estimated profitability to exact results.

## Coverage and completion ledger

| Approved requirement | Implementing phases | Required evidence |
| --- | --- | --- |
| D01, D18 — Windows and performance | 1, 8, 10 | Smoke build, full dataset measurements and clean lifecycle tests |
| D02, D03 — Turkish/TRY and KKTC boundaries | 2, 5–8, 10 | Source semantics, Turkish UI/Excel checks, absence of unsupported statutory claims |
| D04 — Permanent source read-only access | 1–3, 11 | Privilege review, isolated account denial/read evidence and workflow traces |
| D05, D06 — Backup reveal and conditional live access | 2–4, 10, 11 | Package lineage/cutoff and separate L01 rollout gate |
| D07 — Separate analytics store | 1, 4, 5, 11 | Offline reports and identical package/live normalization contracts |
| D08 — No login; safe desktop boundaries | 1, 9 | Renderer/IPC tests and recovery without daily authentication |
| D09 — Encrypted independent recovery | 9, 10 | Machine-loss restore and safe-failure exercises |
| D10 — Customer/employee privacy | 2, 3, 7, 10 | Allowlist, sentinel checks, aggregate labour and package inventory |
| D11 — Spreadsheet expenses and corrections | 7 | Preview/confirm, duplicates, provenance and reversible history tests |
| D12 — Supplier returns | 2, 6 | Conversion reconciliation and evidenced settlement-state tests |
| D13 — Historical versus replacement cost | 2, 6 | G02–G04 and coverage/precision cases |
| D14 — Incurred expense and classification rules | 7 | G05/G06, excluded cash classifications and no duplicate losses |
| D15 — KPI traceability | 4–8 | Version-pinned summary/detail/source and export reconciliation |
| D16 — Incomplete periods and immutable reports | 4, 5, 7, 8 | Partial-period states, revision comparisons and G08 |
| D17 — Excel and first-release exclusions | 7, 8, 10 | Workbook round-trip and release scope inspection |
| D19, D20 — Approved stack and independent rebuild | 1, 10 | Dependency/runtime record and clean repository/release inventory |
| A01 — Source safety | 1–3, 11 | Complete lifecycle plus scoped permission evidence |
| A02 — Calculation correctness | 2, 5–7 | Reviewed oracles and focused/integration regression results |
| A03 — Confidence and traceability | 5–8 | Golden reports, Turkish screenshots and revision walkthrough |
| A04 — Import and data preservation | 4, 7–9 | Failure injection, overlap and ownership comparisons |
| A05 — Privacy/local boundaries | 1–3, 7, 10 | Allowlist/sentinel tests and release-content inspection |
| A06 — Recovery | 9 | Independent clean restore and financial equivalence |
| A07 — Packaging, usability and performance | 1, 8, 10 | Windows lifecycle, measured full-data behaviour and Excel evidence |
| L01 — Later live integration | 11 | Permission, consistency, reconciliation, impact and rollout evidence |

Repository setup and transfer of the approved planning artifacts are complete. All application execution checkboxes and release gates remain open. No application code, source reconnection or release action is represented as completed.
