# Continue Phase 6 on Windows

Copy this prompt into a Windows agent session. Continue on the existing branch and PR. The [local evidence](../evidence/phase-6-local.md) records the tested application revision and remaining gates.

```text
Continue Phase 6, issue #9, in AlesSystems/esmer-market-analytics.
https://github.com/AlesSystems/esmer-market-analytics/issues/9

The user authorized Phase 6 implementation and requested a stop before Windows implementation and testing. Continue on the SAME branch, codex/phase-6-costs-purchasing. Continue existing PR #20: https://github.com/AlesSystems/esmer-market-analytics/pull/20
  gh pr view 20 --comments
Read that PR and comments. Update it rather than creating a replacement. Do not merge, close issue #9, start Phase 7, deploy, or install on Eralp's computer.

Read AGENTS.md. Inspect branch, worktrees, and existing changes. Fetch origin and safely check out the branch while preserving unrelated work. Record the fetched SHA. The locally verified application revision is 7fe3d69687bc6d48c642adf4cd70141579b7dfd9; fetch the latest branch tip because later commits add the handoff evidence and fixture generator. Read issue #9 with comments and its dependencies #5, #7, and #8. Read the foundation specification, historical audit, acceptance checklist, and global/shared/evidence and Phase 6 sections of docs/superpowers/plans/esmer-market-implementation-plan.md.

Read docs/superpowers/plans/2026-09-20-phase-6-local-plan.md, docs/contracts/calculations.md, docs/contracts/analytics-package.md, docs/contracts/persistence.md, docs/contracts/desktop.md, and docs/evidence/phase-6-local.md. Inspect costs, purchasing, package validation, migration, pinned report queries, service/IPC, purchasing UI, and tests before changes. Preserve the established Option A colors, components, Turkish wording conventions, keyboard behavior, and decimal precision.

This is synthetic-supported implementation. Existing real-source semantic and full-dataset gates remain open. Do not start source containers, restore private backups, access credentials, connect to production, contact Eralp, or infer real-market mappings. No owner expense-completeness confirmation or report acceptance may be fabricated. Historical last-purchase cost remains estimated after report acceptance. Expenses, operating-result implementation, export, recovery, and live integration remain later phases.

Inspect package.json and use its Node24 range and locked dependencies. Run each PowerShell command separately and check the exit code:
  git status --short --branch
  git rev-parse HEAD
  node --version
  npm --version
  npm ci
  npm run test:unit -- tests/unit/cost-coverage.test.ts tests/unit/return-cost.test.ts tests/unit/purchasing.test.ts
  npm run test:integration -- tests/integration/cost-provenance.test.ts tests/integration/supplier-return.test.ts tests/integration/purchasing-report.test.ts
  npm run typecheck
  npm run lint
  npm run build
  npm run package:win
  npm test

Desktop tests must launch the packaged Windows application. Unit/integration success on macOS does not satisfy this gate. Confirm the release inventory, actual executable, Windows edition/build, architecture, runtime versions, and artifact SHA256 hashes.

Verify G02 explicitly. Sales100+100 with supported cost60 on one line yield covered sales100, cost60, estimated gross40, coverage50%. The full-population140 must never appear as gross profit. Inspect covered/excluded IDs, counts, signed sales/returns, absolute exposure basis, reasons, and missing cost. Unknown units/KDV and invalid zero remain unsupported. Documented zero is distinct. Sale/return cancellation retains the absolute denominator; all-zero exposure has no percentage, and nonpositive covered sales has no margin.

Verify G03. Three units at historical cost10 retain cost30 when replacement prices change25 to50, while replacement totals change75 to150. Replacement prices use the imported cutoff and keep units explicit. A historical source correction creates a new dataset/candidate while the accepted output and evidence remain unchanged. Acceptance never promotes historical estimates to weighted-average or exact profit.

Verify G04. A supported linked customer return contributes sales-100 and historical cost-60. Original sale can be in a prior reporting month. Missing/mismatched/ambiguous attribution excludes that cost population. There is no latest-purchase fallback. Customer returns must remain distinct from supplier returns.

Verify G07. Linked dispatch and invoice recognize one purchase or supplier-return event under the documented quantity/value/timing convention. Both source documents remain inspectable. Conflicting flags, duplicate links, mismatched supplier/product/unit/quantity, and missing evidence warn or block the affected metric. A physical supplier return alone cannot imply recognized credit, payment, or replacement goods. Unknown settlement stays unknown.

Exercise purchasing product/supplier history and nominal price comparison. Check the historical-vs-replacement labels and scope. Check inventory/waste only for supported observations, negative stock warnings, and sparse/absent waste warnings. No recorded waste is not proof of no losses.

Import a newer package while a sales or purchasing report is open. Both tabs and source evidence must retain the old dataset and method versions until explicit refresh. New context invalidates stale requests. Restart loads the active dataset. Browsing creates no accepted reports. Verify legacy relational and sales packages remain importable; missing Phase 6 semantics stay unavailable.

Exercise real native file selection as well as automated dialog substitution. Generate the synthetic fixture with `node scripts/create-business-fixture.mjs "$env:TEMP\phase-6-business-new.json"`. The output must not exist. Use only fresh temporary paths and disposable profiles. Check cancelled/failed import, stale-report notice, unsupported mapping, and empty states. Check Turkish labels, TRY/date/quantity precision, keyboard navigation, focus restoration, table scrolling, minimum window width, and Windows 100%, 125%, and 150% scaling where available. Capture synthetic screenshots of estimates, purchase history, supplier returns, source evidence, and warnings.

Verify portable and NSIS install/start/restart/upgrade/uninstall with an isolated profile. Seed the prior store schema with source rows, an app revision, adjustment, and accepted report, then verify migration preserves hashes and app-owned history. Do not remove personal data. Record app-data locations and unsigned publisher warnings. Test offline launch/import/restart without a developer runtime and distinguish actual physical-disconnect evidence from network stubs.

Inspect all release files for private data, credentials, source backups, SQLite fixtures, extraction tools, and tests. Financial calculations stay in the service. Renderer sandbox/context isolation and exact named-operation sender/payload validation remain enforced. Record dependency/licence impact accurately; this work should need no new dependency.

Measure cold/warm report and representative evidence reads with repeated observations on documented hardware. Record package identity/size and filters. A small synthetic fixture cannot pass the full imported-dataset two-second performance target. Leave unavailable real/full-volume evidence open.

For any defect, expose a focused failure first, fix the shared root cause, and rerun relevant checks. Run the complete suite after final changes. Keep small Conventional Commits with explicit paths, and obtain independent review where available. Record docs/evidence/windows-phase-6.md with task/gate ID, initial/final commit and build, fixture identity, environment, commands, expected/actual outcomes, screenshots, inventory, and limitations. Link the record from docs/evidence/index.md and the existing PR. Update only Phase 6 checkboxes supported by evidence. Do not certify all A02/A03/A07 gates from synthetic tests.

Commit and push Windows fixes/evidence to codex/phase-6-costs-purchasing. Update the existing PR. Return its URL, commits, checks, evidence, and unresolved gates. Stop without merging or starting Phase 7.
```
