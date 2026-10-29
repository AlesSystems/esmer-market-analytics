# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

The interface uses React inside an Electron desktop application. The supported delivery target is Windows; this is a local desktop product, not a hosted website. Exact Windows versions, hardware and display constraints require acceptance evidence.

## Stack

Electron, TypeScript, React, a local Node service and SQLite. Financial calculations belong to the local service/domain code, not the renderer. No required paid cloud service or subscription.

## Users

Eralp Esmer, the sole owner-user of one Esmer Market store in the TRNC/KKTC, on one trusted computer. No login, PIN, roles or multi-user workflow.

## Product Purpose

Help the owner understand sales, changes over time, purchasing costs, supplier returns and expenses, with a path from each reported figure to its supporting records and limitations.

v1 is the profit-first estimate edition ([decision record](docs/decisions/issue-98-profit-first-estimate-edition.md), owner decision 2026-10-22, [#98](https://github.com/AlesSystems/esmer-market-analytics/issues/98)). For each month the owner reads Satış, Tahmini brüt kâr and Marj per product, and Tahmini net kâr for the month. The recorded-source estimate is v1's financial truth. Each page discloses its estimated nature once through a trust chip; the trust chip popover, "Nasıl hesaplandı?", Hakkında ve bilinen sınırlar and the source-documents overlay carry the detailed reasons and exclusions. The application is a private gift and management-analysis tool, not a POS replacement or statutory accounting, payroll or tax-filing system.

## Operating Context

Launch opens Bu ay directly; there is no welcome page. Three top tabs, Bu ay, Ürünler and Giderler, replace the earlier sidebar; there is no Rapor page. The header carries the month stepper, Excel'e aktar and the Ayarlar gear. The gear menu holds Veri paketi içe aktar, Yedekle / Geri yükle, Yazı boyutu, Canlı bağlantı, Kaynak belgeler and Hakkında ve bilinen sınırlar; recovery, live connection and source documents open as full-page overlays. Per-product source lines are in the Ürünler drawer. Switching tabs preserves the remembered month and passes through existing expense draft protection. Without any imported data, Bu ay says so in one sentence and offers the package import.

- All dashboards read a local analytics store and remain usable offline.
- The first release uses prepared analytics packages from authorized backup preparation. It must not require the owner to restore or administer the POS database.
- Source access is permanently read-only. The first release does not require a live connection. An isolated test connection can be configured, stays off until enabled, and cannot activate a real financial dataset. Completing live integration still requires separate acceptance and authorization.
- Historical data must show its actual cutoff rather than appear to describe current activity.
- Spreadsheet import remains the primary expense-entry workflow. Manual entry uses the same validation, provenance and history rules. A reveal without expense data must still offer useful sales analysis.
- Do not contact the owner, connect to production or install on his computer as a development side effect.

## Capabilities and Constraints

- Turkish-only interface, Turkish presentation conventions, English internal identifiers and TRY only. Do not infer tax rules from another jurisdiction.
- The application includes sales calculations and the sales workspace. That workspace shows a period summary, a category and product breakdown, transactions and source-line evidence, with previous-period and previous-year comparisons.
- It also includes historical cost estimates, purchasing, supplier returns, expense import and corrections, the monthly overview, report revisions and Excel export. The validated financial pipeline for these paths uses synthetic mappings and stays as it is; v1 does not extend it to real-source data.
- The financial contract is monthly product gross profit before operating expenses, as defined in [monthly product profit](docs/contracts/monthly-product-profit.md). The user approved [issue 72's navigation plan](docs/superpowers/plans/2026-10-06-issue-72-simplification.md) on 2026-10-06. Özet provides a concise monthly summary and product highlights. Satışlar provides sales and a searchable product list. Raporlar holds the detailed monthly report, history and exports. Existing operating-result, purchasing and expense workflows remain accessible. v1's estimate edition adds Tahmini net kâr as defined in [calculations](docs/contracts/calculations.md#separate-recorded-source-estimates).
- One selected month follows the five business pages and persists across restarts. First use selects the latest actual record month in the active dataset. A saved unavailable month stays selected with an explanation. Detail navigation retains the origin's filters, table position and focus, while preserving pinned source and report identities.
- Alışlar ve maliyet includes existing recorded invoice documents and their available lines. Missing invoice numbers, suppliers and header totals remain explicit. Source record IDs are not invoice serials. Invoice browsing preserves linked-document deduplication and adds no attachments or source fields.
- Prepared `sql-backup-estimate-v1` inputs provide v1's profit figures under [recorded-source estimates](docs/contracts/recorded-estimates.md). Cost is the last purchase price on the document date. Imported source records drive one workspace: summary in Özet, product lookup in Satışlar, and detail/export in Raporlar when cost data is present. Primary screens say Satış, Tahmini brüt kâr and Marj; source codes and terms such as *katkı*, *aday* and *kapsanan* stay in method details and internal identifiers. The estimate stays `unverified-estimate` internally and is never presented as verified. Returns are not netted out of kâr; the trust chip says so and its popover gives the details. Recorded-only packages lead with their existing counts and record lookup; Reports explains the missing estimate data. There is no financial/source view selector. These transient estimates do not become accepted financial-report versions. Saved financial reports remain explicitly historical; source-free financial installations retain their existing capabilities.
- Product names, product group/category names and unit codes come read-only from the stock master (owner approval 2026-10-22, [#99](https://github.com/AlesSystems/esmer-market-analytics/issues/99)). Older packages fall back to `Ürün #<ID>`. No supplier or customer columns are read. Unit codes are labels; kg and adet are never summed together.
- Keep customer returns distinct from supplier returns and pre-completion voids. Preserve quantity units; do not combine kilograms and pieces into a misleading physical-volume total.
- Historical last-purchase cost is an explicitly labelled estimate, separate from current replacement cost. Missing, zero, negative or unresolved cost is never treated as zero; those lines stay excluded.
- Product gross profit requires supported sales and historical costs from the same covered population. Missing expenses do not block that gross result. The validated operating result keeps its evidence gate. v1 instead shows Tahmini net kâr = Tahmini brüt kâr − expenses the owner entered and marked complete for that month, under the existing expense classification rules. It inherits the estimate's limits and needs no evidence gate. If the month's expenses are not marked complete, show no net figure and keep `Faaliyet kârı hesaplanamıyor — gider verileri eksik.`
- Financial arithmetic stays deterministic decimal in the service layer; the renderer does no financial arithmetic.
- Out of v1: verified or "trusted" real-source profit (A02/A03 trusted parts) and L01 live sync. They remain post-v1 requirements.
- Every released metric needs traceable source identities, import batch, cutoff, calculation version, coverage, confidence and applicable adjustments. Drill-down must preserve its report context during refresh.
- Source refreshes preserve app-owned records and accepted reports. Failed imports retain the last valid dataset; accepted report versions cannot change silently.
- Excel export and encrypted recoverable local backups are first-release requirements. PDF export, forecasts/AI, multi-store, multi-currency and customer analytics are excluded.
- Identifiable customer information and employee-level payroll must not enter the analytics product, fixtures, logs, screenshots or release artifacts. Only aggregated labour cost is in scope.

## Brand Commitments

Esmer Market is the established product/store identity. Product language is Turkish. Current screen visuals are recorded in [DESIGN.md](DESIGN.md). The owner replaced the earlier market-ledger look on 2026-10-29 (prototype B, three top tabs, clean light palette, one azure accent, Figtree); DESIGN.md records the current world. This product file does not replace that record or the foundation specification.

## Evidence on Hand

The following remain authoritative; this product record summarizes them and does not replace their requirements or certify acceptance:

- [Foundation specification](docs/superpowers/specs/2026-09-04-esmer-market-rebuild-design.md).
- [Historical source audit and limitations](docs/superpowers/specs/2026-09-04-esmer-market-rebuild-audit.md).
- [Acceptance checklist](docs/superpowers/specs/2026-09-04-esmer-market-rebuild-acceptance.md).
- [Original phased implementation plan](docs/superpowers/plans/esmer-market-implementation-plan.md).
- [Current capabilities and evidence](docs/evidence/index.md).

The application includes startup, empty and local-service failure states, plus sales, purchasing, expenses, reports, recovery and a raw source preview. Use synthetic or approved reduced fixtures for design. Label synthetic demonstrations clearly. Historical audit observations do not authorize renewed source inspection or resolve all source semantics.

## Product Principles

- Disclose the estimate once per page with a trust chip; keep detailed evidence and exclusions in the popover, the Hakkında menu and the source-documents overlay.
- Preserve uncertainty: distinguish reconciled, estimated and unavailable metrics.
- Let the owner move from a monthly summary to the records explaining it.
- Preserve local data and reproducible history through imports and revisions.
- Deliver one focused offline application for one owner and store.

## Accessibility & Inclusion

Support keyboard navigation, readable Turkish text, explicit unit labels and Turkish date/number formatting. Loading, empty, stale, partial, warning and failure states must remain understandable. Imports and calculations must keep navigation responsive. For v1 the two-second full-dataset target is dropped unless prepared packages exceed 100,000 rows. Windows checking is one smoke test, deferred to [#109](https://github.com/AlesSystems/esmer-market-analytics/issues/109).

## Open Product Questions

- Owner-specific display size, scaling, eyesight or input needs have not been established.

## Related Design Decisions

The Phase 5 view hierarchy is recorded in the [sales UI design brief](docs/superpowers/specs/2026-09-18-phase-5-sales-ui-design.md). Current visual styling is recorded in [DESIGN.md](DESIGN.md).
