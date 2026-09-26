# Collect isolated source evidence

This developer command collects the R1 metadata and population observations for [issue #26](https://github.com/AlesSystems/esmer-market-analytics/issues/26). It produces `SourceEvidenceV1`, not an analytics import package. It does not establish sales, cost, tax, return or profit semantics. See the [source contract](../contracts/source.md) and [foundation acceptance requirements](../superpowers/specs/2026-09-04-esmer-market-rebuild-acceptance.md).

## Preconditions

Use only a separately authorized, frozen, isolated restored copy. Document its lineage and freeze procedure outside Git. The collector requires SQL Server `READ_ONLY` before and after its fixed reads. This setting does not prove that the operator selected the authorized copy.

Provision a restricted SQL login separately. It needs column SELECT on `dbo.FIS(ID,FIS_TURU,FIS_TARIHI,DOVIZ_AD,DURUM,AKTIF)`, `dbo.FIS_DETAY(ID,FIS,STOK)`, `dbo.STOK(ID)` and `dbo.DOVIZ_AD(ID,AD)`, plus catalog visibility for the reviewed columns. The collector rejects `sa`, `dbo`, sysadmin, db_owner and CONTROL SERVER. Separately verify write, DDL and administrative denials. The collector never creates users, changes permissions or modifies database settings.

Use Node 24 and an installed compatible `sqlcmd`. The actual isolated engine and executable must be verified together. No driver dependency enters the application. POSIX process-group cancellation is implemented; Windows child-tree cancellation and Windows developer-host acceptance remain unverified.

## Private inputs and command

Create a private JSON file with this shape. Rejecting unknown keys prevents accidentally accepting a password or SQL statement in it.

```json
{
  "scope": "isolated-copy",
  "server": "isolated-endpoint",
  "database": "isolated-database",
  "user": "restricted-reader",
  "sqlcmdPath": "/trusted/path/to/sqlcmd",
  "trustServerCertificate": false
}
```

`scope`, `server`, `database` and `user` are required. `sqlcmdPath` defaults to `sqlcmd` on PATH. It is a trusted executable, optionally an operator-owned private wrapper. The collector does not implement container management. A wrapper must forward arguments, stdin, exit status and signals correctly and must not log credentials. `trustServerCertificate` defaults to false. Setting it true adds `-C` and records `server-certificate-not-validated` in the private artifact.

If a wrapper starts a remote Docker container, give the operator a separate cleanup procedure. Killing the local process group does not guarantee removal of that container. The [OrbStack verification](../evidence/issue-26-source-validation.md) records this distinction and the explicit cleanup of instrumented test helpers.

Supply `SQLCMDPASSWORD` through a protected environment mechanism. Do not place the password in shell arguments, scripts, Git, command logs or this configuration file. The collector passes it only in the child environment and removes other inherited `SQLCMD*` variables. The command has three positional arguments.

```sh
node tools/collect-source-evidence.ts /private/connection.json /private/evidence.json 10000000-0000-4000-8000-000000000001
```

Use a fresh opaque UUID v4 batch identity and a destination that does not exist. The output directory must already exist and be private. The success token is `EVIDENCE_COLLECTED` with exit 0. Every error emits only `EVIDENCE_FAILED` with exit 1. No path, connection field, driver error or evidence value is printed.

## Fixed evidence contract

One `sqlcmd` invocation reads only the compiled query. No SQL, table or column argument exists. It uses encrypted transport, a 15-second login timeout, a 30-second query timeout, a 45-second wall deadline and a combined 128 KiB stdout/stderr limit. Abort, SIGINT, SIGTERM, timeout or output overflow terminates the process group, escalates to SIGKILL after 250 ms and awaits child closure. Errors and malformed output never publish a final artifact. A forced host crash can leave a private `.partial` file; remove only an identified collector temporary file manually.

The query emits a strict tagged-line protocol. The parser rejects unknown tags, columns, types, duplicate fields, malformed counts/dates, inconsistent group counts, and missing pre/post state markers. It requires all reviewed columns and types. Schema drift fails closed instead of broadening the export.

The JSON contains:

- Format/query-set versions, an opaque source-batch identity and UTC collection timestamp.
- Numeric engine edition, product version, compatibility level and both read-only observations.
- The reviewed catalog column names, types, precision and scale, plus SHA-256 of their sorted JSON representation. This fingerprint covers only the allowlisted projection, not the complete database schema.
- Exact textual `COUNT_BIG(ID)` values for FIS, FIS_DETAY and STOK. This counts non-null IDs; the separately inspected source identifier contract must establish their non-null row identity.
- At most 128 document-type/currency groups, exact textual counts and SQL style-126 minimum/maximum FIS_TARIHI values. Dates retain SQL text without a host timezone conversion; null dates remain null. Document types have no assigned financial meaning. Currency output is TRY, USD, OTHER or null. No raw dictionary name is exported. Group counts must sum to the FIS count.
- Elapsed time, stdout byte count and explicit limitations.

Catalog columns are FIS `ID,FIS_TURU,FIS_TARIHI,DOVIZ_AD,DURUM,AKTIF`; FIS_DETAY `ID,FIS,STOK,BELGE_TARIHINDEKI_SON_ALIS_FIYATI,CARPAN,MIKTAR_FIS,TOPLAM_KDV_MATRAHI,TOPLAM_KDV`; STOK `ID`; DOVIZ_AD `ID,AD`. Decimal columns are metadata only. No raw monetary value, customer/counterparty field, display text or record is returned. The dictionary join rejects duplicate IDs before grouping.

Publication uses a same-directory exclusive `0600` temporary file, file fsync, and a no-overwrite hard link. An existing destination remains unchanged. This protects atomic visibility; directory fsync and power-loss durability are not claimed. Keep the artifact outside Git and reference only its opaque identity and separately calculated hash in sanitized evidence records.

## Verification

Run `npm run test:integration -- tests/integration/source-evidence.test.ts`, `npm run typecheck` and `npm run lint`. The integration tests execute a fake sqlcmd through the real spawn and CLI paths. They prove exact count preservation beyond `2^53`, protocol rejection, limits, cancellation and exclusive publication. They do not prove SQL syntax, actual restricted privileges, TLS compatibility or financial reconciliation. Record actual isolated-source checks separately. A02/A03 and Windows acceptance stay open until their required evidence exists.
