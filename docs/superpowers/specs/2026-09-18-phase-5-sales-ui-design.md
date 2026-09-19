# Phase 5 sales UI design

Status: High-level design interview completed on 2026-09-19. The user confirmed the workspace and each of the five view designs below. On 2026-09-19, the user selected Option A from the clickable prototype. The selected layout and current palette are recorded below; the user authorized Phase 5 implementation on 2026-09-19, stopping before Windows validation for a PR and agent handoff.

Scope: A brief design for each Phase 5 sales view, supporting [issue #8](https://github.com/AlesSystems/esmer-market-analytics/issues/8) and [Phase 5 of the implementation plan](../plans/esmer-market-implementation-plan.md#phase-5--sales-analytics-and-traceability). [Product context](../../../PRODUCT.md) summarizes the governing foundation requirements.

## Confirmed: workspace and navigation

- Use one sales workspace, starting at the monthly sales overview.
- Category/product breakdowns and transaction lists occupy the main content area as the user drills down.
- Open transaction details and source evidence in a side panel.
- Keep the selected month and filter context visible through the journey. Preserve that context when navigating back.
- Provide a clear route through overview → category/product → transactions → transaction details/source evidence.

## Confirmed: sales overview — Satış Özeti

- Show net sales, completed sale-document count and average basket across the top, with previous-month and previous-year comparisons.
- Below the summary, show a daily net-sales trend and category breakdown as entry points into the supporting records.
- Keep the source-data cutoff and relevant warnings visible. Show actual comparison boundaries and flag partial or missing comparative coverage.
- Present quantities separately by unit; do not combine kilograms and pieces into one volume figure.
- Use the report's metric definitions and evidence statuses consistently across the summary and drill-downs.

## Confirmed: category/product breakdown — Kategori / Ürün Detayı

- Start with categories ordered by net sales, showing net sales amount, share of sales and period change.
- Selecting a category shows its products with quantities separated by unit. Selecting a product opens the matching transactions.
- Provide direct product search so the owner can reach a known item without navigating through categories first.
- Preserve the selected period and filter context throughout the drill-down; retain coverage warnings for comparisons.

## Confirmed: transaction list — İşlemler

- Show sales and customer returns in one list, newest first, with a `Tümü / Satışlar / Müşteri iadeleri` filter.
- Show date, stable document ID, transaction type, net-sales contribution and any relevant warning.
- Identify customer returns explicitly as `Müşteri iadesi` and display their signed contribution to net sales; do not rely on color alone.
- When entered from a category or product, show the contribution of matching lines, clearly labelled for the selected scope. Do not substitute the whole document total for that contribution.
- Selecting a transaction opens its full document in the detail panel while preserving the list's period and filters.

## Confirmed: transaction detail — İşlem Detayı

- Use a receipt-style side panel, with document date, stable ID and transaction type at the top alongside net, recorded KDV and gross totals.
- Show all document lines below, including product, quantity/unit, discount and amounts.
- Highlight lines matching the selected category/product and distinguish their subtotal from the full document total.
- Keep reconciliation discrepancies visible rather than hiding them inside source evidence.
- Provide `Kaynak detayını göster` for each line to reach its supporting evidence.

## Confirmed: source evidence — Kaynak Detayı

- Lead with a plain-language explanation of how the selected line contributes to the number, its evidence status and any exclusion or discrepancy.
- Keep source document/line IDs, import batch, cutoff and calculation method/version visible in a compact provenance section.
- Put additional technical fields behind `Teknik ayrıntılar`; show only approved, privacy-safe evidence rather than raw source records.
- Use the same side panel with a back link to the transaction, preserving the report context.

## Required states and safeguards

These requirements carry forward the foundation specification and acceptance checklist; they are not additional product features introduced by the interview.

| State | Required presentation |
| --- | --- |
| No imported data | Explain that no dataset has been imported; do not invent financial values. |
| No matching records | Distinguish an empty selection from missing source coverage. Missing data is not zero activity. |
| Loading | Indicate work in progress and keep navigation responsive. |
| Failure | Show a useful Turkish error; retain the last valid dataset after a failed import. |
| Historical/stale data | Keep the actual cutoff and last successful import visible; do not label backup data as live activity. |
| Partial period or unavailable comparison | Show actual coverage and comparison boundaries; do not imply a full-period or like-for-like comparison without evidence. |
| Excluded or unresolved records | Show the reason and affected population; do not silently assign financial meaning. |
| Reconciliation discrepancy | Keep differences visible in the relevant breakdown/detail; do not grant source-reconciled status to unexplained differences. |
| Refresh during navigation | Keep the summary, lists and evidence on the same pinned report context; never mix dataset or calculation versions. |

Use Turkish text and formatting, TRY amounts, explicit unit labels and keyboard-accessible controls. Evidence status must not rely on color alone. Financial definitions remain governed by the foundation requirements; the interface consumes report results rather than calculating its own totals.

## Selected design — 2026-09-19

The user chose **Option A — Dengeli özet**, saying “Option A is best.” Use this composition as the Phase 5 implementation design baseline:

- A horizontal strip of three summary metrics above a daily-sales trend and category table, arranged side by side on wide windows.
- The confirmed overview → category/product → transactions → receipt → source-evidence journey, with receipt and evidence sharing the detail panel and preserving report context.
- The current brighter palette: blue actions/navigation and trend, green net-sales emphasis and gains, restrained red for decreases/returns and brand/category accents. White surfaces, a pale cool canvas and subtle shadows provide the requested shine. Signed values and labels carry meaning independently of color; discrepancies remain amber.

Reference: prototype commit `227ea94` on `codex/phase-5-ui-prototype`, [Option A capture](https://github.com/AlesSystems/esmer-market-analytics/blob/227ea94/.impeccable/review/palette-desktop-a.png), and [design tokens and component notes](https://github.com/AlesSystems/esmer-market-analytics/blob/02d0550/DESIGN.md). Options B and C remain historical alternatives, not implementation targets.

## Implementation boundary

The selected design settles the overall composition and carries forward the requested palette. Exact typography, spacing, table widths and responsive behavior can be refined during implementation; verify the intended Windows display and scaling. The prototype remains a synthetic, throwaway reference: implement against real report contracts rather than promoting its fixture logic or development controls.

Production implementation and Windows acceptance remain outstanding. Purchasing, cost/profit estimates, expenses, report-revision review and Excel export remain in their planned later phases.
