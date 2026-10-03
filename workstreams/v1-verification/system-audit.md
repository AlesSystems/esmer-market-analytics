# V1 system audit

Contract V1-01. Read-only audit on 2026-10-03, branch `codex/live-mock-tracking`, initial reviewed HEAD `eba1e089294eb17330912f6a35749773d2d2da80`. The delegate changed this evidence file only. The parent owns application fixes, complete suite runs, packaged UI checks, and Git operations.

Result at discovery was `ISSUES`. One P2 report-comparison defect was reproduced. The parent repaired it in `1d74f98`; final integrated verification remains parent-owned. No source-write, privacy, calculation, import-activation, or recovery defect was established in the inspected paths. This is a bounded code and synthetic runtime review, not certification of every historical acceptance checkbox.

## Current scope

The four foundation documents were read alongside the current source, recorded-estimate, privacy, persistence, expense, report, and isolated-live contracts. The issue tracker and current comments on #39, #40, #41, and #43 were read using `gh issue view <number> --comments`.

The 2026-10-02 [recorded-estimate contract](../../docs/contracts/recorded-estimates.md) is the authorized V1 extension. It provides assumption-based product, day, and month results from `sql-backup-estimate-v1`. Real source meanings stay unsupported. Original #39 and #40 verified-source objectives were superseded for V1, and their closure comments explicitly say so. #41 closes delivered transient estimates. #43 records a user-directed assumption of Windows completion without a newly evidenced Windows run. This audit performs no Windows checks and does not reopen those cancelled implementation objectives.

The historical implementation-plan checklist is not the current capability inventory. `monthly-report-v2`, recovery, and raw-source workspaces exist despite older unchecked tasks. The [earlier estimate evidence](../estimated-v1/evidence.md) records real arithmetic reconciliation. Its private inputs were not opened or rerun here.

