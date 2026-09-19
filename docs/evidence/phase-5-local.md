# Phase 5 local evidence

## Scope and environment

This record covers issue #8 tasks 5.1 and 5.2 with the selected Option A design. The user requested a stop before Windows validation, followed by a PR and continuation prompt. A02/A03 sales and A07 UI evidence is limited to synthetic fixtures and the local macOS packaged application. No real-source or Windows acceptance follows from it.

- Branch: `codex/phase-5-sales-analytics`.
- Pull request: [#19](https://github.com/AlesSystems/esmer-market-analytics/pull/19), open for Windows continuation.
- Starting revision: `4452fd9`, merged Phase 4.
- Host: macOS arm64. macOS 26.4.1 build 25E253, Node 24.15.0 and npm 11.12.1.
- Data: generated synthetic packages only. No source connection, private backup, credentials or customer/employee records.
- Decision record: [sales report design](../decisions/phase-5-sales.md).
- Audit trail: [decisions](phase-5-decisions.tsv).
- Windows continuation: [agent prompt](../operations/windows-phase-5-handoff.md).

## Baseline

At `4452fd9`, `npm ci --ignore-scripts` completed with no reported vulnerabilities. Unit tests passed 2/2, integration tests passed 119/119, and `npm run build` passed. The packaged `startup.test.ts` passed all five cases on macOS, including renderer restrictions, imports/restart, interruption warnings and durable revisions/report pins.

## Red-to-green evidence

The first sales-package test failed at the existing validator with `INVALID_PACKAGE` because the sales mapping/fields did not exist. Commit `0d52dbf` records that missing behavior. This was an application contract failure, not a toolchain failure.

Package/store implementation `6555197` passed the focused package and store tests and lint. The author also ran typecheck before the next missing-module test was introduced. G01 test commit `6050049` then failed because `src/analytics/sales` did not exist. Calculator commit `b20576b` passed G01 and a recorded-tax discrepancy test, typecheck and lint. The discrepancy test asserts recorded tax 10 remains 10 while expected tax 9 is separately exposed and reconciliation is incomplete.

## Implemented behavior and independent expectations

| Task / gate contribution | Fixture and procedure | Expected result and evidence |
| --- | --- | --- |
| 5.1 / A02, A03 | G01 in `sales.test.ts` through the actual calculator | Quantity 2 × unit100 × 90% = net180; recorded tax9; gross189. Tax10 remains10 and flags expected-tax9 mismatch. |
| 5.1 / A02 | Two completed sales100 each and return50 | Net150, sale-document count2, basket100; voids and supported converted representations do not double count. Ambiguous conversions and unknown meanings remain excluded. |
| 5.1 / A02 | `decimal-boundaries.test.ts` | Preserve 1e-30 contribution, exact 99,999-line aggregation, and a tiny contribution after large sale/return cancellation. Literal expectations; reordered inputs and timezone changes agree. |
| 5.2 / A03 | `sales-reconciliation.test.ts`, real disposable SQLite stores | Summary365, three sale documents, basket133.33; water contribution100; scoped S002 contribution60 versus whole-document130. Reimport/prune cannot alter an open report; new session invalidates old context. |
| 5.2 / A02 | Covered, missing, leap-year, short-month and partial-month comparisons | Missing coverage remains unavailable; valid empty periods remain zero. Both compared windows are disclosed; complete February compares all January. Basket changes use unrounded ratios. |
| 5.2 / A03, A07 | Actual packaged `sales-drilldown.test.ts` | Overview → category/product → transaction → source, Turkish search, focus/back, returns, discrepancy, exclusions, import while open, explicit refresh and minimum-width chart checks. |
| 5.2 / A01, A04 regression | Package/migration/IPC/startup suites | Schema3 preserves legacy fingerprints, app revisions and accepted reports. Unknown fields, private sentinel, invalid sender/context and malformed package data are rejected. Existing import failure/restart behavior remains intact. |

The reusable synthetic journey fixture is `journeyRecords()` in `tests/helpers/sales-fixtures.ts`, lineage `sales-fixture`, extraction `sales-1`, mapping `synthetic-sales-v1`, cutoff `2025-09-03`. Daily net contributions are70,95,200. The fixture generator is `node scripts/create-sales-fixture.mjs <new-output.json>`; it refuses an existing output path. Fixtures and preparation tools are not bundled into the application.

## Review and corrections

Independent design comparison selected the existing record representation plus one retained worker snapshot. No-comments review removed a redundant CSS banner while keeping the decimal precision rationale. The final Standards and Spec reviews used `git diff 4452fd9...HEAD` and the issue/foundation/Option A requirements. All reviewers used the available GPT-6 Astra family; this was independent review, not cross-family validation.

Review and packaged checks exposed and corrected conflicting converted-record recognition, rounded-basket comparisons, incomplete coverage classification, shorter-month date matching, a detail panel covering the import button, missing product comparison dates, and missing excluded-line source navigation. Missing product dates were reproduced in the packaged app before correction (`67e746c` → `84d550d`); excluded evidence was reproduced through the query boundary (`7ab0b50`). No source rule was inferred to resolve these findings.

## Final local verification

Final tested application code: `7ea6e64ec2abdc6511cfce21299a57bd077822aa`. Later commits contain documentation/screenshots only. All commands ran on the local macOS host above, using only synthetic temporary profiles.

| Command / procedure | Actual result |
| --- | --- |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed |
| `npm test` | 12 unit, 131 integration and 7 packaged desktop tests passed |
| `npm run build` / `npm run package:local` | Passed within the desktop runner; unsigned macOS arm64 directory package |
| `node scripts/verify-package.mjs <app.asar>` | `PACKAGE_NOTICES_OK 6 dependencies` |
| Archive path inventory and SHA-256 | 349 entries, six application assets; no forbidden database/backup/credential/test/fixture/source-extractor paths |
| Generated native-picker fixture | Created successfully; synthetic-only warning and expected365/count3/basket133.33 emitted |
| Screenshot inspection | Readable overview, 680px layout, receipt/source, return, discrepancy and excluded-source panel; Turkish month shown |
| Documentation checks | `git diff --check` and changed-document local links passed |

The [runtime record](phase-5-runtime.json) captures Electron44.3.0, embedded Node24.20.0 and SQLite3.53.4 in main/worker. The [archive inventory](phase-5-package-inventory.json) records build asset hashes; app.asar SHA-256 is `21a37e5f3da34ab4204cc812ab6d0b05e62ffb32a4428e74a233d3f88ad10a7c`. No dependency or lockfile changed. Windows commands have not been executed.

Final independent review follow-ups have no remaining Standards or Spec finding; see the [separate review reports](phase-5-review.md). One attempted excluded-route desktop red run timed out without a useful failing locator and is inconclusive; the query-level missing-fields assertion is the actual red proof. Final packaged verification passes the route and return navigation.

Screenshots: [overview](phase-5-sales-overview.png), [small window](phase-5-sales-small-window.png), [receipt](phase-5-sales-receipt.png), [source](phase-5-sales-source.png), [pinned import](phase-5-sales-journey.png), [return](phase-5-sales-return.png), [discrepancy](phase-5-sales-discrepancy.png), [excluded source](phase-5-sales-excluded-source.png).

## Remaining acceptance boundaries

Windows packaging, installer/portable behavior, Windows display scaling, physical offline checks and full imported-dataset performance remain unperformed here. Real source field semantics, tax/discount/conversion/unit meaning and market-local date validation remain unsupported. Later cost, expense, export and recovery phases remain outside this slice.

The generated fixtures test supported synthetic rules, not actual market completeness. Automated desktop tests substitute the native dialog response; real Windows native-picker use remains in the continuation procedure. The UI requests Turkish native month controls and local macOS screenshots show Eylül; Windows must verify its own locale and display scaling. No dependency was added, no source accessed, and no Windows gate marked complete.
