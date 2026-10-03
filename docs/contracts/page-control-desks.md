# Four workspaces in the overview visual system

The user approved the recommended prototypes on 2026-10-03. Later that day, the user requested v1 verification, simpler components and text, and removal of decorative 3D elements. This presentation update covers plan tasks 5.2, 6.1–6.2, 7.1–7.2 and 8.1–8.2. Existing data and mutation contracts remain authoritative.

| Page | Composition | Task |
|---|---|---|
| Satışlar | Sales desk | Read daily activity and follow category/product/document evidence |
| Alışlar ve maliyet | Coverage inspection | Select actual coverage exceptions and source evidence |
| Giderler | Records and plain task navigation | Read records, preserve Excel previews, review period completeness |
| Raporlar | Version list and selected inspector | Find a version and inspect/export its immutable report |

Each workspace inherits the overview's white background, cobalt actions, Manrope typography, separators, responsive layout and evidence hierarchy. Production 3D scenes, fallback controls and duplicate explanatory panels are removed. Ordinary HTML controls retain the tasks. Expense navigation preserves previews, duplicate decisions and review drafts. Source and calculation evidence remains available through native disclosures. Settings retains its existing composition with shorter supporting copy.

The financial path consumes existing SalesView, PurchasingView, ExpensePeriod and MonthlyDisplay/ReportSummary outputs without recalculating financial values. The source-data path keeps recorded row counts and source fields separate from validated sales/cost/profit. It cannot synthesize product names, suppliers or financial totals. Source Reports can read and export saved versions but cannot create a financial report from unverified source rows.

Acceptance requires packaged desktop checks for current workflows, wide/narrow screenshots, keyboard navigation, draft preservation and financial/source evidence. No production workspace requires WebGL. Local macOS evidence does not close Windows A07 acceptance. No new dependencies, source connections, schema changes or financial calculation changes are required. Historical prototype tooling remains separate from the shipped application.
