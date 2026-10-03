# Default source overview evidence

Recorded on 2026-10-03 for [issue #56](https://github.com/AlesSystems/esmer-market-analytics/issues/56), [Task 8.1](../superpowers/plans/esmer-market-implementation-plan.md#task-81--complete-the-monthly-experience), D15/D16 and the synthetic UI portions of A03/A07.

The default source Özet now shows the existing blue 3D object and **Sonucun dayanağı**. The object explains coverage, recorded rows and unresolved financial meaning. Its fixed geometry represents navigation. It never scales with financial amounts or record counts.

## Build and fixtures

Branch `codex/source-overview-evidence` starts at `f7f3ae5`. The behavioral commits are `4d02326` for the missing contract, `c8d3d2e` for implementation and `02147e6` for interaction, recovery and synthetic SQL coverage.

Environment is macOS 27.0 arm64, Node 24.15.0, npm 11.12.1 and packaged Electron 44.3.0. `npm run test:desktop` builds the application and runs Electron from the packaged `.app`. The tested `app.asar` SHA-256 is `d35d7491de14ab58019fa232966dfc9dfb60679efe0e44dedee89d684a46b20a`.

Backup cases use `rawSnapshot()` with source lineage `fixture:source-control-desk`, batch `source-desk-1`, three headers, two lines and two product IDs. The fallback case uses `fixture:source-fallback`. Covered empty months and out-of-coverage months have separate expectations.

The live case uses a disposable `EsmerLiveFixture_*` database, a restricted reader and generated headers `1001`/`1002` with lines `2001`/`2002`. It imports through the normal configuration picker and refreshes through the real IPC/service/extractor path. No renderer bridge mock substitutes for SQL. Private configuration remains outside Git and screenshots contain generated rows only.

## Acceptance evidence

| Check | Expected and observed result | Reproducible procedure |
| --- | --- | --- |
| SO-01, default backup overview | The baseline lacks the requested heading. The new focused test fails with `element(s) not found`. After implementation, the heading and selected coverage layer appear on launch. | `tests/desktop/source-control-desk.test.ts`, raw-count case |
| SO-02, source provenance | The panel retains lineage, extraction ID, database ID, capture timestamp, version and date coverage. Historical type names do not establish financial meaning. | Raw-count and synthetic SQL cases |
| SO-03, selection | Enter, Space, native pointer controls and a mesh click update one selected layer and its explanation. | Raw-count case |
| SO-04, unknown evidence | A package without cost candidates still shows the object and its unavailable-estimate message. Outside coverage does not show zero counts. A covered empty month shows actual zero raw counts. | Both source-count cases |
| SO-05, rendering failure | Denied WebGL creation and context loss preserve evidence and HTML selection. Retry preserves selection. Failure has a status announcement with a separate retry button. | Source fallback and raw-count cases |
| SO-06, narrow layout | At 1440, 1120, 680 and 390 CSS pixels, the page and layer controls do not overflow horizontally. Reduced-motion preference changes preserve direct selection. | Raw-count case |
| SO-07, successful live capture | Initial SQL import opens the source overview. Refresh changes one document/line to two while keeping one product ID, updates capture evidence and retains layer selection. | `tests/desktop/source-overview-evidence.test.ts` with isolated synthetic SQL admin |
| SO-08, financial regression | Existing financial amounts, accessible labels, navigation, selection and rendering fallback pass. | `tests/desktop/ozet-control-desk.test.ts` |

The seven focused packaged tests pass. The first boundary attempt exposed two test-observation mistakes, an incorrect snapshot timestamp field and a canvas sampled before it was ready. The tests now use `capturedAt` and wait for a visible canvas. Application geometry was unchanged.

## Verification and review

The first full-suite attempt passed all 50 unit tests, then ten existing synthetic-development SQL tests stopped with `MISSING_DEV_CONFIG`. They refused to reuse another session's existing `EsmerSyntheticDev` database. The guard preserved that database. A fresh loopback container using the already available SQL Edge image isolated the final full integration run, which passed 322 tests with one optional configured-reader test skipped. No code change was needed for that environment repair.

All 87 desktop cases were attempted. Seventy-four passed, nine optional cases skipped and four older cases could not launch because their default executable was Windows-only. The four launch failures passed when rerun against the already built macOS package with an explicit `ESMER_EXECUTABLE`. Final unique results are 78 passed and nine skipped. The skips cover private-input, performance, polling and opt-in UI journeys. The new actual SQL import/refresh case passed in the full run.

| Command | Final result |
| --- | --- |
| `npm run test:unit`, reached through `npm test` | 50 passed |
| `ESMER_SQL_TEST_ADMIN=<fresh private fixture config> npm run test:integration` | 322 passed, one optional configured-reader test skipped |
| `ESMER_SQL_TEST_ADMIN=<fresh private fixture config> npm run test:desktop` | Build and package succeeded, 74 passed, nine skipped, four executable-path launch failures |
| `ESMER_EXECUTABLE=<macOS packaged executable> npm exec -- playwright test tests/desktop/option-b.test.ts tests/desktop/shadcn-ui.test.ts tests/desktop/workspace-subviews.test.ts` | All four previously unlaunched cases passed, three already skipped cases remained skipped |
| `npm run typecheck` and `npm run lint` | Passed |
| `git diff --check` | Passed |

Separate reviewers inspected the behavioral diff at `02147e68a74f9fc4b511a9eacf97f1a6bbb6fd66` against `f7f3ae5`. Standards review found zero documented breaches and zero actionable maintainability findings. Spec review passed with zero actionable findings. Both reviews kept Windows acceptance open. The separate no-comments review found zero introduced comments or suppressions and zero flags.

Task-owned temporary SQL configuration directories and the fresh full-suite container were removed after verification. The existing synthetic development container and database were preserved.

The shared renderer has typed three-layer inputs and explicit source/financial accessible labels. SourceControlDesk owns source explanations. The design review selected this shape over a renderer plus two adapter modules because the shared component solves the issue with fewer boundaries. No new dependencies, assets, schema, source mapping, credentials, privileged IPC or financial formulas are introduced. The procedural 3D geometry is the repository's existing implementation.

## Remaining Windows acceptance

Windows packaging, native GPU/fallback behavior and actual Windows scaling remain unverified. macOS results do not close A07, source-dependent acceptance, L01 or production rollout.

Continue on the same branch using an explicitly isolated synthetic SQL engine and a private `ESMER_SQL_TEST_ADMIN` configuration. Run `npm ci`, `npm run typecheck`, `npm run lint`, `npm run test:unit`, `npm run test:integration` and `npm run package:win`. Run the three overview desktop files against `release/win-unpacked/Esmer Market Analytics.exe` with `npm exec -- playwright test tests/desktop/source-control-desk.test.ts tests/desktop/source-overview-evidence.test.ts tests/desktop/ozet-control-desk.test.ts`. A skipped SQL test leaves SO-07 unverified on Windows.

Inspect default backup launch, successful live capture/refresh, keyboard focus, narrow layouts, WebGL failure and retry at actual Windows 100%, 125% and 150% scaling. Record the Windows build, fixture identities, screenshots and results before closing that acceptance. No production connection, owner installation or merge is part of this handoff.

## Synthetic screenshots

- [Default source overview at 1440 pixels](images/source-overview/default-1440.png).
- [Evidence rail in a 390-pixel layout](images/source-overview/narrow-390.png).
- [WebGL failure with source evidence and selection](images/source-overview/no-webgl.png).
- [Actual disposable SQL refresh](images/source-overview/synthetic-sql-refresh.png).
