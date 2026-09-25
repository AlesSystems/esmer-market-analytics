# Issue 26 isolated source validation

This continues [PR #28](https://github.com/AlesSystems/esmer-market-analytics/pull/28) and [issue #26](https://github.com/AlesSystems/esmer-market-analytics/issues/26), R1 and the restricted-read prerequisites of R2. It replaces the Windows source-access blocker with an accessible isolated copy. It does not complete R1, implement a real analytics import, or pass A01 through A07.

## Source and isolation

The user supplied the stopped OrbStack container on 2026-09-25 and authorized continuation on this Mac. The original stayed stopped. A helper mounted its data volume read-only and copied it into a new disposable volume. Only that copy was started, on an internal Docker network with no published ports. No production endpoint was contacted.

The private evidence batch is `67e45d4c-8d47-4f78-8eef-34e65b9aca7a`. Source locators, credentials, file inventories and query results remain outside Git in the operator's private evidence directory. This is a cold volume copy, not a newly supplied pristine backup. No original `.bak` hash, clean-schema comparison or independently established permanent source lineage is available. The restored database includes historical legacy additions. Matching headline counts do not prove that all records match the historical audit.

The observed engine is Azure SQL Edge Developer `15.0.2000.1574`, database compatibility level `120`. Snapshot isolation was disabled and read-committed snapshot enabled. Administration provisioned a dedicated column-restricted login on the disposable copy, then set that database `READ_ONLY`. The evidence command requires the database to remain read-only. This procedure does not establish a consistency protocol for a mutable source or future live synchronization.

## Observations and exclusions

| Observation | Actual result | Meaning and limitation |
| --- | --- | --- |
| Current headers | 529,001 | All types, including unsupported populations |
| Current detail lines | 1,873,553 | No orphan header or product references in the exploratory joins |
| Products | 16,870 | No product display fields approved or exported |
| User tables | 471 | Full schema census retained privately; not a minimal clean backup |
| Raw document timestamps | 2005-01-20T18:02:44 to 2025-10-12T18:06:48 | Stored bounds, not validated market-local period completeness |
| Currency population | 528,997 TRY headers and 4 USD headers | Two USD purchase invoices and two USD supplier-return invoices need explicit exclusion/relationship handling under the TRY-only product contract |
| Headers without current lines | Type 11: 100; type 12: 1; type 35: 2 | Completion and financial treatment remain unresolved |
| Conversion links | 35,944 | 34,518 type 1/5 links, 1,421 type 3/7 links and 5 type 4/8 links; counts alone do not establish recognition or complete matching |
| Stored line multiplier | One on all 1,873,553 lines | Does not validate quantity/cost units |

The exploratory reconciliation query compared stored header KDV with summed line KDV and found two type-5 differences above 0.01. A separate gross-total hypothesis also had exceptions across several types. These comparisons test hypotheses only. They do not approve the formula, a universal tolerance, discount allocation or source-reconciled metrics. Null/missing line populations were counted separately. Query text and results are retained privately under this batch.

Observed types include `bigint` IDs, `datetime` timestamps, `decimal(18,3)` quantities and `decimal(18,8)` selected amounts, multipliers and historical cost. The [source contract](../contracts/source.md) distinguishes these schema facts from unsupported financial meaning. No customer values, staff values or counterparty records were needed for the retained observations.

## Restricted-account proof

Account creation and database settings were isolated administration, separate from the collector. The account received column-level `SELECT` and table-level `VIEW DEFINITION` on the four tables listed in the [evidence privacy allowlist](../contracts/privacy.md). It received no application or source administration role.

The negative checks ran while the disposable database was writable, so database read-only mode could not mask missing account restrictions. DML tests used `WHERE 1=0` inside a transaction. DDL used a probe table inside a transaction. Unexpected success would have failed the check and rolled back.

| Procedure | Expected | Actual |
| --- | --- | --- |
| `SELECT COUNT_BIG(ID) FROM dbo.FIS` | Approved read succeeds | 529,001 |
| `SELECT TOP(0) MUSTERI_AD FROM dbo.FIS` | Customer column denied | SQL error 230 |
| No-op `UPDATE` of `FIS_TURU` | Update denied | SQL error 229 |
| No-op `DELETE` of `FIS` | Delete denied | SQL error 229 |
| `CREATE TABLE` probe | DDL denied | SQL error 262 |
| `EXECUTE AS LOGIN='sa'` | Administrator impersonation denied | SQL error 15406 |

The initial delete attempt returned SQL error 1934 because required session SET options differed. That was not counted as a permission denial. Retrying with `QUOTED_IDENTIFIER`, ANSI options, `ARITHABORT` and `CONCAT_NULL_YIELDS_NULL` enabled, and `NUMERIC_ROUNDABORT` disabled, produced error 229. The private receipt retains both attempts.

These checks prove this evidence account's tested restrictions on the isolated copy. They do not prove the future complete extraction lifecycle, actual production TLS compatibility, all privilege categories or Windows preparation support. The local copy uses a self-signed certificate; any explicit local trust exception must remain visible in the collector artifact and cannot become a production default.

## Implementation and verification

The developer command and its procedure are described in [Collect source evidence](../operations/collect-source-evidence.md). Its artifact is separate from an analytics package. The application's synthetic mapping gates remain unchanged. Only a complete, bounded, validated observation can be published, and publication cannot overwrite an existing file.

The [verification receipt](issue-26-orbstack-verification.json) binds the final collector at `19877d8` to the source batch, commands, results and limitations. The host was macOS 27.0 on an Apple M4 Pro with 24 GiB RAM and Node 24.15.0. SQL ran through the installed SQL Server command-line tool 13.1.0007.0 and ODBC 13 in an amd64 tools container on OrbStack.

The final restricted-account collection produced 15 type/currency groups, all expected counts and 17 allowlisted catalog columns. Its private artifact SHA-256 is `bf5704642c4bf67e43ef072bac35d9a119932b5b58a4089a4eeafbb37c0e17ce`. Its file mode was `0600`. The schema fingerprint is `04870db25f035a782d7b5ee64d02d80ccb0f106c502bc4ff166b761269f33f00`, covering only those columns. The run took 540 ms and returned 1,547 protocol bytes; this is evidence collection timing, not extraction or application performance acceptance.

Actual command checks rejected a wrong password, default certificate validation against the local self-signed certificate, a writable database and a revoked product-ID read permission. None published output. Reusing an existing destination returned failure and preserved its hash. Restoring the permission and frozen state allowed another successful run with identical observations. No restricted-reader sessions remained after success or failure.

For deterministic interruption checks, a private test wrapper inserted a ten-second `WAITFOR` before the fixed query. SIGINT after observing an active SQL session and a two-second collector deadline both returned a fixed error without publishing a file or retaining a reader session. These checks exercise the actual SQL connection but use an instrumented wrapper. Local process-group termination does not manage remote Docker containers. Two tools containers from those checks required explicit operator cleanup. The disposable database container, copied volume, helper containers, network and temporary credential files were all removed. The original remains stopped. The 15 original data-directory file hashes matched across the preservation checks; their private manifest hash appears in the receipt.

The initial test-first contract failed because the new module did not exist. That records an absent implementation, not a demonstrated financial behavior bug. Actual SQL execution then exposed two compatibility failures before successful collection. `-X1` suppressed the password environment variable, as described in the [sqlcmd options](https://learn.microsoft.com/en-us/sql/tools/sqlcmd/sqlcmd-utility?view=sql-server-ver17#-x1). The initial server permission check also used an invalid securable class; [HAS_PERMS_BY_NAME](https://learn.microsoft.com/en-us/sql/t-sql/functions/has-perms-by-name-transact-sql) requires null server scope arguments. Both were corrected while retaining fail-closed account checks and fixed diagnostics.

Verification passed 29 unit tests, 245 integration tests, typecheck, lint, build, Mac packaging and the package notice check. Of 29 packaged desktop tests, 26 passed and three Windows-only checks were skipped. Three existing tests initially attempted to launch a Windows executable on Mac; all passed after rerunning with the supported `ESMER_EXECUTABLE` override. The Mac archive check found no project tools or private database artifacts. The Windows distribution inventory expects a different directory layout, so its attempted Mac invocation failed before an inventory could be produced. No Windows packaging or acceptance claim follows from that attempt.

Independent Astra High Standards review found a cancellation defect where a wrapper could exit before its descendant was killed. Commit `34345b4` reproduced it and `19877d8` fixed it by awaiting group escalation. Independent Spec review found that the POSIX executable fixtures would fail on Windows; the fix explicitly skips only this developer-tool fixture suite on Windows. Both re-reviews passed. A Sol High comment audit removed one redundant comment and found no suppressions. Two Sol Medium design candidates and a Sol High judge selected the installed CLI approach over a new driver dependency. These reviews used one model family.

Prior Windows results in [the synthetic capacity record](issue-26-import-capacity.md) remain evidence for their original build only. The POSIX collector checks are not Windows source preparation acceptance.

## Remaining acceptance work

R1 still needs approved economic identity for sales and conversions, treatment of missing-line headers and foreign-currency dependencies, historical cost and return attribution, business-date semantics, approved display fields, reduced examples and independent financial oracles. Storage precision and matching aggregate counts resolve none of those automatically.

R2 still needs the actual bounded record extractor, driver selection, exact value and timestamp proof, failure/retry/termination verification and supported TLS/source configuration. The evidence collector does not select or normalize financial records. R3 through R6 still need real provenance, bounded/full-population imports, report/export/recovery evidence and Windows acceptance. R7 and live implementation remain subject to issue #14's entry gate.

Continue on `codex/issue-26-real-import`. Do not close issue #26 or enable live access from this increment. The next financial implementation requires a reviewed rule and independent oracle for its declared population, rather than relabelling these observations as a supported mapping.
