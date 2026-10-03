# UI-01 structural simplicity audit

Reviewed on 2026-10-03 from branch `codex/live-mock-tracking`. This is a code-based audit of the current interface. The parent owns packaged screenshots, runtime inspection, implementation and verification. No application or test files were changed by this audit.

The user explicitly requested removal of decorative 3D elements. This supersedes the object requirements in `DESIGN.md` and `docs/contracts/page-control-desks.md`. Keep the incumbent typography, colours, financial meaning and workflows. Update those records to describe the resulting interface when implementation is verified.

Throughput checkpoint is not applicable to this read-only investigation.

## Essential tasks

| Surface | Retained task and required context |
| --- | --- |
| Özet | Read the selected month's sales, estimated costs and operating-result availability. Open sales, purchasing, expenses and detailed monthly report. Retain cutoff, coverage, synthetic identity, stale refresh and method evidence. |
| Source summary | Read recorded document/line/product-ID counts and open supporting raw records. Counts cannot become sales, cost or profit. Preserve actual backup range and unknown day semantics. |
| Satışlar | Navigate category, product, document and source-line evidence; search and compare periods; distinguish customer returns and excluded documents. |
| Alışlar ve maliyet | Inspect missing cost evidence and supported cost rows; read purchasing history, supplier returns, replacement costs and inventory observations. Preserve distinct units, missing values and source documents. |
| Giderler | Import and validate Excel; explicitly resolve duplicate candidates; correct/restore records; review revision-specific period completeness. Labour remains aggregated and KDV evidence remains explicit. |
| Raporlar | Find, select, compare, open, accept and export immutable versions. Keep candidate review separate from expense completeness and from verified profit. |
| Ayarlar / kurtarma | Import prepared packages, distinguish source and financial views, operate isolated SQL test connection, set text size, create encrypted backup and review/confirm restore. |

## Recommended cuts

| Priority | Current evidence | Concrete change | Retention condition |
| --- | --- | --- | --- |
| 1 | `src/ui/overview/ControlDesk.tsx:10,25,46` and `src/ui/overview/MonthObject.tsx` | Delete MonthObject, the financial-layer selection state and duplicate caption. Delete the evidence intro “Rakamları okurken kapsamı da görün.” | All three financial layers already appear in the metric matrix and proof list. Keep proof list, method disclosure and report link. |
| 1 | `src/ui/scenes/SceneFrame.tsx`, `SalesReceiptScene.tsx`, `CostInspectionScene.tsx`, `ExpenseFolioScene.tsx`, `ReportArchiveScene.tsx` | Remove every production canvas, geometry, WebGL fallback/retry, render instrumentation, 3D loading status and “nesne tutar göstermez” caption. | Retain task controls independently of geometry as described below. Do not leave unused imports or scene CSS. |
| 1 | `src/ui/SalesWorkspace.tsx:129` | Replace the receipt object with compact ordinary controls for sales documents, customer returns and source/method. Remove generic rail introduction. | Preserve return filtering, busy disabling, evidence disclosure focus and underlying document/line drill-down. |
| 1 | `src/ui/SourceWorkspace.tsx:28,36,57` | Keep one short, visible raw-source limitation. Consolidate repeated technical/provenance text into “Kaynak ve kapsam ayrıntıları”. Remove rail repetitions of cutoff, package and missing-name facts already present there. | Keep ordinary document/product/evidence controls and accessible evidence focus. Preserve source-scope warning on every source destination, including expenses and saved reports. |
| 1 | `src/ui/ExpensesWorkspace.tsx:65–71` | Replace the three-item “Ayı tamamlamak için” checklist and folio with a compact task navigation and one period/status line. The records view already has a completeness notice, metrics, evidence disclosure and table. | Preserve task switching without clearing review drafts or Excel preview/duplicate decisions. Keep missing labour/KDV/loss reasons in the existing summary disclosure. |
| 1 | `src/ui/purchasing/PurchasingWorkspace.tsx:64` | Remove the inspection object, rail heading/introduction and duplicate covered/excluded count. Keep compact coverage/evidence shortcut if useful. | The excluded table, metric evidence buttons and subview navigation already expose these tasks. Keep selected-line evidence and document links. |
| 1 | `src/ui/reports/ReportArchive.tsx:14` | Remove archive scene and first-three sleeve controls entirely. | The table's “Sürümü incele” action selects the same versions and covers all pages. Keep selected inspector and full-report/export controls. |
| 2 | `src/ui/reports/ReportArchive.tsx:14` | Remove the three-field archive summary. Version count repeats the list heading, last save repeats first table row, selected period repeats inspector. | Keep count by list title; keep selection identity, cutoff and synthetic/coverage warning in inspector. |
| 2 | `src/ui/SalesWorkspace.tsx:121` | Consolidate chart captions into one plain line explaining returns and negative bars. | Keep daily-value disclosure as accessible alternative to SVG. |
| 2 | `src/ui/overview/ControlDesk.tsx:31,45–46` | Remove “Satış, maliyet ve giderleri aynı çerçevede okuyun.” and duplicate generic status prose. | Keep period/report status and at least one direct missing-cost and non-profit qualification beside affected values. Do not hide the operating-result reason. |
| 2 | `src/ui/overview/SourceControlDesk.tsx:32` | Remove “Ay bir bakışta” under the source summary title. | “Kaynak kayıtlarının özeti” and selected period remain. |
| 2 | `src/ui/SourceWorkspace.tsx:47` | Remove repeated textual counts directly before the source table when the metric row is visible. | Pagination count still describes the filtered result. Detail view keeps document and line evidence. |
| 2 | `src/ui/reports/SavedReports.tsx:33–34` | Combine the two notices about saved versions and raw SQL limitations into one concise warning. | Explicitly state versions keep their own source and raw records cannot create a financial report. |
| 3 | `src/ui/settings/SettingsPage.tsx:157–159,170–174,187–195` | Remove settings intro and “Analiz veri paketi” subheading that repeats tile title. Consider presenting About as a compact disclosure/footer instead of a full tile. | Keep application version, TRY and local/read-only identity accessible. Preserve import failure preservation and distinction between validated financial and raw packages. |
| 3 | `src/ui/recovery/RecoveryWorkspace.tsx:48` | Move retention-policy detail into a disclosure if it crowds the backup action. | Keep backup+key requirement visible, last verification/status, pinned backup controls and destructive restore confirmation. |

