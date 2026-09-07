# Esmer Market rebuild — database audit summary

- Recorded: 2026-09-04.
- Status: User-approved summary of the earlier read-only audit; transferred without rerunning the audit or revalidating its findings.
- Related: [Foundation specification](2026-09-04-esmer-market-rebuild-design.md) · [Release acceptance checklist](2026-09-04-esmer-market-rebuild-acceptance.md).

## 1. Conclusion and evidence boundary

The available database is a useful source for the rebuild. It does not establish that the old application's financial calculations are correct, that all real-world costs/losses are recorded, or that historical weighted-average profit can be reconstructed exactly.

Sales/purchasing history and source relationships justify proceeding with a clean implementation. Historical profit must remain estimated or unavailable according to coverage. No trusted profitability start date has been established.

This document preserves aggregate observations and schema identifiers only. It intentionally contains no customer records, credentials, raw source backup or private spreadsheet. The detailed query outputs remain in the conversation; no standalone signed audit log, hashed raw backup or sanitized fixture was created during that audit. Revalidation on a clean/newer backup is required before treating the source contract as complete.

### Environment and actions during the earlier audit

- Inspected the user-provided OrbStack container `esmer-mssql`, ID `8e870f7b29d6877a1e247f4e0ec92097630df95f6b9a9fa71956254d2b16d397`.
- Started the initially stopped development container and used read-only SQL/metadata queries plus `DBCC CHECKDB` diagnostics. No application DML, DDL, migrations, restore, or schema repair was performed.
- Used a temporary SQL client container; no source credentials were printed into the audit output.
- Both physical-only and full `DBCC CHECKDB` diagnostics completed with no reported errors.
- Returned the source container to its original stopped state after the audit.
- No database was opened, restarted or re-queried solely to write these planning documents.

Diagnostic success establishes structural database integrity within the checks performed. It does not certify business completeness, correct bookkeeping or tax compliance.

## 2. Source identity, age and size

| Observation | Recorded result |
| --- | --- |
| Restored database | `EsmerMarketDB` |
| Backup source database name | `ESMER` |
| Backup start/finish | 2025-10-12 18:05:37 / 18:08:54, source-recorded timestamps |
| Restore timestamp | 2026-05-18 07:17:00, source-recorded timestamp |
| Engine in source container | Azure SQL Edge image; exact future SQL Server version/support is not inferred from this environment |
| Compatibility/recovery | Compatibility level 120; SIMPLE recovery |
| Database size | Approximately 8,185.9 MB including log |
| Schema objects | 471 user tables; 365 views; 1,942 stored procedures; 131 scalar functions; 28 table functions; 5 triggers |
| Current document headers | `FIS`: 529,001 |
| Current document lines | `FIS_DETAY`: 1,873,553 |
| Products | `STOK`: 16,870 |
| Counterparties | `CARI`: 391; individual records were not exposed |

The dataset is not current to September 2026. Observed retail sales run from 2022-01-18 to 2025-10-12; October 2025 is a partial month and the final date is a partial day. A restore timestamp in 2026 does not make the business data current to 2026.

An initial allocation-unit metadata query overcounted some rows. The direct/current counts above supersede that initial estimate.

## 3. Verified document-type dictionary and conversion risk

The actual `dbo.FIS_TURU` dictionary contradicts important legacy assumptions. The dictionary and movement evidence, not old application constants or old generated documentation, must drive the new source mapping.

