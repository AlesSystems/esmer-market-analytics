# Isolated SQL synchronization contract

Related: [#14](https://github.com/AlesSystems/esmer-market-analytics/issues/14), prerequisite [#26](https://github.com/AlesSystems/esmer-market-analytics/issues/26), Tasks 11.1/11.2, D06/D07/D18 and L01.

## Delivery boundary

This implementation provides a read-only SQL transport, candidate synchronization controller, protected desktop configuration and local fallback. It is an **isolated connection preview**. A successful read publishes the same `sql-backup-estimate-v2` package `npm run prepare:month` writes (see [Live refresh package](#live-refresh-package)) through `importSourcePreview`. It does not activate a financial dataset. (`openSales` was removed in this change.) The [source contract](source.md) still has no approved real financial mapping. No real data is relabelled synthetic. This does not complete #14 or #26.

Synthetic packages exercise successful activation through the existing package validator and atomic store import. Actual SQL tests exercise coherent reads and the packaged application's rejection/fallback path. These are separate evidence claims.

## Read contract

`extractSqlServer` accepts a validated configuration whose scope is `isolated-copy`. It opens one encrypted TDS connection using pinned `tedious@20.0.0`, SQL authentication and a dedicated reader. Certificate verification is on by default; explicit certificate trust is for the disposable local test instance only. `sa`, `dbo`, administrative/database-owner permissions and writes to projected source tables are rejected. The runtime issues no source DDL or DML.

Each extraction starts a new SERIALIZABLE transaction. The engine provides a coherent serial state across the multi-statement scan; this is not a claim about an exact wall-clock snapshot instant. No `NOLOCK`, CDC, indexes or source settings are introduced. Serializable reads can block source writers. Representative source load and acceptable blocking remain release gates.

The scan rereads **all current headers and their current lines within the configured inclusive date range**, with a fresh primary-key cursor each time. It uses no persistent maximum-ID/date watermark or change-log cursor. Dates are SQL parameters converted with culture-independent style 112; source timestamps remain ISO strings without host timezone conversion. IDs and monetary/quantity decimals are converted to strings in SQL, before JavaScript sees them.

Limits: 256 records per batch, 100,000 combined rows, 32 MiB serialized raw rows, 10-second connect timeout, 15-second query timeout, 3-second lock timeout and 60-second overall extraction deadline. Cancellation closes the connection and waits for the driver's end event. Partial reads never activate. These limits support a bounded preview; they do not cover the whole historical database.

Projected source columns:

- `FIS`: `ID`, `FIS_TURU`, `DOVIZ_AD`, `DURUM`, `AKTIF`, `SATIR_TOPLAM`, `SATIR_ISKONTO_TOPLAM`, `FIS_ISKONTO_TOPLAM`, `KDV_TOPLAM`, `OTV_TOPLAM`, `TEFKIFAT_TOPLAM`, `GENELTOPLAM`, `FIS_TARIHI`.
- `FIS_DETAY`: `ID`, `FIS`, `STOK`, `FIS_TURU`, `CARPAN`, `MIKTAR_FIS`, `TOPLAM_KDV_MATRAHI`, `TOPLAM_KDV`, `TOPLAM_OTV`, `TOPLAM_TEVKIF`.
- `DOVIZ_AD`: join ID and a bounded `TRY`/`USD`/`OTHER`/null classification of `AD`.
- Engine version and `database_guid` from system metadata.

Customer identifiers/names, addresses, contacts, tax identifiers, employee/payroll data, product/supplier labels and raw change-log SQL are excluded. Raw financial observations are private even when they contain no identifying text. Only fixed error codes cross the worker boundary.

A configured `database_guid` must match before extraction. A changed GUID rejects the read. This is **not complete reset detection**: restoring or replacing data while retaining that GUID can evade it. Real mapping must define stronger lineage/reset evidence before activation. A header with no lines remains a raw observation and cannot become a reconciled financial claim.

## Activation and fallback

`LiveSynchronizer` stores bytes that `readRawPackage` accepts with `importPreview`. Those bytes never call `readPackage` or `importPackage`. A stored preview is not cleared when the financial dataset is absent or different. A financial candidate still goes through `readPackage`. That path requires the active lineage, mapping, coverage, provenance and currency to match. It compares normalized stream fingerprints against the currently active dataset. Identical financial records avoid another dataset. A→B→A with distinct capture identities can activate A again through ordinary store history. Historical package replay cannot be reported as fresh success.

The existing store owns staging, reconciliation, atomic activation, retention and rollback. Expenses, adjustments, settings and accepted report pins remain app-owned. A failed extraction/validation/import retains the last valid dataset. The service keeps local report reads and expense writes available during asynchronous SQL work. Package import and live refresh do not overlap; restore disables and drains source work before replacing the store.

The controller polls five minutes after completion, admits only one extraction, and retries after delayed cleanup without accumulating work. Refresh has a 60-second deadline. An idle state becomes stale more than 15 minutes after its last successful check; failures become stale immediately. Restarted enabled configuration with readable prior status starts stale and requires a fresh check. Missing or invalid status starts with no successful check recorded; enabling it reports only that the connection is open. Status distinguishes last successful source check from local data cutoff. Configuration defaults disabled.

Desktop main owns native configuration selection and OS `safeStorage` encryption. Configuration lives outside SQLite/recovery archives. Unavailable encryption and Linux `basic_text` fail closed. The renderer can only request status, native configuration, enable/disable and refresh; it never supplies arbitrary SQL, server addresses, paths or credentials. Sanitized status is durably stored separately; persistence failure is visible and cannot turn a committed import into a fictitious failure.

## Live refresh package

Before: `refreshLiveSource` extracted without cost (`extractSqlServer(config, signal)`) and wrote a `sql-backup-preview-v1/v2` package with `writeRawPackage` for the connection's whole from/to range. `source_preview` therefore had no cost column and Bu ay could not estimate profit after a live refresh.

Now: one data path, two ways in. Live refresh calls `prepareMonthlyEstimate(config, month, 6, signal, {clamp: true})`, the function behind `npm run prepare:month`, and stores its `sql-backup-estimate-v2` bytes with `importSourcePreview`. Both paths extract with `{cost: true}`, shrink the window to the 100,000-row / 32 MiB bounds by dropping the oldest month, and read the same `MonthProfitView`.

- **Month.** `latestLiveMonth` picks the month of the earlier of the connection's `to` and today (local date). It is an error (`WINDOW_OUTSIDE_CONFIG`) when the connection starts after that date.
- **Window.** Up to six months ending at that month, cut to the connection's from/to (`clamp`). `prepare:month` keeps its strict rule that the window lies inside the file's bound.
- **Differences between the paths.** Only `source.hash` (it covers the random extraction id) and `source.extractedAt` (capture instant) differ for the same source data; the integration test `live-month-view` asserts every other `MonthProfitView` field equal.
- **No change.** Raw packages compare by `rawFingerprint` (everything except extraction id and capture instant) against the stored preview. An identical read returns `unchanged` and does not rewrite `source_preview`. A failed refresh leaves the preview, expenses, settings and audit history untouched.
- **Analysis packages.** The `readPackage`/`importCandidate` branch of `LiveSynchronizer` is no longer reachable from the service (extraction yields raw packages only). It stays because the controller's fingerprint, source-change and fallback tests (`live-failure`, `live-reconciliation`) still exercise it.
- **Ayarlar.** After "Şimdi yenile" the app reloads availability; Bu ay follows the newest month of the loaded source until the owner picks a month (a saved or picked month is never overridden).

## Remaining obligations

Real normalized candidates, financial oracles, conversion/return dependencies outside the date window, complete history/capacity, reset detection, representative polling impact/freshness, eventual SQL Server version/TLS compatibility and Windows acceptance remain open. Existing archive/log coverage is incomplete evidence, so it is not used as the synchronization truth. See [acceptance evidence](../evidence/live-acceptance.md) and [operator procedure](../operations/live-rollout-tr.md).

References: [Tedious connection API](https://tediousjs.github.io/tedious/api-connection.html), [Tedious request API](https://tediousjs.github.io/tedious/api-request.html), [SQL Server transaction isolation](https://learn.microsoft.com/en-us/sql/t-sql/statements/set-transaction-isolation-level-transact-sql).
