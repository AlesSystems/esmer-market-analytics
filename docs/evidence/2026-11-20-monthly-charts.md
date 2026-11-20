# Monthly gross profit, net profit and margin

[Issue #164](https://github.com/AlesSystems/esmer-market-analytics/issues/164) extends the Bu ay analysis area with three charts. Verification uses synthetic packages in disposable application profiles. The service values and the charts are exercised through the existing monthly read and the packaged Electron application. [PR #171](https://github.com/AlesSystems/esmer-market-analytics/pull/171)

| Synthetic case | Observed result |
| --- | --- |
| The package begins 10 November 2025 and ends 20 January 2026. | November breaks even, December lacks usable cost, and January loses 42,50 ₺. Both partial months show their exact dates. The selected January margin is −9,88%, calculated on 430 ₺ of known-cost sales. |
| A single December package replaces the cross-year package. | December is the only chart month. The gross figure is 102,00 ₺. A separate zero-price sale with 100 ₺ cost gives a loss and an unavailable margin. |
| November 2026 has 10.000 ₺ gross and a 1.250 ₺ electricity bill. | Confirming expenses reveals 8.750 ₺ net, including when November appears in December’s history. Expense correction and explicit approval withdrawal each remove the obsolete figure on the next read. |
| An earlier month starts mid-month, and a subsequent month has no sales. | The partial month identifies the package coverage. The empty month reports that gross profit is unavailable. |
| Use the keyboard in a 680-pixel window at 100% and 200% Electron zoom. | Each disclosure opens an exact-value table with coverage, selection, result or reason. The chart and table fit the panel width at both zoom levels. |

The service checks also cover independent monthly expense approvals, confirmed zero expenses, break-even, losses, unknown KDV and blocking expense rows. See the [service cases](../../tests/unit/month-profit.test.ts), [gross profit workflow](../../tests/desktop/monthly-trends.test.ts), [margin workflow](../../tests/desktop/monthly-margin.test.ts) and [net profit workflow](../../tests/desktop/monthly-net-trend.test.ts).

## Packaged screenshots

| Chart | Narrow window | Exact values at 200% zoom |
| --- | --- | --- |
| Estimated gross profit | [Chart](images/monthly-charts-164/gross-chart-680-zoom1.png) | [Table](images/monthly-charts-164/gross-table-680-zoom2.png) |
| Estimated net profit | [Chart](images/monthly-charts-164/net-chart-680-zoom1.png) | [Table](images/monthly-charts-164/net-table-680-zoom2.png) |
| Margin | [Chart](images/monthly-charts-164/margin-chart-680-zoom1.png) | [Table](images/monthly-charts-164/margin-table-680-zoom2.png) |

## Build and reproduction

The screenshots above come from the packaged macOS arm64 app, version 1.0.1 at commit `62a34d8`, using Node 24.15.0 on macOS 27.0. Run `npm run test:desktop -- tests/desktop/monthly-trends.test.ts tests/desktop/monthly-margin.test.ts tests/desktop/monthly-net-trend.test.ts` to rebuild and exercise the three synthetic workflows. Playwright saves both zoom levels for every chart and table.

The Windows workflow builds and inspects the x64 installer and portable distribution, then runs the desktop suite against the packaged executable. Its evidence artifact retains the Windows captures and package manifests. The PR records platform results and environment-dependent skips. [Windows checks for PR #171](https://github.com/AlesSystems/esmer-market-analytics/pull/171/checks)