| ID | Source meaning | Header count | Line count | Rebuild relevance |
| --- | --- | ---: | ---: | --- |
| 1 | Alış faturası | 18,980 | 110,357 | Purchase invoice |
| 2 | Satış faturası | 6 | Not retained in this summary | Sales invoice; low-volume population still requires validation |
| 3 | Alıştan iade faturası | 915 | 3,484 | Supplier-return invoice / financial return evidence |
| 4 | Satıştan iade faturası | 7 | Not retained in this summary | Customer-return invoice |
| 5 | Alış irsaliyesi | 5,609 | 35,155 | Purchase dispatch; often later invoiced |
| 7 | Alıştan iade irsaliyesi | 260 | 1,630 | Supplier-return dispatch; often later invoiced |
| 8 | Satıştan iade irsaliyesi | 2 | Not retained in this summary | Customer-return dispatch; conversion handling required |
| 11 | Perakende satış fişi | 502,143 | 1,708,937 | Main completed retail sales population |
| 12 | Perakende satış iade fişi | 526 | 781 | Retail customer return; not supplier return |
| 15 | Stock consumption | 14 | 70 | Inventory consumption evidence |
| 16 | Stock waste | 13 | 75 | Recorded waste/loss evidence, not proof of complete loss recording |
| 17 | Stock count | 6 | 10,732 | Inventory adjustments/count evidence |
| 35 | Perakende satış faturası | 520 | 2,295 | Retail invoice; validate relationship to retail receipts |

The full dictionary also contains other types, including price-difference documents. This table is not a complete hardcoded financial allowlist. No unmapped type IDs or header/line type mismatches were found in the checks performed. The remaining type populations must be classified before a complete financial inclusion rule is released.

`FIS_DETAY_BELGE_DETAY` exposes conversion links:

- Purchase invoice type 1 → purchase dispatch type 5: 34,518 line links, 5,492 invoice documents and 5,508 dispatch documents.
- Supplier-return invoice type 3 → supplier-return dispatch type 7: 1,421 line links, 217 invoice documents and 224 dispatch documents.
- Customer-return invoice type 4 → dispatch type 8: 5 line links.

`FATRALANDIRILMIS_IRSALIYEMI` is important: 34,567 type-5 lines and 1,424 type-7 lines were marked invoiced dispatches. The stock-balance view excludes invoiced dispatch lines. Summing both invoice and dispatch populations indiscriminately would double count events. Different link/flag counts require reconciliation, not the assumption that the two mechanisms always agree.

Supplier returns are therefore materially present in the source. These observations do not prove how every supplier settles a return, whether every pending claim is recorded, or whether replacement goods can always be linked to the original claim.

## 4. Sales identity, voids and deletions

### Current relationships and availability

- All 1,873,553 current detail lines joined current headers and products in the checked relationships; no orphan header/product line was found.
- Current headers were active in the profiled status fields. Inactive flags alone cannot identify historical deletions.
- `FIS_POS` has one row for each current type-11, type-12 and type-35 document in the checked populations.
- Retail sales occur continuously: 347 active days in 2022 from January 18, 365 in 2023, 366 in 2024, and 285 through October 12 in 2025. Continuity does not prove that every transaction was captured.

### Receipt fields are not a proven unique business key

All checked sale/return populations had null `FIS.YAZAR_KASA_FIS_NO`. Consequently an earlier zero-duplicate result that required non-null receipt numbers was not evidence of uniqueness.

The populated POS fields were also reused:

- Grouping by date, fiscal-device serial, `KASA_Z` and `KASA_FIS` produced 168,337 duplicate groups involving 339,408 documents, including 477 mixed-type groups.
- Type-11/type-35 documents had 293 matching pairs on that day/device/Z/receipt key.
- A separate exact timestamp/register/gross-total comparison found no matching type-11/type-35 pairs.

These checks are inconclusive about all potential sale/invoice conversions. Neither reused POS keys nor the absence of exact amount/time matches proves whether two documents represent the same economic sale. Use source `FIS.ID` as record identity, and separately validate economic conversion/deduplication rules with line-level examples. Do not label all type-11/type-35 transactions duplicates or all independent based on these checks alone.

### Deletion and void evidence

- `FIS_ARSIV` contained 31,319 archived headers, including 30,324 type-11 retail sales headers.
- The `FIS_ARSIVLE` delete trigger archives deleted headers with `SILME_TARIHI`. Current detail lines did not join archived headers; deleted details are not recoverable simply by joining the current detail table.
- `FIS_POS_IPTAL` contained 7,132 cancellation headers and 19,542 cancellation lines. These appear to include pre-completion POS void activity; their financial interpretation is not fully verified.

Do not subtract all archive/void records from current completed-sales totals. Import and synchronization must distinguish records already absent from the current source, completed-sale returns, and pre-completion voids.

