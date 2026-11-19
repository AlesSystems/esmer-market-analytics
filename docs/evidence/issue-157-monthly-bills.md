# #157 monthly bill entry and correction

[Issue #157](https://github.com/AlesSystems/esmer-market-analytics/issues/157) · Phase 7 expense history and review · Tested app commit `801b4f8`

On macOS ARM64 with Node 24.15.0 and packaged Electron 44.3.0, the Giderler walkthrough set the renderer clock to 10 December 2026, selected Kasım 2026 and saved a synthetic electricity bill using only the category and `1.250,00`. The November record appeared after a full restart. An in-flight lost reply resolved to its original receipt. Two independently recorded bills with the same amount remained visible. Correction changed only the selected bill, retained its original amount in history and guarded its unsaved draft. Reversal and restoration appended versions.

The integration fixture migrated a schema 8 store containing a detailed manual expense and its receipt to schema 9. The legacy expense retained its day, payment month and tax treatment. The fixture verified that November's KDV-inclusive amount had month precision and no payment fields, a correction moved the bill to December and made both months' reviews stale, and both original receipts resolved after restart. Snapshot validation accepted the resulting history.

- `npm run test:unit` passed all 185 tests.
- `npm run test:integration` passed 315 tests with 17 skipped.
- `npm run test:desktop -- tests/desktop/manual-expenses.test.ts tests/desktop/expenses-control-desk.test.ts tests/desktop/design-finish.test.ts tests/desktop/welcome.test.ts` built the app and passed 22 desktop checks. The runner wrote the synthetic manual-entry and absent-receipt screenshots under the checkout's `test-results/manual-expenses-*`.
- `npm run typecheck`, `npm run lint` and `git diff --check` passed.

Windows desktop acceptance remains open. Run the same desktop scenarios with the integrated build's packaged Windows executable. Profit and Excel reconciliation are covered by separate workstreams #158 and #159.
