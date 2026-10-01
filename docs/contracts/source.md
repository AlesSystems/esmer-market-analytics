# Source-to-domain contract

## Status and authority

Mapping `source-contract-v1` belongs to [Phase 2, issue #5](https://github.com/AlesSystems/esmer-market-analytics/issues/5), tasks 2.1 and 2.2. It records approved product policy, historical observations and synthetic assumptions separately. The [foundation specification](../superpowers/specs/2026-09-04-esmer-market-rebuild-design.md) and [audit](../superpowers/specs/2026-09-04-esmer-market-rebuild-audit.md) govern the contract.

Phase 2 did not access a source. The authorized [issue 26 OrbStack continuation](../evidence/issue-26-source-validation.md) now records schema and population observations from an isolated copy, plus restricted-account checks. A clean restore, newer backup comparison and approved reduced real fixture remain unavailable. All real-source financial mappings remain unsupported. A reviewed synthetic contract does not confer source-reconciled status.

The executable registry is [src/source/contract.ts](../../src/source/contract.ts). It is declarative and has no source I/O. Its historical dictionary entries are observations, not a complete financial inclusion allowlist. Unknown types and missing essential identities require candidate rejection until explicitly classified.

The [issue 39 source-profit record](../evidence/issue-39-source-profit.md) lists the evidence still missing for a real monthly financial mapping. Its renewed September 2025 raw-row checks and the 2026-10-01 bounded unit/relationship sample establish transport and reader boundaries; they do not release a financial rule.

## Identity and provenance

A source record is identified by source lineage plus source document ID and, for a line, source line ID. IDs remain strings. Snapshot/import identity identifies a version of those records. Same-lineage corrections replace the current candidate representation once; a reset/new lineage never silently reuses another lineage's identities.

`FIS.ID` is record identity in the historical audit. POS date/device/Z/receipt fields are reused and cannot establish uniqueness or economic equivalence. Economic sale identity is a separate validation obligation. Both duplicates and independently issued invoices remain possible until line-level evidence resolves the type-11/type-35 relationship.

The synthetic A/B snapshots declare the same lineage and stable IDs. Their expected insert/edit/delete sets are explicit. A reset scenario declares another lineage with reused IDs. Accepted reports retain their original snapshot, mapping, calculation and app revision. Source removal flags dependent adjustments for review; it never deletes or reassigns them.

## Historical dictionary and required consequences

Counts below are historical audit populations, not current-source measurements.

| Type | Recorded meaning and affected population | Unresolved financial rule and consequence |
| --- | --- | --- |
| 1 | Purchase invoice, 18,980 headers / 110,357 lines | Validate value, units and 1/5 conversion timing. Block unsupported purchasing amounts. |
| 2 | Sales invoice, 6 headers | Validate inclusion and economic identity. Block affected sales/count/basket. |
| 3 | Supplier-return invoice, 915 headers / 3,484 lines | Validate 3/7 links and credit recognition. Physical return does not prove settlement. |
| 4 | Customer-return invoice, 7 headers | Validate 4/8 conversion and original-sale cost attribution. Unsupported cost remains excluded. |
| 5 | Purchase dispatch, 5,609 headers / 35,155 lines | Link/flag counts differ. Block unresolved event recognition instead of summing invoice and dispatch. |
| 7 | Supplier-return dispatch, 260 headers / 1,630 lines | Validate conversion and physical/financial states separately. Do not invent credit or replacement. |
| 8 | Customer-return dispatch, 2 headers | Resolve conversion and sales/cost treatment. Block the affected metric. |
| 11 | Retail sale receipt, 502,143 headers / 1,708,937 lines | Resolve type-11/type-35 economic identity, discounts and completion. Block unresolved sales/count/basket. |
| 12 | Retail customer return, 526 headers / 781 lines | Customer return, not supplier return. Validate sign, linkage and historical cost. |
| 15 | Stock consumption, 14 headers / 70 lines | Validate movement/cost basis. Do not treat as sale or automatically as operating expense. |
| 16 | Stock waste, 13 headers / 75 lines | Validate recorded loss only. Sparse recording cannot establish complete losses. |
| 17 | Stock count, 6 headers / 10,732 lines | Validate adjustments. No established opening valuation or trusted-profit cutoff. |
| 35 | Retail invoice, 520 headers / 2,295 lines | Same unresolved economic-identity obligation as type 11. Neither assume duplicate nor independent. |
| Other / unknown | Dictionary also contains price-difference and other types | Revalidate the full dictionary and classify relevant populations. Unknown essential types reject the candidate; no silent financial default. |

`FIS_ARSIV` contains archived deleted headers, not recoverable current detail lines. `FIS_POS_IPTAL` includes apparent pre-completion voids. Neither population is automatically deducted again from current completed sales. Customer returns are separately classified signed financial events once supported.

## Unresolved semantics ledger

| Rule / affected population | Evidence still needed | Required consequence |
| --- | --- | --- |
| Historical last-purchase cost, every sale/return using `BELGE_TARIHINDEKI_SON_ALIS_FIYATI` | Quantity unit, multiplier, cost KDV basis, transaction-time meaning, zero/negative examples | Block unsupported cost or identify covered subset. Availability/nonzero counts are not verified coverage. |
| Fractional/unknown units | Original quantity precision and validated conversion examples | Preserve decimal text. Unknown conversion excludes dependent quantity/cost; never assume multiplier one. |
| Discounts and recorded KDV | Header/line reconciliation, discount ordering, other charges, rounding and anomaly examples | Block unreconciled financial metrics. Preserve recorded values; no global tax-rate rewrite. |
| Return cost | Original-sale linkage and matching unit/tax basis | Exclude unsupported returned-cost portion, retain signed exposure and warning. No current-price fallback. |
| Invoice/dispatch conversion | Reconcile `FIS_DETAY_BELGE_DETAY` against `FATRALANDIRILMIS_IRSALIYEMI`, including partial/conflicting links | Block affected event recognition; retain both records for traceability. |
| Market-local business date | Market-local examples and exact source field semantics | Block period attribution until verified. Host timezone and import time cannot select a period. |
| Supplier identity/display | Purchasing-document counterparties, validated join and separately reviewed safe display columns | No wholesale `CARI` replication. Supplier display stays unavailable until review. |
| Inventory/loss completeness | Negative-stock and sparse-waste interpretation | Explicit warnings; no POS correction and no inference that absent waste is zero waste. |
| Expenses and KDV treatment | Approved expense input, classification, recoverability evidence and owner completeness review | Missing/unknown remains missing/unknown; operating-profit headline unavailable. |
| Essential IDs, schema and references | Authorized schema comparison and relationship checks | Reject invalid candidate without touching the active dataset. |
| Refresh completeness | Paired source observations, backdated updates/deletes and coherent extraction | Synthetic scenarios only. No incremental protocol or live correctness claim. |

Known historical exceptions include 13,030 sales lines without a recorded purchase, 25,588 before their first costed purchase, and 5,298 missing historical cost snapshots. These are different populations and are not additive. The pooled sale/return count of 5,303 belongs to another population. The earlier audit also found two type-5 KDV discrepancies above 0.01, with a maximum of 93.99. These observations guide a future audit; they do not establish a universal reconciliation tolerance.

## Revalidation gate

### Observed isolated copy on 2026-09-25

Batch `67e45d4c-8d47-4f78-8eef-34e65b9aca7a` contains 529,001 headers, 1,873,553 lines and 16,870 products. Its source timestamp range is `2005-01-20T18:02:44` through `2025-10-12T18:06:48`. These are raw `FIS_TARIHI` bounds, not validated market-local coverage or a claim that intervening periods are complete.

The currency dictionary identifies code 1 as TRY and code 2 as USD. Two purchase invoices and two supplier-return invoices use USD. A future TRY mapping must explicitly account for those four records and their relationships. It must not relabel their amounts as TRY or silently drop them.

Schema inspection establishes `bigint` record IDs, `datetime` document timestamps, `decimal(18,3)` document quantities and `decimal(18,8)` multipliers, historical cost snapshots and selected line amounts. These storage types do not validate unit meaning, tax basis, rounding or economic identity. All 1,873,553 observed line multipliers equal one; this does not prove that every quantity and historical cost share a unit.

An exploratory left join found 100 type-11 headers, one type-12 header and two type-35 headers without current detail lines. They remain an explicit unresolved population. No source-reconciled sales or completed-transaction count is enabled by these observations.

Further checks on the already authorized isolated source must record an opaque source-batch identity, source lineage, backup hash where available, actual cutoff/coverage, clean/restored schema differences and legacy additions. Existing authorization does not need to be requested again for that source and scope. A different source or production access requires separate authorization. Checks must use approved read-only queries and scoped permission tests. Credentials and full records stay outside Git and logs.

A contract revision can support a source rule only after representative reduced examples and independent expectations establish that rule for its declared population. Record exclusions and their monetary exposure. Unknown raw column names, decimal scale and time interpretation stay unresolved until that evidence exists. Financial implementation remains blocked for affected source rules even if synthetic fixture checks pass.

See [calculation policies](calculations.md), [privacy allowlists](privacy.md) and [golden oracle evidence](../evidence/golden-oracles.md).

## Isolated raw-record preview

`sql-backup-preview-v1` is a separate, nonfinancial package accepted by the desktop import picker. Its provenance is `isolated-sql-backup`, and `sourceReconciled` must be `false`. It carries declared lineage, extraction identity, database GUID, engine version, capture time, source timestamp window, exact projected rows and a content digest. It does not satisfy any unsupported financial rule above.

The preview retains source record IDs, type/status codes, source timestamps and decimal strings. It does not infer financial document kinds, economic deduplication, market-local dates, units, tax treatment or profit. Current headers without lines remain present. Unknown source type codes remain visible as codes; they cannot enter financial calculators.

Schema 7 stores the latest valid preview separately from active and rollback financial datasets. A rejected or cancelled import preserves the prior preview and financial state. The preview participates in encrypted application backup and validation on restore. Existing synthetic packages and accepted report versions keep their original contracts. See the [real preview evidence](../evidence/real-sql-preview.md).

The source workspace exposes the existing five application destinations without activating a financial dataset. Its named `querySourceWorkspace` IPC validates month, scope, exact string IDs, page offset and package hash. Results use fixed 50-row pages; a changed package requires reopening before drill-down. Sales/purchasing groups use historical dictionary-code observations only, with all records and unknown codes still reachable. Document detail shows all lines of the selected document even when a product filter selected it. App-owned expenses, recovery and preserved reports remain independent. See [workspace evidence](../evidence/source-workspace.md).

## Separate financial projection planning

The [P01 contract](monthly-product-profit.md#separate-financial-source-scope) defines the approved planning scope for a purpose-limited financial projection for P02 review. It leaves the raw preview unchanged. Exact new columns, joins, query scope and source authorization must be recorded before renewed inspection; no logical field name in the proposal is an approved raw mapping.
