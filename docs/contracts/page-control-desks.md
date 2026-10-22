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

Each workspace inherited the overview's white background, cobalt actions, Manrope typography, separators, responsive layout and evidence hierarchy. Production 3D scenes, fallback controls and duplicate explanatory panels are removed. Ordinary HTML controls retain the tasks. Expense navigation preserves previews, duplicate decisions and review drafts. Source and calculation evidence remains available through native disclosures. Settings retains its existing composition with shorter supporting copy. The white-background and cobalt description is historical; the current look is the market ledger described below.

The financial path consumes existing SalesView, PurchasingView, ExpensePeriod and MonthlyDisplay/ReportSummary outputs without recalculating financial values. The source-data path keeps recorded row counts and source fields separate from validated sales/cost/profit. It cannot synthesize product names, suppliers or financial totals. Source Reports can read and export saved versions but cannot create a financial report from unverified source rows.

## Shared month and dedicated details

One validated selected month follows all five pages and persists across restart. First use selects the latest actual dated record in the active dataset. A saved unavailable month remains selected. Loading or failure never puts old figures beneath a new month. Financial sessions and recorded package hashes remain pinned; replacing a source cannot reuse old detail by record ID alone.

Each page shows its title, month and compact data status. Product, transaction and invoice details use the content area, a visible location, the active parent sidebar destination and a labelled back control. Returning restores the originating search, filters, page, table scroll, window scroll and focus. Archived detail shows its saved month and source rather than the editable working-month control. Its return restores the originating archive context.

