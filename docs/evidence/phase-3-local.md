# Phase 3 local verification

## Scope and authorization

The user authorized [issue #6](https://github.com/AlesSystems/esmer-market-analytics/issues/6), PR creation and a stop before Windows testing. This record covers tasks 3.1 and 3.2 on `codex/phase-3-analytics-packages`, based on `3631b1b136dcae2b92f8c2049498e4691b9bf42f`. Dependency #5 was closed when inspected on 2026-09-17. Its real-source evidence remains unresolved.

No market database, existing source container, backup or private credential was accessed. All new database tests use temporary synthetic SQLite fixtures. Real-source extraction remains blocked by the unsupported source mapping. The desktop retains its empty/offline behavior and has no package activation operation.

## Environment and baseline

- macOS 26.4.1, build 25E253, ARM64.
- Node 24.15.0 and npm 11.12.1.
- `npm ci` passed with the existing lockfile.
- Baseline checks passed with 2 unit and 72 integration tests, typecheck and lint.

## Design and evidence boundaries

Independent design agents compared a bounded canonical JSON envelope with a framed streaming format. The selected design uses JSON with explicit size limits and real read-only synthetic SQLite extraction. It avoids a generic source-driver interface while the actual raw mapping is unavailable. One implementation agent owns the coupled extraction/package schema; the parent owns evidence and the Windows handoff. Review uses separate agents from one model family.

The worker owns the synthetic database connection. Its parent enforces the extraction deadline and cancellation. SQLite's `timeout` option limits waiting for a lock, so it cannot establish an execution deadline by itself. [Node SQLite documentation](https://nodejs.org/download/release/v24.16.0/docs/api/sqlite.html#new-databasesyncpath-options)

The bounded package is a synthetic development contract. It does not demonstrate capacity for the historical 1,873,553-line source population. Hashes detect corruption and do not authenticate a sender or certify financial semantics.

## Verification results

The final tested code and tests are at `352617491637bfa4d3cca6364dda27b5f491d466`. Subsequent documentation changes do not change the tested application. The generated fixture uses mapping `synthetic-relational-v1`, lineage `synthetic-test` and extraction ID `synthetic-batch-1`. Its coverage is 2026-01-01 through 2026-01-02, explicitly partial. All private attack values are synthetic sentinels.

| Procedure | Expected outcome | Actual outcome |
| --- | --- | --- |
| Focused extraction, privacy and package integration files | Read-only lifecycle and strict package contracts pass | 15 tests passed in the final full integration run |
| `npm run typecheck` and `npm run lint` | Application, tests and preparation tool pass | Passed |
| `npm test` | Unit, integration and packaged desktop regression pass | 2 unit, 87 integration and 1 packaged desktop test passed |
| `npm run build`, invoked by the desktop test's `package:local` | Desktop, service, UI and licence notices build | Passed; unsigned macOS ARM64 directory package created |
| Actual `node tools/prepare-backup.ts ...` subprocesses | Safe success, existing-target failure and unsupported-mode rejection | Passed; stdout/stderr captured by the committed privacy test |
| Independent CLI preparation and file comparison | Source unchanged, existing destination preserved, no partial output | Passed; valid package was 1,029 bytes with the expected three warning codes |
| ASAR inspection and `node scripts/verify-package.mjs <app.asar>` | Tooling/private inputs absent and dependency notices present | Passed; 349 archive entries and 6 dependency notices |
| `git diff --check` and local Markdown target checks | No whitespace errors or missing local targets | Passed |

The 1,029-byte synthetic CLI package had SHA-256 `387c1055231c9e331b11a8cd2873cc27e37e052ace8e7fda023c2ded9f063a41`. The reader returned `SYNTHETIC_ONLY`, `PARTIAL_COVERAGE` and `MISSING_COST`. Decimal text beyond JavaScript's safe numeric range and trailing precision remains unchanged.

The package cases include payload/count/hash changes, unsupported schema, undeclared streams, missing required references, duplicate IDs, malformed types, private fields, invalid UTF-8, BOMs, truncation and byte limits. Invalid references and types are tested after independently recomputing hashes. A matching hash cannot bypass schema checks.

Extraction checks exercise actual SQLite SELECTs, denied private reads, DML, DDL and administrative operations, source-byte preservation, initialization failure, bounded retry, deadlines, aborts and early consumer exit. The retry test holds a real SQLite lock and releases it only after the first busy failure. The paused-consumer check proves cancellation releases the read lock before the consumer resumes. A missing `lines.cost` column produces a real query failure after document output; the failure releases locks and publishes no package.

## Contract-first and review evidence

The initial contract commit `03ac5c0` preceded implementation. Its package test failed because the extractor module did not exist. Vitest reported a module-resolution failure with zero executed tests. This was a missing implementation seam, not an observed behavioral assertion failure.

Independent review of `d27d7d4` found two defects and one missing privacy check:

- A declared `ROWID` column could shadow SQLite's intrinsic cursor. More than 256 records could produce a silently truncated valid package. Regression commit `64c3df1` reproduced successful publication where rejection was expected. Fix `86f197d` rejects declared cursor aliases, including generated columns, before extraction.
- `kind: ["sale"]` passed enum validation after hash recomputation. Regression `b7d9ef7` reproduced acceptance. Fix `cf316a5` requires a string before enum membership.
- The original privacy test inspected returned values without capturing CLI logs. Commit `0588cf0` captures stdout/stderr on success and failure. This new test passed immediately; no leak or failing-before result is claimed.

The parent also reproduced BOM acceptance before the initial implementation commit. The decoder now preserves a BOM for rejection, and the malformed-input test covers it.

Follow-up Standards review reported zero remaining findings at `2217027`. It independently rejected twelve shadow-column combinations and six malformed document kinds. Follow-up Spec review reported zero remaining findings and passed all fourteen then-current focused tests. Commit `3526174` added the real mid-extraction query-failure check and passed immediately without a production-code change. Final verification includes that fifteenth focused case. Comment review found no comments or suppressions to remove.

## Packaged regression

The [startup screenshot](phase-3-offline-startup.png) was visually inspected. The actual packaged application displays `Henüz veri içe aktarılmadı` and `Canlı bağlantı kapalı`, without login or invented financial data. The test exercises protected main/preload/service communication and same-profile restart. This is the unchanged empty application, not a package-import UI.

The packaged main and service worker report Electron 44.3.0, Node 24.20.0 and SQLite 3.53.4. The [archive inventory](phase-3-package-inventory.json) records the artifact hash and inspected application bundles. Repository `src`, `tests`, `tools`, `docs` and `work` paths, backup/database/environment files and source maps are absent. Application bundles contain no preparation-worker, mapping or private-sentinel markers. No dependency or lockfile changed.

The inventory was produced with the installed `@electron/asar` `listPackage`, `statFile` and `extractFile` APIs. Top-level entries were restricted to `dist`, `node_modules` and `package.json`; application bundles were checked separately from public dependency files. This is macOS archive evidence only. It does not establish Windows distribution contents, physical network-disconnect behavior or SQL Server safety.

## Remaining gates

| Task or gate | Boundary |
| --- | --- |
| 3.1, A01 | Synthetic SQLite checks cannot prove a dedicated SQL Server account denies writes and administration across its complete driver lifecycle. Real source permission evidence remains open. |
| 3.1, A05 | The actual source raw-column allowlist, purchasing-counterparty mapping and reduced real fixture require separate authorized source inspection. Synthetic success cannot validate them. |
| 3.2, A04 | Package rejection is separate from dataset activation, app-owned preservation and accepted-report reproducibility. Those importer behaviors belong to Phase 4 and later. |
| A07 | Windows packaging, worker/file lifecycle and portable/NSIS smoke checks are deliberately unperformed here. Follow the [Windows handoff](../operations/windows-phase-3-handoff.md) on the same branch. |
| L01 | Live integration remains disabled and unauthorized. |

Phase 3 source-dependent acceptance remains open. No complete A01–A07 or L01 gate is passed by this local record.
