# R42 candidate B. Adapt the monthly overview

## Problem

The owner needs monthly estimated gross profit, product contributions and original evidence on one scrolling page. Grounded at `625661b29108e053cbfabc7f72613e88169c23d6` in the supplied worktree. This is a synthetic UI design, not source approval or Windows acceptance. Ground, sketch and trace completed; synthesis belongs to the coordinator; implementation and scrap phases are deferred.

## Usage

Keep both existing callers. The format discriminant selects sections inside `MonthlyOverview`, so saved reports and the live candidate share the same presentation.

```tsx
// MonthlyWorkspace, after the coherent monthly response.
<MonthlyOverview report={report} refresh={refresh} onSales={onSales}
  onExpenses={onExpenses} onPurchasing={onPurchasing} />
// ReportVersions, after reading immutable selected output.
<MonthlyOverview key={selected.id} report={selected}
  refresh={() => setSelected(candidate)} />
// Inside MonthlyOverview, only for v2.
<ProductContributions key={report.id} report={report} />
```

## Shape

Retain `MonthlyOverview` as the one main landmark and section composer. For v2, adapt the existing financial ledger into the first gross-profit answer, replace its daily net-sales chart with daily gross profit, then place `ProductContributions` immediately below. Move existing net-sales/basket, expenses and general evidence into supporting sections below product detail. For v1, retain existing ordering and meanings. No concatenated full purchasing or sales page enters the primary flow.

One new focused component owns product table and selected detail, including bounded requests. It hides loading, paging, selection and focus without adding a generic data hook or another complete page, per Laziness Protocol. Reuse `PageControls`, formatters, buttons, and the existing `ReportEvidence` request-key pattern. Keep IPC validation in existing desktop request guards, per Boundary Discipline.

```ts
type V2 = Extract<MonthlyDisplay, { format: "monthly-report-v2" }>;
type Product = ReportProductsPage["rows"][number];
type Selection = { product: Product; documentId: string | null } | null;
function ProductContributions(props: { report: V2 }): ReactNode;
// Local state: search, sort, direction, offset, selection, evidenceOffset.
// Load products with readReportProducts({reportId, search, sort, direction, offset}).
// Load selected lines with readReportEvidence({section:"product-profit",
//   reportId, productId, offset:evidenceOffset, search:"", range:"current",
//   documentId:null}). Both endpoints fix pages at 100.
```

Request identity includes report ID, section, product/document ID, search, sorting, offset and attempt. Cleanup invalidates pending requests; response report/section/product/offset must match. Month/new report resets the keyed component. Search/sort resets table offset but preserves selection. If selected product is absent from the shown page, label that fact precisely; do not infer absence from the entire matched set. A separate selected-ID search can establish the contract's hidden-by-search notice without fetching all rows.

Selecting a product preserves table scroll; after evidence loads, focus its heading. Return restores its row button when present, otherwise the table heading. Document expansion fetches all pinned document lines using section `lines`, paged at 100; mark selected-product matches. Retain distinct scope amounts and recorded document totals, without renderer money calculations. Original-sale references remain visible even outside the month.

Use one daily chart initially, within the approved maximum of three. It consumes only `report.productProfit.daily`, with zero baseline, signed values, null gaps and exact table alternative. Table search/sort/page/selection never changes it or summary. Additional product/coverage charts need independent unfiltered bounded data, not current table rows.

Null is unavailable; complete empty days are zero; genuine zero/loss remain numeric. Show covered scope, exclusions and synthetic/cutoff warnings beside values. Retry failures locally. Stale reports remain pinned until explicit refresh. Save/export always uses selected `report.id` through existing version operations.

## Tradeoffs and alternative

Accept a few v1/v2 section branches to preserve shared callers. A dedicated v2 page hides composition better if layouts diverge substantially, but duplicates status, evidence and saved-report integration today. Switch only if conditional sections become interleaved and hard to maintain. Synthesis pending; candidate A was not read.

## Trace, risks and next check

Trace `SalesWorkspace:116` → `MonthlyWorkspace:8` → `MonthlyOverview:14`; saved selection enters through `ReportVersions:70`. `display.ts` supplies compact v2 summary and named bounded product/evidence operations; `ReportEvidence.useEvidence` already rejects obsolete responses.

First expose packaged E02/E03 journey, search/paging invariance, rapid month/product response races, document pagination, focus/200% zoom, v1 reopening and pinned export. Extend monthly-overview, unavailable-states, report-pagination/version tests; retain secondary source/import/expense/recovery checks. No tests run for this design. Main risk is duplicating headline meanings while retaining supporting sections. Implementation waits for R47 integration and candidate selection. User performs Windows checks.