## Behavior risks when removing scenes

- Expense task tabs are functional. `selectTask` preserves preview and review state, while `returnToRecords` clears preview. Keep a plain task nav with stable opener IDs and focus restoration. Existing regression checks exercise switching away and back with a review draft and an explicitly selected duplicate row.
- Financial sales receipt controls select sales versus customer-return transactions. Source receipt controls select document versus product-ID records. Do not imply source product IDs are verified customer returns.
- Purchasing scene exceptions shortcut selects the first excluded row. Preserve this useful behavior only if retaining that shortcut. Normal row selection already exposes each record. Evidence buttons still need to open the same disclosure.
- Report table has separate select and open actions. They serve distinct inspector and full-report workflows. Removing the scene does not justify merging these actions without a behavior decision.
- Removing an evidence rail must not delete unique source identities, method versions or date ranges. Move those into existing disclosure before deleting duplicated containers.
- Avoid removing synthetic warnings merely because another destination has one. Saved reports may belong to a different dataset than the currently open raw source.
- Preserve page headings, Turkish labels, native table scroll regions, daily-value disclosures, `aria-current`, pressed task states, loading/error announcements and focus return after panel closure.

## Tests to update

| Existing file | Scene-specific expectations to replace | Behavioral evidence to retain |
| --- | --- | --- |
| `tests/desktop/ozet-control-desk.test.ts:48,74` | Layer tabs, canvas click, context loss, retry and layer selection. | Metric values, wide/narrow large-number overflow, keyboard navigation, method disclosure/focus. |
| `tests/desktop/sales-control-desk.test.ts:13,122` | Canvas, mesh click, 3D caption/loading, WebGL recovery and draw instrumentation. | Financial/source routes, returns/documents controls, evidence focus, raw/financial distinctions, responsive layout and stale/source details. |
| `tests/desktop/purchasing-control-desk.test.ts:46–51,55` | Lens canvas and WebGL retry, renderer counters. | Excluded-row selection and document source links, covered/excluded evidence, purchasing history, source-only limitations and keyboard controls. |
| `tests/desktop/expenses-control-desk.test.ts:6,84,104,127` | Folio/checklist heading, mesh projections, scene rendering and WebGL retry. | Review draft retention, duplicate choices and preview retention, focus restoration, mutation disabling, one main in source mode and narrow layout. |
| `tests/desktop/reports-control-desk.test.ts:18,30` | First-three sleeve buttons, mesh click, canvas/context loss/retry and render metrics. | Select same versions through table row controls, stable inspector across pagination/search, immutable metadata/value, synthetic and incomplete-period warnings, Excel export and acceptance. |
| `tests/desktop/source-control-desk.test.ts` | Any removed secondary source subtitle if asserted. | Recorded counts, backup cutoff, accessible chart tables, missing days and type-code limits. |

Test the simplified controls directly rather than keeping a WebGL-failure simulation for components that no longer contain WebGL. A compact assertion that all production destinations have no canvas verifies the explicit user requirement. Keep existing backend and financial tests unchanged.

## Styling and dependency notes

Remove obsolete production scene selectors in `src/ui/overview/control-desk.css`, `src/ui/sales/sales-control-desk.css`, `src/ui/purchasing/control-desk.css`, `src/ui/expenses-control-desk.css` and `src/ui/reports/reports-control-desk.css`. Keep responsive grid changes needed by retained evidence panels and task navigation. The purchasing rail currently has a tinted rounded card while sales and reports use separators; flattening that rail reduces variation without introducing a new design system.

`@react-three/fiber` and `three` remain used by `src/ui/overview/prototype/MonthObject.tsx` and prototype tooling. Do not remove their package declarations without first deciding whether prototype artifacts remain supported and checking all imports. Removing production scene entry points should remove these dependencies from the shipped renderer bundle without requiring unrelated prototype cleanup.

## Evidence and limits

Read PRODUCT.md, DESIGN.md, `docs/contracts/page-control-desks.md`, the UI modules named above, AppShell, MonthlyOverview, ReportEvidence, SettingsPage, RecoveryWorkspace, scene modules, workspace styles, the scene desktop tests, package.json and the current v1 work-contract plan. Impeccable context was already run by the parent. Distill guidance was applied to remove repetition while keeping task completeness. The Poteto wrapper, Codex adapter, upstream principles index, Investigation playbook, how leaf and explorer prompt were read. Further delegation was skipped because this is the scoped read-only explorer node.

No runtime, packaged verification or screenshot result is claimed here. Parent screenshots must confirm actual visual hierarchy and spacing after these structural cuts. Windows verification remains outside this task by explicit user request.
