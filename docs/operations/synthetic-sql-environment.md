# Synthetic SQL development environment

Operator-owned loopback SQL Server only. This repository does not install the engine. Use a private admin JSON with `scope: "isolated-test-setup"` and user `sa`. The port must not be `1433`. Point `ESMER_SQL_TEST_ADMIN` at that file.

Recorded disposable evidence used Azure SQL Edge `ProductVersion` `15.0.2000.1574`. That string is an observation, not a compatibility claim.

## Commands

Require `ESMER_SQL_TEST_ADMIN`. `start`, `seed`, `reset` and `check` also require `ESMER_SQL_DEV_CONFIG` pointing outside the repository. Refuse paths inside the repo.

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

Run `seed` before a scenario. Run `seed` again between row scenarios. Reseeding keeps the saved reader password and database GUID, so a running app keeps its configured connection. Seed also explicitly restores reader access. Existing malformed, foreign, wrong-password or mismatched-GUID configurations fail before row replacement.

`start` and `seed` require the private reader-config path. The first start seeds the database and writes its config; later starts validate its identity without clearing rows. An existing database with missing config requires explicit reset, avoiding a hidden credential rotation. `start` and ordinary row scenarios do not restore an outage. `reset` creates a new GUID and preserves the validated reader password; choose its new reader JSON in the app again. `stop` drops the synthetic database/login and removes only a validated owned reader config.

- `insert` adds header `1003` and line `2003`.
- `correct` sets header `1001` `GENELTOPLAM` to `50.00000000`.
- `delete` removes header `1002` and line `2002`.
- `backdate` sets header `1001` to `2025-08-01`.
- `source-reset` deletes every header and line. The database GUID stays the same.
- `incomplete` adds header `1004` with no line.
- `late-low-id` commits header `1006`, then header `1005`. The command returns after both commits. The open-transaction lock barrier stays in `tests/integration/live-sql-server.test.ts`.
- `permission-loss` denies line reads until `recover` or `seed`. The already configured app must retain its previous preview and show the failure.
- `connection-loss` disables only the synthetic reader login. New refresh connections from the configured app fail with `SOURCE_UNAVAILABLE`; the SQL engine remains running.
- `rejected-candidate` is an extractor-only probe using a wrong GUID. It does not change the configured app; use explicit `reset` to exercise a real GUID change through app refresh.

`permission-loss`, `connection-loss`, and `rejected-candidate` also require `ESMER_SQL_DEV_CONFIG`.

## Point the packaged app at the reader

1. Run `seed` or `reset` so `ESMER_SQL_DEV_CONFIG` holds the reader `SqlServerConfig`.
2. In a fresh packaged app, use **SQL kaynağını içe aktar** and choose that JSON file. For an already configured app, use **Ayarlar → Test bağlantısını ayarla**.
3. The app account is the reader (`EsmerSyntheticDevReader`), never `sa`.
4. Live refresh stores a source preview. It does not activate a financial dataset.

## Track updates in the running app

After the first seed, configure the reader JSON once and enable live connection in **Ayarlar**. Keep the source workspace open. Every tick below is a finite command; use **Kaynağı yeniden kontrol et** or wait for the existing app refresh interval. Observe both live status and the source rows.

```sh
npm run synthetic-sql -- check baseline
npm run synthetic-sql -- scenario correct
npm run synthetic-sql -- check correct
npm run synthetic-sql -- seed
npm run synthetic-sql -- append
npm run synthetic-sql -- append
npm run synthetic-sql -- scenario connection-loss
npm run synthetic-sql -- check connection-loss
npm run synthetic-sql -- scenario recover
npm run synthetic-sql -- seed
npm run synthetic-sql -- check baseline
```

Each `append` adds one complete document with a distinct generated ID on the fixture's September 2025 date. Select September 2025 in the app. The first two ticks produce four documents/four lines from the two-document baseline. Fixed-ID scenarios remain one-shot between seeds; repeating `insert` without seed correctly rejects duplicate keys.

`check [baseline|scenario]` verifies the restricted reader snapshot, including each line's parent. It prints only the synthetic label on success and a fixed error code on failure. It proves SQL observation, while the app still needs its own refresh/UI evidence. `check recover` expects baseline; use `check correct` after recovering a corrected population.

During an outage, confirm the prior preview remains visible. After recovery, confirm the next app refresh succeeds without choosing the config again. Reseed and repeat insert/correct/delete/backdate, then quit/reopen the same app profile and compare counts. Accepted reports and app-owned expenses must remain unchanged. Database reset deliberately produces `SOURCE_CHANGED` with the old app config; configure the new JSON only after observing that protection.

## Boundaries

Every population is synthetic. Rows are not sales, cost, or profit. `FIS_TURU` 12 is a raw observation.

macOS or Linux runs do not close Windows packaged acceptance. Phase 11 and L01 stay open.
