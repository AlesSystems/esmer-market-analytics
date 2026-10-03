# Reports B — local packaged acceptance

Date: 2026-10-03. Task: page-control-desks Reports B / plan 8.1–8.2. Branch: `codex/reports-control-desk`. Base: `fb610c9e183da84b17e517d9ea42fc42528692b5`; implementation remains uncommitted for root integration. No source access, dependency, schema, IPC or calculation changes.

## Contract and artifacts

Archive search covers actual review explanation, saved ID, dataset ID and recorded dates. Sorting and ten-row paging operate only on saved summaries. The persistent inspector reads the actual selected immutable report. Full report navigation remains explicit; candidate review and saved-pair comparison remain separate. Source mode offers read/export only, retains its own source warning and synthetic saved-report warning, and cannot construct a financial candidate from SQL rows.

The upright folder uses four fixed box meshes and up to three real saved-version sleeves. Selected sleeves advance only after a successful read. HTML selections and mesh selections use the same page-owned read. No financial values determine geometry. The archive scene unmounts while full report detail is open, preserving archive filters and paging. Scene assets are authored local primitive geometry; no external model, texture or paid service.

## Verification

Environment: macOS arm64, Electron 44.3.0 packaged application. Synthetic fixtures: `businessPackage` / `businessRecords`, extraction `archive-second`, raw batch `fixture:archive` / `archive-source`, and ten `archive-page-*` batches. Original/private market rows were not used.

