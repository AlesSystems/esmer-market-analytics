# Expenses C acceptance evidence

Task: plan 7.1–7.2 presentation / approved Expenses C; branch `codex/expenses-control-desk`, base `a2c5751`, uncommitted implementation handed to root for review and commit. Environment: macOS arm64, Electron 44.3.0 packaged app, 2026-10-03. No source connection or private fixture.

The month checklist reads actual `ExpensePeriod` rows, batches, summary coverage/reasons, labour coverage, revision and persisted completeness. Geometry contains fixed dimensions, never money or completeness proportions. The folio selects records/import/completeness; mutations remain in existing explicit controls. HTML buttons and mesh targets share the task owner. No services, schemas, dependencies or financial calculations changed.

## Commands and observed results

- Red contract: packaged baseline at `/Users/altanesmer/Desktop/Ales/esmer-market-analytics/release/mac-arm64/Esmer Market Analytics.app/Contents/MacOS/Esmer Market Analytics`, `npx playwright test tests/desktop/expenses-control-desk.test.ts` with ESMER_EXECUTABLE. Actual application failure: `Ayı tamamlamak için` heading absent. Toolchain ran normally.
- `npm run typecheck`, `npm run lint`, `npm run build`: passed.
- Packaging: `npx electron-builder --dir --config.electronDist=/Users/altanesmer/Desktop/Ales/esmer-market-analytics/node_modules/electron/dist`: passed using existing Electron distribution after parent reported download 503. Builder warned about undefined transitive search paths; packaged functional checks below passed. Signing intentionally disabled by existing config.
- `ESMER_CAPTURE_EVIDENCE=1 ESMER_EXECUTABLE='<this worktree>/release/mac-arm64/Esmer Market Analytics.app/Contents/MacOS/Esmer Market Analytics' npx playwright test tests/desktop/expenses-control-desk.test.ts tests/desktop/expenses.test.ts tests/desktop/workspace-subviews.test.ts`: 10 passed.

Synthetic fixtures: empty standalone period; `rawSnapshot()` opaque source batch `expense-desk-source`; existing business fixtures in expense and workspace tests; two synthetic Excel rows `folio-a`/`folio-b` for duplicate continuity. Tests cover source embedded one-main, financial workspace, standalone entry, real task tab mesh selecting Excel, keyboard equivalents, repeated same-task review draft preservation, task round-trip review/duplicate choices, invalid workbook blocking, duplicate approval guards, correction/reversal/history and explicit saved completeness.

Renderer: actual WEBGL_lose_context and retry retain draft/checkbox. Forced unavailable getContext retains HTML task actions and disabled approval. Live reduced-motion preference changes preserve feedback; scene has no animation. Instrumented latest rendered frame: 13 draw calls, 228 triangles; settled idle window: zero draw calls. See renderer.json. This measures this macOS packaged run only.

Screenshots: expenses-desktop.png (1440 px), expenses-narrow.png (390 px), expenses-review.png. Inspected wide/narrow as one visual batch: complete folio, readable tabs and checklist; no horizontal document overflow. One repair moved actual period/revision metadata below heading. Frozen production layout thereafter. Mesh-target test initially missed with guessed pixel coordinates; fixed test to project the known tab using the fixed camera and wait for renderer readiness; observable Excel-task result now passes.

## Remaining gates

Windows A07 packaging/scaling/performance acceptance remains open. Independent parent review, integration and final repository-wide checks are owned by root. No claim of Windows acceptance, contrast measurement, long-run GPU memory testing or full suite completion. No commits or PR created by worker.
