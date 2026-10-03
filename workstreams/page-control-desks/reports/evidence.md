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
