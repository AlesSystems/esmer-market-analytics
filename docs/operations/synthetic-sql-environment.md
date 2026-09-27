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

Success prints a line that includes `SYNTHETIC` and `EsmerSyntheticDev`. Passwords stay in the private reader JSON. Never commit that file.

Closed scenarios: `insert`, `correct`, `delete`, `backdate`, `source-reset`, `incomplete`, `late-low-id`, `permission-loss`, `connection-loss`, `rejected-candidate`.

`permission-loss`, `connection-loss`, and `rejected-candidate` also require `ESMER_SQL_DEV_CONFIG`. They call the existing extractor and expect `SOURCE_REJECTED`, `SOURCE_UNAVAILABLE`, and `SOURCE_CHANGED`. `late-low-id` commits both rows before the command returns. The open-transaction lock barrier stays in `tests/integration/live-sql-server.test.ts`.

## Point the packaged app at the reader

1. Run `seed` or `reset` so `ESMER_SQL_DEV_CONFIG` holds the reader `SqlServerConfig`.
2. In the packaged app, use **Test bağlantısını ayarla** and choose that JSON file through the existing live-config file chooser.
3. The app account is the reader (`EsmerSyntheticDevReader`), never `sa`.
4. Live refresh stores a source preview. It does not activate a financial dataset.

## Boundaries

Every population is synthetic. Rows are not sales, cost, or profit. `FIS_TURU` 12 is a raw observation.

macOS or Linux runs do not close Windows packaged acceptance. Phase 11 and L01 stay open.