The [Show recorded SQL rows](https://github.com/AlesSystems/AlesSystems-Workstreams/blob/main/Esmer%20Market%20Analytics/plans/2026-09-26-live-and-backup-display.md) plan was read. Runtime SQL still publishes raw preview rows. No customer, employee, product-name, or supplier columns were added by this audit.

## Actionable finding

### V1-F01. P2. Report comparisons omit a replacement-price change for one unit

[ReportVersions.compare](../../src/reports/versions.ts), lines 91 through 99, converts arrays to maps using `lineId`, then `productId`, then other identity fields. [calculatePurchasing](../../src/analytics/purchasing.ts), lines 56 through 69, deliberately creates one replacement row per `productId:unit`. A supported product can therefore have separate kilogram and piece replacement rows with the same `productId`.

The comparison map overwrites the first unit with the later unit. The review can omit changed replacement metrics, although the selected report and export still contain their correct values. Other source-evidence differences remain visible, so this does not erase the entire source correction.

A synthetic in-memory probe used the normal package import, monthly report, acceptance, replacement import, and comparison functions. It bundled existing TypeScript with installed esbuild and wrote no application or test file. Both packages activated successfully.

| Report | Product | Kilogram latest cost | Piece latest cost |
| --- | --- | --- | --- |
| Accepted | `water` | `30` | `25` |
| Candidate | `water` | `31` | `25` |

Expected result was a kilogram replacement-price and replacement-cost difference. Actual `changes.filter(c => c.path.startsWith('purchasing.purchasing.replacements'))` returned `[]`. Five source-evidence differences remained.

The focused regression belongs in `tests/integration/report-revisions.test.ts`. Its fixture needs one product sold and purchased in both supported units. Change the first replacement unit while the later unit stays unchanged. Assert the changed unit's latest price and replacement amount. Compound product-and-unit identity prevents this collision without changing formulas or saved reports. Existing tests cover source and expense changes, stale predecessors, retained rules, and v1-to-v2 composition, but not this unit identity boundary.

Resolution was inspected in parent commits `bda73ee` and `1d74f98`. The regression now changes each unit independently and checks unchanged-unit absence, line-based purchasing identities, and reorder stability. The repair keeps `lineId` first, then combines product and unit when both exist. It does not change stored financial values. The final test receipt is recorded by the parent.

## Verified implementation and coverage map

These entries describe inspected code and existing test contracts. They do not imply that the delegate reran the parent's full unit or desktop suites.

| Area | Inspected behavior | Relevant existing verification |
| --- | --- | --- |
| Input and privacy | `src/source/raw-package.ts:25` rejects unknown keys, invalid UTF-8, noncanonical bytes, bad hashes, impossible dates, duplicate IDs, orphans, and line/header type mismatches. Old preview schema rejects the cost field. Both raw schemas require `sourceReconciled:false`. | `raw-preview`, `source-estimate`, `source-workspace`, `source-privacy`, `analytics-package`, and `sales-package` integration tests. |
| Source activation | `src/store/store.ts:285` stages source facts and validates hashes and references. `activate` changes only the active source pointer in a transaction. Identical and historical package outcomes are explicit. Failed or cancelled activation preserves the previous active pin. | `import-activation`, `import-failures`, `store-ownership`, and `import-history` integration tests. |
| Raw and estimate persistence | `src/store/store.ts:57` stores canonical raw bytes separately in `source_preview`. Its transaction checks cancellation before publication. Source hashes pin queries and exports. `src/store/schema.ts:72` advances recovery intent when that preview changes. | `raw-preview` and `source-estimate` integration tests cover replacement, corruption, cancellation, restart, financial-state preservation, and encrypted restore. |
| Estimate arithmetic | `src/source/estimate.ts:40` uses precision 200. It preserves null, zero, loss, separate return exposure, exact product IDs, unsupported types, status and currency exclusions, and one primary exclusion per line. No current-price fallback or physical quantity total exists. | `tests/unit/source-estimate.test.ts` covers independent literals, every exclusion, null versus zero, 140-digit products, and stale requests. |
| Financial sales and costs | `src/analytics/sales.ts:16` handles signed returns, separate basket counting, conversions, and reconciliation. `src/analytics/costs.ts:17` restricts cost to the same covered population and validates original-sale return attribution. `src/domain/money.ts` provides precision 100 and explicit half-up rounding. | `sales`, `decimal-boundaries`, `cost-coverage`, `return-cost`, `product-profit`, `fixture-contract`, and `sales-reconciliation` tests. |
| Purchasing | `src/analytics/purchasing.ts:10` separates conversions, supplier-return settlement evidence, historical cost, replacement prices, units, and inventory warnings. Conflicting same-day prices are unavailable. | `purchasing`, `supplier-return`, `purchasing-report`, and packaged purchasing tests. V1-F01 identifies a downstream comparison gap. |
| Expenses | `src/expenses/import.ts:34` retains a server-owned preview and confirms an atomic batch. Workbook parsing bounds ZIP and XML content and rejects formulas, private payroll columns, and ambiguous cells. Corrections append revisions. | `expense-validation`, `expense-workbook-boundary`, `expense-import`, `adjustment-history`, and `expense-headlines` tests. |
| Operating results | `src/analytics/operating.ts:35` requires full cost and source coverage, resolved classification and tax treatment, and a current completeness confirmation. Incurred costs and payment movements remain separate. | `operating-profit`, `expense-headlines`, `report-expense-states`, and `adjustment-history` tests. |
| Saved reports | `src/reports/versions.ts:70` records accepted serialized output, reason, predecessor, source pin, app revision, and rule identity. Earlier output is read directly. `src/store/store.ts:377` retains active, rollback, accepted-report, and adjustment datasets during pruning. | `report-revisions`, `report-cache`, `report-display`, `recovery-equivalence`, and packaged version-comparison tests. |
| Excel | `src/reports/export.ts:47` clones the selected report. `src/source/estimate-export.ts:5` exports every product and day with exact text, assumptions, hash, exclusions, and explicit unverified status on every sheet. Export does not query current source while composing sheets. | `excel-report`, `source-estimate`, and `report-jobs` integration tests cover full output beyond pagination, formula safety, precision, cancellation, and atomic replacement. |
| Recovery | `src/recovery/backup.ts:75` uses SQLite online backup, authenticated encryption, independent exported keys, verification before publication, pending generations, and latest-five retention plus pins and pre-upgrade checkpoints. `src/recovery/restore.ts:29` journals rollback. `src/recovery/validate.ts:100` validates schema, integrity, source bytes, revision evidence, and v2 product-profit outputs before switching. | `encrypted-backup`, `restore-failures`, `recovery-equivalence`, `recovery-files`, `recovery-worker`, and packaged clean-install restore tests. |
| IPC and renderer | `src/desktop/main.ts:142` enables context isolation and sandboxing and disables Node integration. Sender, main frame, and exact app URL are checked at line 166. `src/desktop/requests.ts` validates named operations and exact payloads. Native dialogs own paths. No arbitrary SQL operation exists. | `desktop-boundary`, `recovery-boundary`, `live-boundary`, source estimate IPC, packaged startup, and boundary tests. |
| Isolated SQL | `src/source/sql-server.ts:32` uses serializable reads, fixed projections, parameterized dates and cursors, bounded rows and bytes, identity checks, timeouts, and connection cleanup. `src/service/worker.ts:42` imports SQL previews without activating financial rows. Protected config defaults disabled and stays outside renderer and recovery archives. | Actual generated-SQL checks below, plus `live-mapping`, `live-worker`, `live-failure`, `live-reconciliation`, and packaged live-tracking tests. |

## Delegate SQL validation

The initial environment lacked SQL opt-in variables. The delegate inspected existing generated-only engine metadata without printing configuration secrets. Existing engines and the configured demo were preserved.

At the parent's explicit direction, the delegate created task-owned container `esmer-v1-audit-31c09666` from the already available native image `9d0e27694fc9`. It published only `127.0.0.1:32768`. The private admin and reader files were under `/tmp/esmer-v1-verification/private`, with file mode 600. No package install, market restore, production connection, or private source read occurred.

| Procedure | Expected result | Actual result | Evidence |
| --- | --- | --- | --- |
| `ESMER_SQL_TEST_ADMIN=<task-private-admin> npm exec -- vitest run tests/integration/synthetic-sql-dev.test.ts tests/integration/live-sql-server.test.ts` | All generated SQL cases pass | 13 passed across two files, 8.07 seconds | `/tmp/esmer-v1-verification/integration-sql.log` |
| `ESMER_SQL_TEST_ADMIN=<task-private-admin> ESMER_SQL_DEV_CONFIG=<task-private-reader> npm run synthetic-sql -- seed` | Generated baseline is read back by the restricted extractor | `SYNTHETIC EsmerSyntheticDev` | `/tmp/esmer-v1-verification/synthetic-seed.log` |
| `ESMER_SQL_TEST_CONFIG=<task-private-reader> npm exec -- vitest run tests/integration/live-consistency.test.ts` | Four checks including the configured-reader case pass | 4 passed, no skips | `/tmp/esmer-v1-verification/integration-reader.log` |

These runs execute all 14 SQL cases skipped in the parent's initial integration run. Three configuration checks overlap that baseline. Fixtures were `EsmerSyntheticDev` and uniquely generated `EsmerLiveFixture_*` databases. Assertions include exact bigint and decimal transport, late committed low IDs, edits, deletion, incomplete headers, denied private reads and writes, wrong GUID, revoked permissions, lock timeout, cancellation, reseed identity, outages, append, and failed provisioning cleanup.

The parent requested a separate clean fixture for the final full-suite run. The delegate created `esmer-v1-suite-2fd32493` from the same local image, on loopback port 32769. Its private setup file is `suite-admin.json`. Startup was verified through a successful connection to `master`. The suite uses that second engine for disposable mutations and the first engine's `reader.json` for the configured-reader check. This separation prevents the fixture suite from altering the reader population during its repeatability assertion.

Parent-owned packaged checks used the task-owned admin configuration. The deprecation warning about an IP TLS server name is visible in the logs. Certificate trust was explicit for the disposable loopback fixtures.

The parent reported final integrated results of 50 unit passes and 324 integration passes with no skips. The packaged run had 72 passes, including the actual five-minute SQL refresh schedule. Four separate packaged checks failed with `ENOENT` because older launch helpers selected a Windows executable path on macOS. Eight Windows or private-input checks were intentionally skipped. The harness repair and complete packaged retest remain parent-owned. These counts are attributed to the parent and were not rerun by this delegate.

After SQL verification finished, the parent authorized teardown. `docker stop` and `docker rm` succeeded for exactly `esmer-v1-audit-31c09666` and `esmer-v1-suite-2fd32493`. A subsequent `docker ps -a` confirmed both absent. The existing running demo `esmer-live-mock-20261003` and all containers present before this teardown remained listed. No SQL connection or query occurred during teardown.

Only after engine removal, the delegate deleted the task-private `admin.json`, `suite-admin.json`, and `reader.json`. Sanitized engine manifests and all verification logs remain. The receipt is `/tmp/esmer-v1-verification/sql-teardown.json`. No unrelated credentials, profiles, containers, or logs were removed.

## Open requirements and limits

| Gate | Current conclusion |
| --- | --- |
| A01 and A05 | Inspected code and actual generated SQL cover read-only transport, privilege denials, fixed projection, sender validation, and synthetic privacy sentinels. No production-safety certification is claimed. |
| A02 and A03 | Current estimate assumptions remain visibly unverified. Validated real sales completion, unit, tax basis, historical cost meaning, and return attribution were superseded for this V1 slice. Earlier real Decimal reconciliation is recorded evidence, not a new run here. V1-F01 is repaired and awaits the parent's final verification receipt. |
| A04 | Existing tests cover atomic imports, retained app revisions, cancelled or corrupt candidates, report pins, and synthetic source corrections. Physical power loss and full-volume filesystem exhaustion are outside this run. |
| A06 | Existing recovery tests cover independent keys, corruption, switch failure, and financial equivalence. Fresh packaged macOS evidence belongs to the parent. Owner retention of the backup and key remains an operational requirement. |
| A07 | Windows verification is excluded at the user's direction. macOS packaged checks and synthetic performance observations remain platform-specific. No full-market benchmark is performed by this delegate. |
| L01 | Production permission, owner acceptance, representative load, production reset detection, complete normalized mapping, and rollout remain separate. A GUID-preserving replacement can evade the current SQL identity check. Generated test success does not enable production access. |

The Prove It Works principle changed this audit's evidence choice. The comparison defect was exercised through real package, report, and store functions. SQL checks used the actual restricted reader and disposable engine rather than relying on test names or historical pass counts.
