# Monthly data path measurements (#101)

Task: [issue #101](https://github.com/AlesSystems/esmer-market-analytics/issues/101), window/cap decision in [issue-101-monthly-window](../decisions/issue-101-monthly-window.md). Raw results: [2026-10-22-monthly-data-path.json](2026-10-22-monthly-data-path.json).

## Environment

- Branch `feat/monthly-data-path-101`, commit `376c48d` (implementation `9ec6561`).
- Disposable local Azure SQL Edge container (arm64 image already present on the machine, port 14339, loopback only), created for this run and removed afterwards. No real backup, credential or source row was used.
- Node v24.15.0, macOS, Apple M4 Pro (darwin-arm64).
- Procedure: `tests/integration/monthly-volume.test.ts`, run with `ESMER_SQL_TEST_ADMIN=<private admin json>` and `ESMER_MONTHLY_VOLUME_OUT=<private output>`. It creates a random fixture database, adds the cost column, seeds six months (April–September 2025) with 5,508 documents and 18,858 lines per month over 3,529 products in 40 groups, then calls `prepareMonthlyEstimate` for September with 1, 2, 3 and 6 months. Each package is imported into a new file-backed store, and the September summary estimate is opened once.

## Results

| Requested | Written window | Rows (documents + lines + products) | Package bytes | Prepare ms | Import ms | First estimate ms |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 2025-09 | 27,895 | 7,328,994 | 2,101 | 282 | 369 |
| 2 | 2025-08 – 09 | 52,261 | 14,307,878 | 2,553 | 393 | 424 |
| 3 | 2025-07 – 09 | 76,627 | 21,286,762 | 3,473 | 642 | 606 |
| 6 | 2025-07 – 09 (shrunk from 6) | 76,627 | 21,286,762 | 14,141 | 537 | 501 |

The six-month request tried six, five and four months, hit the 100,000-row bound each time and wrote three months. Each extra month adds about 24,366 rows and 7.0 MB at this volume. Six months would be about 150,000 rows and 43 MB.

## Other checks on this path

- `tests/unit/sql-allowlist.test.ts` (A01/A05): the generated header, line and product SQL references only allowlisted columns per table alias, contains no `*` or write/exec keywords, contains no customer, supplier, employee or average-cost names, and adds the cost column only to estimate line reads. The reader guard rejects sysadmin, db_owner, and write/alter/control permission on all six read tables.
- `tests/integration/monthly-sql.test.ts` (SQL Edge): an ungranted cost column fails with `SOURCE_REJECTED`. A granted run writes `sql-backup-estimate-v2` with the exact window, cost values, catalogue rows and no sentinel, extra cost column, supplier ID, password, user or server text. The live projection stays without the cost column. A 120,000-line two-month source shrinks to the selected month.
- `tests/integration/monthly-package.test.ts`: importing a newer six-month estimate package keeps the financial snapshot, expenses, settings, revision history, import history and accepted reports. A corrupt package afterwards keeps the newer package.
- CLI run against `npm run synthetic-sql -- start` (plus the cost column) printed `MONTHLY_ESTIMATE_PREPARED 2025-04-01..2025-09-30 months=6/6 ...`, wrote a 0600 file next to the connection file and refused a second run with `OUTPUT_EXISTS`.

## Limitations

- Synthetic shape only: uniform documents and a fixed line-per-document ratio. Real months can differ, especially around holidays.
- Timings come from one run on one Mac with SQL Edge on the same machine. They do not cover a Windows computer, a remote SQL Server, desktop IPC transport, encrypted recovery of the larger package, or Excel export.
- Product catalogue column names are those of the synthetic schema. They remain unverified against the real source.