Technical IDs, status codes and calculation evidence start collapsed under `Veri ve hesaplama ayrıntıları`. Missing cost, excluded returns, unknown amounts, unverified estimates and incomplete expenses remain beside the affected number (superseded for the estimate edition by one page trust chip; see [Profit-first estimate edition](#profit-first-estimate-edition-2026-10-22)). Giderler has one entry for manual expense entry and one for spreadsheet import. Its draft and locked-operation guard applies before month, mode and page changes. An unavailable source month does not disable app-owned expenses or saved report history.

Invoice browsing lists retained supported invoice representations, including empty and unsupported documents, with their available lines. Missing serial, supplier and recorded header total remain explicit. Line totals cannot replace header totals. Linked dispatches keep their actual dates and do not double-count purchasing. Recorded mode uses only its existing allowlist and preserves currency and historical document-type qualifications.

For [v0.5's Mac demo](../superpowers/plans/2026-10-09-v0.5-demo.md), confirmed on 2026-10-09, imported source records automatically select the workspace. Settings describes the active source without a financial/source choice. Prepared estimate packages supply the concise unverified estimate in Özet, product lookup and recorded-document drilldown in Satışlar, and the same source/month estimate and export in Raporlar. Recorded-only packages automatically lead with existing record counts and lookup; Reports explains unavailable estimates and their prepared-package requirement. Validated source format in the workspace response governs this capability without a mode selector. Historical financial reports occupy an explicit archive destination with their own saved context. Purchasing and expenses retain their existing contracts. Empty imported sources keep their identity and default to the declared extraction end month; an absence of rows cannot select unrelated financial data. Other Settings controls retain their existing composition.

Acceptance requires packaged desktop checks for current workflows, wide/narrow screenshots, keyboard navigation, draft preservation and financial/source evidence. No production workspace requires WebGL. Local macOS evidence does not close Windows A07 acceptance. No new dependencies, source connections, schema changes or financial calculation changes are required. Historical prototype tooling remains separate from the shipped application.

## Source document reading layout

The October 4, 2026 document-detail refinement groups identity and date, currency, and recorded amounts above a full-width line table. Issue 72 now starts technical status and currency codes collapsed under `Veri ve hesaplama ayrıntıları`, while the actual currency and amount qualifications remain visible. It applies to the shared sales and purchasing source detail. The summary reflows into fewer columns in small windows. The page owns vertical scrolling; a keyboard-focusable table region owns horizontal scrolling.

The primary display retains every nonzero decimal digit and uses Turkish grouping. It removes only trailing decimal zeros. The native "Tam kaynak değerlerini göster" checkbox reveals each exact source string beneath its corresponding value, including source timestamps and quantity precision. Null remains distinct from zero. Every projected header field, existing line column and conditional cost-candidate column remains available. Recorded amounts retain their unverified labels. This presentation does not change source queries, source access, calculations, stored records or report versions.

[Packaged verification and synthetic screenshots](../evidence/source-document-layout.md) record the local evidence. Windows acceptance remains open.

## Chart-led pages (2026-10-13)

On 2026-10-13 the user reported that the graphs were basic and hard to read and asked for a more visual UI with fewer confusing text sections, toward v1. The seven missing source-evidence items stay unavailable, so validated real profit and operating profit remain gated. This presentation update leads each page with charts and condenses the caveats. It does not change calculations or evidence rules.

This direction relaxes the 2026-09-29 limit of three graphs in [monthly product profit](monthly-product-profit.md) to **at most three graphs per page**. Every graph keeps the existing rules: it uses the same pinned report or source/month estimate, stays independent of table search, sort, pagination and selection, draws unknown, missing-cost and out-of-coverage values as visible gaps or hatched unknown marks (never as zero), and has an exact numeric table alternative.

Shared SVG primitives in `src/ui/charts` replace the duplicated per-site bar code. They have no new dependency, no canvas and no WebGL. Each plot has an accessible name and keyboard and hover values. Colour never carries meaning alone. Series colours are validated for colour-vision deficiency and contrast. Displayed amounts come only from service strings through the existing formatters. The renderer converts strings to numbers only for geometry.

Each page shows the unverified-estimate state once, as a compact `Doğrulanmamış tahmin` badge. The badge discloses the estimate's limits. Returns, unknown amounts, coverage and incomplete expenses still stay beside the affected number. (This badge and the beside-the-number rule are superseded for the estimate edition; see [Profit-first estimate edition](#profit-first-estimate-edition-2026-10-22).) Technical evidence remains under `Veri ve hesaplama ayrıntıları`.

## Profit-first estimate edition (2026-10-22)

The project owner approved the [profit-first estimate edition](../decisions/issue-98-profit-first-estimate-edition.md) on 2026-10-22 ([issue 98](https://github.com/AlesSystems/esmer-market-analytics/issues/98), [plan 111](https://github.com/AlesSystems/esmer-market-analytics/issues/111)). For the estimate edition it supersedes the caveat rules above: the issue 72 rule that caveats stay beside the affected number, and the 2026-10-13 `Doğrulanmamış tahmin` badge. Earlier text remains as history.

**Wording.** Primary screens use *Satış*, *Tahmini brüt kâr*, *Marj* and *Tahmini net kâr*, as defined in [calculations](calculations.md#separate-recorded-source-estimates) and [recorded estimates](recorded-estimates.md). *Katkı*, *aday*, *kapsanan* and source codes such as `FIS_TURU` or column names do not appear on primary screens. They may remain under `Veri ve hesaplama ayrıntıları`, in Rapor method details and export, and in internal identifiers.

**One trust chip per page.** Each page shows exactly one trust chip, for example `Tahmini kâr · maliyeti bilinen satış %98,3`, where the percentage is the existing cost-coverage percentage. It opens a short explanation: estimate basis, excluded costs, returns not netted out of kâr, and unknown amounts. Detailed exclusion reasons and counts move to Rapor. No per-number caveats appear on primary screens. The estimate is never labelled verified or `Güvenilir`.

**Rendering rules kept.** Null and unknown values are never shown or drawn as zero; unknowns appear as gaps or hatched marks. Valid zero and losses stay distinct. Every chart has a numeric table alternative. Each page has at most three graphs. The renderer does no financial arithmetic and displays only service strings through the existing formatters.

**Visual freeze.** Keep the current market-ledger look: green rail, paper and Manrope, as in [DESIGN.md "Owner workspace revision (2026-10-19)"](../../DESIGN.md). No new visual system is introduced before v1 ships.

**Windows acceptance.** For v1, Windows acceptance is the single deferred Windows smoke test in [issue 109](https://github.com/AlesSystems/esmer-market-analytics/issues/109).
