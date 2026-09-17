# Source-to-domain contract

## Status and authority

Mapping `source-contract-v1` belongs to [Phase 2, issue #5](https://github.com/AlesSystems/esmer-market-analytics/issues/5), tasks 2.1 and 2.2. It records approved product policy, historical observations and synthetic assumptions separately. The [foundation specification](../superpowers/specs/2026-09-04-esmer-market-rebuild-design.md) and [audit](../superpowers/specs/2026-09-04-esmer-market-rebuild-audit.md) govern the contract.

No source has been accessed for this phase. No clean restore, newer backup, restricted-account check or reduced real fixture is available to this work. The historical audit retained neither a backup hash nor sufficient redacted examples to complete source validation. All real-source financial mappings remain unsupported. A reviewed synthetic contract does not confer source-reconciled status.

The executable registry is [src/source/contract.ts](../../src/source/contract.ts). It is declarative and has no source I/O. Its historical dictionary entries are observations, not a complete financial inclusion allowlist. Unknown types and missing essential identities require candidate rejection until explicitly classified.

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

A future separately authorized isolated audit must record an opaque source-batch identity, source lineage, backup hash where available, actual cutoff/coverage, clean/restored schema differences and legacy additions. It must use approved read-only queries and scoped permission checks. Credentials and full records stay outside Git and logs.

A contract revision can support a source rule only after representative reduced examples and independent expectations establish that rule for its declared population. Record exclusions and their monetary exposure. Unknown raw column names, decimal scale and time interpretation stay unresolved until that evidence exists. Financial implementation remains blocked for affected source rules even if synthetic fixture checks pass.

See [calculation policies](calculations.md), [privacy allowlists](privacy.md) and [golden oracle evidence](../evidence/golden-oracles.md).
