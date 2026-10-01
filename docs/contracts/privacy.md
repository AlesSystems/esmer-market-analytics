# Privacy and field allowlists

## Scope and review status

This privacy contract began in [Phase 2](https://github.com/AlesSystems/esmer-market-analytics/issues/5) for D10 and A05. Phase 2 established fixture boundaries. [Phase 3](analytics-package.md) adds an explicitly synthetic extraction and package contract. No actual market-source mapping or real reduced fixture is approved.

The declarative [source registry](../../src/source/contract.ts) lists allowed synthetic fields and historically evidenced source-column candidates. These are different schemas. A synthetic `businessDate` or `quantity` field does not prove a raw SQL column name. A future extractor must resolve every required raw mapping on an authorized clean restore and receive a reviewed contract revision before use.

## Default-deny rules

Only explicitly declared fields may appear in a permitted record. Unknown columns and unknown nested objects are rejected. Approval applies to a field in its named record type and use case, not globally to any column with the same name. An unknown field must not be preserved for convenience or hidden only at display time.

The following populations are excluded:

- Customer identities and references that identify a customer, names, contact details, addresses, tax/identity numbers and loyalty/card identifiers.
- Personnel identifiers, names, individual salaries, payroll records and payslips. Only monthly aggregate labour is eligible later.
- Identifying/free-form source text, source credentials, raw change-log SQL, legacy authentication tables and original backup contents.
- Wholesale `CARI`, `FIS_POS`, archive, cancellation or change-log replication.

Known historical sensitive names include `MUSTERI_AD`, `VERGI_NUMARASI`, `EMAIL`, `VERGI_DAIRESI` and `ADRES`. A denylist of those names is not sufficient; the allowlist must also reject unknown private columns. Raw change-log SQL can contain sensitive values and is excluded even when its table/operation metadata would otherwise be useful.

## Minimal record populations

| Record | Permitted purpose | Boundary |
| --- | --- | --- |
| Source identity / snapshot | Lineage, snapshot, schema/mapping version, synthetic provenance, explicit cutoff and coverage | No backup path, connection string or credential. Private evidence uses opaque references outside Git. |
| Document / line | Stable IDs, document kind, date, product/unit/decimal facts needed by a declared oracle | Explicit fixture keys only. Source raw mappings remain subject to revalidation. |
| Conversion / return link | IDs and validated event relationship | No raw SQL, free text or unsupported settlement assertion. |
| Product / category | Minimal identifiers and approved non-identifying product/category data | Product-level `STOK.CARI` is not accepted as supplier mapping. Display fields need separate raw-schema review. |
| Supplier | Counterparty ID proven to occur on a purchasing document | Shared counterparty-table membership alone is insufficient. No customer rows, contact/address/tax fields or unreviewed display names. |
| App-owned fixture records | Synthetic expenses, adjustments, settings, audit entries and accepted report references | These represent preservation expectations, not extracted POS data. No employee-level fields. |

The historical audit evidences names such as `FIS.ID`, `FIS_DETAY.BELGE_TARIHINDEKI_SON_ALIS_FIYATI` and `FATRALANDIRILMIS_IRSALIYEMI`. Other required field names cannot be invented from familiarity with another schema. The machine-readable candidate list is not an executable SELECT list and does not resolve the missing mappings.

## Synthetic privacy tests

The developer-only [source evidence collector](../operations/collect-source-evidence.md) has a separate aggregate-use allowlist. It may read document IDs, document types, raw document timestamps and currency references from `FIS`; line and parent/product IDs from `FIS_DETAY`; product IDs from `STOK`; and currency dictionary IDs/codes from `DOVIZ_AD`. IDs remain inside SQL aggregates and joins. The artifact contains counts, bounded type/currency groups and raw timestamp bounds, not document, product or counterparty records. Currency names outside the fixed recognized codes become `OTHER`.

Catalog inspection is restricted to the collector's named column list, including selected quantity, multiplier, amount and historical-cost column types/scales. Catalog visibility does not authorize reading those monetary values. Customer fields, product display names, supplier records, staff records and free text remain excluded. This allowlist does not approve a real analytics package or source financial mapping.

The fixture suite uses conspicuously fake private sentinels only as hostile input. Permitted outputs and snapshots must exclude both prohibited keys and sentinel values. Mutation tests add unknown/private fields at record boundaries and must fail with safe diagnostics rather than printing submitted values. Attack inputs are separate from valid analytics-shaped fixtures.

These tests verify the declared fixture boundary. They do not prove the future extractor avoids broad SELECTs, filters every log path or publishes private-data-free packages. Phase 3 must exercise the actual extraction and publication workflow against its approved allowlist, with purchasing-only supplier membership and synthetic sentinels. A field projection simulated inside a test cannot pass A05 extraction acceptance.

## Required release evidence

Before real reduced data enters Git, review every generated field and its purpose, confirm authorized source provenance, inspect the generated content and record reviewer/evidence identity. Keep original backup, credential and identifiable records outside Git. Review release archives and logs as separate artefacts. Phase 2 fixtures remain excluded from the desktop build under existing packaging rules.

See [source revalidation obligations](source.md#revalidation-gate) and [local evidence](../evidence/phase-2-local.md) for performed checks and open gates.

## Isolated backup record preview allowlist

The authorized preview may extract the following fields from the disposable restored copy. It uses explicit SQL projections and preserves only string or null values. Package validation rejects extra columns and text that does not match the expected numeric, timestamp or fixed currency format.

- `FIS`: `ID`, `FIS_TURU`, `DOVIZ_AD`, `DURUM`, `AKTIF`, `SATIR_TOPLAM`, `SATIR_ISKONTO_TOPLAM`, `FIS_ISKONTO_TOPLAM`, `KDV_TOPLAM`, `OTV_TOPLAM`, `TEFKIFAT_TOPLAM`, `GENELTOPLAM`, `FIS_TARIHI`.
- `FIS_DETAY`: `ID`, `FIS`, `STOK`, `FIS_TURU`, `CARPAN`, `MIKTAR_FIS`, `TOPLAM_KDV_MATRAHI`, `TOPLAM_KDV`, `TOPLAM_OTV`, `TOPLAM_TEVKIF`.
- `DOVIZ_AD`: `ID` and `AD` for the SQL join and fixed `CURRENCY` classification (`TRY`, `USD`, `OTHER` or null). Arbitrary currency display text is not exported.

The package includes opaque source lineage and extraction identity, database GUID, numeric engine version, capture timestamp and selected source-date bounds. It contains no server locator, account name, password, customer/product/supplier display text or source file path. Use opaque identifiers for lineage and extraction identity.

Prepared real packages, source snapshots, exact-value oracles and real screenshots stay outside Git and release assets. Public UI evidence uses generated rows. Import does not make private source material suitable for publication.

## Product-profit projection boundary

The [P01 source-scope decision](monthly-product-profit.md#separate-financial-source-scope) keeps the existing preview allowlist unchanged. A separate financial projection can include product labels only after explicit review of minimal non-identifying fields. Customer, employee and supplier fields remain excluded from that slice. This planning change approves no new source reads.

The user authorized renewed isolated inspection on 2026-09-30. For private evidence batch `3824ff83-6d2f-47b7-9b74-02d7334d6cd4`, independent query review approved the existing preview columns above, plus `FIS_DETAY.BELGE_TARIHINDEKI_SON_ALIS_FIYATI` for recorded cost-value checks and `STOK.ID` for reference validation. This is 27 distinct table-column grants: 13 header, 11 line, two currency and one product column. The bounded value population uses recorded header timestamps from 2025-09-01 inclusive to 2025-10-01 exclusive. It does not establish a business-month interpretation.

Catalog-only inspection covered column names, types, precision, scale, length and nullability for `FIS`, `FIS_DETAY`, `STOK`, `DOVIZ_AD`, `FIS_DETAY_BELGE_DETAY`, `FIS_ARSIV` and `FIS_POS_IPTAL`. It did not read archive, cancellation, conversion-link or product display values. Query review pinned the exact SQL hashes, copied database identity and catalog artifact before bounded value reads. The private runner imposed a 100,000-row limit, 32 MiB transport cap and deadlines, checked the isolated container/network, and required complete JSON results. Restricted-reader probes passed before the copied database was frozen read-only.

Private rows, decimal expectations and prepared packages remain outside Git and release assets. Only counts, opaque identities and digests are recorded in the [issue 39 evidence](../evidence/issue-39-source-profit.md). This evidence-only grant does not add historical cost to the raw preview or approve a financial mapping. The existing preview projection and runtime registry remain unchanged.
