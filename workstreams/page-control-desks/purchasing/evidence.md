# Purchasing C implementation evidence

Task: plan 6.1–6.2 / page-control-desks Purchasing C. Branch `codex/purchasing-control-desk`, implementation based on `a2c5751`; parent owns final commit/PR/integration. This is local macOS evidence, not Windows A07 acceptance. Environment: macOS27.0 build26A428, arm64, Node24.15.0, Electron44.3.0, 3 October2026.

The financial page keeps service-produced full-width coverage/estimate metrics and adds a paginated table of actual excluded cost lines. Selecting a row shows that row's reason, line ID, source document link and unknown cost. Existing coverage disclosure, history/returns/replacement/inventory views, filters, pinned source details and focus restoration remain. Source purchasing shows recorded counts, raw rows and explicit unverified cost coverage; it does not create cost/profit totals or new names.

The fixed geometry is authored locally from torus and box primitives: a diagonal lens and open evidence tray. Ring/slips select the actual first excluded line; tray selects purchase history. Matching HTML buttons expose the same actions. Source uses the ring for recorded documents and slips/tray for existing scope evidence. Empty raw coverage omits slips. No textures, animation loop, assets, financial math, dependencies, schema or IPC changes.

## Observed verification

- Test-first baseline: packaged executable from `page-control-desks` at base `a2c5751`; new contract failed because the `Maliyet kapsamı incelemesi` region was absent. This was missing behavior, not a toolchain failure.
- `npm run typecheck`, `npm run lint`, `npm run build`: pass.
- `npm run test:desktop -- tests/desktop/purchasing-control-desk.test.ts tests/desktop/purchasing.test.ts tests/desktop/source-workspace.test.ts`: initial packaged run 6 passed / 1 failed (source typing race); a subsequent run after source overflow repair 8 passed. Final offline packaged run: 7 passed / 1 failed at existing source-workspace line45 before Purchasing is opened. All six new/existing purchasing tests passed on the final build.
- Packaging retry initially encountered upstream Electron download HTTP503. Verified offline package command: `npm run build` followed by `npm exec -- electron-builder --dir --config.electronDist=node_modules/electron/dist`. Packaged app is `release/mac-arm64/Esmer Market Analytics.app`.
- Final new contracts pass actual row L2 selection/reason/source, mesh and keyboard parity, loss/retry, live reduced-motion change while mounted, native source-table focus/overflow, WebGL unavailable with usable evidence controls, one source main landmark, and no document overflow at 390px.
- Post-render counters in `renderer-counters.json`: 9 draw calls / 608 triangles / 1 frame; frame count unchanged over a subsequent 300ms idle window. Budgets <=24 calls / <=4000 triangles met. This is representative local scene rendering evidence, not Windows performance acceptance.
- Synthetic captures: `desktop.png` and `narrow.png` financial initial page at 1440/390; `source-desktop.png` and `source-narrow.png` normal raw source with 3D; `source-no-webgl.png` separately records fallback. Financial fixture `purchasingJourney()` / extraction `business-1`; source reduced fixture `rawSnapshot()` with purchasing type code1 / batch `cost-source-1`.
- Visual inspection at wide/narrow identified a long source hash overflowing while evidence was open. One repair batch scoped wrapping to purchasing main. Financial scene was complete and readable, summaries full-width, tables scroll natively. No open polishing loop.
- Screenshots/counters are refreshed only when `ESMER_CAPTURE_EVIDENCE=1`; normal test runs write screenshots to Playwright output paths.

## Existing limitation and remaining gates

The source-workspace test sometimes types into controls during a query refresh after `Filtreleri temizle`; its Sales branch input remounts/resets before all characters arrive. Identical line45 failure reproduced on unchanged baseline executable with `--repeat-each=3`: 1 failed / 5 passed. It also passed standalone and in one full focused run. Purchasing changes leave source query guards/filter behavior intact. Parent should reconcile the already incoming Sales fixes and rerun integration; this record does not claim a uniformly passing source suite.

Independent review, full unit/integration suites and final integration belong to the parent. Windows installation/scaling/performance gates remain unperformed. No production source access or private data was used. Packaging retains existing unsigned/default-icon and dependency-path warnings.
