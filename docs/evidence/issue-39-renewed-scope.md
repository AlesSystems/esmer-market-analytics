# Renewed source scope for issue 39

R39-SCOPE proposal, 2026-10-01. This document requests no execution by itself. It prepares a separate authorization for [P02 / #39](https://github.com/AlesSystems/esmer-market-analytics/issues/39), after the approved [P01 contract](../contracts/monthly-product-profit.md). It changes no application, source mapping, or preview allowlist.

The user confirmed that only the existing isolated backup is available. No independent POS documentation or sale, return, or purchase receipts were supplied. The user handles Windows verification. R39 financial meaning and R40 real financial activation remain blocked, even if the proposed inspection later succeeds.

## Existing evidence and source identity

PR [#46](https://github.com/AlesSystems/esmer-market-analytics/pull/46), reviewed here with `git show 85d4645:docs/evidence/issue-39-source-profit.md`, records September raw transport evidence. Its private batch is `3824ff83-6d2f-47b7-9b74-02d7334d6cd4`. This is the intended predecessor identity, not permission to restart or recreate its stopped copy.

The previous batch recorded 15,880 headers and 54,965 lines in raw `FIS_TARIHI` September 2025. It proved neither financial inclusion nor market-local dates. Its original backup hash and permanent lineage remain unknown. The existing restored schema includes legacy additions. No pristine restore or production compatibility is assumed.

Before any authorized connection, the operator must provide a private identity receipt binding the exact existing isolated database to that batch's retained database GUID and file-hash manifest. Compare the GUID before every query. Keep hashes, paths, credentials, and source locators outside Git. Record whether the files are unchanged; do not expect hashes of an already running database to equal stopped-file hashes. A changed or missing copy fails this scope rather than permitting another source.

This proposal authorizes no container inventory, start, stop, copy, restore, account creation, grant, configuration change, or private-evidence read. If the identity receipt, a running isolated read-only copy, and an existing suitable restricted reader are unavailable, stop and prepare a separate exact lifecycle request. Do not substitute production or the original development source.

## Stage M reads catalog metadata only

The proposed metadata scope covers only these known candidate tables in `dbo`:

- `FIS` and `FIS_DETAY` for status, dates, discounts, quantity, and cost candidates.
- `STOK_BIRIM` for the historically mentioned unit dictionary.
- `FIS_DETAY_BELGE_DETAY` for historically observed conversion relationships.
- `FIS_DETAY_MALIYET` for historically observed cost relationships.

`STOK_BIRIM` is mentioned in PR #46; its existence and columns still require confirmation. The [foundation audit](../superpowers/specs/2026-09-04-esmer-market-rebuild-audit.md) names the other relationship tables without their endpoint columns. No endpoint, unit, discount, completion, or original-sale column is invented here.

M1 is the following fixed SQL Server catalog draft. It reads names and storage types only. It excludes defaults, descriptions, module definitions, trigger bodies, view definitions, extended properties, and all user-table values.

```sql
SELECT TOP (1025)
	s.name AS schema_name,
	t.name AS table_name,
	c.name AS column_name,
	c.column_id,
	y.name AS storage_type,
	c.max_length,
	c.precision,
	c.scale,
	c.is_nullable
FROM sys.tables AS t
JOIN sys.schemas AS s ON s.schema_id = t.schema_id
JOIN sys.columns AS c ON c.object_id = t.object_id
JOIN sys.types AS y ON y.user_type_id = c.user_type_id
WHERE s.name = N'dbo'
	AND t.name IN (N'FIS', N'FIS_DETAY', N'STOK_BIRIM',
		N'FIS_DETAY_BELGE_DETAY', N'FIS_DETAY_MALIYET')
ORDER BY t.name, c.column_id;
```

Allow at most 1,024 metadata rows and 1 MiB UTF-8 output. Row 1,025 is an excess sentinel, not a truncation policy. Missing tables, invisible columns, duplicate catalog identities, an excess row, or an excess byte fails the pass. Record missing objects as unresolved; do not expand to other tables automatically.

Keep the complete catalog receipt private because unapproved column names may identify sensitive fields. Publish only reviewed non-identifying candidate names, types, missing-object findings, and an opaque receipt identity. Do not infer meaning from a name or decimal scale.

An independent reviewer must turn the M1 receipt into an exact proposed field allowlist with a purpose for every field. Only then can a separate Stage V request include new unit or relationship values. Stage M approval never approves those values.

## Stage V is a subsequent bounded value proposal

Stage V remains unapproved. Its first useful slice is a September sample for comparison with independent evidence, rather than another full raw extraction. The prior full raw transport receipts already cover that workload.

The raw time predicate is fixed to `FIS_TARIHI >= CONVERT(datetime,'20250901',112)` and `FIS_TARIHI < CONVERT(datetime,'20251001',112)`. This is recorded time, not a validated business calendar. Preserve all selected currency codes and unsupported statuses as evidence. Do not silently filter them into a financial population.

Known value fields proposed for this first sample are:

| Table | Exact proposed fields | Purpose |
| --- | --- | --- |
| `FIS` | `ID`, `FIS_TURU`, `FIS_TARIHI`, `DOVIZ_AD`, `DURUM`, `AKTIF`, `SATIR_TOPLAM`, `SATIR_ISKONTO_TOPLAM`, `FIS_ISKONTO_TOPLAM`, `KDV_TOPLAM`, `OTV_TOPLAM`, `TEFKIFAT_TOPLAM`, `GENELTOPLAM` | Raw identity, timestamp, codes, and null-preserving amount comparisons. |
| `FIS_DETAY` | `ID`, `FIS`, `STOK`, `FIS_TURU`, `CARPAN`, `MIKTAR_FIS`, `TOPLAM_KDV_MATRAHI`, `TOPLAM_KDV`, `TOPLAM_OTV`, `TOPLAM_TEVKIF`, `BELGE_TARIHINDEKI_SON_ALIS_FIYATI` | Exact recorded line quantities, amounts, and historical-cost candidate. |
| `DOVIZ_AD` | `ID`, `AD` inside fixed classification only | Return `TRY`, `USD`, `OTHER`, or null. Never export arbitrary dictionary text. |
| `STOK` | `ID` inside reference checks only | Verify the product ID exists. Export no product attributes. |

Known joins are `FIS_DETAY.FIS = FIS.ID`, `FIS_DETAY.STOK = STOK.ID`, and `FIS.DOVIZ_AD = DOVIZ_AD.ID`. Required parent and product joins must be checked without dropping orphan rows. Currency uses a left join; an unresolved reference stays unresolved. Check unique IDs and one-to-one parent/dictionary references before emitting values. Record identity alone does not prove economic identity.

V1 is a fixed selection draft for at most 60 headers. Types 11, 12, and 35 are historical dictionary candidates, not an inclusion policy. The reviewer-approved projection must use every field in the table above explicitly, as exact decimal and ID strings. This selection draft is not a runnable extractor or approval to add columns.

```sql
WITH ranked AS (
	SELECT f.ID, f.FIS_TURU,
		ROW_NUMBER() OVER (PARTITION BY f.FIS_TURU ORDER BY f.ID) AS sample_rank
	FROM dbo.FIS AS f
	WHERE f.FIS_TARIHI >= CONVERT(datetime,'20250901',112)
		AND f.FIS_TARIHI < CONVERT(datetime,'20251001',112)
		AND f.FIS_TURU IN (11,12,35)
)
SELECT ID, FIS_TURU
FROM ranked
WHERE sample_rank <= 20
ORDER BY FIS_TURU, ID;
```

V2 selects all lines belonging to those exact approved header IDs. Use parameterized bigint IDs and explicit fields. Permit at most 1,000 lines, with a 1,001st-row sentinel that fails before publication. Do not silently truncate a document. The combined private output ceiling is 2 MiB. Headers without lines remain recorded. A sample that lacks an anomaly does not disprove the anomaly.

Units, conversion endpoints, original-sale attribution, purchase timing, additional discount operands, or completion timestamps require the M1 result, reviewed exact columns and joins, and another explicit value authorization. No SQL draft for those reads is possible from the public identifiers alone. Product display labels, customer fields, employee fields, supplier fields, POS keys, archives, cancellations, and raw change-log SQL remain excluded.

## Bound dependencies before value authorization

Propose dependencies only through reviewed exact source links, not amount/date similarity or a search over full product history. The final request must name the relationship columns, endpoint roles, permitted types, fixed IDs, date bounds, and projection.

The proposed maximum outside-month closure is 200 headers, 1,000 lines, 2,000 relationship rows, 500 distinct product IDs, and 2 MiB. All are ceilings for the whole pass, not each query. Limit traversal to two relationship hops. No product dictionary value read is approved. Keep a visited-ID set and reject cycles, missing required endpoints, duplicate conflicting links, or excess before output. Do not return the first rows and pretend the closure is complete.

For September originals and conversions, the proposed raw dependency window is `2005-01-20` inclusive through `2025-10-13` exclusive, matching the historical source bounds conservatively. This window restricts linked IDs only. It grants no all-time scan or all-time financial contribution. Fetch cumulative returns only for approved exact original-sale line IDs within that same fixed source cutoff; they are evidence, never extra September contributions. If a required original, purchase, or later return falls outside the window or cannot be linked within these ceilings, mark that rule unsupported. Enlarging the window or ceiling requires a new reviewed request.

## Reader, execution, and output conditions

Use an existing dedicated restricted reader. It may read only the approved catalog metadata for M1, and later only separately approved column projections. It must have no broad `db_datareader`, source writes, administration, arbitrary procedures, impersonation, or access to private columns. Review effective permissions through an operator-provided private receipt. Account provisioning and negative write probes need separate isolated lifecycle authorization; do not execute them under M1.

The execution wrapper must bind the privately supplied expected GUID, verify read-only state before and after, and pin the reviewed query SHA-256. A mismatch closes the connection without values. No dirty-read hint, new source index, or isolation/configuration change is permitted. If the existing identity/state checks need privileges the reader lacks, stop rather than elevate.

Keep the existing 15-second request timeout and a 60-second total pass deadline. Cancel immediately on user cancellation or any bound failure, cancel the request, and close the connection in a finalizer. Measure cancellation latency, elapsed time, rows, and bytes in a safe receipt. No retries after a timeout or identity failure without diagnosis. SQL text may contain only approved identifiers and parameter placeholders; redact errors and parameters from public logs.

Write private output exclusively outside Git and release directories, with mode 0600 and atomic publication after validation. Delete incomplete output on failure. Disable screenshots, traces, video, and page snapshots for real values. Public evidence contains synthetic examples, safe aggregate findings after review, query hashes, and opaque receipt references. Existing preview packages, app-owned records, and accepted reports are unchanged.

## Independent proof remains missing

Every enabled rule needs source-specific independent expectations plus literal Decimal arithmetic. More raw values, raw SUM equality, and plausible column names cannot supply these expectations.

| Rule | Independent evidence needed | Until available |
| --- | --- | --- |
| Completed sales, voids, types 11/35 | Installed POS product/version and its documented completion/status rules, or independently reviewed linked sale/void examples and receipts. | No recognized sales or transaction counts. |
| Conversion and return links | Documented endpoint roles plus invoice/dispatch and original-sale/return examples that establish event identity and cumulative quantities. | No inferred deduplication or returned-cost attribution. |
| Dates and coverage | Product-specific timestamp convention and independently dated market examples, including month boundaries and cutoff. | Raw recorded September window only. |
| Units and multiplier | Piece/kg dictionary meaning, receipt quantities, conversion rules, and matching cost unit. | Unknown units block document recognition under P01. |
| Net, KDV, discounts, charges, rounding | Receipts or source-specific documentation for amount basis, null meaning, allocation/order, and exact rounding examples. | No null-to-zero, universal tolerance, or net-sales formula. |
| Historical cost | Independently dated purchase evidence and source-specific snapshot timing, tax/unit basis, genuine-zero, and contradictory-cost examples. | Positive candidates are not cost coverage. No current-price fallback. |

Only the existing backup is available, so these proof requirements are presently unmet. Do not repeat a request for receipts as though supplied evidence exists. If product/version documentation or reduced independent receipts become available later, review them without owner contact. Record unknown financial exposure as null, not zero. A sample proves only its declared rule and population; no whole-month promotion follows.

## Exact next authorization request

> Do you authorize Stage M only on the existing isolated copy associated with batch `3824ff83-6d2f-47b7-9b74-02d7334d6cd4`, after its operator-provided private GUID/hash identity and restricted-reader receipt match, to run only M1 catalog metadata for `dbo.FIS`, `dbo.FIS_DETAY`, `dbo.STOK_BIRIM`, `dbo.FIS_DETAY_BELGE_DETAY`, and `dbo.FIS_DETAY_MALIYET`, with a 1,024-row/1-MiB limit, 15-second request timeout, 60-second total deadline, and private output? This excludes all user-table values, container actions, restore/copy/start, account or grant changes, production access, and financial activation. If the existing copy is unavailable or stopped, the pass stops for a separate lifecycle scope. Stage V values require a later reviewed exact allowlist and separate authorization.

This is a concrete pending request for coordinator review, not a permission question issued by this worker. Approval can unblock metadata preparation only. Missing independent semantics still block #39 completion and R40. Windows acceptance remains with the user.

## Preparation verification

R39-SCOPE used only repository files and read-only `git`/`gh` operations on local macOS. No SQL, container, backup, credential, or private source evidence was accessed. Issue #39 has label `enhancement`, no comments, and a completion dependency on #38. The current public contracts keep actual financial rules unsupported.

The documentation check is `git diff --check`, plus a local Markdown target check on this file. Application tests, SQL execution, source permission probes, runtime behavior, and Windows acceptance are not claimed for this documentation-only proposal. Coordinator review remains required before publication or the authorization request.
