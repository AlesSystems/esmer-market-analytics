# Monthly estimate packages keep the package bounds

Date: 2026-10-22. Implements the window/cap decision of [issue #101](https://github.com/AlesSystems/esmer-market-analytics/issues/101) under [plan #111](https://github.com/AlesSystems/esmer-market-analytics/issues/111). Measurements: [monthly data path evidence](../evidence/2026-10-22-monthly-data-path.md).

## Decision

1. **Windowed monthly packages, bounds unchanged.** `npm run prepare:month -- <conn.json> <YYYY-MM> [months=6] [out.json]` asks for the selected calendar month plus up to five previous months. The 100,000-row and 32 MiB package bounds in `src/source/package.ts` stay as they are.
2. **Shrink from the oldest month.** If a window exceeds either bound, the command drops the oldest month and extracts again, down to the selected month alone. The printed line names the window actually written (`months=<written>/<requested>`). Every other failure (permissions, missing columns, wrong database, timeout) stops at once and writes nothing.
3. **One month that does not fit fails.** The command never splits or truncates a month.

## Why not raise the bounds

At synthetic volume shaped like the recorded September 2025 window (5,508 documents, 18,858 lines and 3,529 products per month), one month is 27,895 rows and 7.3 MB. Three months fit (76,627 rows, 21.3 MB). Four months need about 101,000 rows, and six months about 150,000 rows and 43 MB, so both bounds would have to rise.

The [estimate contract](../contracts/recorded-estimates.md) states that it does not change the 100,000-row bound. Packages above 100,000 rows would also activate the two-second benchmark of [#98](issue-98-profit-first-estimate-edition.md) (gate 6). The [import capacity decision](issue-26-import-capacity.md) requires full-path measurements (desktop transport, recovery, export) before a larger format. This node has none of those. Raising the bounds is therefore a separate product decision, not a side effect of the monthly command.

## Consequences

- At September 2025 volume the owner receives about three months per package. Month-over-month comparison works; a six-month trend (#108) does not, unless the real months are smaller or the bounds are later raised.
- A newer package replaces the previous source package. Expenses, settings, report history and accepted reports stay unchanged (regression test `tests/integration/monthly-package.test.ts`).
- Estimate packages need `FIS_DETAY.BELGE_TARIHINDEKI_SON_ALIS_FIYATI`. The extractor selects it only for this command (`extractSqlServer(..., {cost: true})`); the live connection and the preview command keep their earlier projection. The privacy contract describes this column as an application-input allowance and not permission to broaden runtime SQL queries; this command is the isolated-copy preparation path, not runtime access. Reviewers should confirm that reading.
- The catalogue columns `STOK.AD`, `STOK.STOK_GRUP`, `STOK.STOK_BIRIM`, `STOK_GRUP.AD` and `STOK_BIRIM.AD` from #99 remain unverified against the real schema. If any is missing or not granted, extraction fails with `SOURCE_REJECTED` and nothing is written.

## Revisit when

- An authorized real backup shows that typical months are smaller or larger than the September window.
- The owner needs six months in one view: raise the bounds together with the two-second benchmark and the full-path measurements above.
