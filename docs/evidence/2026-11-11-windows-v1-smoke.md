# Windows v1 smoke receipt

The Phase 10.1 / A07 v1 smoke journey passed on the development Windows 11 computer on 2026-11-11. These are agent-operated native application checks with synthetic data. They are not Eralp's acceptance or installation on his computer. The v1 scope follows [decision #98](../decisions/issue-98-profit-first-estimate-edition.md).

## Build and environment

| Field | Observed value |
| --- | --- |
| Application baseline | Main `7f5020cd231fa8f7a2f1427595591ede963828ec`, including merged [PR #137](https://github.com/AlesSystems/esmer-market-analytics/pull/137) |
| Validation branch | `codex/windows-current-validation` |
| Version | 1.0.1, installed executable 1.0.1.0. The older `v1.0.1` tag does not identify this build. |
| OS | Windows 11 Pro x64, 10.0.26200 |
| Hardware | Intel Core i9-12900H, 33,974,288,384 bytes RAM |
| Display | 1920 × 1200. Native Windows scaling 125% and 150%, confirmed by Electron scale factors 1.25 and 1.5. |
| Build tools | Node 24.15.0, npm 11.12.1. Downloaded Node archive matched the vendor's SHA-256 list. |
| Packaged runtime | Electron 44.3.0, Node 24.20.0, Chromium 152.0.7977.78, SQLite 3.53.4 |
| Excel | Microsoft Excel 16.0.15128.20246 |
| Fixture | `fixture:rich-estimate` / `rich-estimate-1`, 2,994 headers and 7,415 lines, August through October 2025 |
| Fixture SHA-256 | `cd5930e3153b1ab6c5794d254f872fc6210281000cb81ea487bb8bbd9b7a2b8e` |

The checkout initially pointed to an older clean development branch. The validation branch starts from current main. No source database, historical private backup or personal app profile was opened.

## Automated verification

The required outcome was passing checks and inspected installer and portable payloads. Commands ran with the task-local Node 24 directory first on `PATH`. Packaging used the documented process-local override `$env:npm_config_script_shell = "$env:SystemRoot\System32\cmd.exe"`; this host otherwise selects Windows PowerShell 5, which cannot parse the scripts' `&&` operators.

| Command | Actual result |
| --- | --- |
| `npm ci --no-audit --no-fund` | Passed with the locked graph under Node 24 |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed |
| `npm run test:unit` | 185 passed |
| `npm run test:integration` | 302 passed, 29 skipped |
| `npm run package:win` | Passed, including its `npm run build` |
| Package notices and inventory | `PACKAGE_NOTICES_OK 79 dependencies`; 81 outer files, 3,078 archive files, no prohibited-file violations |
| Distribution comparison | `DISTRIBUTIONS_MATCH_INSPECTED_PAYLOAD` |
| `npm exec -- playwright test` with absolute `ESMER_EXECUTABLE` pointing to `release/win-unpacked/Esmer Market Analytics.exe` | 68 passed, six skipped at native 125% |

The 29 integration skips retain the same boundaries as the [October CI receipt](2026-10-27-windows-ci.md). Eleven require POSIX executable fixtures, 17 require optional isolated SQL configuration, and one requires an Apple Silicon Mac. No source configuration was supplied. The six desktop skips are optional captures, one Bu ay, two Giderler and three visual capture cases. Recovery, lifecycle and the expense month-navigation regression ran.

### Failures and fixes

- Four Mac inventory tests initially failed during fixture setup with Windows `EPERM` on symbolic-link creation. The focused run reproduced four failures, seven passes and one skip. Windows directory junctions now exercise the existing link-admission and escaping-link assertions without elevation. The focused result became 11 passes and one skip. POSIX fixtures retain relative symbolic links. No release-inspection rule changed.
- Three desktop assertions initially failed at native 125%. Chromium reported a declared 1 CSS pixel divider as 0.8 pixels and a declared 2 pixel focus outline as 1.6 pixels. The assertions now account for device-pixel quantization and preserve the intended widths. Application styles did not change.
- The first full desktop run also recorded one native worker exit, code `3221226505`, before the v1 journey began. It is a runner failure, separate from those assertions. The focused journey and subsequent complete 68-test run passed. The orphaned app process used that failed test's temporary profile and was closed before installation.
- The first packaging attempt stopped in the host's PowerShell 5 script shell. The `cmd.exe` override resolved this toolchain failure. A separate log-filename error in the orchestration command was corrected before the affected test commands ran.

## Native walkthrough

The installer used a fresh guarded directory below `work/windows-current/lifecycle`. Both registry views in HKCU and HKLM were checked before installation. The historical `work/phase-10-lifecycle` receipts and the existing personal `%APPDATA%` profile were preserved. Every app launch specified an isolated `--user-data-dir`.

| Procedure | Expected and actual result |
| --- | --- |
| Install NSIS distribution | Installed successfully, exit 0. Installed archive matched the inspected archive. [Install receipt](windows-v1-2026-11-11/phase-10-install-proof.json). Installation was scripted; this is not a fresh-download SmartScreen observation. |
| Launch empty installed app | Opened Bu ay with three tabs and a gear menu. Turkish empty state, no login, live connection disabled. |
| Native package picker | Selected the synthetic package using the actual Windows file dialog. Import succeeded and selected October 2025. No dialog substitution. |
| Monthly figures and unavailable net result | Gross estimate 144,100.00 TRY. Net result withheld before expense confirmation. Missing costs remained excluded. |
| Product and source rows | Opened product #1003, inspected its estimate and missing-cost explanation, followed Kaynak satırlar and returned to the product list. Sale documents and Turkish dates loaded. |
| Expense template and Excel import | Saved `Sentetik-İşçilik-Çığ.xlsx` through the native save dialog. Opened it in Excel, entered a synthetic October rent of 1,000.00 TRY, saved and imported it through the native picker and preview. The category `Sentetik kira Çığ İşçilik` survived. |
| Completeness and net result | Explicitly confirmed the empty expense groups. Bu ay displayed gross 144,100.00 less expenses 1,000.00, giving net estimate 143,100.00 TRY. |
| Native report export and Excel | Saved `Rapor-Ekim-Çığ.xlsx`, opened it in Excel without a repair prompt and used native Save As for `Excel-kaydedildi-Çığ.xlsx`. All values and cell types in Özet, Ürünler and Giderler matched. [Comparison receipt](windows-v1-2026-11-11/excel-values.json). |
| Settings and limitations | The gear exposed package import, recovery, text sizes, disabled live connection, source documents and Hakkında ve bilinen sınırlar. The original walkthrough no longer has a Rapor ve Excel tab or five settings tiles. |
| Native 125% and 150% scaling | Walked the monthly, product, source-row, expense and settings surfaces. Controls remained reachable and Turkish text did not overlap. Vertical scrolling remained available. Reopened the app at 150% and retained the figures and confirmation. |
| Encrypted backup | Used real native directory, key save, key verification and confirmation dialogs. The app displayed a verified encrypted backup. The key was in a different directory outside the app profile. Both directories were on this test computer's disk. |
| Fresh-profile restore | Used the native backup and key pickers, reviewed the preview and confirmed restore into an empty profile. Source estimates, the imported expense and completeness returned. Exported at native 150%; all worksheet values and types matched the pre-backup export. |
| Portable and persistence | Launched the actual portable executable with the same explicit synthetic profile and a `PATH` containing Windows directories only. It showed gross 144,100.00 and net 143,100.00. The self-extracting wrapper timed out in `electron.launch`; normal launch followed by local CDP inspection passed. |
| Installer reapplication | Reapplied the exact same 1.0.1 installer. Database SHA-256 remained equal before and after. Reopening retained net estimate 143,100.00. This is a same-version reinstall, not a versioned or failed upgrade. [Receipt](windows-v1-2026-11-11/phase-10-upgrade-proof.json). |
| Uninstall | Uninstaller exited 0, removed the executable and registration, and preserved the database hash. [Receipt](windows-v1-2026-11-11/phase-10-uninstall-proof.json). The synthetic data is retained under ignored `work/`. |

The original backup and key were retained; this walkthrough did not simulate physical computer loss. The automated packaged recovery test separately exercised Windows DPAPI and profile-loss recovery.

### Independent numeric expectations

An independent aggregation of the synthetic fixture using integer kuruş gave October sale amount 573,259.00, covered sale amount 529,051.00, cost 384,951.00 and gross estimate 144,100.00 TRY. The single eligible expense is 1,000.00 TRY, so the expected completed-month net estimate is 143,100.00 TRY. The UI and native Excel export matched these values. Returns of 29,938.00 TRY are disclosed separately and do not reduce v1 profit. This establishes fixture arithmetic, not real-source financial semantics.

## Initial walkthrough artifacts

These files are retained locally in `work/windows-current/delivery`. A rebuild has its own hashes and must not be described as byte-identical.

| Artifact | SHA-256 |
| --- | --- |
| `Esmer Market Analytics Setup 1.0.1.exe` | `c92eaea03c9dd0a96162456139bb331e47b820ad01048415799383f389785627` |
| `Esmer Market Analytics 1.0.1.exe` | `2d61f9701a235310b66679fbca9185007c32b7231a2af28d05c53968138100f4` |
| `resources/app.asar` | `f9b8d6f1f165caa645e96718c255550a73871b74f54a0db4a9da74e4cb5b2fe8` |
| `release-inventory.json` | `545d7184c0ae5a73435ee61be4e394007427ee6f3cc90fcedcf1dd8c5fda514a` |
| `distribution-inspection.json` | `a8197ca156b215aa581cc549851f9e229373c731ebee1cb4b9a7e0272ab47745` |

## Delivery rebuild

The delivery rebuild uses source commit `a4c325234dc2c4526287e5e5fe22b3b15368491a`. It includes the Windows test repairs and the updated bundled limitations. Comparing both archive inventories found only `dist/ui/app.js` changed. The desktop main process, preload, service worker, styles and dependencies retained their hashes. The renderer difference is the imported limitations text; no calculation or workflow source changed.

`npm run package:win` passed again with `DISTRIBUTIONS_MATCH_INSPECTED_PAYLOAD`. The unsigned files are retained separately in `work/windows-current/final-delivery`.

The full packaged desktop suite then passed again on this rebuilt payload at native 150%, with 68 passes and six optional capture skips. A separate reviewer independently passed typecheck, lint and all six focused design, forced-colors and v1-journey tests, and measured native scale factor 1.5 in a separate packaged launch. The [125% run](windows-v1-2026-11-11/desktop-125.txt), [final 150% run](windows-v1-2026-11-11/desktop-150.txt) and [independent check](windows-v1-2026-11-11/independent-150.txt) retain sanitized output.

The exact delivery installer was then [installed successfully](windows-v1-2026-11-11/delivery-install.json) in another guarded test directory. Its archive matched the delivery hash below. After copying the preserved synthetic analytics database into that test profile, the installed app showed the same product/source rows, completed expense and 143,100.00 TRY net estimate. Hakkında showed the updated Windows status. The exact portable file launched normally without developer Node on `PATH` and showed the same result at native 150%. The [delivery smoke receipt](windows-v1-2026-11-11/delivery-smoke.json) records those observations. [Uninstall](windows-v1-2026-11-11/delivery-uninstall.json) removed the executable and registration and preserved the synthetic database hash. Windows display scaling was restored to its original 125%.

| Delivery artifact | SHA-256 |
| --- | --- |
| `Esmer Market Analytics Setup 1.0.1.exe` | `5bcb2c5e5b733b3b734287b728da340da8f3b68e614fc024888c4e5062b0b9d9` |
| `Esmer Market Analytics 1.0.1.exe` | `dbb124d9f5f8c342aa7cdf8bd0393223af7dcbd43ef5fbce06c04e274e74b26f` |
| `resources/app.asar` | `a25df1f39745e330fafed96da26d815f815bf8e73245f352c835f26b8e61927a` |
| `release-inventory.json` | `d841ce40ad923c84c4ac95691b2a27b3c9ea35662dc6624717516f466a135f61` |
| `distribution-inspection.json` | `736a4c5afc6ec45c8149a9a8c44d8d1a469734478e108728cb18a32673b12476` |

The workflow now retains both verified executables and both manifests in `windows-distributions-<commit>` for 14 days after a successful run. This is an Actions artifact, not a published release or a moved version tag.

## Screenshots

Only synthetic application content is committed. Native Excel workbooks remain ignored because Excel adds local author metadata. File-picker and Windows Settings screenshots are not committed.

- [Monthly result at 125%](windows-v1-2026-11-11/125-net.png).
- [Monthly result at 150%](windows-v1-2026-11-11/150-net.png).
- [Product drawer at 150%](windows-v1-2026-11-11/150-product.png).
- [Expenses at 150%](windows-v1-2026-11-11/150-expenses.png).
- [Restored result at 150%](windows-v1-2026-11-11/150-restored.png).

## Remaining boundaries

Windows 10, a separate clean machine, independent media, original OS credential-store loss and physical power-loss durability were not exercised. Independent recovery and durability remain post-v1 in [#138](https://github.com/AlesSystems/esmer-market-analytics/issues/138). A raw-estimate-only restore preview reports its cutoff as Bilinmiyor; the restored monthly range and values were verified directly.

No production SQL, live refresh, owner contact or owner installation occurred. [#110](https://github.com/AlesSystems/esmer-market-analytics/issues/110) remains open for owner acceptance, installation direction and production permissions/validation. Verified profit and the display-rounding decision remain open. The conditional above-100,000-row benchmark does not apply to this fixture or the current package cap.

`npm audit --omit=dev --json` reported two high-severity transitive Azure authentication dependencies in the locked graph. [#139](https://github.com/AlesSystems/esmer-market-analytics/issues/139) tracks assessment. This task did not change dependencies or assess their reachability. The distributions are unsigned. No downloaded-installer SmartScreen result or stronger security acceptance is inferred from the smoke test.

Prove It Works required inspection of the installed and portable artifacts and native Excel output. Fix Root Causes kept the test repairs at fixture creation and DPI quantization. Sequence Work into Verifiable Units kept failed observations separate from subsequent passing runs.

The [decision trail](windows-v1-2026-11-11/decisions.tsv) records the principal choices and verification checkpoints. Independent Standards and Spec review covered the patch and evidence. The Spec reviewer separately ran the rebuilt packaged journey, checked live limitations and confirmed artifact hashes. Its PASS+NOTES verdict preserves the initial/final artifact distinction and requires current-head CI before merge. A reviewer locator error was corrected from a nonexistent table row to the observed list item; it was not an application failure.
