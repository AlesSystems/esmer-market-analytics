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

Help the owner understand sales, changes over time, purchasing costs, supplier returns and expenses, with a path from each reported figure to its supporting records and limitations. The application is a private gift and management-analysis tool, not a POS replacement or statutory accounting, payroll or tax-filing system.

## Operating Context

- All dashboards read a local analytics store and remain usable offline.
- The first release uses prepared analytics packages from authorized backup preparation. It must not require the owner to restore or administer the POS database.
- Source access is permanently read-only; live access is disabled for the first release. Later live integration requires separate acceptance and authorization.
- Historical data must show its actual cutoff rather than appear to describe current activity.
- Spreadsheet import is the primary expense-entry workflow. A reveal without expense data must still offer useful sales analysis.
- Do not contact the owner, connect to production or install on his computer as a development side effect.

## Capabilities and Constraints

- Turkish-only interface, Turkish presentation conventions, English internal identifiers and TRY only. Do not infer tax rules from another jurisdiction.
- Phase 5 covers sales calculations and the first usable sales interface: period summary, category/product breakdown, transactions and source-line evidence, with previous-period/year comparisons.
- Historical cost estimates, purchasing and supplier returns follow in Phase 6; expenses and corrections in Phase 7; the complete monthly overview, report-revision experience and Excel export in Phase 8.
- The first-release main surface is `Aylık Market Özeti`. Sales, costs, expenses and profitability share one consistent reporting path.
- Keep customer returns distinct from supplier returns and pre-completion voids. Preserve quantity units; do not combine kilograms and pieces into a misleading physical-volume total.
- Historical last-purchase cost is an explicitly labelled estimate, separate from current replacement cost. Missing or unresolved values remain unavailable rather than zero.
- Profitability requires the prescribed cost and expense coverage. Without sufficient expense evidence, show `Faaliyet kârı hesaplanamıyor — gider verileri eksik.`
- Every released metric needs traceable source identities, import batch, cutoff, calculation version, coverage, confidence and applicable adjustments. Drill-down must preserve its report context during refresh.
- Source refreshes preserve app-owned records and accepted reports. Failed imports retain the last valid dataset; accepted report versions cannot change silently.
- Excel export and encrypted recoverable local backups are first-release requirements. PDF export, forecasts/AI, multi-store, multi-currency and customer analytics are excluded.
- Identifiable customer information and employee-level payroll must not enter the analytics product, fixtures, logs, screenshots or release artifacts. Only aggregated labour cost is in scope.

## Brand Commitments

Esmer Market is the established product/store identity. Product language is Turkish. No additional visual direction is confirmed by this document; the existing shell is implementation evidence, not approval of the eventual sales-page design.

## Evidence on Hand

The following remain authoritative; this product record summarizes them and does not replace their requirements or certify acceptance:

- [Foundation specification](docs/superpowers/specs/2026-09-04-esmer-market-rebuild-design.md).
- [Historical source audit and limitations](docs/superpowers/specs/2026-09-04-esmer-market-rebuild-audit.md).
- [Acceptance checklist](docs/superpowers/specs/2026-09-04-esmer-market-rebuild-acceptance.md).
- [Phased implementation plan](docs/superpowers/plans/esmer-market-implementation-plan.md).

The existing React shell provides startup, empty and local-service failure presentation. It does not yet establish the sales workspace. Use synthetic or approved reduced fixtures for design; label synthetic demonstrations clearly. Historical audit observations do not authorize renewed source inspection or resolve all source semantics.

## Product Principles

- Make financial meaning and evidence understandable alongside the number.
- Preserve uncertainty: distinguish reconciled, estimated and unavailable metrics.
- Let the owner move from a monthly summary to the records explaining it.
- Preserve local data and reproducible history through imports and revisions.
- Deliver one focused offline application for one owner and store.

## Accessibility & Inclusion

Support keyboard navigation, readable Turkish text, explicit unit labels and Turkish date/number formatting. Loading, empty, stale, partial, warning and failure states must remain understandable. Imports and calculations must keep navigation responsive. The ordinary dashboard/drill-down target is below two seconds on documented Windows hardware with the full dataset; it requires measurement.

## Open Product Questions

- Owner-specific display size, scaling, eyesight or input needs have not been established.

## Related Design Decisions

The confirmed high-level Phase 5 view hierarchy and navigation are recorded in the [sales UI design brief](docs/superpowers/specs/2026-09-18-phase-5-sales-ui-design.md). Detailed visual styling remains future work.