- Baseline: new focused test failed against the existing root packaged binary because `Arşivde ara` was absent. Observed application contract failure, not a toolchain failure.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build && npx electron-builder --dir --config.electronDist=/Users/altanesmer/Desktop/Ales/esmer-market-analytics/node_modules/electron/dist`: passed. Existing symlinked dependency-discovery/default-icon/unsigned macOS warnings remain; packaged launch and report operations succeeded.
- Packaged focused suite: `ESMER_CAPTURE_EVIDENCE=1 ESMER_EXECUTABLE='<worktree>/release/mac-arm64/Esmer Market Analytics.app/Contents/MacOS/Esmer Market Analytics' npx playwright test tests/desktop/reports-control-desk.test.ts tests/desktop/report-version-comparison.test.ts tests/desktop/report-expense-states.test.ts tests/desktop/source-workspace.test.ts` produced 8 passed / 1 failed. All four new Reports checks, existing candidate comparison/review/focus, report empty/error/retry and source recovery passed. The existing source-workspace test failed before visiting Reports: sequential typing of product ID `333` yielded an empty input. Its focused rerun (`npx playwright test tests/desktop/source-workspace.test.ts`, same executable) passed both checks. No source-workspace code/test changed in this workstream.
- Export output XML contains the selected first saved ID while the active dataset/newest saved report is the second ID.
- A deliberately unavailable report table causes a failed read; loaded inspector ID and scene `aria-pressed` remain the prior saved ID. Restoring the table permits the next action.
- Mesh tap selects the same saved ID as its keyboard HTML button. Live reduced-motion preference changes preserve immediate selection.
- Actual `WEBGL_lose_context` causes fallback, preserves selection, permits keyboard selection, and retries successfully. Separate initialization with WebGL disabled preserves usable task controls and renderer-only retry.
- 1440 px and 390 px pages have no document overflow. Archive tables are labeled focusable overflow regions. Paging/search preserve the loaded inspector even when its row is on another page.
- Renderer instrumentation: financial and source each measured **6 calls / 72 triangles** for a resize frame and **0 idle draw calls** after settling. Targets: <=24 calls / <=4,000 triangles. See [financial renderer](financial-renderer.json) and [source renderer](source-renderer.json). The three-sleeve fixture has bounded geometry by construction; measured captures use two sleeves.

Normal captures: [financial 1440](financial-1440.png), [financial 390](financial-390.png), [source 1440](source-1440.png), [source 390](source-390.png). Separate fallback captures: [financial context loss](financial-context-loss.png), [source context loss](source-context-loss.png), [WebGL unavailable](unavailable.png). Normal screenshots preserve the actual scene, selected report identity, provenance and useful controls. Tests default to `testInfo` output; tracked refresh requires explicit `ESMER_CAPTURE_EVIDENCE=1`.

## Limits

Windows packaging/scaling, A07 Windows acceptance, real source semantics and full-volume performance remain open. No acceptance claim extends beyond these synthetic local macOS checks. Root owns full unit/integration verification, independent review, integration commits, PR and merge. No commits, pushes or spawned agents were made here.

## PR60 bounded review repair

Date: 2026-10-03. Starting pinned head: `0f0855629ebf4e1745a865d0d9f9f27487073943`, base `9683a80249efb5b30bbc463ca8ad95ec9230a29e`. Reviewed `work/page-implementation/reports/standards-review.md`. Repair is uncommitted for root integration.

Four packaged regressions were added before application edits and run against the reviewer's existing pinned binary. **4 failed**: an accepted unavailable August period showed `0,00 ₺` rather than `Hesaplanamıyor`; accepted partial September lacked `Kısmi dönem`; accepted unreconciled September lacked `Kanıt eksik`; UI accept → inspect older ID → open newest/current row displayed the older full-report ID. Fixtures used actual `ReportVersions.open/accept` outputs and the application's UI acceptance flow, with no fabricated report DTOs.

The inspector now uses the existing MonthlyOverview coverage boundary: unavailable sales are withheld, partial/incomplete contributions carry the existing Turkish explanations, and the service-provided from/to range is explicit. No financial values are recalculated. The candidate-ID full-open shortcut sets the requested candidate before opening details. Three redundant test comments were removed. Normal captures now reset window scroll to zero and wait for two animation frames after viewport changes.

Fresh `npm run typecheck`, `npm run lint`, `npm run build` and offline `npx electron-builder --dir --config.electronDist=/Users/altanesmer/Desktop/Ales/esmer-market-analytics/node_modules/electron/dist` **passed**. Existing dependency-discovery/default-icon/unsigned macOS warnings are unchanged.

The packaged command above, with explicit `ESMER_CAPTURE_EVIDENCE=1`, then ran **13 passed in 15.3 seconds**: all eight Reports control-desk tests (including the four red regressions), existing saved-pair versus candidate review/focus, two report states, and two source-workspace checks. The existing source typing race did not occur in this run; no claim that it was fixed. `git diff --check` passed.

Normal financial/source 1440/390 captures and separate fallback captures were refreshed once after the repair. Visual inspection confirms the desktop sidebar begins at the page top, the full scene remains visible in full-page normal captures, and coverage status/range appear with the selected saved report. Financial/source measurements remain 6 draw calls / 72 triangles per resize frame and zero idle draw calls. Windows A07, real-source, full-volume and long-running renderer gates remain open.

## Integrated final verification

On integrated head fa6d576: full unit suite49 passed; integration305 passed /5 opt-in SQL checks skipped; packaged desktop72 passed /8 Windows or private-source checks skipped. All ESMER opt-in environment values were cleared except the explicit synthetic packaged executable. No private or live source was inspected. Original logs are retained in the main checkout work/page-implementation/final-{unit,integration,desktop}.log. The existing source typing test passed in this full run.

A final evidence-only correction followed: the financial context-loss full-page capture retained a displaced sticky sidebar. A first scroll-readiness assertion exposed late scroll anchoring at400px; capture now waits for settled zero scroll and uses the actual1440×1000 viewport. Root visually verified the top-aligned sidebar and fallback controls. Typecheck/lint and both financial/source focused checks pass after this test-only change. No application code changed after the full suite. The full run regenerated an unrelated tracked source-estimate screenshot; root restored that test side effect. Windows A07 remains open.

Final finish review required one visual repair: remove the candidate card’s3px cobalt side stripe. Removed only the two border declarations, retained spacing and thin section separator, rebuilt the package and passed3 focused financial/source/renderer checks. Financial normal and fallback captures refreshed; unchanged source captures retained. This CSS-only repair follows the full-suite run and does not change application behavior.
