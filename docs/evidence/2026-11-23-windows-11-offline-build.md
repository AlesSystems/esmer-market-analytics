# Windows 11 offline build receipt

On 23 November 2026, the portable Esmer Market Analytics 1.0.1 build at `d2f5a30659482619548b3c3d41fbf17664b65e05` passed the native Windows 11 walkthrough with synthetic data. This receipt records the redesigned app checks from [#151](https://github.com/AlesSystems/esmer-market-analytics/issues/151), the Windows smoke scope from [#109](https://github.com/AlesSystems/esmer-market-analytics/issues/109), and same-machine recovery under [decision #98](../decisions/issue-98-profit-first-estimate-edition.md). The earlier installer lifecycle proof belongs to the [11 November build](2026-11-11-windows-v1-smoke.md).

## Build and environment

- [Windows CI run 45170289016](https://github.com/AlesSystems/esmer-market-analytics/actions/runs/45170289016) built the installer and portable distributions from the selected main commit. The [distribution artifact](https://github.com/AlesSystems/esmer-market-analytics/actions/runs/45170289016/artifacts/14817730357) expires on 7 December 2026. This build includes the [leaf-green branding](2026-11-23-leaf-green-branding.md) and [monthly charts](2026-11-20-monthly-charts.md). [PR #173](https://github.com/AlesSystems/esmer-market-analytics/pull/173) merged after the build was selected. Its [main Windows CI run](https://github.com/AlesSystems/esmer-market-analytics/actions/runs/45173226792) passed separately. The native results below apply to the pinned binaries.
- Windows 11 Pro 25H2 x64, build `26200.9974`, Intel Core i9-12900H, 33,974,288,384 bytes of RAM, and a 1920 × 1200 display. Windows scale changed from its initial 125% to 100% and 150%, then returned to 125%. Electron measured each setting in the running app.
- Local build tools were Node 24.15.0 and npm 11.12.1. The packaged runtime was Electron 44.3.0. Microsoft Excel 16.0.15128.20246 opened and saved the exported workbook.
- The fixture was `fixture:rich-estimate` / `rich-estimate-1`, generated with `node tools/make-synthetic-estimate.ts`. Its 2,994 headers and 7,415 lines cover 1 August through 31 October 2025. File SHA-256 was `cd5930e3153b1ab6c5794d254f872fc6210281000cb81ea487bb8bbd9b7a2b8e`. The only added expense was synthetic October rent of 1,000 TRY.

The downloaded executable sizes and hashes matched the distribution manifest. Both unsigned containers held the same inspected payload.

| File | SHA-256 |
| --- | --- |
| `Esmer Market Analytics Setup 1.0.1.exe` | `ec115daba98e541e873d14b4a4a42fe8d5892508ff9b847f857c5b7e25e284e8` |
| `Esmer Market Analytics 1.0.1.exe` | `b525c9c194be26a0523a5c5838e2441b64b3ac88ffb1bf7c57bf47c460dd85fc` |
| `distribution-inspection.json` | `79f83a3604f73d2b66d4ee980d46c675d6b1b63b09b2ae7119ff7225d515c207` |
| `release-inventory.json` | `018e6a45871ef09b721ecdfe4f19c41dea815581056d557f78c7eb3565447a70` |
| `resources/app.asar` | `d5a2e10a9884d76645781cf98bbfa6a59e1900740032ccd6c0123865c5a622d0` |

## Automated verification

The selected CI run passed `npm ci --no-audit --no-fund`, `npm run typecheck`, `npm run lint`, 183 unit tests, 311 integration tests, `npm run package:win`, and 79 packaged desktop tests. It recorded 29 integration skips for optional source or platform fixtures and six desktop skips for optional captures. Distribution verification printed `PACKAGE_NOTICES_OK 79 dependencies` and `DISTRIBUTIONS_MATCH_INSPECTED_PAYLOAD`.

The local Windows 11 build passed the same install, typecheck, lint, unit, integration, and packaging commands using the `cmd.exe` script shell. The local archive had the same SHA-256 as the CI archive. Local package inventory reported 80 unpacked files, 3,078 archived files and zero prohibited-file violations. With `ESMER_EXECUTABLE` pointing to the local `release/win-unpacked/Esmer Market Analytics.exe`, `npm exec -- playwright test` passed 79 tests at native 125%, with six optional capture skips.

## Native walkthrough

The exact downloaded portable executable ran under explicit disposable `--user-data-dir` paths and with the Windows directories on `PATH`. The app opened to the empty Bu ay view in a fresh profile. Playwright exercised the renderer. The operating system dialogs handled file and folder selection and confirmation.

| Procedure | Observed result |
| --- | --- |
| Import the synthetic package through Ayarlar | The Windows picker loaded the package. Bu ay selected October 2025 and displayed 01.10.2025 through 31.10.2025. The app displayed estimated gross profit and withheld net profit before expense review. |
| Inspect product and source records | Ürün #1003 showed a 30.52% margin and a missing-cost explanation. Kaynak satırlar opened its October sales documents. Ürünlere dön returned to the product list. |
| Review the expense | The Windows save dialog exported the template. The filled workbook used its column order. The Windows open dialog imported one October rent row for 1,000 TRY. After confirmation of the empty expense groups, Bu ay showed 143,100 TRY estimated net profit. |
| Export and open in Excel | The Windows save dialog wrote the October workbook. Excel opened it and Save As created a separate copy. All cell values and types matched across the 23 Özet, 56 Ürünler and 12 Giderler rows. |
| Check display scaling and settings | At native 100%, 125% and 150%, the monthly view, product detail and source return, expense view and settings remained reachable. The three viewports measured 1104 × 721, 1106 × 723 and 1106 × 715 CSS pixels, with no horizontal page overflow. Ayarlar showed the import, recovery, text size, disabled live connection, source documents and limitations controls. |
| Back up and restore | Native dialogs selected a backup folder and saved and verified a separate recovery-key file. The app showed Son doğrulanan yedek. On this PC, another empty profile restored the backup using the native dialogs. The restored expense, confirmation and net estimate returned. A fresh export matched the original worksheet values and types. Both recovery files were on the same disk. |
| Close and reopen the portable build | The original synthetic profile reopened with the October net estimate of 143,100 TRY. Live SQL remained disabled. |

An independent integer-kuruş calculation over the fixture produced 573,259 TRY in recorded sales and 529,051 TRY for sales with supported costs. Subtracting 384,951 TRY in estimated costs gave 144,100 TRY estimated gross profit. Subtracting 1,000 TRY for the reviewed expense gave 143,100 TRY estimated net profit. The app and the October export matched these values. The raw-estimate restore preview showed `Veri kesim tarihi: Bilinmiyor`. The restored monthly page reported 31.10.2025 as the package cutoff.

[Monthly view at 100%](images/2026-11-23-windows-11/monthly-100.png) · [Confirmed expenses at 125%](images/2026-11-23-windows-11/expenses-125.png) · [Product detail at 150%](images/2026-11-23-windows-11/product-150.png) · [Settings at 150%](images/2026-11-23-windows-11/settings-150.png)

## Open Windows and owner checks

Installation and uninstall for this exact NSIS executable remain open. The test account already had an Esmer Market installation with the same NSIS registration. The locked installer can run the previous uninstaller even when given a different destination. The existing installation was preserved. A disposable Windows account or machine can complete the native installer lifecycle with the hashed executable above, following the [Windows procedure](../operations/windows-v1-handoff.md). Windows 10 and SmartScreen behavior for a fresh download remain untested.

Owner installation, acceptance and production SQL stay under [#110](https://github.com/AlesSystems/esmer-market-analytics/issues/110). Independent recovery and power-loss durability stay under [#138](https://github.com/AlesSystems/esmer-market-analytics/issues/138). This receipt exercises the offline application with a synthetic package.
