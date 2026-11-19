# Giderler verification on packaged Windows

This receipt covers the owner workflow in [#155](https://github.com/AlesSystems/esmer-market-analytics/issues/155) and [the Windows verification ticket](https://github.com/AlesSystems/esmer-market-analytics/issues/160). The application revision was `dfb08af9624a04f20a1f95ef17c6ad9130385e18` on `codex/giderler-155`. GitHub Actions tested the PR merge commit `e317f922471c70eb35ae2cf9db91cecbfcf409ca` against main `fe3d287`. [Windows validation run](https://github.com/AlesSystems/esmer-market-analytics/actions/runs/44545722047)

## Build and procedure

The runner used Microsoft Windows Server 2025 (10.0.26100) x64, Node 24.15.0 and packaged Electron 44.3.0. CI installed the locked dependencies, ran typecheck, lint and both Vitest suites, then ran `npm run package:win`. The distribution checks compared the installer and portable payloads with the inspected application. Playwright launched `release/win-unpacked/Esmer Market Analytics.exe` with a fresh, disposable profile. The tests supplied synthetic files at the native open and save dialogs and read back the generated Excel worksheets.

| Procedure and expected outcome | Observed result |
| --- | --- |
| Start with a full November 2026 source package. In December choose November and open **Elle gider ekle**. | The form accepted Elektrik and 1.250,00 TRY. After restart, one November bill remained. No day, payment, net amount or KDV split was created. |
| Inspect Giderler, then open the Excel import flow before choosing a workbook. | Both former main-page disclosures were absent. Empty history, template download and previously imported batches were accessible. |
| Open Bu ay before and after marking November's expenses complete. | Gross was 10.000,00 TRY. Net was withheld before review. The reviewed screen and exported Özet worksheet agreed on 1.250,00 TRY in expenses and 8.750,00 TRY estimated net. |
| Attach the matching 15 November workbook row with evidenced recoverable KDV to the original bill. | One active expense remained and review became stale. After a fresh review, the screen and export showed a 1.000,00 TRY deduction and 9.000,00 TRY estimated net. Replaying the workbook kept one expense and one batch. |
| Keep a second genuine 1.250,00 TRY bill with evidenced non-recoverable KDV. | Two bills remained. After review, the screen and export showed 2.250,00 TRY in expenses and 7.750,00 TRY estimated net. |

The [November fixture](../../tests/helpers/november-bill-fixture.ts) contains one sale for 15.000 TRY with recorded cost of 5.000 TRY. The [packaged walkthrough](../../tests/desktop/v1-walk.test.ts) reads literal amounts from the exported workbook and checks calculation version `month-profit-v2`. The [expense desktop suite](../../tests/desktop/expenses.test.ts) also covers a choice between multiple manual candidates, keeping a matching manual bill separate, and protecting edits after enrichment.

[Manual entry](images/giderler-155/manual.png) · [Excel matching](images/giderler-155/match.png) · [Reviewed November estimate](images/giderler-155/net-manual.png)

The first Windows pass identified a timing issue in the walkthrough when the source import finished after navigation to Giderler. The corrected test waits for successful import and the November gross figure before opening expenses. The integrated build also includes the draft-confirmation dialog from [PR #162](https://github.com/AlesSystems/esmer-market-analytics/pull/162). [Earlier Windows run](https://github.com/AlesSystems/esmer-market-analytics/actions/runs/44543477266)

## Service and recovery evidence

- The [operating result tests](../../tests/unit/operating-profit.test.ts) withhold the stricter result for a month-only bill with unknown KDV. The [monthly service tests](../../tests/integration/month-profit.test.ts) check missing gross profit, partial source coverage, stale review and blocked detailed expenses.
- The [import tests](../../tests/integration/expense-import.test.ts) exercise failed multi-row confirmation, ambiguous matches, exact replay and numerically equivalent amounts. The [recovery tests](../../tests/integration/recovery-accepted-reports.test.ts) reopen frozen accepted report outputs after correction, Excel enrichment and encrypted restore.
- Windows passed 186 unit tests, 311 integration tests and 74 packaged desktop tests. The suite skipped 29 integration cases for platform-specific or optional source fixtures and six optional desktop captures. The Windows evidence artifact includes the package inventory, distribution inspection and synthetic screenshots. [CI evidence](https://github.com/AlesSystems/esmer-market-analytics/actions/runs/44545722047)

The run used synthetic data on a hosted Windows runner. Owner hardware, production source access and installation are outside this verification.
