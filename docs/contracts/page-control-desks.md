# Business pages in the overview visual system

The user approved the recommended prototypes on 2026-10-03. Later that day, the user requested v1 verification, simpler components and text, and removal of decorative 3D elements. This presentation update covers plan tasks 5.2, 6.1–6.2, 7.1–7.2 and 8.1–8.2. Existing data and mutation contracts remain authoritative.

On 2026-10-06 the user approved [issue 72's plan and representative UI](../superpowers/plans/2026-10-06-issue-72-simplification.md). The following first views supersede the October 3 compositions. Existing calculation, evidence, expense and immutable-report contracts still govern their behavior.

| Page | Composition | Task |
|---|---|---|
| Özet | Concise monthly summary and product highlights | Understand sales, comparable change, available gross estimate and recorded expenses |
| Satışlar | Sales summary and searchable products | Find a product and follow category/transaction/document evidence |
| Alışlar ve maliyet | Purchase summary, recent purchases and invoices | Browse retained invoices and lines; reach returns, replacement cost, stock/waste and coverage |
| Giderler | Records and plain task navigation | Read records, preserve Excel previews, review period completeness |
| Raporlar | Selected month's report with history and export | Inspect the monthly result, then open immutable versions and comparisons |

Each workspace inherits the overview's white background, cobalt actions, Manrope typography, separators, responsive layout and evidence hierarchy. Production 3D scenes, fallback controls and duplicate explanatory panels are removed. Ordinary HTML controls retain the tasks. Expense navigation preserves previews, duplicate decisions and review drafts. Source and calculation evidence remains available through native disclosures. Settings retains its existing composition with shorter supporting copy.

The financial path consumes existing SalesView, PurchasingView, ExpensePeriod and MonthlyDisplay/ReportSummary outputs without recalculating financial values. The source-data path keeps recorded row counts and source fields separate from validated sales/cost/profit. It cannot synthesize product names, suppliers or financial totals. Source Reports can read and export saved versions but cannot create a financial report from unverified source rows.

## Shared month and dedicated details

One validated selected month follows all five pages and persists across restart. First use selects the latest actual dated record in the active dataset. A saved unavailable month remains selected. Loading or failure never puts old figures beneath a new month. Financial sessions and recorded package hashes remain pinned; replacing a source cannot reuse old detail by record ID alone.

Each page shows its title, month and compact data status. Product, transaction and invoice details use the content area, a visible location, the active parent sidebar destination and a labelled back control. Returning restores the originating search, filters, page, table scroll, window scroll and focus. Archived detail shows its saved month and source rather than the editable working-month control. Its return restores the originating archive context.

Technical IDs, status codes and calculation evidence start collapsed under `Veri ve hesaplama ayrıntıları`. Missing cost, excluded returns, unknown amounts, unverified estimates and incomplete expenses remain beside the affected number. Giderler has one entry for manual expense entry and one for spreadsheet import. Its draft and locked-operation guard applies before month, mode and page changes. An unavailable source month does not disable app-owned expenses or saved report history.

Invoice browsing lists retained supported invoice representations, including empty and unsupported documents, with their available lines. Missing serial, supplier and recorded header total remain explicit. Line totals cannot replace header totals. Linked dispatches keep their actual dates and do not double-count purchasing. Recorded mode uses only its existing allowlist and preserves currency and historical document-type qualifications.

For [v0.5's Mac demo](../superpowers/plans/2026-10-09-v0.5-demo.md), confirmed on 2026-10-09, imported source records automatically select the workspace. Settings describes the active source without a financial/source choice. Prepared estimate packages supply the concise unverified estimate in Özet, product lookup and recorded-document drilldown in Satışlar, and the same source/month estimate and export in Raporlar. Recorded-only packages automatically lead with existing record counts and lookup; Reports explains unavailable estimates and their prepared-package requirement. Validated source format in the workspace response governs this capability without a mode selector. Historical financial reports occupy an explicit archive destination with their own saved context. Purchasing and expenses retain their existing contracts. Empty imported sources keep their identity and default to the declared extraction end month; an absence of rows cannot select unrelated financial data. Other Settings controls retain their existing composition.

Acceptance requires packaged desktop checks for current workflows, wide/narrow screenshots, keyboard navigation, draft preservation and financial/source evidence. No production workspace requires WebGL. Local macOS evidence does not close Windows A07 acceptance. No new dependencies, source connections, schema changes or financial calculation changes are required. Historical prototype tooling remains separate from the shipped application.

## Source document reading layout

The October 4, 2026 document-detail refinement groups identity and date, currency, and recorded amounts above a full-width line table. Issue 72 now starts technical status and currency codes collapsed under `Veri ve hesaplama ayrıntıları`, while the actual currency and amount qualifications remain visible. It applies to the shared sales and purchasing source detail. The summary reflows into fewer columns in small windows. The page owns vertical scrolling; a keyboard-focusable table region owns horizontal scrolling.

The primary display retains every nonzero decimal digit and uses Turkish grouping. It removes only trailing decimal zeros. The native "Tam kaynak değerlerini göster" checkbox reveals each exact source string beneath its corresponding value, including source timestamps and quantity precision. Null remains distinct from zero. Every projected header field, existing line column and conditional cost-candidate column remains available. Recorded amounts retain their unverified labels. This presentation does not change source queries, source access, calculations, stored records or report versions.

[Packaged verification and synthetic screenshots](../evidence/source-document-layout.md) record the local evidence. Windows acceptance remains open.
