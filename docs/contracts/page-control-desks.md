# Four workspaces in the overview visual system

The user approved the recommended prototypes on 2026-10-03 and requested one merged PR per page. This contract implements plan tasks 5.2, 6.1–6.2, 7.1–7.2 and 8.1–8.2 as a presentation update. Existing data and mutation contracts remain authoritative.

| Page | Approved composition | Distinct object | Task |
|---|---|---|---|
| Satışlar | A, sales desk | Folded receipt | Read daily activity and follow category/product/document evidence |
| Alışlar ve maliyet | C, coverage inspection | Inspection lens and evidence tray | Select actual coverage exceptions and source evidence |
| Giderler | C, finish the month | Standing month folio | Read records, prepare import, review period completeness |
| Raporlar | B, version archive | Upright archive folder | Find a version and inspect/export its immutable report |

Each workspace inherits the overview's white background, cobalt actions, Manrope typography, separators, responsive layout and evidence hierarchy. Settings and the overview keep their existing composition. Each object has a distinct silhouette and page-specific interaction. Geometry never encodes money, percentages or completeness. Ordinary HTML controls expose every scene action. Scene selection never performs an import, expense approval, report acceptance or export.

The financial path consumes existing SalesView, PurchasingView, ExpensePeriod and MonthlyDisplay/ReportSummary outputs without recalculating financial values. The source-data path keeps recorded row counts and source fields separate from validated sales/cost/profit. It cannot synthesize product names, suppliers or financial totals. Source Reports can read and export saved versions but cannot create a financial report from unverified source rows.

Acceptance requires packaged desktop checks for current workflows and added interactions, wide/narrow screenshots, keyboard and reduced-motion behavior, WebGL failure/context-loss recovery, and bounded rendering. Local macOS evidence does not close Windows A07 acceptance. No new dependencies, source connections, schema changes or financial calculation changes are required.
