# #158 monthly estimate and Excel export

[Issue #158](https://github.com/AlesSystems/esmer-market-analytics/issues/158) covers the manual bill deduction in the recorded-source estimate. The packaged macOS 27.0 ARM64 checks used Node 24.15.0 and Electron 44.3.0. App changes are in `81b4e68` and verification is in `8e2508d`.

The synthetic November fixture contains one sale for 15,000 TRY with a 5,000 TRY historical purchase cost and full November coverage. The packaged test set the renderer clock to December, selected Kasım 2026 and saved a 1,250 TRY electricity bill. Bu ay showed 10,000 TRY estimated gross profit and withheld the net figure until the owner confirmed expenses. The confirmed screen showed 8,750 TRY. The exported Özet worksheet contained decimal text values `10000`, `1250` and `8750`. The fixture and its paired Excel row are in `tests/helpers/november-bill-fixture.ts`.

The service tests verified missing gross profit, partial source coverage, a stale confirmation after correction and a blocking detailed expense. Correcting the bill to 1,250.25 TRY and confirming again yielded 8,749.75 TRY. The stricter operating result remained unavailable because the monthly bill lacked KDV evidence. Frozen accepted reports retained byte-equal content through a manual bill correction and encrypted recovery.

- `npm run test:desktop -- tests/desktop/v1-walk.test.ts` built the app and passed both packaged macOS tests. Playwright saved the v1 walk screenshots under `test-results/v1-walk-*`.
- `npm run test:unit` passed 186 tests. `npm run test:integration` passed 316 tests with 17 skipped.
- `npm run typecheck`, `npm run lint` and `git diff --check` passed.

The [integrated Windows verification](issue-155-giderler-windows.md) records the packaged checks for this change.
