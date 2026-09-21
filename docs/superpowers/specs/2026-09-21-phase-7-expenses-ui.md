# Phase 7 expense UI

Mode Operate. Extend the existing application for [Phase 7](https://github.com/AlesSystems/esmer-market-analytics/issues/10). Preserve the visual system in `src/ui/style.css` and `SalesWorkspace.tsx`, checked against the committed Phase 6 purchasing screenshot. `PRODUCT.md` exists; the pre-existing absence of `DESIGN.md` does not authorize a redesign or context repair.

## Direction contract

THESIS: Review an Excel expense batch before it affects the local records. Separate import success from owner completeness confirmation.

OWN-WORLD: Preserve the existing pale blue workspace, white data sections, navy text, blue links/actions, tabular numbers and green/red Esmer wordmark. Reuse navigation, form and table conventions.

STORY: Download the canonical Turkish workbook, fill it outside the app, select it, inspect row errors and suggested duplicates, then explicitly confirm. Review period expenses, corrections and completeness before reading the estimated operating result.

FIRST VIEWPORT: Existing app header and period selector remain. Giderler opens a heading with Şablonu kaydet and Excel seç actions, clear missing-evidence or estimated operating status, then the review table. Supporting provenance and batch history sit beneath. Correction forms are inline and labelled. Keyboard focus and horizontal tables work at 680px.

FORM: Direct extension of established workspace and issue-specified preview → validate → confirm sequence. No open concept selection or identity changes.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance. For this ordinary extension, document incumbent preservation and pre-existing absence of DESIGN.md without creating a new design system.

No invented data, automatic completeness confirmation, financial calculation in renderer or employee-level payroll. Include real pending/cancel/error/empty states; controls name their operation. Financial history must remain inspectable; revisions and source context remain pinned or clearly refreshed. Tests exercise packaged app and native dialog stubs. Verify the finished UI with packaged screenshots, keyboard checks and the Impeccable detector.
