# R42 / P05 synthetic monthly product profit workspace

## Build and scope

Branch `codex/monthly-profit-page`, base `c2f8ee050911f17d704f203269285a19d7375f36`; initial reviewed code `98f129d1c89d34de9a006d782593e5dbe4092c29`, focus repair code `d7df4c9a7ba7b8cb08f61dc5dd79f1255be89e51`. Implements [#42](https://github.com/AlesSystems/esmer-market-analytics/issues/42), [monthly product profit contract](../contracts/monthly-product-profit.md), and R42 in the coordinator release plan. This receipt covers synthetic macOS verification only. Real-data approval, source semantics, Windows packaging, physical Windows scaling and the ordinary-interaction two-second Windows gate remain open; the user owns Windows testing.

Exact repaired package `app.asar` SHA256 `9feefe30dca562f7d972b44fd8b95d399802563fabfcad482591a38d417fa492`; initial reviewed package `1307354419f7f60d0f727b8a05b94a0d4ab2cc583991c657e7c1deb1b179c0b0`. Baseline PR47 package SHA256 `c7220ece53cea49594d264ce73e2368fef84ef8bffcb2b80e7c7daa73fb750fe`. Both executable launchers SHA256 `588478afc5f2bc73b6433d6e565a214dc830144be39a3d79805723292754ccd8`. Environment: Darwin27 arm64, Mac16,8,24GiB, Node24.15.0, Electron44.3.0. Packages run offline against disposable profiles. No SQL, private-preview, production data or keys used.

V2 now composes one scrolling page at MonthlyOverview: summary/scope/cutoff, projected daily profit, bounded products, selected product/cost/transaction evidence, full recorded document header and paged lines. Existing v1 title/rendering and secondary workflows remain available. Search/sort/page never alter summary/chart or saved/exported population. Service geometry uses existing Exact arithmetic; React performs no financial arithmetic. Exact documentId filtering uses the existing field and preserves period bounds and null callers. No dependency, storage schema or financial-rule change; named IPC and validation boundaries retained.

## Red, repair and verification chronology

Behavior contracts were committed before UI implementation. The first packaged wrapper stalled downloading Electron SHASUMS; UI code was written while that command waited. The wrapper eventually produced missing-title behavioral red; direct execution against immutable baseline independently confirmed it. This is not a claim that packaged UI red completed before implementation. Signed geometry, exact-header101-collision and genuine-zero/tiny-nonzero display boundaries had focused behavioral red before their implementation changes. The tiny-zero probe first violated the fixture precision limit; that tool/fixture failure was corrected before behavioral red.

Initial full checks:44 unit;294 integration passed,5 skipped;47 packaged desktop passed,7 skipped; typecheck/lint/build passed. Review then found repeat selection: Çay → table → same Çay keyboard activation kept focus on the row. `90174ad` exposes that packaged failure (`reselect-red.log`); `d7df4c9` directly focuses the existing detail without refetch. Repaired package:14 focused product-profit tests passed;44 unit,294 integration with5 skips,47 full packaged desktop with7 skips passed again; typecheck/lint and package/build passed. Integration skips require configured SQL; desktop skips cover Windows volume/lifecycle/pagination/three visual gates and private prepared SQL.

Commands from the worktree:

```sh
npm run test:unit
npm run test:integration
npm run typecheck
npm run lint
npm run package:local -- --config.electronDist=node_modules/electron/dist
ESMER_EXECUTABLE='/absolute/release/mac-arm64/Esmer Market Analytics.app/Contents/MacOS/Esmer Market Analytics' npm exec -- playwright test --output=/tmp/esmer-market-r42-evidence-20261001/live-final
```

Every synthetic command clears inherited `ESMER_SQL_TEST_ADMIN`, `ESMER_SQL_TEST_CONFIG`, `ESMER_SQL_PREVIEW_PACKAGE`, `ESMER_SQL_DEV_CONFIG`, `ESMER_LIFECYCLE_PROFILE`, `ESMER_LIFECYCLE_REUSE_PHASE8` with `env -u`. Explicit electronDist uses the installed locked44.3.0 distribution; no dependency/config change bypasses the wrapper download. Direct full Playwright after successful packaging is the runtime receipt, distinct from literal wrapper completion. Logs/probe scripts live under `/tmp/esmer-market-r42-evidence-20261001` and ignored `work/poteto/r42`; failed selector attempts are probe failures (nested sort label, descending name order, unavailable notice outside baseline summary), not application defects.

## Packaged lane receipts

| Lane | Expected and observed result | Artifact / verification |
| --- | --- | --- |
|1|Genuine v1 calculated by original1ed1824 calculator, then same accepted artifact on baseline/head: net200, covered profit40; all workbook sheets identical. Committed compatibility test also checks a deliberately downgraded synthetic v2 shape and is labelled separately.|[Baseline](r42/lane-01-genuine-v1-baseline.png), [head](r42/lane-01-genuine-v1-head.png), performance.json|
|2|Literal E02/E03 summary60, daily+100/−40, unit cost60; full coverage100% vs89.74%. One main landmark.201-line mixed document pages100/100/1, selected101line evidence100/1; recorded net2010, other product scope distinct.|[Top](r42/monthly-top.png), [detail](r42/selected-detail.png), [large document](r42/lane-02-large-mixed.png), [last page](r42/lane-02-last-document-page.png), mixed-document.json|
|3|Turkish trimmed search; signed ascending/descending order positive/zero/negative with unavailable last.101product pages100/1. Summary and graph unchanged.|[Signed sort](r42/lane-03-signed-sort.png), product-profit packaged test and signed.log|
|4|Hidden-search/off-page identities retained, connected opener/fallback heading receives focus and scroll; repeated same selection now focuses detail.|[Hidden selection](r42/lane-04.png), reselect red/green logs|
|5|Delayed search, product, actual A1→B1 document and month responses cannot overwrite current identities.|[Race](r42/lane-05.png), packaged late-response test|
|6|Partial/no-cost/unsupported/retry labels preserve unknowns; existing expenses stale-report refresh checks pass.|Seven lane-06-07-state snapshots; packaged states/retry/expenses checks|
|7|Empty/true0/loss/return-only show correct values; unavailable days have no geometry, genuine zero has marker. Tiny nonzero height rounded0 is explicitly not zero.|Seven lane-06-07-state snapshots; report-display boundary and packaged state assertions|
|8|Real Electron zoom factor2 at680×720, bounded actual Tab walk reaches product; Enter/detail/document/return focus. Numeric daily alternative available.|[Zoom](r42/lane-08.png); physical Windows acceptance remains open|
|9|UI accept/save, then filter ÇAY/export still includes A/B/C and all30days, warnings/version metadata retained.|[Export](r42/lane-09.png), packaged workbook assertions|
|10|Import, expenses, purchasing, reports, raw source and recovery remain reachable; full offline restore preserves reports.|[Raw](r42/lane-10-raw.png), [operations](r42/lane-10-operations.png), [recovery](r42/lane-10-recovery.png), full packaged suite|

Working screenshots were presented before merge, including normal viewport top and selected document detail. [30.68second synthetic owner video](r42/owner-journey.webm) shows the functional page; no cosmetic redesign followed.

## Five paired performance observations

[Machine-readable samples and identities](r42/performance.json) use the same101document/line/product synthetic fixture, fresh process/profile per sample, baseline→head pairs, warm navigation after cold opening. Fixture SHA256 `081c42227d44925a4b6d5a5084f2dd572f7fa44fba561ae80330f79b7b956da4`. No other Electron task ran during samples. Units milliseconds; no statistical improvement claim.

| Measurement | Baseline five samples | Head five samples |
| --- | --- | --- |
|Cold coherent opening|407.4,407,400.1,407.4,405.5|402.8,398.9,408.9,408.5,412.2|
|Warm monthly tab navigation|47.2,36.2,30.7,30.6,35.2|33.2,33.5,33.2,34.1,34.7|
|Shared bounded evidence|18.9,14.7,14.7,13.9,14.3|29.5,13.4,13.1,13.2,13.6|
|Actual Aug→Sep coherent report|61.5,59.3,62.5,57.4,58.7|68,65.3,65,65.6,64.4|
|Navigate to expenses from import click|34.6,36.6,36.1,36.6,35.7|36,37.7,36.8,37,38.5|
|Product search|Absent in baseline|13.8,8.8,8.1,30.8,30.8|
|Name descending sort|Absent in baseline|18.5,31.7,14.1,14.7,14.2|
|Next product page|Absent in baseline|41.2,37.3,38.9,40.4,40.9|
|Select→loaded evidence|Absent in baseline|41.4,43,43.2,42.8,42.3|

Every head first page has100product rows; last page1; one graph;540DOM nodes in last-page selected state. Import responsiveness measures real101line import click followed immediately by expenses navigation and eventual successful import message, with no injected delay. It does not establish long-running real-volume throughput. Actual month-change metric includes both outside-coverage Aug readiness and Sep coherent summary/product page. Mac samples do not satisfy Windows or admitted-real-volume performance.

## Remaining handoff

Review and coordinator integration are separate gates. Continue Windows on this branch with `npm run package:win`, packaged desktop checks at minimum/narrow/200percent scaling, keyboard visibility, signed/null chart alternatives,101products and201mixed-document lines, filtered saved export and secondary workflows. Record unsigned installer/portable launch and ordinary interactions below two seconds on documented Windows hardware. Do not admit real data or enable source access from this receipt.
