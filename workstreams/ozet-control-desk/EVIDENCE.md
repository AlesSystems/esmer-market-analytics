# Kontrol masası acceptance evidence

Scope is the owner's selected C prototype for production Özet, including its cobalt palette and the logo from esmermarket.com. This work implements the presentation slice of Task 8.1 in the [implementation plan](../../docs/superpowers/plans/esmer-market-implementation-plan.md). The [contract and DAG](CONTRACT.md) record the boundaries. Windows A03/A07 acceptance and source-dependent gates remain open.

## Environment and fixtures

Recorded on 2026-10-03, macOS arm64, Node 24 and Electron 44.3.0. Desktop tests launch the packaged application from `release/mac-arm64`. Each test uses an isolated temporary profile and synthetic local store. No source backup or production connection is used.

The minimal `businessPackage()` fixture contains net sales 200.00 TRY, covered historical cost 60.00 TRY, covered gross profit 40.00 TRY, 50% cost coverage and incomplete expenses. The 30-day visual fixture in `ozet-control-desk.test.ts` contains alternating daily sales of 30,000 and 53,240 TRY. Independent expected monthly amounts are 1,248,600 TRY sales, 825,000 TRY covered cost and 423,600 TRY covered gross profit. All categories, product names and source IDs are synthetic.

## Contract and verification

| Stage | Procedure | Expected / observed result |
| --- | --- | --- |
| C2 missing contract | `npm run test:desktop -- tests/desktop/ozet-control-desk.test.ts` before implementation | Packaged app launched. Failed at missing `Ay bir bakışta` heading, as intended. |
| C3 initial regression | Packaged monthly-overview, product-profit, unavailable-states and new overview tests | 19 passed. One test's `--disable-webgl` launch flag did not disable the renderer; its fallback assertion failed. Corrected the test to inject an unavailable WebGL context before reload. No fallback success claimed from the failed flag. |
| C3 visual correction | Inspected actual 1440px screenshot with one recorded day | One bar initially filled the chart. Changed geometry to calendar slots, preserving absent days as gaps. No values or financial calculations changed. |
| C5 focused | Final `npm run test:desktop -- tests/desktop/ozet-control-desk.test.ts` | All three tests passed. Covers pinned values, actual workspace navigation, local logo, Turkish font, 1440/1120/680/390 layouts, initialization fallback, simulated context loss, retry, keyboard selection, live reduced-motion preference and method focus. |
| Static checks | `npm run typecheck`, `npm run lint`, `git diff --check` | Passed after test-fixture variable rename. An intermediate typecheck correctly caught the fixture's local `document` variable shadowing DOM types in page callbacks; production code was unaffected. |
| Full regression | `npm test` | 49 unit tests passed; 305 integration tests passed and 5 isolated SQL opt-ins skipped. Desktop run passed 49, skipped 8, and failed four launches because existing tests default to a Windows `.exe` path. A targeted rerun of those files with `ESMER_EXECUTABLE` set to the built macOS executable passed all four, with three existing visual opt-ins skipped. Total executed desktop scenarios passed is 53. No application assertion failed in the full run. |
| Independent review | Separate Standards and Spec reviewers examined `39cbee4...b0b8f6c` | Zero actionable findings in each axis. Standards checked boundaries, packaging and renderer semantics; Spec compared the selected prototype and all five production screenshots. Neither reviewer reran tests. |

## Appearance

The main figures, chart, category rows and evidence rail use the selected C structure. The website logo is unchanged and loads from the packaged asset allowlist. Manrope Latin and Latin Extended fonts load locally. Other workspaces retain their existing styles. Existing monthly detail and saved-report workflows remain available.

- [Desktop, 1440px](screenshots/desktop.png)
- [Desktop, 1120px](screenshots/desktop-1120.png)
- [Narrow, 680px](screenshots/narrow.png)
- [Compact, 390px](screenshots/mobile.png)
- [WebGL unavailable](screenshots/webgl-unavailable.png)

Screenshots show synthetic data only. Desktop captures at 1440 and 1120 were visually inspected, as was the compact layout. CSS layout checks cover all four widths. The 390px check is Chromium viewport emulation; the native desktop minimum window width is 680px.

## Assets and boundaries

[Asset provenance](../../src/ui/assets/README.md) records the logo URL, locked fonts, and bundled MIT/OFL notices. The 3D object is locally authored geometry with a fixed camera and demand rendering. Its layers select explanations, not proportional amounts. HTML alternatives remain usable without WebGL. Pixel ratio is bounded to 1–1.5. No automatic rotation or animation is introduced.

Desktop protocol changes add exactly three asset paths and `font-src 'self'`. IPC, database schema, report arithmetic, source access and external network permissions are unchanged. The renderer continues to consume MonthlyDisplay. Prototype fixtures and controls are not imported into production.

## Limitations

Windows packaging and installed/portable Windows runtime acceptance were not performed on this macOS host. Physical touchscreen input, publisher signing and real-source acceptance are not claimed. Existing release gates remain open. No deployment or merge is part of this request.

Package notice inspection passed for 80 packaged dependencies. All ten new or promoted renderer/font licence resources were confirmed present and nonempty in the packaged application. Comment review found zero actionable comments or suppressions.

The final focused rerun also clicks the rendered top 3D mesh after selecting cost through HTML and confirms the shared selection changes to sales. Context-loss recovery then preserves the expense selection. All three focused tests passed again against the same packaged build.

The eight skipped desktop cases were existing opt-ins or platform gates: Windows performance and lifecycle, pagination opt-in, three extended visual journeys, private source estimate and private backup preview. The five skipped integration cases require isolated SQL configuration.

## Revision record

Branch `codex/ozet-ui-prototypes`. Contract commit `da7767b`, implementation `b0b8f6c`, mesh-selection regression `f5ffa56`. The packaged runtime tested by the full suite contains the implementation in `b0b8f6c`; `f5ffa56` adds test assertions only. The PR also includes the original three prototype commits `0f454eb` and `39cbee4` as the design record.

PR [#54](https://github.com/AlesSystems/esmer-market-analytics/pull/54) targets main. Design and acceptance evidence commit is `c4c000e`.