## 5. Cost history, inventory and inflation

### Cost fields and built-in calculations

- `FIS_DETAY.BELGE_TARIHINDEKI_SON_ALIS_FIYATI` was nonzero on 1,703,686 of 1,708,937 retail sale lines and 2,249 of 2,295 type-35 lines. It is historical last-purchase evidence, not validated perpetual weighted-average COGS.
- `FIS_DETAY.BIRIM_MALIYET` had no nonzero values in the profiled populations. `STOK.ORTALAMA_MALIYET` was null for every product. These custom legacy fields cannot support claims that weighted-average costing is already populated.
- `LOKASYON_MALIYETI` was populated with zero, not useful nonzero costs. Earlier non-null counts must not be read as cost coverage.
- `FIS_DETAY_MALIYET` contained only 19,332 rows covering 721 distinct input lines and 19,251 distinct outgoing lines; it does not cover the full sales population.
- The inspected `RP_MALIYET_FIS_DETAY` method 1 reads the product's current last-purchase price. Its method 3 averages inflows without a transaction-date cutoff. Neither establishes immutable historical perpetual weighted-average COGS.
- Inspected FIFO-oriented functions have ordering/opening-stock/fallback concerns; they were not accepted as a verified replacement.

The cost-field unit, tax treatment and return attribution still need a source contract. High nonzero coverage is evidence of availability, not proof that multiplication by every quantity field is financially correct.

### Opening stock and purchase-history gaps

- Across sales types 2, 11 and 35, 13,030 lines had no recorded purchase for their product; 25,588 lines preceded the first recorded costed purchase; 5,298 lines had missing historical cost snapshots. These measure different kinds of missing evidence.
- January 2022 had approximately 88.61% of net sales without a prior recorded costed purchase; the ratio declined substantially later. In most 2024–2025 months it was below 1%, but that does not establish opening-stock valuation.
- The 2022-01-21 count adjustment had 3,093 lines across 3,086 products, with missing cost snapshots on 3,075 lines.
- The 2023-12-04 count adjustment had 7,165 lines across 7,091 products, including 106 missing cost snapshots and substantial positive/negative quantity adjustments.
- `SAYIM`/`SAYIM_DETAY` contain additional count-session information, but the sessions and adjustment documents are not interchangeable. No complete dated quantity-and-cost valuation was established.
- The user does not expect a historical inventory valuation report to be available and wants to avoid asking Eralp before the surprise.

December 2023 is a candidate event for further investigation, not an approved trusted-profit cutoff. Neither 2024 nor any other period may be automatically marked trusted because it follows this count.

### Inventory data quality

The movement-based balance showed 950 negative-stock products among 14,295 products with movements. Recorded waste consisted of only 13 documents/75 lines, concentrated in 2024–2025. Both results limit inventory-derived claims and loss completeness; neither authorizes changing stock records.

The product-level `STOK.CARI` relationship was unsuitable as a supplier dimension: 8,298 products lacked it and 8,094 had a non-matching reference in the checked relationship. Purchasing-document counterparties are the candidate supplier source. Product-group references were valid in the checks performed.

### Illustrative replacement-price distortion

The audit compared signed quantities valued using historical last-purchase snapshots versus the current product last-purchase price. The current-price proxy exceeded the historical-price proxy by approximately:

| Transaction year | Difference |
| --- | ---: |
| 2022 | +200.31% |
| 2023 | +114.63% |
| 2024 | +53.86% |
| 2025 through backup cutoff | +14.66% |

These are diagnostic proxy comparisons, not certified COGS, inflation rates, or margin statements. They support keeping replacement-cost analysis separate from historical cost. The pooled sale/return query had 5,303 missing snapshot lines, whereas the sale-only population above had 5,298; the different populations must not be conflated.

## 6. KDV and total reconciliation

Recorded line rates were predominantly 0, 5, 10, 16 and 20. Rare unusual rates, including extreme values, also occurred. This is an observation of stored data, not verification of current KKTC law or a universal allowed-rate list.

