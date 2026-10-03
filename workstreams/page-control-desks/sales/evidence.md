# Sales A implementation evidence

Task: approved page-control-desks presentation slice, plan 5.2 / A03–A07 relevant UI behavior. Branch `codex/sales-control-desk`; root owns commits/PR and integration. Test-first contract commit `4039b7a`. This record describes the current working patch; root must bind it to implementation commit/PR at integration.

Environment: macOS 27.0.0, arm64, Node 24, Electron 44.3.0 packaged application at `release/mac-arm64/Esmer Market Analytics.app/Contents/MacOS/Esmer Market Analytics`. Synthetic `journeyRecords` / `salesPackage` and `rawSnapshot` / `fixture:sales-desk` only. No live/source connection or private data.

## Result

Financial and raw-source Sales now have full-width heading and KPI row, daily chart and ledger with an evidence rail. Financial values come unchanged from SalesView. Raw-source summary shows counts and daily recorded documents, retains unverified raw currency/totals/IDs, and does not invent net sales/cost/profit/names. Receipt geometry is a locally authored bent strip plus return fold and evidence tab. It represents navigation only.

SceneFrame is renderer lifecycle only: fixed caller-owned camera, bounded DPR, demand/hidden frame mode, initialization status, error boundary, context loss, retry and listener cleanup. SalesReceiptScene owns geometry, controlled semantic actions and HTML equivalents. Existing overview MonthObject remains intact. Shared page-desk-shell palette applies Manrope/cobalt to the four authorized workspaces, excludes settings/away state.

## Checks

- `npm run test:desktop -- tests/desktop/sales-control-desk.test.ts tests/desktop/sales-drilldown.test.ts tests/desktop/source-workspace.test.ts`: **7 passed**, packaged application (11.4 seconds test runtime). Existing keyboard drill-down/focus, stale source, discrepancies, unavailable periods and raw-source destination workflow retained.
- Added contracts cover financial/source receipt mesh selection, equivalent HTML keyboard actions, real return filtering/source product IDs, live reduced-motion preference changes, context loss/retry with selection preserved, unavailable WebGL and repeated Turkish input. Wide and 390px document overflow assertions pass with provenance expanded.
- Renderer instrumentation wraps WebGL draw calls in test initialization, with no product debug API. Both financial/source resize renders: **14 calls, 164 triangles**. Settled 350ms interval: **0 draw calls**. Budgets: ≤24 calls / ≤4,000 triangles. Geometry is static and fixed-size; it does not grow per record.
- `npm run typecheck`, `npm run lint`, build/package step and `git diff --check`: passed.
- Final screenshot capture run: **3 passed** using the same packaged binary; initial default pages captured after font readiness; recovery screenshots are separate.

Logs and renderer JSON are under `work/page-implementation/sales/`. Final default screenshots: `financial-1440.png`, `financial-390.png`, `source-1440.png`, `source-390.png`; recovery variants and `unavailable.png` sit beside this record. Implementer inspected financial desktop and source narrow captures. Parent/reviewer owns independent visual acceptance.

## Test-first evidence and limits

Initial two tests successfully launched, asserted source/financial fixture values and failed only on missing `.sales-control-desk`; see `test-first.log`. First green run accidentally overwrote the original `*-before` images; those originals were inspected by root before overwrite. A subsequent capture-only run against the unchanged original checkout's packaged executable regenerated `*-before` images, **2 passed** (`baseline-regenerated.log`). These are regenerated baseline evidence, not preserved first-run files.

Mac checks do not close Windows A07. Full-volume Windows performance/scaling and source-semantic acceptance remain open. The bounded resource observation does not prove long-running navigation leak absence, touch hardware behavior or comprehensive accessibility/contrast conformance. No dependency, schema, IPC or financial calculation change.

## Root visual repair batch

Root's final screenshot inspection found narrow comparison labels overlapping and a blank/cropped receipt after resize. Wrapped comparison values within their minimum-width-zero columns, removed unnecessary visibility/IntersectionObserver frame switching, retained demand rendering without an animation loop, and kept the stage at230px at narrow widths for full receipt framing. The focused packaged Sales suite passed **3 tests** (6.6seconds); default/recovery/unavailable screenshots were recaptured at the same paths. Log: `work/page-implementation/sales/visual-repair-test.log`. This supersedes the earlier frame visibility description: SceneFrame always uses demand rendering. No other polishing or scope changes were performed.

## Independent review repairs

Independent standards and spec reviews found that the new negative tabindex removed native disclosure controls from keyboard navigation. Both summaries now retain native focus behavior. A source-navigation regression also kept the receipt's product button pressed after the document view opened; selection now follows the real query view. Added packaged contracts cover Tab/Enter on source overview provenance and product-to-document selection continuity. All three focused packaged tests, typecheck, lint and diff checks passed after repair.

The upstream Electron download returned HTTP 503 during repackaging. The verified installed Electron 44.3.0 distribution was reused with `electron-builder --dir --config.electronDist=/Users/altanesmer/Desktop/Ales/esmer-market-analytics/node_modules/electron/dist`. This still exercises the packaged app. Screenshot tests now use Playwright output directories by default; `ESMER_CAPTURE_EVIDENCE=1` explicitly refreshes the tracked evidence.
