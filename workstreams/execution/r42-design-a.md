# R42 candidate A

## Problem and traced flow

Read-only design grounded at `625661b29108e053cbfabc7f72613e88169c23d6` on `codex/product-profit-reports`. Ground/sketch complete; agree, implementation and redesign wait for R47 merge and coordinator selection. Poteto wrapper, adapter, bundled architect/runner/rationale and how were read. Nested exploration and source scaffolding are skipped within assigned scope.

`SalesWorkspace` owns month, pinned context, navigation, import/recovery and freshness. `MonthlyWorkspace` queries that context and rejects cancelled effects, then renders `MonthlyOverview` or `ReportVersions`. Both current and saved views reach `MonthlyOverview`; saved export uses `selected.id`. `monthlyDisplay` discriminates v1/v2, sends summary and ≤31 days, withholding full products/lines. `readReportProducts` sorts the complete matching population before slicing 100 rows. `readReportEvidence` supplies bounded pinned product-cost lines and source document/line pages. Existing `ReportEvidence` excludes product-profit in its hook and lazily opens purchasing.

## Usage (caller's view)

```tsx
// Existing candidate caller and saved-version caller remain unchanged.
<MonthlyOverview report={report} refresh={refresh} onExpenses={onExpenses} />
<MonthlyOverview key={selected.id} report={selected} refresh={reopenCandidate} />
// Dispatch inside MonthlyOverview before v1 hook-bearing implementation.
return report.format === "monthly-report-v2"
  ? <MonthlyProfitPage key={report.id} report={report} embedded={embedded}
      refresh={refresh} onSales={onSales} onExpenses={onExpenses}
      onPurchasing={onPurchasing} />
  : <LegacyMonthlyOverview {...props} />;
```

## Shape

One focused `overview/MonthlyProfitPage.tsx` owns v2 interaction. Keep v1 body in the existing file as a local function. Public props expose only report, embedding and existing navigation actions; transport and asynchronous state remain inside. Reuse formatters, Button/Input, PageControls, warning labels and expandable ReportEvidence. Extract only the document evidence section needed for controlled document selection, preserving its existing caller.

```ts
type V2 = Extract<MonthlyDisplay, { format: "monthly-report-v2" }>;
type Product = ReportProductsPage["rows"][number];
type Query = Pick<ReportProductsRequest, "search" | "sort" | "direction" | "offset">;
type Selection = { product: Product; documentId: string | null; evidenceOffset: number } | null;
type Load<T> = { key: string; value: T }; // display only if key equals current request
function MonthlyProfitPage(props: ExistingOverviewProps & { report: V2 }): JSX.Element;
// Bodies intentionally not implemented. No financial calculations in React.
```

Arrange compact pinned status, gross summary, daily trend, bounded product table, selected product/component-cost evidence, then secondary operating/method evidence. One main landmark; embedded mode uses section. No second month selector or concatenated purchasing/sales page.

Key requests by reportId plus every query/selection parameter and retry generation. Clear loading/error state on key change; cleanup rejects late promises and echoed report/offset/section/product must match. Report-key remount resets search, default profit-desc sort, page and selection. Search/sort reset page only, retaining selected row data. Mark a selection hidden by search explicitly; never overwrite it with a same-name product. Detail loads only after selection; document evidence only after opening, each ≤100.

Preserve table scroll. Save opener ref; after successful selection focus detail heading. Return restores connected opener or table heading, without requerying summary. Document close returns to its opener. Failed loads retain selection and offer local retry, with no old response shown under new identity.

## Charts and truthful states

Ship daily profit and optional summary coverage chart, both report-wide. Product chart is deferred because no bounded global series exists; table pages must never supply chart data. Daily zero baseline, signed bars, null gaps and numerical table reuse current SVG pattern. Prepare display-only geometry beside `monthlyDisplay` using existing Exact arithmetic; React consumes geometry and exact strings, without aggregation or financial arithmetic.

Use contract state text for empty, unsupported, no cost, partial and historical data. Keep exclusions/exposure beside affected amounts, null as unavailable, complete empty days zero, unsupported days gaps. Stale pinned reports stay visible until explicit reopen. Local failure never becomes zero; offline local data needs no source connection. Save/export continues selecting the complete pinned report, independent of table state.

## Alternatives, tradeoffs and synthesis

Integrated alternative adds v2 branches/table state to MonthlyOverview and product filtering to ReportEvidence. It saves one file but exposes v1/v2 lifecycle complexity in an already broad component. Candidate A accepts one focused component for a smaller format-dispatch interface. Synthesis remains coordinator-owned.

## Risks and next step

Can originalSaleLineId be resolved outside the month without unbounded scanning? Current evidence requires documentId; show stored attribution reference honestly until a bounded existing-operation extension resolves it. Can geometry remain ephemeral rather than altering accepted artifacts? Yes, proposed in display projection only.

After selection/R47, first expose packaged one-page journey, 101-row paging, late responses, search-invariant summary/chart, partial loss/gaps, document scope, focus return, saved v1 and export pinning in existing desktop suites. Run unit/integration, typecheck, lint, build and packaged desktop checks; synthetic Mac evidence leaves user-run Windows/full-volume gates open.
