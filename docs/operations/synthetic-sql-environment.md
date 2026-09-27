# Synthetic SQL development environment

Operator-owned loopback SQL Server only. This repository does not install the engine. Use a private admin JSON with `scope: "isolated-test-setup"` and user `sa`. The port must not be `1433`. Point `ESMER_SQL_TEST_ADMIN` at that file.

Recorded disposable evidence used Azure SQL Edge `ProductVersion` `15.0.2000.1574`. That string is an observation, not a compatibility claim.

## Commands

Require `ESMER_SQL_TEST_ADMIN`. `seed` and `reset` also require `ESMER_SQL_DEV_CONFIG` pointing outside the repository. Refuse paths inside the repo.

```sh
export ESMER_SQL_TEST_ADMIN=/private/sql-admin.json
export ESMER_SQL_DEV_CONFIG=/private/esmer-synthetic-dev-reader.json
npm run synthetic-sql -- start
npm run synthetic-sql -- seed
npm run synthetic-sql -- reset
npm run synthetic-sql -- scenario insert
npm run synthetic-sql -- stop
```

Success prints a line that includes `SYNTHETIC` and `EsmerSyntheticDev`. `seed` and `reset` read the rows back through the existing extractor and stop with `OBSERVATION_MISMATCH` when the view does not match the baseline. Passwords stay in the private reader JSON. Never commit that file.

## Reproduce a scenario

Run `seed` before a scenario. Run `seed` again between scenarios that change rows.

- `insert` adds header `1003` and line `2003`.
- `correct` sets header `1001` `GENELTOPLAM` to `50.00000000`.
- `delete` removes header `1002` and line `2002`.
- `backdate` sets header `1001` to `2025-08-01`.
- `source-reset` deletes every header and line. The database GUID stays the same.
- `incomplete` adds header `1004` with no line.
- `late-low-id` commits header `1006`, then header `1005`. The command returns after both commits. The open-transaction lock barrier stays in `tests/integration/live-sql-server.test.ts`.
- `permission-loss` denies line reads and expects `SOURCE_REJECTED`. Run `seed` again before you point the app at the reader. Seed restores the grant.
- `connection-loss` reads port `1` and expects `SOURCE_UNAVAILABLE`.
- `rejected-candidate` uses a wrong database GUID and expects `SOURCE_CHANGED`.

`permission-loss`, `connection-loss`, and `rejected-candidate` also require `ESMER_SQL_DEV_CONFIG`.

## Point the packaged app at the reader

1. Run `seed` or `reset` so `ESMER_SQL_DEV_CONFIG` holds the reader `SqlServerConfig`.
2. In the packaged app, use **Test bağlantısını ayarla** and choose that JSON file through the existing live-config file chooser.
3. The app account is the reader (`EsmerSyntheticDevReader`), never `sa`.
4. Live refresh stores a source preview. It does not activate a financial dataset.

## Boundaries

Every population is synthetic. Rows are not sales, cost, or profit. `FIS_TURU` 12 is a raw observation.

macOS or Linux runs do not close Windows packaged acceptance. Phase 11 and L01 stay open.
