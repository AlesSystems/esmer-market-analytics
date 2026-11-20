# Bu ay profit explanations

[Issue #163](https://github.com/AlesSystems/esmer-market-analytics/issues/163) covers the gross-profit popup and the net-profit card on **Bu ay**. The tests launch the packaged application using disposable profiles and synthetic source packages and expenses.

| Selected month scenario | Expected result on Bu ay |
| --- | --- |
| 1.000,00 ₺ of sales, of which 800,00 ₺ have a known cost of 500,00 ₺ | The popup shows 800,00 ₺ − 500,00 ₺ = 300,00 ₺ and explains the excluded 200,00 ₺. |
| One 200,00 ₺ sale with missing cost and one sale of unknown amount | The popup explains why gross profit is unavailable, gives the excluded known amount, and counts one unvalued record. |
| Sales and costs of 80,00 ₺ and 80,00 ₺, then 100,00 ₺ and 137,00 ₺ | The popup shows 0,00 ₺ and -37,00 ₺ in their respective months. |
| 300,00 ₺ gross profit and 100,00 ₺ of reviewed rent | The net card shows 300,00 ₺ − 100,00 ₺ = 200,00 ₺. Correcting rent to 350,00 ₺ withdraws the result until review, then shows -50,00 ₺. |
| A partial source month, unavailable gross, missing or incomplete expenses, unknown KDV, or a blocked expense | The net card explains the selected month's reason. A partial month shows the first and last covered dates. Expense actions open Giderler for the selected month. |
| Explicit zero-expense confirmation | The net card shows 0,00 ₺ in the deduction and repeats the gross amount as the net result. |

The [gross popup tests](../../tests/desktop/approved-a.test.ts), [net card tests](../../tests/desktop/net-profit-states.test.ts), and [expense confirmation tests](../../tests/desktop/expense-confirm.test.ts) exercise these examples. The popup opens from the keyboard, closes with Escape and returns focus to its trigger. The layout checks include a 680-pixel window at 200% zoom.

[Gross popup](images/bu-ay-163/gross.png) · [Gross popup at 200%](images/bu-ay-163/gross-zoom.png) · [Net card](images/bu-ay-163/net.png)

## Packaged verification

The screenshots and local results use application revision `1808caa5b2a9edb31e10e9ebedd8fb7b56e77e33`, Electron 44.3.0 and Node 24.15.0 on macOS 27 arm64. The focused regression for June 10–30 first reproduced the old month-end-only explanation. The corrected card displayed the covered date range for June 10–30 and October 1–20.

Local typecheck, lint, 180 unit tests and 323 integration tests passed. The packaged runs exercised the gross, net, expense confirmation and Bu ay journeys.

[PR #170](https://github.com/AlesSystems/esmer-market-analytics/pull/170) records the separate Windows build and packaged-test run for this change. Its Windows validation workflow runs `npm run package:win`, inspects the NSIS and portable payloads, then launches the inspected executable for Playwright with synthetic profiles.
