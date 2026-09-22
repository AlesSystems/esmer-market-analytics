# Phase 8 specification review

Reviewed `6e0a478...add17a4` against issue #11 (including comments), AGENTS.md, the foundation specification/audit/acceptance documents, Phase 8 tasks and the report contract. Review performed on macOS with Node 24.15.0; no Windows or source access was performed.

## Actionable finding

**P2 — Preserve available app-owned amounts when sales coverage is unavailable.**

Specification §4.5 requires: “Exported figures must reconcile with the corresponding UI/report version.” §5.3 states: “Each metric carries its own evidence status.”

`src/reports/export.ts:60` replaces every summary value with null whenever sales coverage is unavailable, including independently available expense and payment amounts. `src/ui/overview/MonthlyOverview.tsx:12,26` correctly displays those amounts using their own evidence.

Reproduced through the real store, expense importer, report service and workbook reader: import `businessPackage()` (September 2025), import a synthetic TRY 50 expense incurred 15 October and paid 16 October, then open/export October. The saved report has sales coverage `unavailable`, operating-expense coverage `available`, expense `50` and payments `50`; Excel’s `Faaliyet gideri` and `Ödemeler` cells are both blank. Sales and profit should remain unavailable, while the supplied expense/payment values must survive export. Existing unavailable-month coverage tests contain no supplied expenses, so they miss this mismatch. The implementation owner is addressing this finding separately.

## Scope and remaining gates

No additional concrete requirement violation or scope creep identified. Accepted output/evidence are retained independently of current calculations; revision comparisons retain source, expense and method changes. Estimate/completeness caveats remain visible, and saving does not promote estimates to verified profit.

Windows packaging, lifecycle, cancellation latency, full-volume responsiveness and A03/A07 acceptance remain open as explicitly requested. Historical source semantics and real-data acceptance remain unverified; synthetic/macOS evidence does not close those gates.

## Resolution

**Resolved in `c5e460f`, regression `c104339`.** The export now applies source coverage only to source-derived metrics. Independently recorded expenses/payments retain their values; unavailable sales and profit remain unavailable. Narrow re-review inspected both commits and reran `npm run test:integration -- tests/integration/excel-report.test.ts`: four tests passed on macOS/Node 24.15.0. The original review baseline above is unchanged. No outstanding finding remains from this specification review; reserved acceptance gates stay open.
