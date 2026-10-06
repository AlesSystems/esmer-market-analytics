# Issue 67 selected-product milestone

This receipt covers S00 and S02D through S02H from the implementation plan. It implements the [selected-detail contract](../contracts/monthly-product-profit.md#selected-detail-projection-issue-67-s02) and reuses [PR 69](https://github.com/AlesSystems/esmer-market-analytics/pull/69). It does not establish real financial mapping, close [issue 67](https://github.com/AlesSystems/esmer-market-analytics/issues/67), or certify v1 release readiness.

## Result

The Turkish selected-product view shows net sales, covered sales and historical cost, signed gross result, margin, separate quantities by unit, exclusions and daily results. Original-sale navigation follows the selected return inside the saved report. The original remains evidence outside the return month's totals. Product export includes the complete selected scope; monthly export retains every product.

All reads resolve the selected report. They copy stored product totals and project stored line outcomes through the supported v2 arithmetic contract. They never rerun recognition or read active-source facts. No storage schema, persisted report shape, dependency or raw SQL column changed. Unknown report methods or missing saved facts return unavailable.

Revision comparison exposes offsetting product/day changes. Encrypted recovery preserves accepted detail, dependency evidence and every product workbook sheet even after a source correction and loss of the original profile.

## Execution and verification

The graph is `S00 → S02D → S02I → S02T → S02R → S02H`. An export-memory repair S02P follows S02I and precedes the repeated S02T. G01 remains blocked by independent source semantics. G02 through G06 and the wider V01 release audit retain that dependency. Windows execution is skipped under the user's explicit direction on 2026-10-06.

Base integration is `66e97f53453d10816f2d8b51cf2353cb99d78489`, combining PR69 with main `36f1f6450f664b2913e81a72b3cc14e0b321bd4b`. The feature range begins at `439e938`. Tests first observed a missing `ReportVersions.product` method and absent selected summary in the packaged app. They were application failures, not toolchain failures.

The full run exposed two further issues. Product workbook exposure rows followed object insertion order, which changed when canonical saved JSON was restored. Explicit field order fixes workbook equality. Desktop privilege tests needed the three new named operations in their explicit API allowlist; Node and process access remain absent.

The first maximum fixture run exceeded the provisional memory budget. The fixes remove a whole-report copy before product export, flatten technical spreadsheet evidence one row at a time, and share pinned purchasing evidence during private monthly composition while retaining public response copies. Both preserve output cells, source precision and all evidence. No rows or dependencies were truncated and package bounds remain 100,000 records and 32 MiB.

Application candidate: `ea16d03afbf3e19ac4bf78c242464afdfee77f4f`. Packaged macOS arm64 app.asar SHA-256: `230d52265d81c6207c0f2c6185c60d36bbf6ab57197a1353eee27cc97b8ce086`. Environment: macOS arm64, Node 24, Electron 44.3.0. All fixtures are synthetic. Native file dialogs in packaged tests are stubbed to disposable paths; the actual service, workbook writer and encrypted backup run. Non-Windows recovery uses the existing safeStorage test substitute, so it is not Windows DPAPI proof.


## Candidate checks

The final full run passed 53 unit tests, 341 integration tests and 88 packaged desktop tests; 14 integration and 11 desktop checks were skipped. Typecheck, lint and the packaged build passed. Counts and command outcomes are in [verification.json](issue-67/synthetic-product-month/verification.json). Required commands are `npm test`, `npm run typecheck`, `npm run lint` and `npm run package:local` (the packaged test script runs this build). The optional demo uses `ESMER_S02_REVIEW=docs/evidence/issue-67/synthetic-product-month npm exec -- playwright test tests/desktop/product-detail.test.ts`.

The 14 integration skips require isolated synthetic SQL configuration. The 11 desktop skips comprise six Windows checks (large dataset, report paging, package lifecycle, layout, visual stress and visual evidence), three isolated SQL tracking checks, and two private retained-package checks. They are not passes.

Independent Standards and Spec reviewers examined the application candidate in the same model family. Standards found missing units in original-sale evidence; a failing packaged mixed/unknown-unit test exposed it and `ea16d03` fixed it. A separate reviewer checked that repair. Final independent focused runs passed 17 and 33 integration tests with no unresolved application findings. The artifact review checks copies of stored report facts, public mutation isolation, exact exports, privacy boundaries and no added code comments/suppressions. This is not external financial validation.

## Capacity evidence

The reproducible [macOS probe](../../tests/helpers/issue-67-max-performance.ts) exercises a fresh profile, automatic initial month, deliberate second open, selected detail, original dependency and actual XLSX export. Its 16,666-group fixture contains 99,996 records and 32,121,670 bytes, including 16,666 original sales outside the month. SHA-256: `6cc6ecf9f522d0ab934887785537864488f3dc49eccbe5193ea6dc1912c53c9a`. Expected monthly gross is -333320 and product A gross is -666640; both are asserted before export. Exact rational checks are retained in [independent-arithmetic.json](issue-67/synthetic-product-month/independent-arithmetic.json).

| Final run | Reopened month | Product detail | Original evidence | Product export | Sampled Browser RSS |
| --- | ---: | ---: | ---: | ---: | ---: |
| [1](issue-67/synthetic-product-month/max-capacity-1.json) | 1516 ms | 55 ms | 71 ms | 1960 ms | 982928 KiB |
| [2](issue-67/synthetic-product-month/max-capacity-2.json) | 1487 ms | 58 ms | 65 ms | 1984 ms | 986832 KiB |
| [3](issue-67/synthetic-product-month/max-capacity-3.json) | 1495 ms | 54 ms | 66 ms | 1972 ms | 971648 KiB |

All three sampled Browser/service peaks are below the provisional 1 GiB bound (1,048,576 KiB). Cold launch plus the first background report took 2172–2186 ms, separately from warm navigation. Detail responses are 13,012 bytes; original evidence is 1,961 bytes. The resulting workbook is approximately 4.08 MB. The maximum probe checks successful writing and size; complete row membership is supported by the export implementation and read-back integration fixtures, not an independent maximum-workbook row audit.

Earlier failed capacity samples remain alongside the final receipts: `max-perf.json` 1126512 KiB; `max-repaired-perf.json` 1096560 KiB; `max-final-perf.json` 1029536 KiB; `max-final-2-perf.json` 1063312 KiB. The later failure reopened the repair gate; the favorable first sample was not treated as final acceptance.

The 205-product baseline and pre-final candidate each have three fresh-process samples in `baseline-perf.json` and `candidate-perf.json`. Median selection was 55/59 ms, paging 45/38 ms, reopened month 18/17 ms and whole-month export 62/63 ms. No measured median wall-time regression exceeded 25%. These samples were collected in batches, not interleaved as planned, so they are indicative rather than a controlled regression proof. RSS snapshots in that smaller probe are not peak measurements. Final capacity receipts use the application hash above.

Reproduce from the repository root after `npm run package:local`:

```sh
mkdir -p work/issue-67
node_modules/.bin/esbuild tests/helpers/issue-67-max-performance.ts --bundle --platform=node --format=esm --packages=external --outfile=work/issue-67/max-performance.mjs
node work/issue-67/max-performance.mjs 16666 work/issue-67/max-performance.json
```

Use a new output filename for each fresh run and run serially with other desktop checks. Browser RSS includes the worker thread; it cannot isolate service RSS. Sampling starts after Electron launch resolves, every 100 ms; startup and between-sample peaks may be missed. OS cache/background activity is uncontrolled. These are measured engineering bounds, not Windows D18 certification.

## Visual evidence

The selected summary, daily values, original-sale evidence and both export scopes are saved in [the synthetic evidence folder](issue-67/synthetic-product-month/). The [33-second walkthrough](issue-67/synthetic-product-month/walkthrough.webm) uses a disposable profile and synthetic names, with native file-dialog responses stubbed to real temporary XLSX writes.

The optional demo initially replaced the active service context through a direct test IPC call before navigating the UI. Moving that call after the UI exports fixed the harness ordering (`4787427`); both demo checks passed. Application code and packaged hash stayed unchanged.

## Open acceptance

G01 still requires independently evidenced finalized transactions, duplicate/conversion rules, business dates, tax and quantity bases, transaction-time cost and return attribution. The selected real product/month and independent reconciliation remain unavailable. The raw recorded-source estimate remains separate and explicitly unverified.

Windows installer, portable executable, DPAPI recovery, operating-system lifecycle and D18 hardware acceptance were not run. Cold startup and a background first report are measured separately from ordinary warm reads. Sampled Browser RSS includes the threaded service and does not isolate worker memory. macOS measurements cannot establish Windows performance.

The operator reviews the screenshots/video and lands the PR. Owner contact, owner installation and production access remain outside this work.
