# Continue Phase 5 on Windows

Copy the prompt below into a Windows agent session. The local evidence record identifies the code tested on macOS. Windows acceptance remains open until this procedure produces evidence.

```text
Continue Phase 5, issue #8, in AlesSystems/esmer-market-analytics.
https://github.com/AlesSystems/esmer-market-analytics/issues/8

The user authorized Phase 5 with Option A and requested a handoff before Windows validation. Continue on the SAME branch, codex/phase-5-sales-analytics. Find and update its existing PR:
  gh pr list --head codex/phase-5-sales-analytics --state open
Do not create a replacement PR, merge, close issue #8, start Phase 6 or deploy to Eralp.

Read AGENTS.md. Inspect branch, worktrees and existing changes. Fetch origin and safely check out the branch. Record the fetched SHA and preserve unrelated work. Read issue #8 with comments, labels and dependencies #5 and #7. Read the foundation specification, audit, acceptance checklist, and the global/shared/evidence and Phase 5 sections of docs/superpowers/plans/esmer-market-implementation-plan.md.

Locally verified application revision: `7ea6e64ec2abdc6511cfce21299a57bd077822aa`; subsequent handoff commits contain documentation only. Fetch the latest branch tip rather than checking out that older revision.

Read PRODUCT.md, docs/superpowers/specs/2026-09-18-phase-5-sales-ui-design.md, docs/decisions/phase-5-sales.md, docs/contracts/calculations.md, docs/contracts/analytics-package.md, docs/contracts/persistence.md, docs/contracts/desktop.md, docs/evidence/phase-5-local.md and docs/evidence/phase-5-decisions.tsv. Inspect the calculator, report query, package validation, migration, service/IPC, sales UI and tests before changing code.

Scope is synthetic-supported decimal sales, pinned report queries, and Option A's monthly overview through category/product, transactions, receipt and source evidence. Preserve existing imports, app revisions and accepted reports. No real-source mapping or source-reconciled market result is established by these tests. Legacy sparse packages remain importable and cannot acquire invented sales semantics.

No renewed source access is authorized. Do not start source containers, restore private backups, access source credentials, contact Eralp or install on his computer. Use disposable synthetic packages/profiles only. Costs/profit, expenses, Excel, accepted-report review, backup/recovery and live integration remain later phases.

Inspect package.json. Use its required Node24 range and npm11. In PowerShell run each command and check its exit code before continuing:
  git status --short --branch
  git rev-parse HEAD
  node --version
  npm --version
  npm ci
  npm run test:unit -- tests/unit/sales.test.ts
  npm run test:unit -- tests/unit/decimal-boundaries.test.ts
  npm run test:integration -- tests/integration/sales-reconciliation.test.ts
  npm run typecheck
  npm run lint
  npm run build
  npm run package:win
  npm test

The full desktop suite must launch the packaged Windows executable. Verify startup with no dataset, legacy dataset analytics unavailable, synthetic sales import, same-profile restart, failed/cancelled/historical imports and durable interruption messages. Preserve renderer sandbox, context isolation, fixed named operations and rejection of unknown fields, wrong senders, SQL/path input and stale report contexts.

Follow Option A from summary to category, product, transaction and source line. Check that selected-line contribution differs correctly from whole-document totals. Check net sales, sale-document count, average basket excluding separately issued returns, signed returns, units, exclusions and header discrepancies against literal test expectations. Verify cutoff, import state, method, batch, IDs and report context remain visible. Synthetic data must never be presented as real or source-reconciled.

Import replacement snapshots while a report is open. Follow its existing transaction/evidence and confirm all amounts retain the old context even after pruning. Explicit refresh must start a new context; stale requests must reject. Browsing must not create owner-accepted reports. Restart must load the active dataset without modifying accepted historical output.

Check previous-month/year boundaries including partial coverage, absent periods, leap days and nonpositive bases. Missing data is unavailable, not zero. Check Turkish dotted/dotless I search and labels, TRY formatting, fractional units, keyboard focus, back/close behavior, scrolling and the selected blue/green/red palette. Test the native default and minimum window widths plus Windows display scaling. Record screenshots of the overview, scoped transaction/receipt, source evidence, returns and discrepancy states.

Generate a disposable native-picker fixture with:
  node scripts/create-sales-fixture.mjs "$env:TEMP\phase-5-sales-new.json"
The output path must not already exist. The fixture is synthetic-only: net365, count3, basket133.33. No fixture is bundled into the app.

Exercise real native file selection in addition to automated dialog substitution. Verify portable and NSIS install/start/restart/upgrade/uninstall with an isolated profile. Seed the previous supported store schema with source and app-owned revisions plus an accepted report; upgrade and verify preservation. Do not remove personal data. Record data location, unsigned publisher warnings and offline launch/restart. Attribute human physical-disconnect checks separately from automation.

Inspect app.asar and all release files for private backups, credentials, databases, source extraction tools, tests and fixtures. Record a safe inventory and artifact SHA256 hashes. No new dependency or publisher-signing service is required.

Measure cold/warm report and representative drill-down response times on documented hardware with repeated observations. Record Windows edition/build, architecture, scaling, build hash, synthetic package identity/size and filters. A small synthetic test cannot pass the full imported-data two-second target. Leave real/full-volume performance open when authorized evidence is unavailable.

For defects, expose a focused failure, fix the root cause, rerun relevant checks and the full suite after final changes. Keep small Conventional Commits and locked dependencies. Obtain independent code review where available. Write docs/evidence/windows-phase-5.md with task/gate IDs, fetched/final code and build hashes, runtime versions, commands, expected/actual outcomes, screenshots/inventory and limitations. Link it from docs/evidence/index.md and the same PR. Update only Phase 5 checkboxes supported by evidence. Do not claim all A02/A03/A07 gates complete from synthetic or macOS checks.

Commit and push Phase 5 fixes/evidence on codex/phase-5-sales-analytics. Update the existing PR with Windows results. Return the PR URL, commits, tests, evidence and remaining gates. Stop without merging or starting Phase 6.
```