Header KDV reconciled with summed line KDV essentially exactly for retail sales: no type-11 document exceeded a 0.01 difference in the performed comparison. Two type-5 documents exceeded that tolerance, with a maximum difference of 93.99. Some non-KDV header/line totals differed because further discount/charge/document semantics must be resolved.

Use source values as evidence and surface anomalies. Do not overwrite historical transactions using a globally fixed rate or calculate headline net revenue and line breakdowns with incompatible definitions. The exact treatment of source discounts, other taxes/charges and cost KDV remains a validation obligation.

## 7. Freshness and future synchronization

- Native change tracking, CDC and temporal history were disabled on the checked source tables. The app has no authority to enable them.
- Core IDs were not identity columns, but an incrementing non-cycling SQL sequence `ID` existed. The maximum checked `FIS.ID` was 6,139,829; sequence current value was 6,139,838.
- Business dates and ID order did not align: 14,881 headers were earlier-dated than the preceding ID's business date. Monthly ID ranges overlap. A business-date-only watermark misses backdated activity.
- `SEQUNCES_DEGISIKLIK` held 1,276,215 change records. Operation codes appeared to represent insertion/update/deletion, but complete semantic coverage was not proven.
- For `FIS`, the log had 26,648 apparent inserts, 15,656 updates and 31,264 deletes—far fewer inserts than current retail headers. Many records elsewhere had no table name. This is not a complete standalone change feed.
- Core source indexes on IDs, dates/types and detail-to-header/product relationships exist. No new source indexes were created or approved.

A hybrid protocol is a design hypothesis: increasing IDs for inserts plus existing log/archive evidence and periodic reconciliation. It still needs proof for committed header/line consistency, late updates, deletes, source resets, transaction ordering and extraction load. IDs alone are not a guaranteed exactly-once stream.

No multi-snapshot update/delete test, live concurrent-writer test, production load test or 5–15 minute synchronization benchmark was performed. The two-second dashboard target was not tested by this audit.

## 8. Expenses, source-schema additions and privacy

The restored database contains legacy-app additions made after its restore, including custom expense/tax/payroll/migration structures and appended calculation/expiry fields. Relevant custom expense and payroll tables had no data in the audit. Do not assume the restored schema is identical to a pristine market backup.

Not every column of a table modified after restore was added by the old app. Object modification timestamps do not prove the creation date of each column. A clean/newer backup would clarify the baseline, but no cleanup/restore is authorized by writing these documents.

Spreadsheet imports remain necessary for expenses and aggregated labour. Do not import the old user/authentication or employee tables.

Sensitive header fields observed in metadata included `MUSTERI_AD`, `VERGI_NUMARASI`, `EMAIL`, `VERGI_DAIRESI`, `ADRES`, address references and personnel-name fields. `FIS_POS` also contains loyalty-card and other potentially identifying/free-text fields. The extractor must use an explicit field allowlist, not select all columns and redact only what the UI happens to display. Do not extract raw change-log SQL text, which can itself carry sensitive values.

Supplier display data, if needed, must be scoped to purchasing counterparties and reviewed separately; shared `CARI` membership is not permission to replicate customer contacts, tax identifiers or addresses.

## 9. Revalidation checklist for the next authorized source audit

1. Record backup lineage, file hash where available, metadata, data cutoff and clean/restored schema differences without exposing credentials.
2. Reproduce direct table counts, core references, dictionary values, conversion flags/links and reconciliation samples using read-only queries.
3. Validate source units, tax/cost basis, discounts and returns with redacted examples and independently checked expected outputs.
4. Resolve the type-11/type-35 economic-transaction relationship and all financially relevant remaining types.
5. Compare two source snapshots, including edits and deletions, before claiming refresh/incremental correctness.
6. Produce a reviewed, reduced, customer-free fixture and a schema/column allowlist; retain original backups outside Git.
7. Keep all unresolved populations explicit. If evidence still cannot support a calculation, retain the unavailable/estimated policy rather than weakening the acceptance rule.

The next audit remains subject to the same source-safety boundary. This checklist is not authorization to reconnect to production or mutate the provided development database.
